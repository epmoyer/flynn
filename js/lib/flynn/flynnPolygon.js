(function () {
    'use strict';

    Flynn.Polygon = Class.extend({

        init: function (points, color, scale, position, constrained, is_world) {
            if (arguments.length != 6) {
                throw 'Polygon(): init API has changed.';
            }
            if (!(position instanceof Victor)) {
                throw 'Polygon(): init API has changed. position must be a Victor object';
            }

            this.color = color || Flynn.Colors.WHITE;
            this.position = position.clone();
            this.is_world = is_world;

            this.points = points.slice(0);
            this.pointsMaster = points.slice(0);

            // Allow a boundary region polygon to be substituted for collision detection.
            this.bounding_enabled = false;
            this.bounding_visible = false;
            this.points_bounding = null;
            this.points_bounding_master = null;
            this.points_bounding_dirty = true;

            this.angle = 0;
            this.scale = scale;
            this.visible = true;
            this.setAngle(this.angle);

            this.constrained = constrained;
        },

        setBoundingPoly: function (points) {
        // Enable bounding polygon (for collision detection)
            this.points_bounding_master = points.slice(0);
            this.points_bounding = points.slice(0);
            this.bounding_enabled = true;

            for (let i = 0, len = this.points_bounding_master.length; i < len; i += 2) {
                const x = this.points_bounding_master[i];

                if (x == Flynn.PEN_COMMAND) {
                    throw 'Bounding poly cannot contain PEN_COMMAND.';
                }
            }
        },

        setAngle: function (theta) {
            this.angle = theta;
            const c = Math.cos(theta);
            const s = Math.sin(theta);

            for (let i = 0, len = this.pointsMaster.length; i < len; i += 2) {
                const x = this.pointsMaster[i];
                const y = this.pointsMaster[i + 1];

                if (x == Flynn.PEN_COMMAND) {
                // Preserve pen commands
                    this.points[i] = x;
                    this.points[i + 1] = y;
                } else {
                    this.points[i] = (c * x - s * y) * this.scale;
                    this.points[i + 1] = (s * x + c * y) * this.scale;
                }
            }
            this.points_bounding_dirty = true;
        },

        getSpan: function () {
        // Get the span (screen size) of the polygon at it's current scale and angle.
        // Returns an object of the form:
        //    {left:<float>, right:<float>, up:<float>, down:<float>}
        // where each float represents the distance (in pixels) from the anchor point
        // (this.position) to the farthest vertex (at the current scale) in the given
        // cardinal direction.
        //
            const span = { left: null, right: null, up: null, down: null };
            let first_point = true;

            for (let i = 0, len = this.pointsMaster.length; i < len; i += 2) {
                const x = this.points[i];
                const y = this.points[i + 1];

                if (x != Flynn.PEN_COMMAND) {
                    if (first_point) {
                        span.right = x;
                        span.left = x;
                        span.up = y;
                        span.down = y;

                        first_point = false;
                    } else {
                        span.right = Math.max(span.right, x);
                        span.left = Math.min(span.left, x);
                        span.up = Math.min(span.up, y);
                        span.down = Math.max(span.down, y);
                    }
                }
            }
            return (span);
        },

        applyAspectRatio: function (aspect_ratio) {
            for (let i = 0, len = this.pointsMaster.length; i < len; i += 2) {
                const x = this.pointsMaster[i];
                const y = this.pointsMaster[i + 1];
                // Preserve pen commands
                if (x != Flynn.PEN_COMMAND) {
                // Apply aspect ratio to y coordinates
                    this.pointsMaster[i + 1] = y / aspect_ratio;
                }
            }
        },

        setScale: function (c) {
            this.scale = c;
            this.setAngle(this.angle);
            this.points_bounding_dirty = true;
        },

        normalizeScale: function (recenter) {
        // Resize the points associated with the polygon such that the "size" of the
        // unscaled polygon is exactly 1.0 in either the x or the y direction
        // (whichever is the larger of the two)
        //
        // If recenter is true, then the points will be shifted such that (0, 0) is
        // at the center of the X span and of the Y span.
            var i, len, x_max, x_min, y_max, y_min, x, y, first, span_x, span_y, span_max, pan_x, pan_y;
            first = true;
            for (var i = 0, len = this.pointsMaster.length; i < len; i += 2) {
                x = this.pointsMaster[i];
                y = this.pointsMaster[i + 1];
                // Ignore pen commands
                if (x != Flynn.PEN_COMMAND) {
                    if (first) {
                        first = false;
                        x_max = x;
                        x_min = x;
                        y_max = y;
                        y_min = y;
                        continue;
                    }
                    x_max = Math.max(x_max, x);
                    x_min = Math.min(x_min, x);
                    y_max = Math.max(y_max, y);
                    y_min = Math.min(y_min, y);
                }
            }
            span_x = x_max - x_min;
            span_y = y_max - y_min;
            span_max = Math.max(span_x, span_y);
            pan_x = recenter ? -x_min - span_x / 2 : 0;
            pan_y = recenter ? -y_min - span_y / 2 : 0;
            for (i = 0, len = this.pointsMaster.length; i < len; i += 2) {
                x = this.pointsMaster[i];
                y = this.pointsMaster[i + 1];
                // Preserve pen commands
                if (x != Flynn.PEN_COMMAND) {
                    this.pointsMaster[i] = (x + pan_x) / span_x;
                    this.pointsMaster[i + 1] = (y + pan_y) / span_y;
                }
            }
            this.points = this.pointsMaster.slice(0);
        },

        updateBoundingPoly: function () {
            if (this.points_bounding_dirty) {
                this.points_bounding_dirty = false;

                const c = Math.cos(this.angle);
                const s = Math.sin(this.angle);

                for (let i = 0, len = this.points_bounding_master.length; i < len; i += 2) {
                    const x = this.points_bounding_master[i];
                    const y = this.points_bounding_master[i + 1];

                    this.points_bounding[i] = (c * x - s * y) * this.scale;
                    this.points_bounding[i + 1] = (s * x + c * y) * this.scale;
                }
            }
        },

        hasPoint: function (x, y) {
        // Test if point is within polygon
        // Adapted from: http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        //
        // Args:
        //    x: x coordinate of test point
        //    y: y coordinate of test point
        // Returns:
        //    true if test point within polygon
            if (arguments.length != 2) {
                throw 'hasPoint(): Temp fix back.';
            }

            let c = false;
            let p;
            let pos_x, pos_y;
            if (!this.bounding_enabled) {
                p = this.points;
            } else {
                this.updateBoundingPoly();
                p = this.points_bounding;
            }

            pos_x = this.position.x;
            pos_y = this.position.y;

            const len = p.length;
            let i, j, px1, px2, py1, py2;

            // doing magic!
            for (i = 0, j = len - 2; i < len; i += 2) {
                px1 = p[i] + pos_x;
                px2 = p[j] + pos_x;

                py1 = p[i + 1] + pos_y;
                py2 = p[j + 1] + pos_y;

                if (
                    (py1 > y != py2 > y) &&
                (x < (px2 - px1) * (y - py1) / (py2 - py1) + px1)
                ) {
                    c = !c;
                }
                j = i;
            }
            return c;
        },

        is_colliding: function (target_poly) {
        // Test for collision with another polygon.
        // This is a lossy check.  It checks only whether the vertices of the
        // polygon appear within this polygon, which is sufficient for game collision detection
        // between similar sized polygons.  It is possible to construct polygons with long
        // appendages which can overlap without triggering collision detection.  Exhaustive
        // general-case detection of edge intersection is not worth the performance hit.
            let i, len, pos_x, pos_y;

            if (!this.visible) {
                return false;
            }
            pos_x = this.position.x;
            pos_y = this.position.y;
            for (i = 0, len = this.points.length - 2; i < len; i += 2) {
                if (target_poly.hasPoint(
                    this.points[i] + pos_x,
                    this.points[i + 1] + pos_y
                )) {
                    return true;
                }
            }
            return false;
        },

        render: function (ctx) {
            if (!this.visible) {
                return;
            }

            let vector_color = this.color;
            let points_x, points_y;
            let draw_x, draw_y;

            draw_x = this.position.x;
            draw_y = this.position.y;

            ctx.vectorStart(vector_color, this.is_world, this.constrained);
            let pen_up = false;
            let first_point = true;
            for (var i = 0, len = this.points.length; i < len; i += 2) {
                if (this.points[i] == Flynn.PEN_COMMAND) {
                    if (this.points[i + 1] == Flynn.PEN_UP) {
                        pen_up = true;
                    } else {
                        vector_color = Flynn.ColorsOrdered[this.points[i + 1] - Flynn.PEN_COLOR0];
                        ctx.vectorEnd();
                        ctx.vectorStart(vector_color, this.is_world, this.constrained);
                        if (i > 0) {
                            ctx.vectorMoveTo(points_x + draw_x, points_y + draw_y);
                        }
                    }
                } else {
                    points_x = this.points[i];
                    points_y = this.points[i + 1];
                    if (first_point || pen_up) {
                        ctx.vectorMoveTo(points_x + draw_x, points_y + draw_y);
                        pen_up = false;
                        first_point = false;
                    } else {
                        ctx.vectorLineTo(points_x + draw_x, points_y + draw_y);
                    }
                }
            }
            ctx.vectorEnd();

            // Draw bounding polygon (if enabled for development debug)
            first_point = true;
            if (this.bounding_visible) {
                this.updateBoundingPoly();
                vector_color = (Flynn.Colors.GRAY);
                pen_up = true;
                ctx.vectorStart(vector_color, this.is_world, this.constrained);
                for (i = 0, len = this.points_bounding.length; i < len; i += 2) {
                    points_x = this.points_bounding[i];
                    points_y = this.points_bounding[i + 1];
                    if (first_point || pen_up) {
                        ctx.vectorMoveTo(points_x + draw_x, points_y + draw_y);
                        pen_up = false;
                        first_point = false;
                    } else {
                        ctx.vectorLineTo(points_x + draw_x, points_y + draw_y);
                    }
                }
                ctx.vectorEnd();
            }
        },

    });
}()); // "use strict" wrapper
