var Game = Game || {}; // Create namespace

(function() {
    "use strict";

    Game.StateUtil = Flynn.State.extend({
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
        // SHATTER_PARTICLE_VELOCITY_MAX: 0.5,
        SHATTER_PARTICLE_VELOCITY_MAX: 1,
        SHATTER_SPAWN_INTERVAL: 30,

        init: function() {
            var i, x;
            this._super();

            // Set world viewport
            Flynn.mcp.viewport.x = 0;
            Flynn.mcp.viewport.y = 0;

            this.regions = [
                new Flynn.Rect(
                    Game.BOUNDS.left,
                    Game.BOUNDS.top,
                    Game.BOUNDS.width / 2,
                    Game.BOUNDS.height / 2
                ),
                new Flynn.Rect(
                    Game.BOUNDS.center_x,
                    Game.BOUNDS.top,
                    Game.BOUNDS.width / 2,
                    Game.BOUNDS.height / 2
                )
            ];

            this.ball_sets = [[], []];
            for (var set = 0; set < this.ball_sets.length; set++) {
                var balls = this.ball_sets[set];
                for (i = 0; i < this.NUM_BALLS; ++i) {
                    var radius = Flynn.Util.randomFromInterval(this.MIN_RADIUS, this.MAX_RADIUS);
                    balls.push(
                        new Game.Ball(
                            // position
                            new Victor(
                                Flynn.Util.randomFromInterval(
                                    Game.BOUNDS.left + radius,
                                    Game.BOUNDS.right - radius
                                ),
                                Flynn.Util.randomFromInterval(
                                    Game.BOUNDS.top + radius,
                                    Game.BOUNDS.bottom - radius
                                )
                            ),

                            // velocity
                            new Victor(
                                Flynn.Util.randomFromInterval(
                                    -this.MAX_VELOCITY,
                                    this.MAX_VELOCITY
                                ),
                                Flynn.Util.randomFromInterval(-this.MAX_VELOCITY, this.MAX_VELOCITY)
                            ),
                            this.regions[set],
                            radius,
                            // Flynn.Colors.ORANGE, // color
                            set === 0 ? Flynn.Colors.DODGERBLUE : Flynn.Colors.ORANGE, // color
                            radius, // mass
                            set === 0 ? true : false, //do_bounce
                            set === 0 ? true : false, //do_friction
                            set === 0 ? true : false //do_collide
                        )
                    );
                }
            }

            this.angle = 0;
            this.ship_polygon = [
                new Flynn.Polygon(
                    Game.Points.SHIP,
                    Flynn.Colors.RED,
                    2.0, // scale
                    new Victor(0, 0),
                    true, // constrained
                    false // is_world
                ),
                new Flynn.Polygon(
                    Game.Points.SHIP,
                    Flynn.Colors.RED,
                    2.0, // scale
                    new Victor(0, 0),
                    false, // constrained
                    false // is_world
                )
            ];

            this.shatter_polygons = [];
            this.shatter_center = new Victor(Game.BOUNDS.left + 150, Game.BOUNDS.bottom - 150);
            this.shatter_spawn_counter = this.SHATTER_SPAWN_INTERVAL;
            this.particles = new Flynn.Particles(true);
            this.shatter_polygon_catalog = [
                // { points: Game.Points.SHIP, scale: 3 },
                // { points: Game.Points.SHIPB, scale: 3 },
                { points: Game.Points.CARET, scale: 1.5 },
                // { points: Game.Points.MUTICOLOR1, scale: 3 },
                // { points: Game.Points.MUTICOLOR2, scale: 3 },
                // { points: Game.Points.MUTICOLOR3, scale: 3 },
                // { points: Game.Points.MUTICOLOR4, scale: 4.2 },
                // { points: Game.Points.MUTICOLOR5, scale: 2.3 },
                // { points: Game.Points.MUTICOLOR6, scale: 3.2 }
            ];

            this.span_polygons = [];
            var span_colors = [Flynn.Colors.DODGERBLUE, Flynn.Colors.RED, Flynn.Colors.GREEN];
            var span_points = [Game.Points.SHIP, Game.Points.SHIPB, Game.Points.POINTY_SHIP];

            var i;
            for (i = 0; i < span_points.length; i++) {
                this.span_polygons.push(
                    new Flynn.Polygon(
                        span_points[i],
                        span_colors[i],
                        3, // scale
                        new Victor(Game.BOUNDS.center_x + 30 + i * 50, Game.BOUNDS.center_y + 60),
                        false, // constrained
                        false // is_world
                    )
                );
            }
        },

        handleInputs: function(input, elapsed_ticks) {
            Game.handleInputs_common(input);
        },

        update: function(elapsed_ticks) {
            var i, j, len, polygon;
            for (var set = 0; set < this.ball_sets.length; set++) {
                var balls = this.ball_sets[set];
                for (i = 0, len = balls.length; i < len; i++) {
                    balls[i].update(elapsed_ticks);
                }

                len = balls.length;
                for (i = 0; i < len; i++) {
                    for (j = i + 1; j < len; j++) {
                        if (balls[i].do_collide && Flynn.Util.is_colliding(balls[i], balls[j])) {
                            Flynn.Util.resolve_collision(balls[i], balls[j]);
                        }
                    }
                }
            }

            this.angle += this.ANGLE_STEP * elapsed_ticks;

            //------------------------
            // Spawn shatter polygons
            //------------------------
            this.shatter_spawn_counter -= elapsed_ticks;
            if (this.shatter_spawn_counter <= 0) {
                this.shatter_spawn_counter = this.SHATTER_SPAWN_INTERVAL;
                var shatter_item = Flynn.Util.randomChoice(this.shatter_polygon_catalog);
                polygon = new Flynn.Polygon(
                    shatter_item.points,
                    Flynn.Colors.GREEN,
                    shatter_item.scale,
                    this.shatter_center,
                    false, // constrained
                    true // is_world
                );
                polygon.lifetime = this.SHATTER_POLYGON_LIFETIME;
                polygon.velocity = Victor.randomDirection(this.SHATTER_POLYGON_VELOCITY);
                polygon.setAngle(polygon.velocity.angle() + Math.PI / 2);

                this.shatter_polygons.push(polygon);
            }

            //--------------------
            // Move shatter polygons
            //--------------------
            for (i = 0; i < this.shatter_polygons.length; i++) {
                polygon = this.shatter_polygons[i];
                polygon.lifetime -= elapsed_ticks;
                if (polygon.lifetime <= 0) {
                    // Shatter
                    this.particles.shatter(
                        polygon,
                        this.SHATTER_PARTICLE_VELOCITY_MAX,
                        undefined,  // velocity
                        true        // distribute_exit_angles
                        );

                    // Remove polygon
                    this.shatter_polygons.splice(i, 1);
                    i--;
                } else {
                    polygon.position.add(polygon.velocity.clone().multiplyScalar(elapsed_ticks));
                }
            }
            this.particles.update(elapsed_ticks);

            //--------------------
            // Spin span polygons
            //--------------------
            var i;
            for (i = 0; i < this.span_polygons.length; i++) {
                this.span_polygons[i].setAngle(
                    this.span_polygons[i].angle + (Math.PI / 180.0) * elapsed_ticks * (1 + 0.2 * i)
                );
            }
        },

        render: function(ctx) {
            var i, len, polygon;
            var left_margin = 8,
                top_margin = 10,
                scale = 1.5,
                heading_color = Flynn.Colors.YELLOW;
            var line_step_y = 18;
            var left_x, curret_y;

            Game.render_page_frame(ctx);

            //--------------------
            // Balls
            //--------------------
            for (var set = 0; set < this.ball_sets.length; set++) {
                var balls = this.ball_sets[set];
                for (i = 0, len = balls.length; i < len; i++) {
                    balls[i].render(ctx);
                }
                var bounds = this.regions[set];
                ctx.vectorRectR(bounds, Flynn.Colors.GREEN);

                left_x = bounds.left + left_margin;
                curret_y = bounds.top + top_margin;
                switch (set) {
                    case 0:
                        ctx.vectorText2({
                            text: "is_colliding()",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        curret_y += line_step_y;
                        ctx.vectorText2({
                            text: "resolve_collision()",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        curret_y += line_step_y;
                        ctx.vectorText2({
                            text: "doBoundsBounce()",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        curret_y += line_step_y;
                        ctx.vectorText2({
                            text: "FRICTION",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        break;

                    case 1:
                        ctx.vectorText2({
                            text: "doBoundsWrap()",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        curret_y += line_step_y;
                        ctx.vectorText2({
                            text: "NO COLLISION",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        curret_y += line_step_y;
                        ctx.vectorText2({
                            text: "NO FRICTION",
                            scale: scale,
                            x: left_x,
                            y: curret_y,
                            color: heading_color
                        });
                        break;
                }
            }

            //--------------------
            // Constraint testing
            //--------------------
            curret_y = Game.BOUNDS.center_y + top_margin;
            left_x = Game.BOUNDS.left + left_margin;
            ctx.vectorText2({
                text: "CONSTRAINED VS. UNCONSTRAINED",
                scale: scale,
                x: left_x,
                y: curret_y,
                color: heading_color
            });

            var draw_position = new Victor(Game.BOUNDS.left + 20, Game.BOUNDS.center_y + 40).add(
                new Victor.fromPolar(this.angle, 5)
            );
            this.ship_polygon[0].position = draw_position;
            this.ship_polygon[0].render(ctx);
            draw_position.x += 30;
            this.ship_polygon[1].position = draw_position;
            this.ship_polygon[1].render(ctx);

            //--------------------
            // polygon.getSpan() testing
            //--------------------
            left_x = Game.BOUNDS.center_x;
            ctx.vectorText2({
                text: "SPAN",
                scale: scale,
                x: left_x,
                y: curret_y,
                color: heading_color
            });
            var length = 45;
            for (i = 0; i < this.span_polygons.length; i++) {
                polygon = this.span_polygons[i];
                var span = polygon.getSpan();
                ctx.vectorLine(
                    polygon.position.x + span.left,
                    polygon.position.y - length / 2,
                    polygon.position.x + span.left,
                    polygon.position.y + length / 2,
                    Flynn.Colors.GRAY
                );
                ctx.vectorLine(
                    polygon.position.x + span.right,
                    polygon.position.y - length / 2,
                    polygon.position.x + span.right,
                    polygon.position.y + length / 2,
                    Flynn.Colors.GRAY
                );
                ctx.vectorLine(
                    polygon.position.x - length / 2,
                    polygon.position.y + span.up,
                    polygon.position.x + length / 2,
                    polygon.position.y + span.up,
                    Flynn.Colors.GRAY
                );
                ctx.vectorLine(
                    polygon.position.x - length / 2,
                    polygon.position.y + span.down,
                    polygon.position.x + length / 2,
                    polygon.position.y + span.down,
                    Flynn.Colors.GRAY
                );

                polygon.render(ctx);

                // Show vertex
                ctx.fillStyle = Flynn.Colors.YELLOW;
                ctx.fillRect(polygon.position.x - 1, polygon.position.y - 1, 3, 3);
            }

            //--------------------
            // Polygon shatter (particles)
            //--------------------
            ctx.vectorCircle(
                this.shatter_center.x,
                this.shatter_center.y,
                20, // radius
                12, // num_sides
                Flynn.Colors.GRAY,
                true // is_world
            );
            curret_y = Game.BOUNDS.center_y + top_margin + 55;
            left_x = Game.BOUNDS.left + left_margin;
            ctx.vectorText2({
                text: "POYGON SHATTER (PARTICLES)",
                scale: scale,
                x: left_x,
                y: curret_y,
                color: heading_color
            });
            for (i = 0; i < this.shatter_polygons.length; i++) {
                this.shatter_polygons[i].render(ctx);
            }
            this.particles.render(ctx);
        }
    });

    Game.Ball = Flynn.Polygon.extend({
        NUM_SIDES: 10,
        RESTITUTION: 1.0,
        FRICTION: 0.004,

        init: function(
            position,
            velocity,
            bounds,
            radius,
            color,
            mass,
            do_bounce,
            do_friction,
            do_collide
        ) {
            var points = Flynn.Util.make_regular_polygon_points(this.NUM_SIDES, radius);
            this._super(
                points,
                color,
                1, // Scale
                position,
                false, // constrained
                false // is_world
            );

            this.radius = radius;
            this.velocity = velocity;
            this.bounds = bounds;
            this.mass = mass;
            this.do_bounce = do_bounce;
            this.do_friction = do_friction;
            this.do_collide = do_collide;
        },

        update: function(pace_factor) {
            if (this.do_friction) {
                this.velocity.multiplyScalar(Math.pow(1 - this.FRICTION, pace_factor));
            }
            this.position.add(this.velocity.clone().multiplyScalar(pace_factor));

            // Bounce position at bounds edges
            if (this.do_bounce) {
                Flynn.Util.doBoundsBounce(this, this.bounds, this.RESTITUTION);
            } else {
                Flynn.Util.doBoundsWrap(this, this.bounds);
            }
        },

        render: function(ctx) {
            this._super(ctx);
        }
    });
})(); // "use strict" wrapper
