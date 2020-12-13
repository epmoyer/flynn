//--------------------------------------------
// flynnStateEnd class
//    End of game screens (leaderboard score entry/table)
//--------------------------------------------

(function () { "use strict";

Flynn.StateEnd = Flynn.State.extend({

    CURSOR_BLINK_RATE: 2,
    MAX_NICKNAME_LENGTH: 12,
    TOUCH_KEYBOARD_ROWS: [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "BACK"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER"],
        ["Z", "X", "C", "V", "B", "N", "M"],
        ["SPACE"],
    ],
    DEBUG_SHOW_KEY_CENTERS: false,

    // These reference values will be scaled to fill the screen width with the touch keyboard
    REFERENCE_KEY_SIZE: 48,
    REFERENCE_KEY_GAP: 5,
    KEYBOARD_MARGIN: 5,

    init: function(score, leaderboard, color, title, prompt, parentState, score_is_seconds, font_aspect_ratio, game_version) {
        this._super();

        this.score = score;
        this.leaderboard = leaderboard;
        this.color = color;
        this.title = title;
        this.prompt = prompt;
        if(score_is_seconds == undefined){
            score_is_seconds = false;
        }
        if(font_aspect_ratio == undefined){
            font_aspect_ratio = 1.0;
        }
        if(game_version == undefined){
            game_version = '0.0';
        }
        this.score_is_seconds = score_is_seconds;
        this.font_aspect_ratio = font_aspect_ratio;
        this.game_version = game_version;

        if(typeof(parentState)==='undefined'){
            throw("API has changed. parentState is now a required parameter.");
        }

        this.parentState = parentState;
        this.nickname = "";
        var worstEntry = this.leaderboard.getWorstEntry();
        if (    (!this.leaderboard.sortDescending && this.score < worstEntry.score) ||
                ( this.leaderboard.sortDescending && this.score > worstEntry.score) ) {
            // Capture name (because score is better than worst current leaderboard score).
            this.hasEnteredName = false;
        } else {
            // Capture name if leaderboard not full.
            this.hasEnteredName = this.leaderboard.isFull();
        }
        if(!this.hasEnteredName){
            Flynn.mcp.input.startTextCapture();
        }
        this.cursorBlinkTimer = 0;

        // Build touch keyboard
        var reference_width = 12 * this.REFERENCE_KEY_SIZE + 10 * this.REFERENCE_KEY_GAP;
        var fill_width = Flynn.mcp.canvasWidth - 2 * this.KEYBOARD_MARGIN;
        var key_scale = fill_width / reference_width;
        var num_rows = this.TOUCH_KEYBOARD_ROWS.length;
        var reference_height = (
            num_rows * this.REFERENCE_KEY_SIZE +
            (num_rows - 1) * this.REFERENCE_KEY_GAP
        );
        var keyboard_height = reference_height * key_scale;

        var kbd = {
            key_size: this.REFERENCE_KEY_SIZE * key_scale,
            key_gap: this.REFERENCE_KEY_GAP * key_scale,
            key_separation: null,  // calculated below
            touch_radius: 58 * 0.7,
            row_jog: 0.35,
            y_top: Flynn.mcp.canvasHeight - keyboard_height - this.KEYBOARD_MARGIN,
            x_left: this.KEYBOARD_MARGIN,
            text_scale: 3,
            keys: []
        };
        kbd.key_separation = kbd.key_size + kbd.key_gap;
        this.touch_keyboard = kbd;
        
        var self = this;
        var key_width, left_offset;
        $.each(this.TOUCH_KEYBOARD_ROWS, function( row_index, keyboard_row ){
            left_offset = 0;
            $.each(keyboard_row, function( col_index, key_text ){
                //console.log(row_index, col_index, keyboard_key_id);
                switch (key_text){
                    case 'ENTER':
                        key_width = kbd.key_size * 2;
                        break;             
                    case 'BACK':
                        key_width = kbd.key_size * 2;
                        break;
                    case 'SPACE':
                        key_width = kbd.key_size * 9;
                        break;
                    default:
                        key_width = kbd.key_size;
                        key_text = key_text;
                        break;
                }
                var key = {
                    text: key_text,
                    x_left: (
                        kbd.x_left + 
                        left_offset +
                        kbd.key_size * kbd.row_jog * row_index
                    ),
                    width: key_width,
                    y_top: kbd.y_top + row_index * kbd.key_separation,
                };
                key.center_v = new Victor(
                    key.x_left + key_width/2,
                    key.y_top + kbd.key_size/2
                );

                self.touch_keyboard.keys.push(key);

                left_offset += key_width + kbd.key_gap;
            });
        });

        // Clear last touch location before start
        Flynn.mcp.input.getLastTouchLocation();
    },

    // Override this method to format scores as times etc.
    scoreToString: function(score){
        if(this.score_is_seconds){
            return Flynn.Util.ticksToTime(score * 60);
        }
        return score.toString();
    },

    getAndCleanNickname: function(){
        var text = Flynn.mcp.input.getTextCapture();
        if(text != this.nickname){
            this.nickname = Flynn.mcp.input.getTextCapture();
            this.nickname = this.nickname.substring(0,this.MAX_NICKNAME_LENGTH+1); // Limit name length
            Flynn.mcp.input.setTextCapture(this.nickname);
        }
    },

    handleInputs: function(input, elapsed_ticks) {
        if (this.hasEnteredName) {
            if (input.virtualButtonWasPressed("UI_enter") ||
                (Flynn.mcp.browserSupportsTouch && input.getLastTouchLocation() !== null)
                ) {
                // Exit back to the parent state
                Flynn.mcp.changeState(this.parentState);
                Flynn.sounds.ui_move.play();
            }
        } else {
            if (input.isTextCaptureDone()) {
                // take state to next stage
                this.hasEnteredName = true;

                // cleanup and append score to high score array
                this.getAndCleanNickname();

                this.leaderboard.add({
                    'name':this.nickname,
                    'score':this.score,
                    'version': this.game_version,
                    'timestamp': (new Date()).toISOString(),
                });
                Flynn.sounds.ui_success.play();

                // Force history of "UI_enter" press to clear.  Games using touch may
                // may UI_ender to a touch button encompassing the whole screen.
                // We must clear the state so that the last touch used to complete
                // name entry does not also trigger exiting this screen prematurely.
                input.virtualButtonWasPressed("UI_enter");
            }
        }

        // -----------------------
        // Touch keyboard
        // -----------------------
        if(Flynn.mcp.browserSupportsTouch){
            var touched_key = null;
            var distance_touched_key = 100000000000;
            var touch_location_v = input.getLastTouchLocation();
            if(touch_location_v !== null){
                var card_center_v, distance;
                var self = this;
                $.each(this.touch_keyboard.keys, function(index, key){
                    distance = key.center_v.distance(touch_location_v);
                    if(distance < self.touch_keyboard.touch_radius && distance < distance_touched_key){
                        touched_key = key;
                        distance_touched_key = distance;
                    }
                });
                if(touched_key !== null){
                    var key_lookup = touched_key.text.toLowerCase();
                    switch(key_lookup){
                        case 'back':
                            key_lookup = 'delete';
                            break;
                        case 'space':
                            key_lookup = 'spacebar';
                            break;
                    }
                    $.each(Flynn.KeyboardMap, function(key_name, key_code){
                        if(key_name == key_lookup){
                            input.processTextCapture(key_code);
                            return false;  // break 
                        }
                    });
                }
            }
        }
    },

    update: function(elapsed_ticks) {
        this.cursorBlinkTimer += ((this.CURSOR_BLINK_RATE*2)/60) * elapsed_ticks;
        if (!this.hasEnteredName) {
            this.getAndCleanNickname();
        }
    },

    render: function(ctx) {
        if (!this.hasEnteredName){
            // -------------------------
            // Entering name
            // -------------------------
            ctx.vectorText2({
                text: this.prompt,
                scale: 3.5,
                y: 100,
                justify: null,
                color: this.color,
                aspect_ratio: this.font_aspect_ratio
            });
            ctx.vectorText2({
                text: "TYPE YOUR NAME AND PRESS ENTER",
                scale: 2,
                y: 180,
                color: this.color,
                aspect_ratio: this.font_aspect_ratio
            });
            if(this.cursorBlinkTimer%2 > 1){
                ctx.vectorText2({
                    text: " " + this.nickname + "_",
                    scale: 3,
                    y: 220,
                    justify: null,
                    color: this.color,
                    aspect_ratio: this.font_aspect_ratio
                });
            } else{
                ctx.vectorText2({
                    text: this.nickname,
                    scale: 3,
                    y: 220,
                    color: this.color,
                    aspect_ratio: this.font_aspect_ratio
                });
            }
            ctx.vectorText2({
                text: this.scoreToString(this.score),
                scale: 3,
                y: 300,
                color: this.color,
                aspect_ratio: this.font_aspect_ratio
            });

            if(Flynn.mcp.browserSupportsTouch){
                //---------------------------
                // Draw Touch keyboard
                //---------------------------
                var self = this;
                $.each(this.touch_keyboard.keys, function(index, key){
                    ctx.vectorRect(
                        key.x_left,
                        key.y_top,
                        key.width,
                        self.touch_keyboard.key_size,
                        self.color
                    );
                    ctx.vectorText2({
                        text: key.text,
                        scale: self.touch_keyboard.text_scale,
                        x: key.center_v.x,
                        y: key.center_v.y - (
                            Flynn.Font.Normal.CharacterHeight * self.touch_keyboard.text_scale / 2
                            ),
                        color: this.color,
                        justify: 'center',
                        aspect_ratio: this.font_aspect_ratio
                    });
                    // DEBUG key centers
                    if(this.DEBUG_SHOW_KEY_CENTERS){
                        ctx.fillStyle=Flynn.Colors.RED;
                        ctx.fillRect(
                            key.center_v.x-1,
                            key.center_v.y-1,
                            3,
                            3
                        );
                    }
                });
            }
        }
        else {
            // -------------------------
            // Name Entered
            // -------------------------
            ctx.vectorText2({
                text: this.title, 
                scale: 4,
                y: 130,
                color: this.color
            });
            for (var i = 0, len = this.leaderboard.leaderList.length; i < len; i++) {
                var leader = this.leaderboard.leaderList[i];
                ctx.vectorText2({
                    text: leader.name,
                    scale: 2,
                    x: Flynn.mcp.canvasWidth/2 - 152,
                    y: 200+25*i,
                    color: this.color,
                    aspect_ratio: this.font_aspect_ratio
                });
                ctx.vectorText2({
                    text: this.scoreToString(leader.score),
                    scale: 2,
                    x: Flynn.mcp.canvasWidth/2 + 148,
                    y: 200+25*i,
                    justify: 'right',
                    color: this.color,
                    aspect_ratio: this.font_aspect_ratio
                });
            }
            var text = Flynn.mcp.browserSupportsTouch ? 
                "TAP ANYWHERE TO CONTINUE" :
                "PRESS <ENTER> TO CONTINUE";
            ctx.vectorText2({
                text: text,
                scale: 2,
                y: 450,
                color: this.color,
                aspect_ratio: this.font_aspect_ratio
            });
        }
    }
});

}()); // "use strict" wrapper