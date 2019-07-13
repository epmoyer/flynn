var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StateColor = Flynn.State.extend({

    TEXT_MARGIN: 10,
    FADE_ANGULAR_VELOCITY: Math.PI / (60 * 4),

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);

        this.fade_polygon = new Flynn.Polygon(
            Game.Points.POINTY_SHIP,
            Flynn.Colors.RED,
            3, // scale
            new Victor(
                Game.BOUNDS.right - 70,
                Game.BOUNDS.bottom - 160),
            false, // constrained
            false  // is_world
            );
        this.fade_angle = 0;
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        this.fade_angle += this.FADE_ANGULAR_VELOCITY * elapsed_ticks;
    },

    render: function(ctx){
        var y_step, y_text, x_text, color;

        Game.render_page_frame(ctx);

        y_step = 20;
        y_text = Game.BANNER_HEIGHT + Game.BORDER_MARGIN + this.TEXT_MARGIN;
        x_text = Game.BORDER_MARGIN + this.TEXT_MARGIN;

        for(var color_name in Flynn.Colors){
            if(color_name == 'BLACK'){
                continue;
            }
            color = Flynn.Colors[color_name];
            ctx.vectorText2({
                text: color_name  + ': ' + color,
                scale: 1.5,
                y: y_text,
                x: x_text,
                color: color
            });
            y_text += y_step;
        }

        //-----------------
        // Vertex brightness test
        //-----------------
        var colors = [
            Flynn.Colors.RED,
            Flynn.Colors.GREEN,
            Flynn.Colors.BLUE,
            Flynn.Colors.CYAN,
            Flynn.Colors.MAGENTA,
            Flynn.Colors.YELLOW
        ];

        var center_y = Game.BOUNDS.bottom - 70;
        for(i=0; i<colors.length; i++){
            color = colors[i];
            var center_x = Game.BOUNDS.left + 70 + i * 110;

            var alpha = 1.0;
            for (var size = 100; size >= 10; size-=10){
                ctx.vectorRect(center_x - size/2, center_y - size/2, size, size, color, null, false, alpha);
                alpha *= 0.80;
            }
        }

        // Test vertex brightness across full vector brightness range, fading
        // to full black, for multiple color component distributions
        var brightness = Math.floor(255 * ((Math.sin(this.fade_angle) + 1)/2));
        for(i=0; i<colors.length; i++){
            this.fade_polygon.position = new Victor(
                Game.BOUNDS.left + 30 + i * 45,
                Game.BOUNDS.bottom - 150);
            this.fade_polygon.color = colors[i] + Flynn.Util.componentToHex(brightness);
            this.fade_polygon.setAngle(this.fade_angle);
            this.fade_polygon.render(ctx);
        }
    }
});

}()); // "use strict" wrapper