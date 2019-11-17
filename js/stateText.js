var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StateText = Flynn.State.extend({

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;
        this.render_dirty = true;
        this.rotate_angle = 0;
        this.rotate_step = -(Math.PI/3)/60;

    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        this.gameClock += elapsed_ticks;
        this.rotate_angle += this.rotate_step * elapsed_ticks;
        Game.TransformWarpMagnitude = 0.015 * Math.sin(this.rotate_angle);
    },

    render: function(ctx){
        // if (this.render_dirty){
        if (true){
            this.render_dirty = false;

            var left_x = 10;
            var margin = 3;
            var i, j, x;
            var heading_color = Flynn.Colors.YELLOW;
            
            Game.render_page_frame(ctx);

            // Center guides
            var guide_inset = 10;
            ctx.vectorLine(
                guide_inset*2, 
                Flynn.mcp.canvasHeight/2,
                Flynn.mcp.canvasWidth-2*margin-guide_inset,
                Flynn.mcp.canvasHeight/2,
                Flynn.Colors.GREEN);
            ctx.vectorLine(
                Flynn.mcp.canvasWidth/2,
                37+guide_inset,
                Flynn.mcp.canvasWidth/2,
                Flynn.mcp.canvasHeight-2*margin-guide_inset,
                Flynn.Colors.GREEN);

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
            ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText2({
                    text: strings[i],
                    scale: 1.5,
                    x: left_x + indent,
                    y: current_y + i*line_step,
                    color: Flynn.Colors.WHITE
                });
            }
 
            current_y += 4*line_step;
            ctx.vectorText2({
                text: "RIGHT JUSTIFY", 
                scale: 1.5, 
                x: left_x, 
                y: current_y,  
                color: heading_color
            });
            current_y += 20;
            text_x = left_x + indent + 80;
            ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText2({
                    text: strings[i],
                    scale: 1.5,
                    x: text_x,
                    y: current_y + i*15,
                    justify: 'right',
                    color: Flynn.Colors.WHITE
                });
            }

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
            ctx.vectorLine(text_x, current_y, text_x, current_y+num_strings*line_step, Flynn.Colors.GREEN);
            for(i=0; i<strings.length; i++){
                ctx.vectorText2({
                    text: strings[i],
                    scale: 1.5,
                    x: text_x,
                    y: current_y + i*15,
                    justify: 'center',
                    color: Flynn.Colors.WHITE
                });
            }

            current_y += 4*line_step;
            ctx.vectorText2({
                text: "SCALING",
                scale: 1.5,
                x: left_x,
                y: current_y,
                color: heading_color
            });
            text_x = left_x + indent;
            current_y += 20;
            ctx.vectorLine(text_x, current_y, text_x, current_y+360, Flynn.Colors.GREEN);
            for(i=0; i<15; i++){
                var scale = 1.0 + 0.25*i;
                ctx.vectorText2({
                    text: "SCALE = " + scale.toFixed(2),
                    scale: scale,
                    x: text_x,
                    y: current_y,
                    color: Flynn.Colors.WHITE
                });
                current_y += scale * Flynn.Font.Normal.CharacterHeight + 8;
            }

            ctx.vectorText2({
                text: "HORIZONTAL CENTERING",
                scale: 1.5,
                y: 50,
                color: Flynn.Colors.WHITE
            });
            ctx.vectorText2({
                text: "VERTICAL CENTERING",
                scale: 1.5,
                x: Flynn.mcp.canvasWidth-20,
                justify: 'right',
                color: Flynn.Colors.WHITE
            });
            ctx.vectorText2({
                text: "HORIZONTAL & VERTICAL CENTERING",
                scale: 1.5,
                color: Flynn.Colors.WHITE
            });

            ctx.vectorTextArc2({
                text:"ARC TEXT WITH REVERSE ENABLED",
                scale: 3.0,
                center_x: Flynn.mcp.canvasWidth/2,
                center_y: Flynn.mcp.canvasHeight/2,
                angle: Math.PI/2, 
                radius: 170,
                color: Flynn.Colors.MAGENTA,
                is_centered: true,
                is_reversed: true
            });

            ctx.vectorTextArc2({
                text:"ARC TEXT AT -90 DEGREES WITHOUT CENTERING",
                scale: 3.0,
                center_x: Flynn.mcp.canvasWidth/2,
                center_y: Flynn.mcp.canvasHeight/2,
                angle: -Math.PI/2, 
                radius: 200,
                color: Flynn.Colors.DODGERBLUE,
                is_centered: false,
                is_reversed: false
            });

            ctx.vectorTextArc2({
                text:"ARC TEXT AT -90 DEGREES WITH CENTERING",
                scale: 3.0,
                center_x: Flynn.mcp.canvasWidth/2,
                center_y: Flynn.mcp.canvasHeight/2,
                angle: -Math.PI/2, 
                radius: 230,
                color: Flynn.Colors.CYAN,
                is_centered: true,
                is_reversed: false
            });

            ctx.vectorText2({
                text: "ROTATION",
                scale: 2.5,
                x: Flynn.mcp.canvasWidth * 0.88,
                y: Flynn.mcp.canvasHeight * 0.15,
                justify: 'center',
                color: Flynn.Colors.CYAN,
                font: Flynn.Font.Normal,
                angle: this.rotate_angle
            });

            ctx.vectorText2({
                text: "TRANSFORMATION",
                scale: 2.2,
                x: Flynn.mcp.canvasWidth * 0.88,
                y: Flynn.mcp.canvasHeight * 0.35,
                justify: 'center',
                color: Flynn.Colors.CYAN,
                font: Flynn.Font.Normal,
                transform_f: Game.TransformWarpFunction
            });
        }
    }
});

Game.TransformWarpMagnitude = 0.015;

Game.TransformWarpFunction = function(vertex_v){
    var angle = vertex_v.angle();
    var length = vertex_v.length();
    return(vertex_v.clone().rotate(length * Game.TransformWarpMagnitude));
};

// Game.WarpTransformation = Class.extend({

//     init: function(){
//         this.magnitude = 0.01;
//     },

//     transform: function(vertex_v){
//         var angle = vertex_v.angle();
//         var length = vertex_v.length();
//         return(vertex_v.clone().rotate(length * this.magnitude));
//     },
// });

}()); // "use strict" wrapper