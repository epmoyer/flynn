// Vector rendering emulation modes
(function () { "use strict";

Flynn.VectorMode = {
    PLAIN:     0,   // No Vector rendering emulation (plain lines)
    V_THIN:    1,   // Thin Vector rendering 
    V_THICK:   2,   // Thick Vector rendering
    V_FLICKER: 3,   // Flicker rendering    
};

if (typeof Flynn.Config == "undefined") {
   Flynn.Config = {};  // Create Configuration object
}

Flynn.Config.MAX_PACE_RECOVERY_TICKS = 5; // Max elapsed 60Hz frames to apply pacing (beyond this, just jank)

// Vector graphics simulation
Flynn.Config.VECTOR_DIM_FACTOR_THICK = 0.75; // Brightness dimming for vector lines
Flynn.Config.VECTOR_DIM_FACTOR_THIN  = 0.65;
Flynn.Config.VECTOR_OVERDRIVE_FACTOR = 0.2;  // White overdrive for vertex point artifacts

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

        this.devLowFpsPaceFactor = 0;
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

            ctx.clearAll_deprecation_error_reported = false;

            ctx.width = canvas.width;
            ctx.height = canvas.height;
            ctx.fps = 0;
            ctx.fpsFrameAverage = 10; // Number of frames to average over
            ctx.fpsFrameCount = 0;
            ctx.fpsMsecCount = 0;
            ctx.vectorVericies = [];
            ctx.ticks = 0;
            ctx.is_world = false;
            ctx.line_width = 1;

            ctx.ACODE = "A".charCodeAt(0);
            ctx.ZEROCODE = "0".charCodeAt(0);
            ctx.SPACECODE = " ".charCodeAt(0);
            ctx.EXCLAMATIONCODE = "!".charCodeAt(0);
            ctx.ACCENTCODE = '`'.charCodeAt(0);
            ctx.LOWERCASE_A = 'a'.charCodeAt(0);
            ctx.LOWERCASE_Z = 'z'.charCodeAt(0);
            ctx.UPPER_TO_LOWER = 0x20;
            
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
            ctx.vectorStart = function(color, is_world, constrained){
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

                // Determine vector line color
                var dim_color_rgb = Flynn.Util.hexToRgb(color);
                var vectorDimFactor = 1;
                var lineWidth = 1;
                switch(Flynn.mcp.options.vectorMode){
                    case Flynn.VectorMode.PLAIN:
                        vectorDimFactor = 1;
                        lineWidth = 1;
                        break;
                    case Flynn.VectorMode.V_THICK:
                        vectorDimFactor = Flynn.Config.VECTOR_DIM_FACTOR_THICK;
                        lineWidth = 3;
                        break;
                    case Flynn.VectorMode.V_THIN:
                        vectorDimFactor = Flynn.Config.VECTOR_DIM_FACTOR_THIN;
                        lineWidth = 1;
                        break;
                    case Flynn.VectorMode.V_FLICKER:
                        var phase = Math.floor(this.ticks) % 3;
                        if (phase === 0){
                            vectorDimFactor = Flynn.Config.VECTOR_DIM_FACTOR_THIN;
                            lineWidth = 3;
                        }
                        else if(phase === 1){
                            vectorDimFactor = 1;
                            lineWidth = 1;
                        }
                        else{
                            vectorDimFactor = Flynn.Config.VECTOR_DIM_FACTOR_THIN;
                            lineWidth = 1;
                        }
                        break;
                }
                dim_color_rgb.r *= vectorDimFactor;
                dim_color_rgb.g *= vectorDimFactor;
                dim_color_rgb.b *= vectorDimFactor;
                var dim_color = Flynn.Util.rgbToHex(dim_color_rgb.r, dim_color_rgb.g, dim_color_rgb.b);

                // Determine vector vertex color
                var color_overdrive = Flynn.Util.rgbOverdirve(Flynn.Util.hexToRgb(color), Flynn.Config.VECTOR_OVERDRIVE_FACTOR);
                this.vectorVertexColor = Flynn.Util.rgbToHex(color_overdrive.r, color_overdrive.g, color_overdrive.b);

                this.vectorVericies = [];
                var color_num = Flynn.Util.parseColor(dim_color, true);
                this.line_width = lineWidth;
                this.graphics.lineStyle(lineWidth, color_num, 1);
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
                    x -= Math.floor(Flynn.mcp.viewport.x);
                    y -= Math.floor(Flynn.mcp.viewport.y);
                }
                this.vectorVericies.push(x, y);
                if(Flynn.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                    this.graphics.lineTo(x, y);
                    if(this.line_width > 1){
                        this.graphics.moveTo(x, y);
                    }
                }
                else{
                    this.graphics.lineTo(x+0.5, y+0.5);
                    if(this.line_width > 1){
                        this.graphics.moveTo(x+0.5, y+0.5);
                    }
                }
            };

            ctx.vectorMoveTo = function(x, y){
                if(this.constrained){
                    x = Math.floor(x);
                    y = Math.floor(y);
                }
                if(this.is_world){
                    // World coordinates
                    x -= Math.floor(Flynn.mcp.viewport.x);
                    y -= Math.floor(Flynn.mcp.viewport.y);
                }
                this.vectorVericies.push(x, y);
                if(Flynn.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                    this.graphics.moveTo(x, y);
                }
                else{
                    this.graphics.moveTo(x+0.5, y+0.5);
                }
            };


            ctx.vectorEnd = function(){
                if(Flynn.mcp.options.vectorMode != Flynn.VectorMode.PLAIN){
                    // Draw the (bright) vector vertex points
                    var offset, size;
                    if(Flynn.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                        offset = 1;
                        size = 2;
                    }
                    else{
                        offset = 0;
                        size = 1;
                    }
                    this.graphics.lineStyle();
                    this.graphics.beginFill(Flynn.Util.parseColor(this.vectorVertexColor, true));
                    for(var i=0, len=this.vectorVericies.length; i<len; i+=2) {
                        this.graphics.drawRect(this.vectorVericies[i]-offset, this.vectorVericies[i+1]-offset, size, size);
                    }
                    this.graphics.endFill();
                }
            };

            ctx.fillRect = function(x, y, width, height){
                this.graphics.lineStyle();
                this.graphics.beginFill(Flynn.Util.parseColor(ctx.fillStyle, true));
                this.graphics.drawRect(x,  y, width, height);
                this.graphics.endFill();
            };

            ctx.vectorRectR = function(rect, color, fill_color, is_world){
                this.vectorRect(
                    rect.left, rect.top, rect.width, rect.height, 
                    color, fill_color, is_world);
            };

            ctx.vectorRect = function(x, y, width, height, color, fill_color, is_world){
                
                if(typeof(fill_color)!=='undefined' && fill_color){
                    this.fillStyle = fill_color;
                    this.fillRect(x, y, width, height);
                }

                if(typeof(is_world)==='undefined'){
                    is_world = false;
                }

                // Draw a rect using vectors
                this.vectorStart(color, is_world);
                this.vectorMoveTo(x, y);
                this.vectorLineTo(x+width-1, y);
                this.vectorLineTo(x+width-1, y+height-1);
                this.vectorLineTo(x, y+height-1);
                this.vectorLineTo(x, y);
                this.vectorEnd();
            };

            ctx.vectorLine = function(x1, y1, x2, y2, color, is_world){
                if(typeof(is_world)==='undefined'){
                    is_world = false;
                }

                // Draw a vector line
                this.vectorStart(color, is_world);
                this.vectorMoveTo(x1, y1);
                this.vectorLineTo(x2, y2);
                this.vectorEnd();
            };

            ctx.charToPolygon = function(ch, font){
                var p;
                if ((ch >= this.EXCLAMATIONCODE) && (ch <= this.LOWERCASE_Z)){
                    if(ch >= this.LOWERCASE_A){
                        ch -= this.UPPER_TO_LOWER;
                    }
                    p = font.Points.ASCII[ch - this.EXCLAMATIONCODE];
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

            ctx.vectorText = function(text, scale, x, y, justify, color, is_world, font){
                // text: String (the text to display)
                // x: number or null
                //    number: The x location to display the text
                //    null: Center text horizontally on screen
                // y: number or null
                //    number: The y location to display the text
                //    null: Center text vertically on screen
                // justify: String.  'left', 'right', or 'center'
                //    If x is null, then justify can be null (it is ignored)
                // color: String.  Text color.
                // is_world: Boolean
                //    true: Use world coordinates
                //    false: Use screen coordinates
                // font: Flynn font object (Flynn.Font.Normal, Flynn.Font.Block, etc.)
                text = String(text);
                if(typeof(color)==='undefined'){
                    console.log("ctx.vectorText(): default color deprecated.  Please pass a color.  Text:" + text );
                    color = Flynn.Colors.WHITE;
                }
                if(typeof(is_world)==='undefined'){
                    is_world = false;
                }
                if(typeof(font)==='undefined'){
                    font = Flynn.Font.Normal;
                }

                var step = scale*font.CharacterSpacing;

                // add offset if specified
                if (typeof justify === "number") {
                    throw '5th parameter is now "justify" (was "offset").  Pass "left", "right", or "center".';
                }
                else{
                    switch(justify){
                        case 'right':
                            x -= step * text.length - scale * font.CharacterGap;
                            break;
                        case 'center':
                            x -= step * text.length / 2 - scale * font.CharacterGap / 2;
                            break;
                        case 'left':
                            break;
                        default:
                            // If x is null, will center horizontally on screen.
                            // If x is a number, then a justification must be specified
                            if(typeof x == "number"){
                                throw '5th parameter is now "justify" (was "offset").  Pass "left", "right", or "center".';
                            }
                            break;
                    }
                }

                // Center x/y if they are not numbers
                if (typeof x !== "number"){
                    x = Math.round((this.width - (text.length*step-(font.CharacterGap*scale)))/2);
                }
                if (typeof y !== "number"){
                    y = Math.round((this.height - step)/2);
                }

                for(var i = 0, len = text.length; i<len; i++){
                    var ch = text.charCodeAt(i);

                    if (ch === this.SPACECODE){
                        x += step;
                        continue;
                    }
                    var p = this.charToPolygon(ch, font);

                    var pen_up = false;
                    this.vectorStart(color, is_world, true);
                    for (var j=0, len2=p.length; j<len2; j+=2){
                        if(p[j]==Flynn.PEN_COMMAND){
                            pen_up = true;
                        }
                        else{
                            if(j===0 || pen_up){
                                this.vectorMoveTo(p[j]*scale+x, p[j+1]*scale +y);
                                pen_up = false;
                            }
                            else{
                                this.vectorLineTo(p[j]*scale+x, p[j+1]*scale +y);
                            }
                        }
                    }
                    this.vectorEnd();
                    x += step;
                }
            };

            ctx.vectorTextArc = function(text, scale, center_x, center_y, angle, radius, color, is_centered, is_reversed, is_world, font, stretch){
                var draw_x, draw_y;

                text = String(text);

                if(typeof(color)==='undefined'){
                    color = Flynn.Colors.GREEN;
                }
                if(typeof(is_centered)==='undefined'){
                    is_centered = false;
                }
                if(typeof(is_reversed)==='undefined'){
                    is_reversed = false;
                }
                if(typeof(is_world)==='undefined'){
                    is_world = false;
                }
                if(typeof(font)==='undefined'){
                    font = Flynn.Font.Normal;
                }
                if(typeof(stretch)==='undefined'){
                    stretch = null;
                }

                var render_angle = angle;
                var render_angle_step = Math.asin(font.CharacterSpacing*scale/radius);
                if(stretch){
                    render_angle_step *= 1.4;
                }
                var renderAngleOffset = 0;
                if (is_centered){
                    renderAngleOffset = render_angle_step * (text.length / 2 - 0.5);
                    if(is_reversed){
                        renderAngleOffset = -renderAngleOffset;
                    }
                }
                render_angle -= renderAngleOffset;
                var character_angle = render_angle + Math.PI/2;
                if(is_reversed){
                    character_angle += Math.PI;
                    render_angle_step = - render_angle_step;
                }

                for(var i = 0, len = text.length; i<len; i++){
                    this.vectorStart(color, is_world, false);
                    var ch = text.charCodeAt(i);

                    if (ch === this.SPACECODE){
                        render_angle += render_angle_step;
                        character_angle += render_angle_step;
                        continue;
                    }

                    // Get the character vector points
                    var p = this.charToPolygon(ch, font);

                    // Render character
                    var pen_up = false;
                    for (var j=0, len2=p.length; j<len2; j+=2){
                        if(p[j]==Flynn.PEN_COMMAND){
                            pen_up = true;
                        }
                        else{
                            if(stretch){
                                var sign = 1;
                                if (is_reversed){
                                    sign = -sign;
                                }
                                
                                // Remap x coordinate onto a logarithmic scale
                                var character_x = p[j+1];
                                if (!is_reversed){
                                    character_x = font.CharacterHeight - character_x;
                                }
                                var x_log = Flynn.Util.logish(
                                    character_x, 
                                    0,                      // min
                                    font.CharacterHeight,   // max
                                    1.2                     // power
                                    );
                                
                                var draw_radius = radius + (x_log - font.CharacterHeight/2) * scale * stretch;
                                var draw_angle = render_angle +
                                    sign * (p[j] - font.CharacterWidth/2) * font.CharacterSpacing * scale / (font.CharacterWidth * radius);
                                draw_x = Math.cos(draw_angle) * draw_radius + center_x;
                                draw_y = Math.sin(draw_angle) * draw_radius + center_y;
                            }
                            else{
                                var x = p[j] - font.CharacterWidth/2;
                                var y = p[j+1] - font.CharacterHeight/2;
                                var c = Math.cos(character_angle);
                                var s = Math.sin(character_angle);
                                draw_x = (c*x - s*y) * scale + Math.cos(render_angle) * radius + center_x;
                                draw_y = (s*x + c*y) * scale + Math.sin(render_angle) * radius + center_y;
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
            // paceFactor represents the % of a 60fps frame that has elapsed.
            // At 30fps the paceFactor is 2.0,  At 15fps it is 4.0
            var paceFactor = (60*(timeNow - self.previousTimestamp))/1000;
            if (paceFactor > Flynn.Config.MAX_PACE_RECOVERY_TICKS) {
                paceFactor = 1;
            }
            paceFactor *= Flynn.mcp.gameSpeedFactor;

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
                    paceFactor *=  0.2;
                    label = "SLOW_MO";
                    self.gaugeFps.record(1000/deltaMsec);
                    break;
                case Flynn.DevPacingMode.FPS_20:
                    ++self.devLowFpsFrameCount;
                    self.devLowFpsPaceFactor += paceFactor;
                    if(self.devLowFpsFrameCount === 3){
                        self.devLowFpsFrameCount = 0;
                        paceFactor = self.devLowFpsPaceFactor;
                        self.devLowFpsPaceFactor = 0;
                        self.gaugeFps.record(60/paceFactor);
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


                animation_callback_f(paceFactor);

                if(label){
                    self.ctx.vectorText(label, 1.5, 10, self.canvas.height-20, 'left', Flynn.Colors.RED);
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