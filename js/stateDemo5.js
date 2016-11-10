var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateDemo5 = Flynn.State.extend({

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
    },

    handleInputs: function(input, paceFactor) {
        
        if (input.virtualButtonWasPressed("UI_right")){
            Game.navigate('right');
        }
        if (input.virtualButtonWasPressed("UI_left")){
            Game.navigate('left');
        }
        if (input.virtualButtonWasPressed("UI_exit") && Flynn.mcp.backEnabled){
            window.history.back();
        }

        if(Flynn.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonWasPressed("dev_metrics")){
                Flynn.mcp.canvas.showMetrics = !Flynn.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonWasPressed("dev_slow_mo")){
                Flynn.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonWasPressed("dev_fps_20")){
                Flynn.mcp.toggleDevPacingFps20();
            }
        }
    },

    update: function(paceFactor) {
    },

    render: function(ctx){
        ctx.clearAll();

        var left_x = 10;
        var margin = 3;
        var i, j, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        Game.render_page_frame (ctx, Game.States.DEMO5);

        var curret_y = 42;
        var indent = 20;
        var line_step = 15;
        var is_world = false;
        ctx.vectorText("LEFT JUSTIFY", 1.5, left_x, curret_y, 'left', heading_color);
        var strings = ["A", "AB", "ABC"];
        var num_strings = strings.length;
        var text_x = left_x + indent;
        curret_y += 20;
        ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, left_x + indent, curret_y + i*line_step, 'left', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        curret_y += 4*line_step;
        ctx.vectorText("RIGHT JUSTIFY", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 20;
        text_x = left_x + indent + 80;
        ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, text_x, curret_y + i*15, 'right', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        curret_y += 4*line_step;
        ctx.vectorText("CENTER JUSTIFY", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 20;
        text_x = left_x + indent + 40;
        strings = ["OO", "A_OO_B", "ABC_O_DEF"];
        num_strings = strings.length;
        ctx.vectorLine(text_x, curret_y, text_x, curret_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, text_x, curret_y + i*15, 'center', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        var curret_x = Flynn.mcp.canvasWidth * 0.73;
        var curret_y = Flynn.mcp.canvasHeight * 0.4;
        ctx.vectorTextArc(
            "ARC TEXT WITH REVERSE ENABLED", 3.0, 
            curret_x, curret_y, 
            Math.PI/2, 
            150, Flynn.Colors.MAGENTA, true, true, is_world, Flynn.Font.Block);

        ctx.vectorTextArc(
            "ARC TEXT AT -90 DEGREES WITHOUT CENTERING", 3.0, 
            curret_x, curret_y, 
            -Math.PI/2, 
            190, Flynn.Colors.DODGERBLUE, false, false, is_world, Flynn.Font.Block);

        ctx.vectorTextArc(
            "ARC TEXT AT -90 DEGREES WITH CENTERING", 3.0, 
            curret_x, curret_y, 
            -Math.PI/2, 
            230, Flynn.Colors.CYAN, true, false, is_world, Flynn.Font.Block);

        curret_y = 300;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText("TEXT", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 15;
        var low, high;
        var font = Flynn.Font.Block;
        var scale = 2.1;
        var x_step = font.CharacterSpacing * 1.2 * scale;
        var y_step = font.CharacterHeight * 1.2 * scale;
        indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText(high.toString(16), scale, left_x + indent + x_step * (high+1), curret_y, 'left', Flynn.Colors.CYAN,
                is_world, Flynn.Font.Block);
            for (low=0; low<=15; ++low){
                if(high === 0){
                    ctx.vectorText(low.toString(16), scale, left_x + indent, curret_y + y_step * (low + 1), 'left', Flynn.Colors.CYAN,
                        is_world, Flynn.Font.Block);
                }
                ctx.vectorText(String.fromCharCode(high*16 + low), scale, 
                    left_x + indent + x_step * (high+1),
                    curret_y + y_step * (low + 1),
                    'left', text_color, is_world, Flynn.Font.Block);
            }
        }
    }
});

}()); // "use strict" wrapper