(function () {
    'use strict';
    Flynn.Text = Class.extend({
        init: function (opts) {
            // Options:
            //    string: String (the text to display)
            //    scale: float, scales the size (1.0 is no scaling)
            //    x: number or null
            //       number: The x location to display the text
            //       null: Center text horizontally on screen
            //    y: number or null
            //       number: The y location to display the text
            //       null: Center text vertically on screen
            //    justify: String.  'left', 'right', or 'center'
            //       If x is null, then justify can be null (it is ignored)
            //    color: String.  Text color.
            //    is_world: Boolean
            //       true: Use world coordinates
            //       false: Use screen coordinates
            //    font: Flynn font object (Flynn.Font.Normal, Flynn.Font.Block, etc.)
            //    angle: Rotation angle (radians).  Set null (or do not pass it) for
            //       un-rotated text.  Rotated text does not support justification.
            //       Note: Un-rotated text has better rendering performance than text with
            //       an angle of "0", so pass null (or do not pass) for un-rotated use.
            //    aspect_ratio: Stretches the font height. Value is width/height, so
            //        1.0 causes no stretching, 0.5 doubles the height, 2.0 halves the
            //        height, etc.
            //        Tip: An aspect_ratio of 0.75 mimics most old-school vector games.
            //    spacing: scale the inter-character spacing.  1.0 = normal spacing.
            //    transform_f: Vertex transformation callback function. Defaults no null if
            //        no transform_f argument is passed.
            //        If it exists, for each font vertex the callback function will be passed
            //        a Victor object representing the x/y vertex
            //        and should return a Victor object representing the new
            //        (transformed) vertex.
            //
            opts = opts || {};
            this.string = String(Flynn.Util.defaultText(opts.string, '<TEXT>'));
            this.scale = opts.scale || 1.0;
            this.x = Flynn.Util.defaultArg(opts.x, null);
            this.y = Flynn.Util.defaultArg(opts.y, null);
            this.justify = opts.justify || 'left';
            this.color = opts.color || Flynn.Colors.WHITE;
            this.is_world = opts.is_world || false;
            this.font = opts.font || Flynn.Font.Normal;
            this.angle = Flynn.Util.defaultArg(opts.angle, null);
            this.aspect_ratio = opts.aspect_ratio || 1.0;
            this.spacing = opts.spacing || 1.0;
            this.transform_f = opts.transform_f || null;
            this.is_constrained = opts.is_constrained;
            if (this.is_constrained == undefined) {
                this.is_constrained = opts.angle == null; // Un-rotated text defaults to constrained
            }
            this.updatePoints();
        },

        setString: function (string) {
            this.string = string;
            this.updatePoints();
        },

        setScale: function (scale) {
            this.scale = scale;
            this.updatePoints();
        },

        setJustify: function (justify) {
            this.justify = justify;
            this.updatePoints();
        },

        setFont: function (font) {
            this.font = font;
            this.updatePoints();
        },

        setAngle: function (angle) {
            this.angle = angle;
            this.updatePoints();
        },

        setSpacing: function (spacing) {
            this.spacing = spacing;
            this.updatePoints();
        },

        setTransformF: function (transform_f) {
            this.transform_f = transform_f;
            this.updatePoints();
        },

        updatePoints: function () {
            const ctx = Flynn.mcp.canvas.ctx;
            const step = this.scale * this.font.CharacterSpacing * this.spacing;

            this.points = this.angle ? this.createRotatedPoints(ctx, step) : this.createNonRotatedPoints(ctx, step);
            this.pointsLength = this.points.length;
        },

        createNonRotatedPoints: function (ctx, step) {
            let i, len, j, len2, character, polygon;
            let character_x = 0;
            const character_y = 0;

            switch (this.justify) {
            case 'right':
                character_x -= step * this.string.length - this.scale * this.font.CharacterGap;
                break;
            case 'center':
                character_x -= step * this.string.length / 2 - this.scale * this.font.CharacterGap / 2;
                break;
            case 'left':
            case null:
                break;
            default:
                throw 'justify must be one of null, "left", "right", or "center".';
            }

            const points = [];

            for (i = 0, len = this.string.length; i < len; i++) {
                character = this.string.charCodeAt(i);

                if (character === ctx.SPACECODE) {
                    character_x += step;
                    continue;
                }
                polygon = ctx.charToPolygon(character, this.font);

                for (j = 0, len2 = polygon.length; j < len2; j += 2) {
                    if (j === 0 || polygon[j] === Flynn.PEN_COMMAND) {
                        points.push(Flynn.PEN_COMMAND);
                        points.push(Flynn.PEN_UP);
                        if (j !== 0) continue;
                    }

                    let vertex_v = new Victor(
                        polygon[j] * this.scale + character_x,
                        polygon[j + 1] / this.aspect_ratio * this.scale + character_y
                    );

                    if (this.transform_f !== null) {
                        vertex_v = this.transform_f(vertex_v);
                    }

                    points.push(vertex_v.x);
                    points.push(vertex_v.y);
                }
                character_x += step;
            }

            return points;
        },

        createRotatedPoints: function (ctx, step) {
            let i, len, j, len2, character, polygon;
            const character_x = 0;
            const character_y = 0;

            const pen_v = new Victor(character_x, character_y);
            const unit_x_v = new Victor(1, 0).rotate(this.angle);
            const unit_y_v = new Victor(0, 1).rotate(this.angle);

            // Move to start of text
            const start_v = new Victor(
                -(this.string.length * step - (this.font.CharacterGap * this.scale)) / 2,
                -(this.scale / this.aspect_ratio * this.font.CharacterHeight) / 2
            );
            start_v.rotate(this.angle);
            pen_v.add(start_v);

            const points = [];

            for (i = 0, len = this.string.length; i < len; i++) {
                character = this.string.charCodeAt(i);

                if (character === ctx.SPACECODE) {
                    pen_v.add(unit_x_v.clone().multiplyScalar(this.scale * this.font.CharacterSpacing));
                    continue;
                }
                polygon = ctx.charToPolygon(character, this.font);

                for (j = 0, len2 = polygon.length; j < len2; j += 2) {
                    if (j === 0 || polygon[j] === Flynn.PEN_COMMAND) {
                        points.push(Flynn.PEN_COMMAND);
                        points.push(Flynn.PEN_UP);
                        if (j !== 0) continue;
                    }

                    let draw_v = pen_v.clone();
                    draw_v.add(unit_x_v.clone().multiplyScalar(polygon[j] * this.scale));
                    draw_v.add(unit_y_v.clone().multiplyScalar(polygon[j + 1] * this.scale / this.aspect_ratio));
                    if (this.transform_f) draw_v = this.transform_f(draw_v);

                    points.push(draw_v.x, draw_v.y);
                }
                pen_v.add(unit_x_v.clone().multiplyScalar(this.scale * this.font.CharacterSpacing));
            }

            return points;
        },

        render: function (ctx) {
            ctx.vectorStart(
                this.color,
                this.is_world,
                this.is_constrained
            );

            let penUp = false;
            for (let i = 0; i < this.pointsLength; i += 2) {
                const x = this.points[i];
                const y = this.points[i + 1];

                if (x === Flynn.PEN_COMMAND && y === Flynn.PEN_UP) {
                    penUp = true;
                    continue;
                }

                if (i === 0 || penUp) {
                    ctx.vectorMoveTo(this.x + x, this.y + y);
                    penUp = false;
                } else {
                    ctx.vectorLineTo(this.x + x, this.y + y);
                }
            }

            ctx.vectorEnd();
        },
    });
}());
