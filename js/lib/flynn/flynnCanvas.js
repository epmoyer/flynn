// Vector rendering emulation modes
(function () { "use strict";

Flynn.VectorMode = {
    PLAIN:     0,   // No Vector rendering emulation (plain lines)
    V_THIN:    1,   // Thin Vector rendering 
    V_THICK:   2,   // Thick Vector rendering
};

if (typeof Flynn.Config == "undefined") {
   Flynn.Config = {};  // Create Configuration object
}

Flynn.Config.MAX_PACE_RECOVERY_TICKS = 5; // Max elapsed 60Hz frames to apply pacing (beyond this, just jank)

// Vector graphics simulation
Flynn.Config.VectorRender = {
    PLAIN: {
        lineBrightness: 0.0,
        vertexBrightness: 0.0,
        lineSize: 1.0,
        vertexSize: 1.0,
    },
    V_THIN: {
        lineBrightness: -0.15,
        vertexBrightness: 0.6,
        lineSize: 1.0,
        vertexSize: 1.0,
    },
    V_THICK: {
        lineBrightness: -0.15,
        vertexBrightness: 0.4,
        lineSize: 2.0,
        vertexSize: 2.0,
    },
};

Flynn.Canvas = Class.extend({

    init: function(width, height, canvas, background_color) {
        this.showMetrics = false;
        if(typeof(canvas)==='undefined'){
            this.canvas = document.getElementById("gameCanvas");
        }
        else{
            this.canvas = canvas;
        }
        if(typeof(background_color)==='undefined'){
            this.canvas.style.backgroundColor = '#000';
        }
        else{
            this.canvas.style.backgroundColor = background_color;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.previousTimestamp = 0; 
        this.constrained = false;

        this.devLowFpsElapsedTicks = 0;
        this.devLowFpsFrameCount = 0;

        //---------------------------
        // Add performance gauges
        //---------------------------

        var gauge_x = width - 131;
        var gauge_spacing = 8;
        this.gaugeFps = new Flynn.Gauge(
            new Victor(gauge_x, height - 80),
            120, // num_samples
            60,  // range
            1,   // scale
            10,  // tick_interval
            Flynn.Colors.YELLOW,
            'FPS'
            );

        this.gaugeGameLogicTime = new Flynn.Gauge(
            // new Victor(gauge_x, this.gaugeFps.position.y - 90),
            new Victor(gauge_x, 100),
            120,  // num_samples
            34,   // range
            2,    // scale
            16.6, // tick_interval
            Flynn.Colors.DODGERBLUE,
            'Input/Update/Render'
            );
        this.gaugeGameLogicTime.moveTo( new Victor(
                gauge_x, 
                this.gaugeFps.rect.top - this.gaugeGameLogicTime.rect.height - gauge_spacing
            ));

        this.gaugePixiTime = new Flynn.Gauge(
            new Victor(
                gauge_x, 
                this.gaugeGameLogicTime.rect.top - 93),
            120,  // num_samples
            34,   // range
            2,    // scale
            16.6, // tick_interval
            Flynn.Colors.CYAN,
            'Pixi'
            );
        this.gaugePixiTime.moveTo( new Victor(
                gauge_x, 
                this.gaugeGameLogicTime.rect.top - this.gaugePixiTime.rect.height - gauge_spacing
            ));

        this.gaugeTotalAnimation = new Flynn.Gauge(
            new Victor(
                gauge_x, 
                this.gaugePixiTime.rect.top - 93),
            120,  // num_samples
            34,   // range
            2,    // scale
            16.6, // tick_interval
            Flynn.Colors.MAGENTA,
            'Animation'
            );
        this.gaugeTotalAnimation.moveTo( new Victor(
                gauge_x, 
                this.gaugePixiTime.rect.top - this.gaugeTotalAnimation.rect.height - gauge_spacing
            ));

        self = this;
        this.ctx = (function(canvas) {

            // NOTE: The "Context" (ctx) used in Flynn is (for legacy reasons) NOT
            //       an HTML5 graphics context.  It is, rather, a custom object
            //       which contains data and functions related to rendering.
            //
            var ctx = {};

            //----------------------------
            // Initialize PixiJS Renderer
            //----------------------------

            // Identify renderer type
            var type = "WebGL";
            if(!PIXI.utils.isWebGLSupported()){
              type = "canvas";
            }
            PIXI.utils.sayHello(type);

            ctx.renderer = PIXI.autoDetectRenderer(
                Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT,
                {view:canvas, antialias:true}
                );
            ctx.renderer.backgroundColor = 0x000000;
            ctx.stage = new PIXI.Container();
            ctx.graphics = new PIXI.Graphics();
            ctx.stage.addChild(ctx.graphics);

            // Deprecation warnings
            ctx.clearAll_deprecation_error_reported = false;
            ctx.vectorText_deprecation_error_reported = false;
            ctx.vectorTextArc_deprecation_error_reported = false;

            ctx.width = canvas.width;
            ctx.height = canvas.height;
            ctx.fps = 0;
            ctx.fpsFrameAverage = 10; // Number of frames to average over
            ctx.fpsFrameCount = 0;
            ctx.fpsMsecCount = 0;
            ctx.ticks = 0;
            ctx.is_world = false;
            ctx.lineSize = 1;
            ctx.vertexSize = 1;

            ctx.MAX_VERTICIES_x2 = 200;
            ctx.vector_vertices = new Array(ctx.MAX_VERTICIES_x2);
            ctx.index_vector_vertex = 0;

            ctx.ACODE = "A".charCodeAt(0);
            ctx.ZEROCODE = "0".charCodeAt(0);
            ctx.SPACECODE = " ".charCodeAt(0);
            ctx.EXCLAMATIONCODE = "!".charCodeAt(0);
            ctx.ACCENTCODE = '`'.charCodeAt(0);
            ctx.LOWERCASE_A = 'a'.charCodeAt(0);
            ctx.LOWERCASE_Z = 'z'.charCodeAt(0);
            ctx.TILDE = '~'.charCodeAt(0);
            ctx.UPPER_TO_LOWER = 0x20;

            ctx.world_wrap_enabled = false;
            ctx.world_bounds = null;
            ctx.world_wrap_offset_x = 0;
            ctx.world_wrap_offset_y = 0;
            
            ctx.drawPolygon = function(p, x, y) {
                // .drawPolypon is deprecated. No world support.
                throw "drawPolygon() is obsolete. Use polygon's .render() method.";
            };

            ctx.drawFpsGague = function(position, color, percentage){
                if(arguments.length == 4){
                    throw "drawFpsGague(): API has changed.";
                }
                var draw_pos = position.clone().addScalar(0.5);
                this.beginPath();
                var length = 60;
                var height = 6;
                var x_needle = percentage * length;

                this.strokeStyle = Flynn.Colors.GRAY;
                ctx.fillStyle="#FFFFFF";
                ctx.rect(draw_pos.x, draw_pos.y,length,height);
                ctx.fillStyle=color;
                ctx.fillRect(draw_pos.x, draw_pos.y, x_needle, height);

                this.stroke();
            };

            //-----------------------------
            // Vector graphic simulation
            //-----------------------------
            ctx.vectorStart = function(color, is_world, constrained, alpha){
                // Args:
                //    color:  A color string with any of the following forms:
                //           '#RRGGBB', '#RRGGBBAA'
                //    is_world: true if vector is using world (rather than screen) coordinates.
                //    constrained:  If true, then x/y will be truncated to land on integer 
                //           pixel locations.
                //    alpha: Alpha transparency in range 1.0 (solid) to 0.0 (transparent)
                //
                //  If alpha is supplied as part of the color string and as a function
                //  parameter then the two alphas will be multiplied.
                // 
                
                if(typeof(is_world)==='undefined'){
                    this.is_world = false;
                }
                else{
                    this.is_world = is_world;
                }
                if(typeof(constrained)==='undefined'){
                    this.constrained = false;
                }
                else{
                    this.constrained = constrained;
                }

                // Extract alpha from color string (if present).
                // If alpha is supplied in the color string AND as a function
                // parameter then the two alphas are multiplied.
                alpha = alpha == undefined ? 1.0 : alpha;
                var length = color.length;
                if(length == 9){
                    // Color is '#RRGGBBAA
                    alpha = alpha * parseInt(color.substring(7), 16)/255;
                    color = color.substring(0, 7);
                }
                
                var config;
                switch(Flynn.mcp.options.vectorMode){
                    case Flynn.VectorMode.PLAIN:
                        config = Flynn.Config.VectorRender.PLAIN;
                        break;
                    case Flynn.VectorMode.V_THIN:
                        config = Flynn.Config.VectorRender.V_THIN;
                        break;
                    case Flynn.VectorMode.V_THICK:
                        config = Flynn.Config.VectorRender.V_THICK;
                        break;
                }
                var line_color = Flynn.Util.shadeColor(color, config.lineBrightness)
                this.vectorVertexColor = Flynn.Util.colorOverdrive(color, config.vertexBrightness);
                this.vectorVertexAlpha = alpha * 0.7;
                this.index_vector_vertex = 0;
                this.lineSize = config.lineSize;
                this.vertexSize = config.vertexSize;
                this.graphics.lineStyle(
                    config.lineSize,
                    Flynn.Util.parseColor(line_color, true),
                    alpha);
            };

            ctx.vectorLineToUnconstrained = function(x, y){
                throw "vectorLineToUnconstrained() deprecated.  Pass constrained to vectorStart().";
            };

            ctx.vectorMoveToUnconstrained = function(x, y){
                throw "vectorMoveToUnconstrained() deprecated.  Pass constrained to vectorStart().";
            };

            ctx.vectorLineTo = function(x, y){
                if(this.constrained){
                    x = Math.floor(x);
                    y = Math.floor(y);
                }
                if(this.is_world){
                    // World coordinates
                    var world = this.worldToScreen(x, y, true);
                    x = world.x;
                    y = world.y;
                }
                if(this.index_vector_vertex < ctx.MAX_VERTICIES_x2){
                    this.vector_vertices[this.index_vector_vertex++] = x;
                    this.vector_vertices[this.index_vector_vertex++] = y;
                }
                this.graphics.lineTo(x+0.5, y+0.5);
                // This "moveTo" keeps PixiJS from drawing ugly long un-mitered corners
                // for vertices with very acute angles.
                this.graphics.moveTo(x+0.5, y+0.5);
            };

            ctx.vectorMoveTo = function(x, y){
                if(this.constrained){
                    x = Math.floor(x);
                    y = Math.floor(y);
                }
                if(this.is_world){
                    // World coordinates
                    var world = this.worldToScreen(x, y, false);
                    x = world.x;
                    y = world.y;
                }
                if(this.index_vector_vertex < ctx.MAX_VERTICIES_x2){
                    this.vector_vertices[this.index_vector_vertex++] = x;
                    this.vector_vertices[this.index_vector_vertex++] = y;
                }
                this.graphics.moveTo(x+0.5, y+0.5);
            };

            ctx.vectorEnd = function(){
                // Draw the (bright) vector vertex points
                var offset = this.vertexSize / 2;
                this.graphics.lineStyle();
                this.graphics.beginFill(Flynn.Util.parseColor(this.vectorVertexColor, true), this.vectorVertexAlpha);
                for(var i=0; i<this.index_vector_vertex; i+=2) {
                    this.graphics.drawRect(
                        this.vector_vertices[i] - offset + 0.5,
                        this.vector_vertices[i + 1] - offset + 0.5,
                        this.vertexSize,
                        this.vertexSize);
                }
                this.graphics.endFill();
            };

            ctx.worldToScreen = function(x, y, preserve){
                // Convert a location from world coordinates to screen coordinates
                x = (x - Flynn.mcp.viewport.x) * Flynn.mcp.viewportZoom;
                y =(y - Flynn.mcp.viewport.y) * Flynn.mcp.viewportZoom;
                if(!this.world_wrap_enabled){
                    return new Victor(x,y);
                }
                var wrap_margin = 40;
                if(!preserve){
                    if(x < -wrap_margin){
                        this.world_wrap_offset_x = this.world_bounds.width * Flynn.mcp.viewportZoom; 
                    }
                    else if(x > this.width + wrap_margin){
                        this.world_wrap_offset_x = -this.world_bounds.width * Flynn.mcp.viewportZoom; 
                    }
                    else{
                        this.world_wrap_offset_x = 0;
                    }
                    if(y < -wrap_margin){
                        this.world_wrap_offset_y = this.world_bounds.height * Flynn.mcp.viewportZoom; 
                    }
                    else if(y > this.height + wrap_margin){
                        this.world_wrap_offset_y = -this.world_bounds.height * Flynn.mcp.viewportZoom; 
                    }
                    else{
                        this.world_wrap_offset_y = 0;
                    }
                }
                return new Victor( 
                    (x + this.world_wrap_offset_x), 
                    (y + this.world_wrap_offset_y)
                );
            };

            ctx.fillRect = function(x, y, width, height, alpha){
                if(alpha == undefined){
                    alpha = 1;
                }
                this.graphics.lineStyle();
                this.graphics.beginFill(Flynn.Util.parseColor(ctx.fillStyle, true), alpha);
                this.graphics.drawRect(x,  y, width, height);
                this.graphics.endFill();
            };

            ctx.vectorRectR = function(rect, color, fill_color, is_world){
                this.vectorRect(
                    rect.left, rect.top, rect.width, rect.height, 
                    color, fill_color, is_world);
            };

            ctx.vectorRect = function(x, y, width, height, color, fill_color, is_world, alpha){
                
                if(typeof(fill_color)!=='undefined' && fill_color){
                    this.fillStyle = fill_color;
                    this.fillRect(x, y, width, height);
                }
                is_world = is_world == undefined ? false: is_world;
                alpha = alpha == undefined ? 1.0 : alpha;

                // Draw a rect using vectors
                this.vectorStart(color, is_world, false, alpha);
                this.vectorMoveTo(x, y);
                this.vectorLineTo(x+width-1, y);
                this.vectorLineTo(x+width-1, y+height-1);
                this.vectorLineTo(x, y+height-1);
                this.vectorLineTo(x, y);
                this.vectorEnd();
            };

            ctx.vectorLine = function(x1, y1, x2, y2, color, is_world, alpha){
                if(typeof(is_world)==='undefined'){
                    is_world = false;
                }
                alpha = alpha == undefined ? 1.0 : alpha;

                // Draw a vector line
                this.vectorStart(color, is_world, false, alpha);
                this.vectorMoveTo(x1, y1);
                this.vectorLineTo(x2, y2);
                this.vectorEnd();
            };

            ctx.charToPolygon = function(ch, font){
                var p;
                if ((ch >= this.EXCLAMATIONCODE) && (ch <= this.TILDE)){
                    if(Flynn.mcp.forceUpperCase && ch >= this.LOWERCASE_A && ch <= this.LOWERCASE_Z){
                        ch -= this.UPPER_TO_LOWER;
                    }
                    p = font.Points.ASCII[ch - this.EXCLAMATIONCODE];
                    if(p==null){
                        p = font.Points.UNIMPLEMENTED_CHAR;
                    }
                }
                else{
                    p = font.Points.UNIMPLEMENTED_CHAR;
                }
                return p;
            };

            ctx.vectorCircle = function(x, y, radius, num_sides, color, is_world){
                // Draw a circle using vectors

                var angle;
                this.vectorStart(color, is_world);
                for(angle = 0; angle <= Math.PI * 2 + 0.001; angle += Math.PI*2/num_sides){
                    if(angle === 0){
                        this.vectorMoveTo(x + radius, y);
                    }
                    else{
                        this.vectorLineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
                    }
                }
                this.vectorEnd();
            };
            ctx.vectorText2 = function(opts){
                // Options:
                //    text: String (the text to display)
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
                //    transform_f: Vertex transformation callback function.
                //
                opts              = opts              || {};
                opts.text         = Flynn.Util.defaultText(opts.text, '<TEXT>');
                opts.scale        = opts.scale        || 1.0;
                opts.x            = opts.x            || null;
                opts.y            = opts.y            || null;
                opts.justify      = opts.justify      || 'left';
                opts.color        = opts.color        || Flynn.Colors.WHITE;
                opts.is_world     = opts.is_world     || false;
                opts.font         = opts.font         || Flynn.Font.Normal;
                opts.angle        = opts.angle        || null;
                opts.aspect_ratio = opts.aspect_ratio || 1.0;
                opts.spacing      = opts.spacing      || 1.0;
                opts.transform_f   = opts.transform_f || null;

                // Force opts.text to be a string representation
                opts.text = String(opts.text);

                var i, len, j, len2, character, polygon, pen_up;
                var string_x = opts.x;
                var string_y = opts.y;
                var character_x = 0;
                var character_y = 0;

                var step = opts.scale * opts.font.CharacterSpacing * opts.spacing;

                if (opts.angle == null){
                    //----------------------------
                    // Non-rotated text
                    //----------------------------

                    // Center x/y if they are not numbers
                    if (string_x == null){
                        string_x = Math.round((this.width - (opts.text.length*step-(opts.font.CharacterGap*opts.scale)))/2);
                    }
                    if (string_y == null){
                        string_y = Math.round((this.height - step)/2);
                    }

                    // Justification
                    switch(opts.justify){
                        case 'right':
                            character_x -= step * opts.text.length - opts.scale * opts.font.CharacterGap;
                            break;
                        case 'center':
                            character_x -= step * opts.text.length / 2 - opts.scale * opts.font.CharacterGap / 2;
                            break;
                        case 'left':
                            break;
                        case null:
                            break;
                        default:
                            throw 'opts.justify must be one of null, "left", "right", or "center".';
                    }

                    for(i = 0, len = opts.text.length; i<len; i++){
                        character = opts.text.charCodeAt(i);

                        if (character === this.SPACECODE){
                            character_x += step;
                            continue;
                        }
                        polygon = this.charToPolygon(character, opts.font);

                        pen_up = false;
                        this.vectorStart(
                            opts.color,
                            opts.is_world,
                            true // Un-rotated text is always constrained
                            );

                        for (j=0, len2=polygon.length; j<len2; j+=2){
                            if(polygon[j]==Flynn.PEN_COMMAND){
                                pen_up = true;
                            }
                            else{
                                var vertex_v = new Victor(
                                    polygon[j] * opts.scale + character_x,
                                    polygon[j+1] / opts.aspect_ratio * opts.scale + character_y );
                                if(opts.transform_f !== null){
                                    vertex_v = opts.transform_f(vertex_v);
                                }
                                if(j===0 || pen_up){
                                    this.vectorMoveTo(
                                        vertex_v.x + string_x,
                                        vertex_v.y + string_y);
                                    pen_up = false;
                                }
                                else{
                                    this.vectorLineTo(
                                        vertex_v.x + string_x,
                                        vertex_v.y + string_y);
                                }
                            }
                        }
                        this.vectorEnd();
                        character_x += step;
                    }
                }
                else{
                    //----------------------
                    // Rotated text
                    //----------------------

                    // Center x or y is they are not numbers
                    if (character_x == null){
                        character_x = Math.round(this.width);
                    }
                    if (character_y == null){
                        character_y = Math.round(this.height);
                    }

                    var pen_v = new Victor(character_x, character_y);
                    var unit_x_v = new Victor(1, 0).rotate(opts.angle);
                    var unit_y_v = new Victor(0, 1).rotate(opts.angle);

                    // Move to start of text
                    var start_v = new Victor(
                        -(opts.text.length*step-(opts.font.CharacterGap*opts.scale))/2,
                        -(opts.scale / opts.aspect_ratio * opts.font.CharacterHeight)/2
                    );
                    start_v.rotate(opts.angle);
                    pen_v.add(start_v);

                    for(i = 0, len = opts.text.length; i<len; i++){
                        character = opts.text.charCodeAt(i);

                        if (character === this.SPACECODE){
                            pen_v.add(unit_x_v.clone().multiplyScalar(opts.scale*opts.font.CharacterSpacing));
                            continue;
                        }
                        polygon = this.charToPolygon(character, opts.font);

                        pen_up = false;
                        this.vectorStart(
                            opts.color,
                            opts.is_world,
                            false // Unconstrained
                            );
                        for (j=0, len2=polygon.length; j<len2; j+=2){
                            if(polygon[j]==Flynn.PEN_COMMAND){
                                pen_up = true;
                            }
                            else{
                                var draw_v = pen_v.clone();
                                draw_v.add(unit_x_v.clone().multiplyScalar(polygon[j]*opts.scale));
                                draw_v.add(unit_y_v.clone().multiplyScalar(polygon[j+1]*opts.scale / opts.aspect_ratio));
                                if(j===0 || pen_up){
                                    this.vectorMoveTo(draw_v.x + string_x, draw_v.y + string_y);
                                    pen_up = false;
                                }
                                else{
                                    this.vectorLineTo(draw_v.x + string_x, draw_v.y + string_y);
                                }
                            }
                        }
                        this.vectorEnd();
                        pen_v.add(unit_x_v.clone().multiplyScalar(opts.scale*opts.font.CharacterSpacing));
                    }
                }
            };

            ctx.vectorText = function(text, scale, x, y, justify, color, is_world, font, angle, aspect_ratio){
                // ************************************************
                // *** Deprecated.  Use .vectorText2() instead. ***
                // ************************************************
                if(!this.vectorText_deprecation_error_reported){
                    this.vectorText_deprecation_error_reported = true;
                    console.error('ctx.vectorText() has been deprecated. Use ctx.vectortText2() instead.');
                }

                ctx.vectorText2(
                    {
                        text: text,
                        scale: scale,
                        x: x,
                        y: y,
                        justify: justify,
                        color: color,
                        is_world: is_world,
                        font: font,
                        angle: angle,
                        aspect_ratio: aspect_ratio
                    }
                );
                return;
            };

            ctx.vectorTextArc2 = function(opts){
                // Options:
                //    text: String (the text to display)
                //    scale: float, scales the size (1.0 is no scaling)
                //    center_x: X axis center of the arc.
                //    center_y: Y axis center of the arc.
                //    angle: Angle at which to draw the text.
                //    radius: Radius of the text arc along which to draw.
                //    color: String.  Text color.
                //    is_centered: If true then center the text at angle. Else
                //       left justify the text at angle.
                //    is_reversed: If true then the bottom of the characters will
                //       face outward from the center.  Used when text is at the
                //       bottom of an arc and needs to appear "right side up".
                //    is_world: Boolean
                //       true: Use world coordinates
                //       false: Use screen coordinates
                //    font: Flynn font object (Flynn.Font.Normal, Flynn.Font.Block, etc.)
                //    stretch: Value by which to vertically stretch the font, else null
                //       for no stretching.
                opts              = opts              || {};
                opts.text         = Flynn.Util.defaultText(opts.text, '<TEXT>');
                opts.scale        = opts.scale        || 1.0;
                opts.center_x     = opts.center_x     || this.width/2;
                opts.center_y     = opts.center_y     || this.height/2;
                opts.angle        = opts.angle        || 0.0;
                opts.radius       = opts.radius       || 100;
                opts.color        = opts.color        || Flynn.Colors.WHITE;
                opts.is_centered  = Flynn.Util.defaultTrue(opts.is_centered);
                opts.is_reversed  = opts.is_reversed  || false;
                opts.is_world     = opts.is_world     || false;
                opts.font         = opts.font         || Flynn.Font.Normal;
                opts.stretch      = opts.stretch      || null;

                var draw_x, draw_y;
                var text = String(opts.text);
                var render_angle = opts.angle;
                var render_angle_step = Math.asin(opts.font.CharacterSpacing * opts.scale / opts.radius);

                if(opts.stretch){
                    render_angle_step *= 1.4;
                }
                var renderAngleOffset = 0;
                if (opts.is_centered){
                    renderAngleOffset = render_angle_step * (text.length / 2 - 0.5);
                    if(opts.is_reversed){
                        renderAngleOffset = -renderAngleOffset;
                    }
                }
                render_angle -= renderAngleOffset;
                var character_angle = render_angle + Math.PI/2;
                if(opts.is_reversed){
                    character_angle += Math.PI;
                    render_angle_step = - render_angle_step;
                }

                for(var i = 0, len = text.length; i<len; i++){
                    this.vectorStart(opts.color, opts.is_world, false);
                    var character = text.charCodeAt(i);

                    if (character === this.SPACECODE){
                        render_angle += render_angle_step;
                        character_angle += render_angle_step;
                        continue;
                    }

                    // Get the character vector points
                    var polygon = this.charToPolygon(character, opts.font);

                    // Render character
                    var pen_up = false;
                    for (var j=0, len2=polygon.length; j<len2; j+=2){
                        if(polygon[j]==Flynn.PEN_COMMAND){
                            pen_up = true;
                        }
                        else{
                            if(opts.stretch){
                                var sign = 1;
                                if (opts.is_reversed){
                                    sign = -sign;
                                }
                                
                                // Remap x coordinate onto a logarithmic scale
                                var character_x = polygon[j+1];
                                if (!opts.is_reversed){
                                    character_x = opts.font.CharacterHeight - character_x;
                                }
                                var x_log = Flynn.Util.logish(
                                    character_x, 
                                    0,                         // min
                                    opts.font.CharacterHeight, // max
                                    1.2                        // power
                                    );
                                
                                var draw_radius = opts.radius + (x_log - opts.font.CharacterHeight/2) * opts.scale * opts.stretch;
                                var draw_angle = render_angle +
                                    sign * (polygon[j] - opts.font.CharacterWidth/2) * opts.font.CharacterSpacing * opts.scale / (opts.font.CharacterWidth * opts.radius);
                                draw_x = Math.cos(draw_angle) * draw_radius + opts.center_x;
                                draw_y = Math.sin(draw_angle) * draw_radius + opts.center_y;
                            }
                            else{
                                var x = polygon[j] - opts.font.CharacterWidth/2;
                                var y = polygon[j+1] - opts.font.CharacterHeight/2;
                                var c = Math.cos(character_angle);
                                var s = Math.sin(character_angle);
                                draw_x = (c*x - s*y) * opts.scale + Math.cos(render_angle) * opts.radius + opts.center_x;
                                draw_y = (s*x + c*y) * opts.scale + Math.sin(render_angle) * opts.radius + opts.center_y;
                            }
                            if(j===0 || pen_up){
                                this.vectorMoveTo(draw_x, draw_y);
                                pen_up = false;
                            }
                            else{
                                this.vectorLineTo(draw_x, draw_y);
                            }
                        }
                    }
                    this.vectorEnd();

                    render_angle += render_angle_step;
                    character_angle += render_angle_step;
                }
            };

            ctx.vectorTextArc = function(text, scale, center_x, center_y, angle, radius, color, is_centered, is_reversed, is_world, font, stretch){
                // ***************************************************
                // *** Deprecated.  Use .vectorTextArc2() instead. ***
                // ***************************************************
                if(!this.vectorTextArc_deprecation_error_reported){
                    this.vectorTextArc_deprecation_error_reported = true;
                    console.error('ctx.vectorTextArc() has been deprecated. Use ctx.vectortTextArc2() instead.');
                }
                ctx.vectorTextArc2(
                    {
                        text: text,
                        scale: scale,
                        center_x: center_x,
                        center_y: center_y,
                        angle: angle,
                        radius: radius,
                        color: color,
                        is_centered: is_centered,
                        is_reversed: is_reversed,
                        is_world: is_world,
                        font: font,
                        is_stretched: stretch
                    }
                );
                return;
            };

            ctx.clearAll = function(){
                if(!this.clearAll_deprecation_error_reported){
                    this.clearAll_deprecation_error_reported = true;
                    console.error('ctx.clearAll() has been deprecated and should not be called.');
                }
            };

            return ctx;
        })(this.canvas);

        this.ctx.strokeStyle = Flynn.Colors.WHITE;
    },

    animate: function(animation_callback_f) {
        var refresh_f = (function() {
            return window.requestAnimationFrame    ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||

                // probably excessive fallback
                function(cb, el){
                    window.setTimeout(cb, 1000/60);
                };
                
        })();

        var self = this;
        var callback_f = function(timeStamp) {
            
            //---------------------------
            // Calculate FPS and pacing
            //---------------------------
            var timeNow;
            var performance_proxy;

            if(Flynn.mcp.browserSupportsPerformance){
                timeNow = performance.now();
                performance_proxy = performance;
            }
            else{
                timeNow = timeStamp;
                performance_proxy = Flynn.PerformanceNull;
            }
            
            var deltaMsec = timeNow - self.previousTimestamp;
            self.ctx.fpsMsecCount += deltaMsec;
            // elapsed_ticks represents the (possibly fractional) number of
            // 60FPS game ticks which have elapsed.
            // If a game is running at 30FPS then elapsed_ticks will be 2.0,  At 15FPS it will be 4.0
            var elapsed_ticks = (60*(timeNow - self.previousTimestamp))/1000;
            if (elapsed_ticks > Flynn.Config.MAX_PACE_RECOVERY_TICKS) {
                elapsed_ticks = 1;
            }
            elapsed_ticks *= Flynn.mcp.gameSpeedFactor;

            self.ctx.ticks += 1;

            ++self.ctx.fpsFrameCount;
            if (self.ctx.fpsFrameCount >= self.ctx.fpsFrameAverage){
                self.ctx.fpsFrameCount = 0;
                self.ctx.fps = Math.round(1000/(self.ctx.fpsMsecCount/self.ctx.fpsFrameAverage));
                self.ctx.fpsMsecCount = 0;
            }
            self.previousTimestamp = timeNow;

            //---------------------------
            // Apply Developer Speed/Pacing options
            //---------------------------
            var label = '';
            var skip_this_frame = false;
            switch(Flynn.mcp.devPacingMode){
                case Flynn.DevPacingMode.NORMAL:
                    self.gaugeFps.record(1000/deltaMsec);
                    break;
                case Flynn.DevPacingMode.SLOW_MO:
                    elapsed_ticks *=  0.2;
                    label = "SLOW_MO";
                    self.gaugeFps.record(1000/deltaMsec);
                    break;
                case Flynn.DevPacingMode.FPS_20:
                    ++self.devLowFpsFrameCount;
                    self.devLowFpsElapsedTicks += elapsed_ticks;
                    if(self.devLowFpsFrameCount === 3){
                        self.devLowFpsFrameCount = 0;
                        elapsed_ticks = self.devLowFpsElapsedTicks;
                        self.devLowFpsElapsedTicks = 0;
                        self.gaugeFps.record(60/elapsed_ticks);
                    }
                    else{
                        // Skip this frame (to simulate low frame rate)
                        skip_this_frame = true;
                    }
                    label = "FPS_20";
                    break;
            }
            
            //---------------------------
            // Do animation
            //---------------------------
            if(!skip_this_frame){
                var render_start=0;
                var render_end=0;
                render_start = performance_proxy.now();
                
                // ***** Clear the PixiJS Graphics object ******
                self.ctx.stage.removeChildren();
                self.ctx.graphics.clear();
                self.ctx.stage.addChild(self.ctx.graphics);

                animation_callback_f(elapsed_ticks);

                if(label){
                    self.ctx.vectorText2({
                        text:label,
                        scale: 1.5,
                        x: 10,
                        y: self.canvas.height-20, 
                        color:Flynn.Colors.RED
                    });
                }
                
                if (self.showMetrics){
                    self.gaugeFps.render(self.ctx);
                    self.gaugeGameLogicTime.render(self.ctx);
                    self.gaugePixiTime.render(self.ctx);
                    self.gaugeTotalAnimation.render(self.ctx);
                }

                render_end = performance_proxy.now();
                self.gaugeGameLogicTime.record(render_end - render_start);

                var pixi_start, pixi_end;
                pixi_start = performance_proxy.now();
                // ***** Render the PixiJS Graphics object ******
                self.ctx.renderer.render(self.ctx.stage);
                pixi_end = performance_proxy.now();

                self.gaugePixiTime.record(pixi_end - pixi_start);
                self.gaugeTotalAnimation.record(
                        render_end - render_start +
                        pixi_end - pixi_start
                    );
            }
            
            // Update screen and request callback
            if(!Flynn.mcp.halted){
                refresh_f(callback_f, self.canvas);
            }

        };
        refresh_f(callback_f, this.canvas );
    },
});

Flynn.PerformanceNull = {
    now: function(){
        return 0;
    },
};


}()); // "use strict" wrapper