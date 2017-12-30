var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateBox2d = Flynn.State.extend({

    GRAVITY_X: 0,
    GRAVITY_Y: 9.86,     
    RENDER_SCALE: 100, // 100 pixels == 1 meter
    SPAWN_MARGIN: 100,

    WALL_THICKNESS: 20,
    WALL_HEIGHT: 600,
    WALL_MARGIN: 20,


    init: function() {
        var i, x;
        this._super();
   
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;
        this.render_dirty = true;

        this.physics = new Flynn.Physics(Flynn.mcp.canvas.ctx, this.GRAVITY_X, this.GRAVITY_Y, this.RENDER_SCALE);

        var SPAWN_MARGIN = 50;

        // Floor
        new Flynn.Body(this.physics, { type: "static",
            x: (Flynn.mcp.canvasWidth/2)/this.RENDER_SCALE,
            y: (Flynn.mcp.canvasHeight-this.WALL_MARGIN-(this.WALL_THICKNESS/2))/this.RENDER_SCALE,
            height: this.WALL_THICKNESS/this.RENDER_SCALE,
            width: (Flynn.mcp.canvasWidth-(2*this.WALL_MARGIN))/this.RENDER_SCALE,
            color: Flynn.Colors.GRAY,
            });
        // Walls
        for(i=0; i<2; i++){
            x = this.WALL_MARGIN + (this.WALL_THICKNESS/2);
            if(i==1){
                // Reflect to right hand side
                x = Flynn.mcp.canvasWidth - x;
            }
            new Flynn.Body(this.physics, { type: "static",
                x: x/this.RENDER_SCALE,
                y: (Flynn.mcp.canvasHeight-this.WALL_MARGIN-this.WALL_THICKNESS-(this.WALL_HEIGHT/2)+1)/this.RENDER_SCALE,
                height: this.WALL_HEIGHT/this.RENDER_SCALE,
                width: this.WALL_THICKNESS/this.RENDER_SCALE,
                color: Flynn.Colors.GRAY,
                });
        }


        for(i=0; i<10; i++){
            new Flynn.Body(this.physics, {
                x: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                y: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                shape:"circle",
                radius: 30/this.RENDER_SCALE,
                color: Flynn.Colors.MAGENTA,
                render_sides: 10,
                });
            new Flynn.Body(this.physics, {
                x: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                y: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                shape:"circle",
                radius: 20/this.RENDER_SCALE,
                color: Flynn.Colors.CYAN,
                render_sides: 5,
                });
            new Flynn.Body(this.physics, {
                x: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                y: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                height: 30/this.RENDER_SCALE,
                width: 30/this.RENDER_SCALE,
                color: Flynn.Colors.YELLOW,
                });
            new Flynn.Body(this.physics, {
                x: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                y: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                height: 30/this.RENDER_SCALE,
                width: 60/this.RENDER_SCALE,
                color: Flynn.Colors.GREEN,
                });
            new Flynn.Body(this.physics, {
                x: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasWidth  - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                y: (SPAWN_MARGIN +  Math.random() * (Flynn.mcp.canvasHeight - 2*SPAWN_MARGIN))/this.RENDER_SCALE,
                points:[
                    new Box2D.Common.Math.b2Vec2(0, +20/this.RENDER_SCALE),
                    new Box2D.Common.Math.b2Vec2(0, -20/this.RENDER_SCALE),
                    new Box2D.Common.Math.b2Vec2(120/this.RENDER_SCALE, 0),
                    // [0, -10/this.RENDER_SCALE]
                ],
                color: Flynn.Colors.ORANGE,
                shape:"polygon",
                });
        }

    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
        this.gameClock += paceFactor;
        this.physics.update(paceFactor);
    },

    render: function(ctx){

        var left_x = 10;
        var margin = 3;
        var i, j, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        Game.render_page_frame (ctx);

        this.physics.render(ctx);
    },
});

}()); // "use strict" wrapper