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
    MAX_VELOCITY: 2.5,
    MIN_RADIUS: 3,
    MAX_RADIUS: 15,

    ANGLE_STEP: Math.PI / 60,

    SHATTER_POLYGON_LIFETIME: 60,
    SHATTER_POLYGON_VELOCITY: 1.1,
    SHATTER_PARTICLE_VELOCITY_MAX: 0.5,
    SHATTER_SPAWN_INTERVAL: 30,

    init: function() {
        var i, x;
        this._super();

        // Set world viewport
        Flynn.mcp.viewport.x = 0;
        Flynn.mcp.viewport.y = 0;
   
        this.bounds = new Flynn.Rect(
            Game.MARGIN,
            Game.MARGIN + Game.BANNER_HEIGHT,
            Game.CANVAS_WIDTH - 2 * Game.MARGIN,
            Game.CANVAS_HEIGHT - 2 * Game.MARGIN - Game.BANNER_HEIGHT
            );
        this.regions = [
            new Flynn.Rect(
            this.bounds.left, this.bounds.top, this.bounds.width/2, this.bounds.height/2),
            new Flynn.Rect(
                this.bounds.center_x, this.bounds.top, this.bounds.width/2, this.bounds.height/2)
            ];

        this.ball_sets = [[], []];
        for(var set = 0; set < this.ball_sets.length; set++){
            var balls = this.ball_sets[set];
            for(i=0; i<this.NUM_BALLS; ++i){
                var radius = Flynn.Util.randomFromInterval(this.MIN_RADIUS, this.MAX_RADIUS);
                balls.push(new Game.Ball(
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
                    this.regions[set],
                    radius,
                    // Flynn.Colors.ORANGE, // color
                    set === 0 ? Flynn.Colors.DODGERBLUE : Flynn.Colors.ORANGE, // color
                    radius, // mass
                    set === 0 ? true : false, //do_bounce
                    set === 0 ? true : false, //do_friction
                    set === 0 ? true : false  //do_collide
                ));
            }
        }

        this.angle = 0;
        this.ship_polygon = [
            new Flynn.Polygon(
                Game.Points.SHIP,
                Flynn.Colors.RED,
                2.0, // scale
                new Victor(0,0),
                true, // constrained
                false  // is_world
                ),
            new Flynn.Polygon(
                Game.Points.SHIP,
                Flynn.Colors.RED,
                2.0, // scale
                new Victor(0,0),
                false, // constrained
                false  // is_world
                ),
        ];

        this.shatter_polygons = [];
        this.shatter_center = new Victor(
            this.bounds.left + 150,
            this.bounds.bottom - 150
            );
        this.shatter_spawn_counter = this.SHATTER_SPAWN_INTERVAL;
        this.particles = new Flynn.Particles(true);
        this.shatter_polygon_catalog = [
            {points:Game.Points.MUTICOLOR1, scale:3},
            {points:Game.Points.MUTICOLOR2, scale:3},
            {points:Game.Points.MUTICOLOR3, scale:3},
            {points:Game.Points.MUTICOLOR4, scale:4.2},
            {points:Game.Points.MUTICOLOR5, scale:2.3},
            {points:Game.Points.MUTICOLOR6, scale:3.2},
        ];
    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
        var i, j, len, polygon;
        for(var set = 0; set < this.ball_sets.length; set++){
            var balls = this.ball_sets[set];
            for(i=0, len=balls.length; i<len; i++){
                balls[i].update(paceFactor);
            }

            len=balls.length;
            for(i=0; i<len; i++){
                for(j = i + 1; j<len; j++){
                    if(balls[i].do_collide && Flynn.Util.is_colliding(balls[i], balls[j])){
                        Flynn.Util.resolve_collision(balls[i], balls[j]);
                    }
                }
            }
        }

        this.angle += this.ANGLE_STEP * paceFactor;

        //------------------------
        // Spawn shatter polygons
        //------------------------
        this.shatter_spawn_counter -= paceFactor;
        if (this.shatter_spawn_counter <= 0){
            this.shatter_spawn_counter = this.SHATTER_SPAWN_INTERVAL;
            var shatter_item = Flynn.Util.randomChoice(this.shatter_polygon_catalog);
            polygon = new Flynn.Polygon(
                    shatter_item.points,
                    Flynn.Colors.WHITE,
                    shatter_item.scale,
                    this.shatter_center,
                    false, // constrained
                    true  // is_world
                );
            polygon.lifetime = this.SHATTER_POLYGON_LIFETIME;
            polygon.velocity = Victor.randomDirection(this.SHATTER_POLYGON_VELOCITY);
            polygon.setAngle(polygon.velocity.angle() + Math.PI/2);

            this.shatter_polygons.push(polygon);
        }

        //--------------------
        // Move shatter polygons
        //--------------------
        for(i = 0; i < this.shatter_polygons.length; i++){
            polygon = this.shatter_polygons[i];
            polygon.lifetime -= paceFactor;
            if(polygon.lifetime <= 0){
                // Shatter
                this.particles.shatter(polygon, this.SHATTER_PARTICLE_VELOCITY_MAX);

                // Remove polygon
                this.shatter_polygons.splice(i, 1);
                i--;
            }
            else{
                polygon.position.add(polygon.velocity.clone().multiplyScalar(paceFactor));
            }
        }
        this.particles.update(paceFactor);
    },

    render: function(ctx){
        var i, len, polygon;
        var left_margin = 8, top_margin = 10, scale = 1.5, heading_color=Flynn.Colors.YELLOW;
        var line_step_y = 18;
        var left_x, curret_y;
        ctx.clearAll();

        Game.render_page_frame (ctx, Game.States.DEMO6);

        //--------------------
        // Balls
        //--------------------
        for(var set = 0; set < this.ball_sets.length; set++){
            var balls = this.ball_sets[set];
            for(i=0, len=balls.length; i<len; i++){
                balls[i].render(ctx);
            }
            var bounds = this.regions[set];
            ctx.vectorRectR(bounds, Flynn.Colors.GREEN);

            left_x = bounds.left + left_margin;
            curret_y = bounds.top + top_margin;
            switch(set){
                case 0:
                    ctx.vectorText("is_colliding()", scale, left_x, curret_y, 'left', heading_color);
                    curret_y += line_step_y;
                    ctx.vectorText("resolve_collision()", scale, left_x, curret_y, 'left', heading_color);
                    curret_y += line_step_y;
                    ctx.vectorText("doBoundsBounce()", scale, left_x, curret_y, 'left', heading_color);
                    curret_y += line_step_y;
                    ctx.vectorText("FRICTION", scale, left_x, curret_y, 'left', heading_color);
                    break;

                case 1:
                    ctx.vectorText("doBoundsWrap()", scale, left_x, curret_y, 'left', heading_color);
                    curret_y += line_step_y;
                    ctx.vectorText("NO COLLISION", scale, left_x, curret_y, 'left', heading_color);
                    curret_y += line_step_y;
                    ctx.vectorText("NO FRICTION", scale, left_x, curret_y, 'left', heading_color);
                    break;
            }
        }

        //--------------------
        // Constraint testing
        //--------------------
        curret_y = this.bounds.center_y + top_margin;
        left_x = this.bounds.left + left_margin;
        ctx.vectorText("CONSTRAINED VS. UNCONSTRAINED", scale, left_x, curret_y, 'left', heading_color);

        var draw_position = new Victor(
            this.bounds.left + 20,
            this.bounds.center_y + 40)
            .add(new Victor.fromPolar(
                this.angle,
                5));
        this.ship_polygon[0].position = draw_position;
        this.ship_polygon[0].render(ctx);
        draw_position.x += 30;
        this.ship_polygon[1].position = draw_position;
        this.ship_polygon[1].render(ctx);

        //--------------------
        // Polygon shatter (particles)
        //--------------------
        ctx.vectorCircle(
            this.shatter_center.x, this.shatter_center.y,
            20, // radius
            12, // num_sides
            Flynn.Colors.GRAY,
            true // is_world
            );
        curret_y = this.bounds.center_y + top_margin + 55;
        ctx.vectorText("POYGON SHATTER (PARTICLES)", scale, left_x, curret_y, 'left', heading_color);
        for(i = 0; i < this.shatter_polygons.length; i++){
            this.shatter_polygons[i].render(ctx);
        }
        this.particles.render(ctx);

    },
});

Game.Ball = Flynn.Polygon.extend({
    NUM_SIDES: 10,
    RESTITUTION: 1.0,
    FRICTION: 0.004,

    init: function(position, velocity, bounds, radius, color, mass, do_bounce, do_friction, do_collide){
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
        this.do_bounce = do_bounce;
        this.do_friction = do_friction;
        this.do_collide = do_collide;
    },

    update: function(pace_factor){
        if(this.do_friction){
            this.velocity.multiplyScalar(Math.pow((1-this.FRICTION), pace_factor));
        }
        this.position.add(this.velocity.clone().multiplyScalar(pace_factor));

        // Bounce position at bounds edges
        if(this.do_bounce){
            Flynn.Util.doBoundsBounce(this, this.bounds, this.RESTITUTION);
        }
        else{
            Flynn.Util.doBoundsWrap(this, this.bounds);
        } 
    },

    render: function(ctx){
        this._super(ctx);
    },

});

}()); // "use strict" wrapper