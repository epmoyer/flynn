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

    handleInputs: function(input, paceFactor) {
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

    update: function(paceFactor) {
        this.cursorBlinkTimer += ((this.CURSOR_BLINK_RATE*2)/60) * paceFactor;
        if (!this.hasEnteredName) {
            this.getAndCleanNickname();
        }
    },

    render: function(ctx) {
        ctx.clearAll();

        if (this.hasEnteredName) {
            ctx.vectorText(this.title, 4, null, 130, null, this.color);
            for (var i = 0, len = this.leaderboard.leaderList.length; i < len; i++) {
                var leader = this.leaderboard.leaderList[i];
                ctx.vectorText(leader['name'], 2, 360, 200+25*i, 'left', this.color);
                ctx.vectorText(this.scoreToString(leader['score']), 2, 660, 200+25*i,'right', this.color);
            }
            ctx.vectorText("PRESS <ENTER> TO CONTINUE", 2, null, 450, null, this.color);
        } else {
            ctx.vectorText(this.prompt, 4, null, 100, null, this.color);
            ctx.vectorText("TYPE YOUR NAME AND PRESS ENTER", 2, null, 180, null, this.color);
            if(this.cursorBlinkTimer%2 > 1){
                ctx.vectorText(" " + this.nickname + "_", 3, null, 220, null, this.color);
            } else{
                ctx.vectorText(this.nickname, 3, null, 220, null, this.color);
            }
            ctx.vectorText(this.scoreToString(this.score), 3, null, 300, null, this.color);
        }
    }
});

}()); // "use strict" wrapper