var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StatePerformance = Flynn.State.extend({

    init: function() {
        this._super();

        // Set world viewport
        Flynn.mcp.viewport.x = 0;
        Flynn.mcp.viewport.y = 0;
        
        // this.center_x = Flynn.mcp.canvasWidth/2;
        // this.center_y = Flynn.mcp.canvasHeight/2;
        // this.viewport_v = new Victor(0,0);
    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
    },

    render: function(ctx){
        ctx.clearAll();

        Game.render_page_frame(ctx);

        ctx.vectorText(
            "PERFORMANCE", Game.FONT_SCALE, 
            Game.BOUNDS.left + Game.FONT_MARGIN_LEFT,
            Game.BOUNDS.top + Game.FONT_MARGIN_TOP, 
            'left', Flynn.Colors.YELLOW);
    }
});

}()); // "use strict" wrapper