//--------------------------------------------
// flynnStateEnd class
//    End of game screens (leaderboard score entry/table)
//--------------------------------------------

Flynn.StateEnd = Flynn.State.extend({

    CURSOR_BLINK_RATE: 2,

    init: function(mcp, score, leaderboard, color, title, prompt) {
        this._super(mcp);

        this.score = score;
        this.leaderboard = leaderboard;
        this.color = color;
        this.title = title;
        this.prompt = prompt;

        this.nick = "";
        var worstEntry = this.leaderboard.getWorstEntry();
        if (    (!this.leaderboard.sortDescending && this.score < worstEntry['score']) ||
                ( this.leaderboard.sortDescending && this.score > worstEntry['score']) ) {
            this.hasEnteredName = false;
        } else {
            this.hasEnteredName = true;
        }

        // get and init input field from DOM
        this.namefield = document.getElementById("namefield");
        this.namefield.value = this.nick;
        this.namefield.focus();
        this.namefield.select();
        this.cursorBlinkTimer = 0;
    },

    // Override this method to format scores as times etc.
    scoreToString: function(score){
        return score.toString();
    },

    handleInputs: function(input, paceFactor) {
        if (this.hasEnteredName) {
            if (input.virtualButtonIsPressed("UI_enter")) {
                // change the game state
                this.mcp.nextState = States.MENU;
            }
        } else {
            if (input.virtualButtonIsPressed("UI_enter")) {
                // take sate to next stage
                this.hasEnteredName = true;
                this.namefield.blur();

                // cleanup and append score to hiscore array
                this.nick = this.nick.replace(/[^a-zA-Z0-9\s]/g, "");
                this.nick = this.nick.trim();
                this.nick = this.nick.substring(0,13); // Limit name length

                this.leaderboard.add({'name':this.nick, 'score':this.score});
            }
        }
    },

    update: function(paceFactor) {
        this.cursorBlinkTimer += ((this.CURSOR_BLINK_RATE*2)/60) * paceFactor;
        if (!this.hasEnteredName) {
            this.namefield.focus(); // focus so player input is read
            // exit if same namefield not updated
            if (this.nick === this.namefield.value) {
                return;
            }

            // Remove leading spaces
            this.namefield.value = this.namefield.value.replace(/^\s+/, "");

            // clean namefield value and set to nick variable
            this.namefield.value = this.namefield.value.replace(/[^a-zA-Z0-9\s]/g, "");
            this.namefield.value = this.namefield.value.substring(0,13); // Limit name length
            this.nick = this.namefield.value;
        }
    },

    render: function(ctx) {
        ctx.clearAll();

        if (this.hasEnteredName) {
            ctx.vectorText(this.title, 4, null, 130, null, this.color);
            for (var i = 0, len = this.leaderboard.leaderList.length; i < len; i++) {
                var leader = this.leaderboard.leaderList[i];
                ctx.vectorText(leader['name'], 2, 360, 200+25*i, null, this.color);
                ctx.vectorText(this.scoreToString(leader['score']), 2, 550, 200+25*i,   10, this.color);
            }
            ctx.vectorText("PRESS <ENTER> TO CONTINUE", 2, null, 450, null, this.color);

        } else {

            ctx.vectorText(this.prompt, 4, null, 100, null, this.color);
            ctx.vectorText("TYPE YOUR NAME AND PRESS ENTER", 2, null, 180, null, this.color);
            if(this.cursorBlinkTimer%2 > 1){
                ctx.vectorText(" " + this.nick + "_", 3, null, 220, null, this.color);
            } else{
                ctx.vectorText(this.nick, 3, null, 220, null, this.color);
            }
            ctx.vectorText(this.scoreToString(this.score), 3, null, 300, null, this.color);
        }
    }
});