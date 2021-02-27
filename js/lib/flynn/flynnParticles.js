(function () {
    'use strict';

    Flynn.Particle = Class.extend({

        PARTICLE_LIFE_VARIATION: 20,
        PARTICLE_LIFE: 50,
        PARTICLE_FRICTION: 0.99,

        init: function (particles, position, velocity, color, life, length, angle, angular_velocity) {
            if (typeof (life) === 'undefined') {
                this.life = this.PARTICLE_LIFE + (Math.random() - 0.5) * this.PARTICLE_LIFE_VARIATION;
            } else {
                this.life = life;
            }
            if (typeof (length) === 'undefined') {
            // Particle is a point
                this.length = null;
                this.angle = null;
                this.angular_velocity = null;
            } else {
            // Particle is a line
                this.length = length;
                this.angle = angle;
                this.angular_velocity = angular_velocity;
            }
            this.particles = particles;
            this.position = position;
            this.velocity = velocity;
            this.color = color;
        },

        update: function (elapsed_ticks) {
            let isAlive = true;
            // Decay and die
            this.life -= elapsed_ticks;
            if (this.life <= 0) {
            // Kill particle
                isAlive = false;
            } else {
            // Add impulse
                this.position.add(this.velocity.clone().multiplyScalar(elapsed_ticks));
                // Decay impulse
                this.velocity.multiplyScalar(Math.pow(this.PARTICLE_FRICTION, elapsed_ticks));
                if (this.length !== null) {
                // Rotate line
                    this.angle += this.angular_velocity * elapsed_ticks;
                }
            }
            return isAlive;
        },

        render: function (ctx) {
            let position;
            const is_world = this.particles.is_world;

            if (is_world) {
            // Render in world coordinates
                position = ctx.worldToScreen(
                    this.position.x,
                    this.position.y,
                    false);
            } else {
            // Render in screen coordinates
                position = this.position;
            }

            if (this.length === null) {
            // Render point
                ctx.fillStyle = this.color;
                const size = this.particles.dotSize;
                const offset = size / 2;
                ctx.fillRect(position.x - offset, position.y - offset, size, size);
            } else {
                position = this.position;

                // Render line
                const offset_x = Math.cos(this.angle) * this.length / 2;
                const offset_y = Math.sin(this.angle) * this.length / 2;

                ctx.vectorStart(this.color, is_world, false);
                ctx.vectorMoveTo(position.x + offset_x, position.y + offset_y);
                ctx.vectorLineTo(position.x - offset_x, position.y - offset_y);
                ctx.vectorEnd();
            }
        }

    });

    Flynn.Particles = Class.extend({

        EXPLOSION__VELOCITY_VARIATION: 1.0,

        SHATTER__DEFAULT_LIFE_RANGE: {
            min: 50,
            max: 60,
        },
        SHATTER__DEFAULT_VELOCITY_RANGE: {
            min: 0.1,
            max: 1.1
        },
        SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE: {
            min: Math.PI / 600,
            max: Math.PI / 120,
        },

        init: function (is_world, dotSize) {
            is_world = is_world === undefined ? false : is_world;
            dotSize = dotSize === undefined ? 2 : dotSize;

            this.particles = [];
            this.is_world = is_world;
            this.dotSize = dotSize;
            this.draw_warning_issued = false;
        },

        explosion: function (position, quantity, max_velocity, color, velocity) {
            if (!((arguments.length == 5 && position instanceof Victor) && (velocity instanceof Victor))) {
                throw ('API has changed. 5 args. Position and velocity must be instance of Victor.');
            }

            for (let i = 0; i < quantity; i++) {
                const theta = Math.random() * Math.PI * 2;
                const particle_velocity = max_velocity * (1.0 - this.EXPLOSION__VELOCITY_VARIATION + Math.random() * this.EXPLOSION__VELOCITY_VARIATION);
                this.particles.push(new Flynn.Particle(
                    this,
                    position.clone(),
                    velocity.clone().add(
                        new Victor(
                            Math.cos(theta) * particle_velocity,
                            Math.sin(theta) * particle_velocity)),
                    color
                ));
            }
        },

        shatter: function (polygon, opts) {
        //
        //  Args:
        //      polygon: The polygon object to shatter
        //      opts: Options object.  Can be omitted to use defaults.
        //      {
        //          life_range: {
        //              min: <min particle life, in ticks>,
        //              max: <max particle life, in ticks>
        //          },
        //          velocity_range: {
        //              min: <min particle velocity (pixels/tick)>,
        //              max: <max particle velocity (pixels/tick)>
        //          },
        //          angular_velocity_range: {
        //              min: <min particle rotation velocity (radians/tick)>,
        //              max: <max particle rotation velocity (radians/tick)>
        //              // NOTE: regardless of the range given, the resulting rotation
        //              //       velocity will be randomly (50%) negated, resulting in a mix
        //              //       of clockwise and counter-clockwise spins.
        //          },
        //          base_velocity: A Victor object. If supplied, all particles will
        //              have this velocity added to their initial velocity. If omitted,
        //              the velocity of the passed polygon will be used (if it has one).
        //          uniform_exit_angles: If true, all particles (lines) will be given uniformly
        //              distributed exit angles such that they all radiate at equal spacings.
        //          first_exit_angle: (IGNORED IF uniform_exit_angles IS FALSE)
        //              Exit angle, relative to the (un-rotated) polygon's
        //              declared vertices (points), of the first piece.  This option can be
        //              used to provide fine control of the way a simple (typically 3-6 line)
        //              polygon flies apart.  To use this option the segments of the polygon
        //              should always be declared in a CLOCKWISE order.  Each piece after the
        //              first will be given an incremental (clockwise) angle moving around
        //              a full circle, so unless the polygon is defined in a CLOCKWISE order
        //              then the pieces will not appear to shatter outward from its center.
        //      }
        //
            opts = Flynn.Util.defaultArg(opts, {});

            opts.life_range = Flynn.Util.defaultArg(
                opts.life_range,
                this.SHATTER__DEFAULT_LIFE_RANGE);
            opts.velocity_range = Flynn.Util.defaultArg(
                opts.velocity_range,
                this.SHATTER__DEFAULT_VELOCITY_RANGE);
            opts.angular_velocity_range = Flynn.Util.defaultArg(
                opts.angular_velocity_range,
                this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE);

            opts.base_velocity = Flynn.Util.defaultArg(opts.base_velocity, null);
            opts.uniform_exit_angles = Flynn.Util.defaultArg(opts.uniform_exit_angles, false);
            opts.first_exit_angle = Flynn.Util.defaultArg(opts.first_exit_angle, null);

            let i, len, pen_up, first_point, piece_color, piece_position, piece_segment;
            let particle_velocity, angular_velocity, first_exit_angle;
            let velocity_scalar;
            let point_x, point_y, previous_x, previous_y;

            if (polygon.is_world != this.is_world) {
                throw ('.is_world must match for polygon and the Particles object.');
            }

            if (opts.base_velocity === null) {
                if (polygon.velocity == undefined) {
                // Polygon has no velocity; use zero.
                    opts.base_velocity = new Victor(0, 0);
                } else {
                    opts.base_velocity = polygon.velocity;
                }
            }

            pen_up = false;
            piece_color = polygon.color;
            first_point = true;
            const pieces = [];

            for (i = 0, len = polygon.points.length; i < len; i += 2) {
                if (polygon.points[i] == Flynn.PEN_COMMAND) {
                    if (polygon.points[i + 1] == Flynn.PEN_UP) {
                        pen_up = true;
                    } else {
                        piece_color = Flynn.ColorsOrdered[polygon.points[i + 1] - Flynn.PEN_COLOR0];
                    }
                } else {
                    point_x = polygon.points[i];
                    point_y = polygon.points[i + 1];
                    if (!first_point && !pen_up) {
                    // Add line as particle
                        piece_position = new Victor(
                            (point_x + previous_x) / 2,
                            (point_y + previous_y) / 2).add(polygon.position);
                        piece_segment = new Victor(
                            point_x - previous_x,
                            point_y - previous_y);
                        pieces.push({
                            position: piece_position,
                            segment: piece_segment,
                            color: piece_color,
                        });
                    }
                    first_point = false;
                    pen_up = false;
                    previous_x = point_x;
                    previous_y = point_y;
                }
            }

            // ----------------------------
            // Determine piece exit angles
            // ----------------------------
            let piece;
            const angle_base = -Math.PI / 4;
            // var angle_base = null;
            if (opts.uniform_exit_angles) {
            // ----------------------------
            // Distribute exit angles uniformly
            // ----------------------------
                const angle_step = (Math.PI * 2) / pieces.length;
                if (opts.first_exit_angle === null) {
                // ----------------------------
                // Use angle of each piece as a first pass at exit angle order
                // ----------------------------
                    for (i = 0, len = pieces.length; i < len; i++) {
                        piece = pieces[i];
                        piece.position_angle = piece.position.clone().subtract(polygon.position).angle();
                    }
                    pieces.sort(function (a, b) {
                        return a.position_angle - b.position_angle;
                    });

                    first_exit_angle = pieces[0].position_angle;
                    for (i = 0, len = pieces.length; i < len; i++) {
                        piece = pieces[i];
                        piece.exit_angle = first_exit_angle + angle_step * i;
                    }
                } else {
                // ----------------------------
                // Use specified exit angle for first piece, then
                // sequence all pieces in the order in which they appear in the polygon
                // vertex list.
                // ----------------------------
                    for (i = 0, len = pieces.length; i < len; i++) {
                        piece = pieces[i];
                        piece.exit_angle = polygon.angle + opts.first_exit_angle + angle_step * i;
                    }
                }
            } else {
            // ----------------------------
            // Each piece's exit angle is its angle from the (0,0) Polygon anchor.
            // ----------------------------
                for (i = 0, len = pieces.length; i < len; i++) {
                    piece = pieces[i];
                    piece.exit_angle = piece.position.clone().subtract(polygon.position).angle();
                }
            }

            for (i = 0, len = pieces.length; i < len; i++) {
                piece = pieces[i];

                // Velocity
                velocity_scalar = Flynn.Util.randomFromInterval(
                    opts.velocity_range.min,
                    opts.velocity_range.max
                );
                particle_velocity = opts.base_velocity.clone().add(new Victor(1, 0)
                    .rotate(piece.exit_angle)
                    .multiplyScalar(velocity_scalar));

                // Angular velocity
                angular_velocity = Flynn.Util.randomFromInterval(
                    opts.angular_velocity_range.min,
                    opts.angular_velocity_range.max
                );
                if (Math.random() < 0.5) {
                    angular_velocity = -angular_velocity;
                }

                const life = Flynn.Util.randomFromInterval(
                    opts.life_range.min,
                    opts.life_range.max
                );

                this.particles.push(new Flynn.Particle(
                    this,
                    piece.position,
                    particle_velocity,
                    piece.color,
                    life,
                    piece.segment.length(),
                    piece.segment.angle(),
                    angular_velocity
                ));
            }
        },

        update: function (elapsed_ticks) {
            for (let i = 0, len = this.particles.length; i < len; i += 1) {
                if (!this.particles[i].update(elapsed_ticks)) {
                // Particle has died.  Remove it
                    this.particles.splice(i, 1);
                    len--;
                    i--;
                }
            }
        },

        draw: function (ctx) {
            if (!this.draw_warning_issued) {
                this.draw_warning_issued = true;
                console.error('Flynn.Particles.Draw() had been deprecated.  Use render()');
            }
            this.render(ctx);
        },

        render: function (ctx) {
            for (let i = 0, len = this.particles.length; i < len; i += 1) {
                this.particles[i].render(ctx);
            }
        }
    });
}()); // "use strict" wrapper
