var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StatePerformance = Flynn.State.extend({

    SPIRAL_SIZE: 5,
    SPIRAL_GAP: 2,
    SPIRAL_SCALE: 4,
    ANGLE_STEP: Math.PI/60,

    init: function() {
        this._super();

        // Set world viewport
        Flynn.mcp.viewport.x = 0;
        Flynn.mcp.viewport.y = 0;
        
        this.polygon_spiral = new Flynn.Polygon(
            Game.Points.SPIRAL,
            Flynn.Colors.WHITE,
            this.SPIRAL_SCALE, // scale
            new Victor(0,0),
            true, // constrained
            false  // is_world
            );

        this.angle = 0;
        this.num_spirals = 400;
        var offset = Game.BOUNDS.top + Game.FONT_MARGIN_TOP * 2 + Game.FONT_SCALE * Flynn.Font.Normal.CharacterHeight;
        this.spiral_bounds = new Flynn.Rect(
            Game.BOUNDS.left,
            offset,
            Game.BOUNDS.width,
            Game.BOUNDS.height - offset);

    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
        this.angle += this.ANGLE_STEP * paceFactor;
        this.polygon_spiral.setAngle(this.angle);
    },

    render: function(ctx){
        var i;
        var spiral_step = (this.SPIRAL_SIZE + this.SPIRAL_GAP) * this.SPIRAL_SCALE;
        var spiral_x_reset = this.spiral_bounds.left + spiral_step/2 + this.SPIRAL_GAP * this.SPIRAL_SCALE;
        var spiral_x = spiral_x_reset;
        var spiral_y = this.spiral_bounds.top + spiral_step/2;
        ctx.clearAll();

        Game.render_page_frame(ctx);

        ctx.vectorText(
            "PERFORMANCE", Game.FONT_SCALE, 
            Game.BOUNDS.left + Game.FONT_MARGIN_LEFT,
            Game.BOUNDS.top + Game.FONT_MARGIN_TOP, 
            'left', Flynn.Colors.YELLOW);

        for(i=0; i<this.num_spirals; i++){
            this.polygon_spiral.position.x = spiral_x;
            this.polygon_spiral.position.y = spiral_y;
            this.polygon_spiral.render(ctx);
            spiral_x += spiral_step;
            if(spiral_x > this.spiral_bounds.right - spiral_step/2){
                spiral_x = spiral_x_reset;
                spiral_y += spiral_step;
            }   
        }
    }
});

}()); // "use strict" wrapper