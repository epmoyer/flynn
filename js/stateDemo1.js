if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateDemo1 = Flynn.State.extend({

    init: function(mcp) {
        this._super(mcp);
        
        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;
        this.center_x = this.canvasWidth/2;
        this.center_y = this.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;
    },

    handleInputs: function(input, paceFactor) {

        if(this.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonIsPressed("dev_metrics")){
                this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonIsPressed("dev_slow_mo")){
                this.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonIsPressed("dev_fps_20")){
                this.mcp.toggleDevPacingFps20();
            }
        }
    },

    update: function(paceFactor) {
        this.gameClock += paceFactor;
    },

    render: function(ctx){
        ctx.clearAll();

        // Scores
        //ctx.vectorText(this.score, 3, 15, 15, null, Flynn.Colors.YELLOW);
        //ctx.vectorText(this.highscore, 3, this.canvasWidth - 6    , 15, 0 , FlynnColors.YELLOW);

        ctx.vectorText("DEMO1", 3, 15, 15, null, Flynn.Colors.YELLOW);

    }
});