//--------------------------------------------
// flynnStateEnd class
//    End of game screens (leaderboard score entry/table)
//--------------------------------------------

(function () { "use strict";

Flynn.StateEnd = Flynn.State.extend({

    CURSOR_BLINK_RATE: 2,
    MAX_NICKNAME_LENGTH: 12,

    init: function(score, leaderboard, color, title, prompt, parentState) {
        this._super();

        this.score = score;
        this.leaderboard = leaderboard;
        this.color = color;
        this.title = title;
        this.prompt = prompt;

        if(typeof(parentState)==='undefined'){
            throw("API has changed. parentState is now a required parameter.");
        }

        this.parentState = parentState;
        this.nickname = "";
        var worstEntry = this.leaderboard.getWorstEntry();
        if (    (!this.leaderboard.sortDescending && this.score < worstEntry['score']) ||
                ( this.leaderboard.sortDescending && this.score > worstEntry['score']) ) {
            this.hasEnteredName = false;
            Flynn.mcp.input.startTextCapture();
        } else {
            this.hasEnteredName = true;
        }
        this.cursorBlinkTimer = 0;
    },

    // Override this method to format scores as times etc.
    scoreToString: function(score){
        return score.toString();
    },

    getAndCleanNickname: function(){
        var text = Flynn.mcp.input.getTextCapture();
        if(text != this.nickname){
            this.nickname = Flynn.mcp.input.getTextCapture();
            // this.nickname = this.nickname.replace(/[^a-zA-Z0-9\s]/g, "");
            // this.nickname = this.nickname.trim();
            this.nickname = this.nickname.substring(0,this.MAX_NICKNAME_LENGTH+1); // Limit name length
            Flynn.mcp.input.setTextCapture(this.nickname);
        }
    },

    handleInputs: function(input, elapsed_ticks) {
        if (this.hasEnteredName) {
            if (input.virtualButtonWasPressed("UI_enter")) {
                // Exit back to the parent state
                Flynn.mcp.changeState(this.parentState);
                Flynn.sounds.ui_move.play();
            }
        } else {
            if (input.isTextCaptureDone()) {
            // if (input.virtualButtonWasPressed("UI_enter")) {
                // take sate to next stage
                this.hasEnteredName = true;

                // cleanup and append score to hiscore array
                this.getAndCleanNickname();

                this.leaderboard.add({'name':this.nickname, 'score':this.score});
                Flynn.sounds.ui_success.play();
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
        if (this.hasEnteredName) {
            ctx.vectorText2({
                text: this.title, 
                scale: 4,
                y: 130,
                color: this.color
            });
            for (var i = 0, len = this.leaderboard.leaderList.length; i < len; i++) {
                var leader = this.leaderboard.leaderList[i];
                ctx.vectorText2({
                    text: leader['name'],
                    scale: 2,
                    x: Flynn.mcp.canvasWidth/2 - 152,
                    y: 200+25*i,
                    color: this.color
                });
                ctx.vectorText2({
                    text: this.scoreToString(leader['score']),
                    scale: 2,
                    x: Flynn.mcp.canvasWidth/2 + 148,
                    y: 200+25*i,
                    justify: 'right',
                    color: this.color
                });
            }
            ctx.vectorText2({
                text: "PRESS <ENTER> TO CONTINUE",
                scale: 2,
                y: 450,
                color: this.color
            });
        } else {
            ctx.vectorText2({
                text: this.prompt,
                scale: 4,
                y: 100,
                justify: null,
                color: this.color
            });
            ctx.vectorText2({
                text: "TYPE YOUR NAME AND PRESS ENTER",
                scale: 2,
                y: 180,
                color: this.color
            });
            if(this.cursorBlinkTimer%2 > 1){
                ctx.vectorText2({
                    text: " " + this.nickname + "_",
                    scale: 3,
                    y: 220,
                    justify: null,
                    color: this.color
                });
            } else{
                ctx.vectorText2({
                    text: this.nickname,
                    scale: 3,
                    y: 220,
                    color: this.color
                });
            }
            ctx.vectorText2({
                text: this.scoreToString(this.score),
                scale: 3,
                y: 300,
                color: this.color
            });
        }
    }
});

}()); // "use strict" wrapper