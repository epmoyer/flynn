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

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        this.rotate_angle += this.rotate_step * elapsed_ticks;
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
        ctx.vectorText2({
            text: "LEFT JUSTIFY",
            scale: 1.5,
            x: left_x,
            y: current_y,
            color: heading_color
        });
        var strings = ["A", "AB", "ABC"];
        var num_strings = strings.length;
        var text_x = left_x + indent;
        current_y += 20;
        for(i=0; i<strings.length; i++){
            ctx.vectorText2({
                text: strings[i],
                scale: 1.5,
                x: left_x + indent,
                y: current_y + i*line_step,
                justify: 'left',
                color: Flynn.Colors.WHITE,
                font: Flynn.Font.Block
            });
        }
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);

        current_y += 4*line_step;
        ctx.vectorText2({
            text: "RIGHT JUSTIFY",
            scale: 1.5,
            x: left_x,
            y: current_y,
            color: heading_color});
        current_y += 20;
        text_x = left_x + indent + 80;
        for(i=0; i<strings.length; i++){
            ctx.vectorText2({
                text: strings[i],
                scale: 1.5,
                x: text_x,
                y: current_y + i*15,
                justify: 'right',
                color: Flynn.Colors.WHITE,
                font: Flynn.Font.Block
            });
        }
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);

        current_y += 4*line_step;
        ctx.vectorText2({
            text: "CENTER JUSTIFY",
            scale: 1.5,
            x: left_x,
            y: current_y,
            color: heading_color
        });
        current_y += 20;
        text_x = left_x + indent + 40;
        strings = ["OO", "A_OO_B", "ABC_O_DEF"];
        num_strings = strings.length;
        for(i=0; i<strings.length; i++){
            ctx.vectorText2({
                text: strings[i],
                scale: 1.5,
                x: text_x,
                y: current_y + i*15,
                justify: 'center',
                color: Flynn.Colors.WHITE,
                font: Flynn.Font.Block
            });
        }
        ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);

        var current_x = Flynn.mcp.canvasWidth * 0.73;
        var current_y = Flynn.mcp.canvasHeight * 0.4;
        var is_world = false;
        ctx.vectorTextArc2({
            text: "ARC TEXT WITH REVERSE ENABLED",
            scale: 3.0,
            center_x: current_x,
            center_y: current_y,
            angle: Math.PI/2,
            radius: 150,
            color: Flynn.Colors.MAGENTA,
            is_centered: true,
            is_reversed: true,
            font: Flynn.Font.Block
        });

        ctx.vectorTextArc2({
            text: "ARC TEXT AT -90 DEGREES WITHOUT CENTERING",
            scale: 3.0,
            center_x: current_x,
            center_y: current_y,
            angle: -Math.PI/2,
            radius: 190,
            color: Flynn.Colors.DODGERBLUE,
            is_centered: false,
            is_reversed: false,
            font: Flynn.Font.Block
        });

        ctx.vectorTextArc2({
            text: "ARC TEXT AT -90 DEGREES WITH CENTERING",
            scale: 3.0,
            center_x: current_x,
            center_y: current_y,
            angle: -Math.PI/2,
            radius: 230,
            color: Flynn.Colors.CYAN,
            is_centered: true,
            is_reversed: false,
            font: Flynn.Font.Block
        });

        ctx.vectorText2({
            text: "ROTATION",
            scale: 3.0,
            x: current_x,
            y: current_y,
            justify: 'center',
            color: Flynn.Colors.ORANGE,
            font: Flynn.Font.Block,
            angle: this.rotate_angle
        });

        //----------------
        // ASCII Table
        //----------------
        current_y = 300;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText2({
            text: "TEXT",
            scale: 1.5,
            x: left_x,
            y: current_y,
            justify: 'left',
            color: heading_color
        });
        current_y += 15;
        var low, high;
        var font = Flynn.Font.Block;
        var scale = 2.1;
        var x_step = font.CharacterSpacing * 1.2 * scale;
        var y_step = font.CharacterHeight * 1.2 * scale;
        indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText2({
                text: high.toString(16),
                scale: scale,
                x: left_x + indent + x_step * (high+1),
                y: current_y,
                color: Flynn.Colors.CYAN,
                font: Flynn.Font.Block
            });
            for (low=0; low<=15; ++low){
                if(high === 0){
                    ctx.vectorText2({
                        text: low.toString(16),
                        scale: scale,
                        x: left_x + indent,
                        y: current_y + y_step * (low + 1),
                        color: Flynn.Colors.CYAN,
                        font: Flynn.Font.Block
                    });
                }
                ctx.vectorText2({
                    text: String.fromCharCode(high*16 + low),
                    scale: scale,
                    x: left_x + indent + x_step * (high+1),
                    y: current_y + y_step * (low + 1),
                    color: text_color,
                    font: Flynn.Font.Block
                });
            }
        }
    }
});

}()); // "use strict" wrapper