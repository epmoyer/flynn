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
        // if (this.render_dirty){
        if (true){
            this.render_dirty = false;

            ctx.clearAll();

            var left_x = 10;
            var margin = 3;
            var i, j, x;
            var heading_color = Flynn.Colors.YELLOW;
            
            ctx.vectorText("DEMO1", 3, left_x, 11, null, heading_color);
            ctx.vectorLine(margin, 37, this.canvasWidth-margin-1, 37, Flynn.Colors.GREEN);
            ctx.vectorRect(
                margin, 
                margin, 
                this.canvasWidth-2*margin,
                this.canvasHeight-2*margin,
                Flynn.Colors.GREEN);

            // Center guides
            var guide_inset = 10;
            ctx.vectorLine(
                guide_inset*2, 
                this.canvasHeight/2,
                this.canvasWidth-2*margin-guide_inset,
                this.canvasHeight/2,
                Flynn.Colors.GREEN);
            ctx.vectorLine(
                this.canvasWidth/2,
                37+guide_inset,
                this.canvasWidth/2,
                this.canvasHeight-2*margin-guide_inset,
                Flynn.Colors.GREEN);

            var curret_y = 42;
            var indent = 20;
            var line_step = 15;
            ctx.vectorText("LEFT JUSTIFY", 1.5, left_x, curret_y, null, heading_color);
            var strings = ["A", "AB", "ABC"];
            var num_strings = strings.length;
            var text_x = left_x + indent;
            curret_y += 20;
            ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText(strings[i], 1.5, left_x + indent, curret_y + i*line_step, null, Flynn.Colors.WHITE);
            }

            curret_y += 4*line_step;
            ctx.vectorText("RIGHT JUSTIFY", 1.5, left_x, curret_y, null, heading_color);
            curret_y += 20;
            text_x = left_x + indent + 80;
            ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText(strings[i], 1.5, text_x, curret_y + i*15, 0, Flynn.Colors.WHITE);
            }

            curret_y += 4*line_step;
            ctx.vectorText("RIGHT JUSTIFY WITH OFFSET", 1.5, left_x, curret_y, null, heading_color);
            curret_y += 20;
            ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText("ABCDEF", 1.5, text_x, curret_y + i*15, i, Flynn.Colors.WHITE);
            }

            curret_y += 4*line_step;
            ctx.vectorText("SCALING", 1.5, left_x, curret_y, null, heading_color);
            text_x = left_x + indent;
            curret_y += 20;
            ctx.vectorLine(text_x, curret_y, text_x, curret_y+360, Flynn.Colors.GREEN);
            for(i=0; i<15; i++){
                var scale = 1.0 + 0.25*i;
                ctx.vectorText("SCALE = " + scale.toFixed(2), scale, text_x, curret_y, null, Flynn.Colors.WHITE);
                curret_y += scale * Flynn.Font.CharacterHeight + 8;
            }

            ctx.vectorText("HORIZONTAL CENTERING", 1.5, null, 50, null, Flynn.Colors.WHITE);
            ctx.vectorText("VERTICAL CENTERING", 1.5, this.canvasWidth-200, null, null, Flynn.Colors.WHITE);
            ctx.vectorText("HORIZONTAL & VERTICAL CENTERING", 1.5, null, null, null, Flynn.Colors.WHITE);

            ctx.vectorTextArc(
                "ARC TEXT WITH REVERSE ENABLED", 3.0, 
                this.canvasWidth/2, this.canvasHeight/2, 
                Math.PI/2, 
                170, Flynn.Colors.MAGENTA, true, true);

            ctx.vectorTextArc(
                "ARC TEXT AT -90 DEGREES WITHOUT CENTERING", 3.0, 
                this.canvasWidth/2, this.canvasHeight/2, 
                -Math.PI/2, 
                200, Flynn.Colors.DODGERBLUE, false, false);

            ctx.vectorTextArc(
                "ARC TEXT AT -90 DEGREES WITH CENTERING", 3.0, 
                this.canvasWidth/2, this.canvasHeight/2, 
                -Math.PI/2, 
                230, Flynn.Colors.CYAN, true, false);
        }

    }
});