var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateFont = Flynn.State.extend({

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.rotate_angle = 0;
        this.rotate_step = -(Math.PI/3)/60;
    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
        this.rotate_angle += this.rotate_step * paceFactor;
    },

    render: function(ctx){
        var left_x = 10;
        var margin = 3;
        var i, j, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        Game.render_page_frame (ctx);

        var current_y = 42;
        var indent = 20;
        var line_step = 15;
        var is_world = false;
        ctx.vectorText("LEFT JUSTIFY", 1.5, left_x, current_y, 'left', heading_color);
        var strings = ["A", "AB", "ABC"];
        var num_strings = strings.length;
        var text_x = left_x + indent;
        current_y += 20;
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, left_x + indent, current_y + i*line_step, 'left', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        current_y += 4*line_step;
        ctx.vectorText("RIGHT JUSTIFY", 1.5, left_x, current_y, 'left', heading_color);
        current_y += 20;
        text_x = left_x + indent + 80;
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, text_x, current_y + i*15, 'right', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        current_y += 4*line_step;
        ctx.vectorText("CENTER JUSTIFY", 1.5, left_x, current_y, 'left', heading_color);
        current_y += 20;
        text_x = left_x + indent + 40;
        strings = ["OO", "A_OO_B", "ABC_O_DEF"];
        num_strings = strings.length;
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
        for(i=0; i<strings.length; i++){
            ctx.vectorText(strings[i], 1.5, text_x, current_y + i*15, 'center', Flynn.Colors.WHITE, is_world, Flynn.Font.Block);
        }

        var current_x = Flynn.mcp.canvasWidth * 0.73;
        var current_y = Flynn.mcp.canvasHeight * 0.4;
        ctx.vectorTextArc(
            "ARC TEXT WITH REVERSE ENABLED", 3.0, 
            current_x, current_y, 
            Math.PI/2, 
            150, Flynn.Colors.MAGENTA, true, true, is_world, Flynn.Font.Block);

        ctx.vectorTextArc(
            "ARC TEXT AT -90 DEGREES WITHOUT CENTERING", 3.0, 
            current_x, current_y, 
            -Math.PI/2, 
            190, Flynn.Colors.DODGERBLUE, false, false, is_world, Flynn.Font.Block);

        ctx.vectorTextArc(
            "ARC TEXT AT -90 DEGREES WITH CENTERING", 3.0, 
            current_x, current_y, 
            -Math.PI/2, 
            230, Flynn.Colors.CYAN, true, false, is_world, Flynn.Font.Block);

        ctx.vectorText(
            "ROTATION",
            3.0,
            current_x, current_y, 
            'center',
            Flynn.Colors.ORANGE,
            false,
            Flynn.Font.Block,
            this.rotate_angle);

        current_y = 300;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText("TEXT", 1.5, left_x, current_y, 'left', heading_color);
        current_y += 15;
        var low, high;
        var font = Flynn.Font.Block;
        var scale = 2.1;
        var x_step = font.CharacterSpacing * 1.2 * scale;
        var y_step = font.CharacterHeight * 1.2 * scale;
        indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText(high.toString(16), scale, left_x + indent + x_step * (high+1), current_y, 'left', Flynn.Colors.CYAN,
                is_world, Flynn.Font.Block);
            for (low=0; low<=15; ++low){
                if(high === 0){
                    ctx.vectorText(low.toString(16), scale, left_x + indent, current_y + y_step * (low + 1), 'left', Flynn.Colors.CYAN,
                        is_world, Flynn.Font.Block);
                }
                ctx.vectorText(String.fromCharCode(high*16 + low), scale, 
                    left_x + indent + x_step * (high+1),
                    current_y + y_step * (low + 1),
                    'left', text_color, is_world, Flynn.Font.Block);
            }
        }
    }
});

}()); // "use strict" wrapper