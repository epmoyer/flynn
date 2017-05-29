var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateDemo6 = Flynn.State.extend({

    GRAVITY_X: 0,
    GRAVITY_Y: 9.86,     
    RENDER_SCALE: 100, // 100 pixels == 1 meter
    SPAWN_MARGIN: 100,

    WALL_THICKNESS: 20,
    WALL_HEIGHT: 600,
    WALL_MARGIN: 20,

    NUM_BALLS: 40,
    MAX_VELOCITY: 8,
    MIN_RADIUS: 5,
    MAX_RADIUS: 35,

    init: function() {
        var i, x;
        this._super();
   
        this.bounds = new Flynn.Rect(
            Game.MARGIN,
            Game.MARGIN + Game.BANNER_HEIGHT,
            Game.CANVAS_WIDTH - 2 * Game.MARGIN,
            Game.CANVAS_HEIGHT - 2 * Game.MARGIN - Game.BANNER_HEIGHT
            );
        this.balls = [];
        for(i=0; i<this.NUM_BALLS; ++i){
            var radius = Flynn.Util.randomFromInterval(this.MIN_RADIUS, this.MAX_RADIUS);
            this.balls.push(new Game.Ball(
                // position
                new Victor(
                    Flynn.Util.randomFromInterval(
                        this.bounds.left + radius,
                        this.bounds.right - radius),
                    Flynn.Util.randomFromInterval(
                        this.bounds.top + radius,
                        this.bounds.bottom - radius)),  

                // velocity
                new Victor(
                    Flynn.Util.randomFromInterval(-this.MAX_VELOCITY, this.MAX_VELOCITY),
                    Flynn.Util.randomFromInterval(-this.MAX_VELOCITY, this.MAX_VELOCITY)),
                this.bounds,
                radius,
                Flynn.Colors.ORANGE, // color
                radius // mass
            ));
        }
    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
        var i, j, len;
        for(i=0, len=this.balls.length; i<len; i++){
            this.balls[i].update(paceFactor);
        }

        len=this.balls.length;
        for(i=0; i<len; i++){
            for(j = i + 1; j<len; j++){
                if(Flynn.Util.is_colliding(this.balls[i], this.balls[j])){
                    Flynn.Util.resolve_collision(this.balls[i], this.balls[j]);
                }
            }
        }
    },

    render: function(ctx){
        var i, len;
        ctx.clearAll();

        Game.render_page_frame (ctx, Game.States.DEMO6);

        for(i=0, len=this.balls.length; i<len; i++){
            this.balls[i].render(ctx);
        }
    },
});

Game.Ball = Flynn.Polygon.extend({
    NUM_SIDES: 10,
    RESTITUTION: 1.0,
    FRICTION: 0.004,

    init: function(position, velocity, bounds, radius, color, mass){
        var points = Flynn.Util.make_regular_polygon_points(this.NUM_SIDES, radius);
        this._super(
            points,
            color,
            1, // Scale
            position,
            false, // constrained
            false  // is_world
            );

        this.radius = radius;
        this.velocity = velocity;
        this.bounds = bounds;
        this.mass = mass;
    },

    update: function(pace_factor){
        this.velocity.multiplyScalar(Math.pow((1-this.FRICTION), pace_factor));
        this.position.add(this.velocity.clone().multiplyScalar(pace_factor));

        // Bounce position at bounds edges
        Flynn.Util.doBoundsBounce(this, this.bounds, this.RESTITUTION); 
    },

    render: function(ctx){
        this._super(ctx);
    },

});

}()); // "use strict" wrapper