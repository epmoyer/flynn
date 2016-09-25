if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateDemo2 = Flynn.State.extend({

    init: function(mcp) {
        this._super(mcp);
        
        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;
        this.center_x = this.canvasWidth/2;
        this.center_y = this.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;
        this.render_dirty = true;
    },

    handleInputs: function(input, paceFactor) {
        
        if (input.virtualButtonIsPressed("right")){
            this.mcp.nextState = Game.States.HOME;
        }

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

        var left_x = 10;
        var margin = 3;
        var i, j, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        ctx.vectorText("DEMO2", 3, left_x, 11, null, heading_color);
        ctx.vectorLine(margin, 37, this.canvasWidth-margin-1, 37, Flynn.Colors.GREEN);
        ctx.vectorRect(
            margin, 
            margin, 
            this.canvasWidth-2*margin,
            this.canvasHeight-2*margin,
            Flynn.Colors.GREEN);
    },

});