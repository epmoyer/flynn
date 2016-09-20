// Vector rendering emulation modes
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

    init: function(mcp, width, height) {
        this.mcp = mcp;

        this.showMetrics = false;
        this.canvas = document.getElementById("gameCanvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.previousTimestamp = 0;

        this.DEBUGLOGGED = false;

        self = this;
        this.ctx = (function(ctx) {
            ctx.width = ctx.canvas.width;
            ctx.height = ctx.canvas.height;
            ctx.fps = 0;
            ctx.fpsFrameAverage = 10; // Number of frames to average over
            ctx.fpsFrameCount = 0;
            ctx.fpsMsecCount = 0;
            ctx.vectorVericies = [];
            ctx.mcp = mcp;
            ctx.ticks = 0;

            ctx.ACODE = "A".charCodeAt(0);
            ctx.ZEROCODE = "0".charCodeAt(0);
            ctx.SPACECODE = " ".charCodeAt(0);
            ctx.EXCLAMATIONCODE = "!".charCodeAt(0);
            ctx.ACCENTCODE = '`'.charCodeAt(0);
            ctx.LOWERCASE_A = 'a'.charCodeAt(0);
            ctx.LOWERCASE_Z = 'z'.charCodeAt(0);
            ctx.UPPER_TO_LOWER = 0x20;
            
            ctx.drawPolygon = function(p, x, y) {
                var points = p.points;
                var vector_color = p.color;
                var current_polygon_x, current_polygon_y;

                this.vectorStart(vector_color);
                var pen_up = false;
                for (var i=0, len=points.length; i<len; i+=2){
                    if(points[i] == Flynn.PEN_COMMAND){
                        if(points[i+1] == Flynn.PEN_UP){
                            pen_up = true;
                        }
                        else{
                            vector_color = Flynn.ColorsOrdered[points[i+1] - Flynn.PEN_COLOR0];
                            this.vectorEnd();
                            this.vectorStart(vector_color);
                            if(i>0){
                                this.vectorMoveTo(current_polygon_x+x, current_polygon_y+y);
                            }
                            //pen_up = true;
                            //this.vectorMoveTo(current_polygon_x+x, current_polygon_y+y);
                        }
                    }
                    else{
                        current_polygon_x = points[i];
                        current_polygon_y = points[i+1];
                        if(i===0 || pen_up){
                            this.vectorMoveTo(current_polygon_x+x, current_polygon_y+y);
                            pen_up = false;
                        }
                        else {
                            this.vectorLineTo(current_polygon_x+x, current_polygon_y+y);
                        }
                    }
                }
                this.vectorEnd();
            };

            ctx.drawFpsGague = function(x, y, color, percentage){
                x += 0.5;
                y += 0.5;
                this.beginPath();
                var length = 60;
                var height = 6;
                var x_needle = percentage * length;

                this.strokeStyle = Flynn.Colors.GRAY;
                ctx.fillStyle="#FFFFFF";
                ctx.rect(x,y,length,height);
                ctx.fillStyle=color;
                ctx.fillRect(x, y, x_needle, height);

                this.stroke();
            };

            //-----------------------------
            // Vector graphic simulation
            //-----------------------------
            ctx.vectorStart = function(color){

                // Determine vector line color
                var dim_color_rgb = Flynn.Util.hexToRgb(color);
                var vectorDimFactor = 1;
                var lineWidth = 1;
                switch(this.mcp.options.vectorMode){
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
                this.beginPath();
                this.strokeStyle = dim_color;
                this.lineJoin = 'round';  // Get rid of long mitres on sharp angles
                this.lineWidth = lineWidth;

                //this.lineWidth = "6"; // Fat lines for screenshot thumbnail generation
            };

            ctx.vectorLineTo = function(x, y){
                this.vectorLineToUnconstrained(Math.floor(x), Math.floor(y));
            };

            ctx.vectorMoveTo = function(x, y){
                this.vectorMoveToUnconstrained(Math.floor(x), Math.floor(y));
            };

            ctx.vectorLineToUnconstrained = function(x, y){
                this.vectorVericies.push(x, y);
                if(this.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                    this.lineTo(x, y);
                }
                else{
                    this.lineTo(x+0.5, y+0.5);
                }
            };

            ctx.vectorMoveToUnconstrained = function(x, y){
                this.vectorVericies.push(x, y);
                if(this.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                    this.moveTo(x, y);
                }
                else{
                    this.moveTo(x+0.5, y+0.5);
                }
            };


            ctx.vectorEnd = function(){
                // Finish the line drawing 
                this.stroke();

                if(this.mcp.options.vectorMode != Flynn.VectorMode.PLAIN){
                    // Draw the (bright) vector vertex points
                    var offset, size;
                    if(this.mcp.options.vectorMode === Flynn.VectorMode.V_THICK){
                        offset = 1;
                        size = 2;
                    }
                    else{
                        offset = 0;
                        size = 1;
                    }
                    this.fillStyle = this.vectorVertexColor;
                    for(var i=0, len=this.vectorVericies.length; i<len; i+=2) {
                        ctx.fillRect(this.vectorVericies[i]-offset, this.vectorVericies[i+1]-offset, size, size);
                    }
                }
            };

            ctx.vectorRect = function(x, y, width, height, color){
                // Finish the line drawing 
                this.vectorStart(color);
                this.vectorMoveTo(x, y);
                this.vectorLineTo(x+width-1, y);
                this.vectorLineTo(x+width-1, y+height-1);
                this.vectorLineTo(x, y+height-1);
                this.vectorLineTo(x, y);
                this.vectorEnd();
            };

            ctx.vectorLine = function(x1, y1, x2, y2, color){
                // Finish the line drawing 
                this.vectorStart(color);
                this.vectorMoveTo(x1, y1);
                this.vectorLineTo(x2, y2);
                this.vectorEnd();
            };

            ctx.charToPolygon = function(ch){
                var p;
                if ((ch >= this.EXCLAMATIONCODE) && (ch <= this.LOWERCASE_Z)){
                    if(ch >= this.LOWERCASE_A){
                        ch -= this.UPPER_TO_LOWER;
                    }
                    p = Flynn.Font.Points.ASCII[ch - this.EXCLAMATIONCODE];
                }
                else{
                    p = Flynn.Font.Points.UNIMPLEMENTED_CHAR;
                }
                return p;
            };

            ctx.vectorText = function(text, scale, x, y, offset, color){
                text = String(text);
                if(typeof(color)==='undefined'){
                    console.log("ctx.vectorText(): default color deprecated.  Please pass a color.  Text:" + text );
                    color = Flynn.Colors.WHITE;
                }

                var step = scale*Flynn.Font.CharacterSpacing;

                // add offset if specified
                if (typeof offset === "number") {
                    x += step*(offset - text.length) + scale * Flynn.Font.CharacterGap;
                }

                // Center x/y if they are not numbers
                if (typeof x !== "number"){
                    x = Math.round((this.width - (text.length*step-(Flynn.Font.CharacterGap*scale)))/2);
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
                    var p = this.charToPolygon(ch);

                    var pen_up = false;
                    this.vectorStart(color);
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
                this.DEBUGLOGGED = true;
            };

            ctx.vectorTextArc = function(text, scale, center_x, center_y, angle, radius, color, isCentered, isReversed){
                text = String(text);

                if(typeof(color)==='undefined'){
                    color = Flynn.Colors.GREEN;
                }
                if(typeof(isCentered)==='undefined'){
                    isCentered = false;
                }
                if(typeof(isReversed)==='undefined'){
                    isReversed = false;
                }

                var step = scale*Flynn.Font.CharacterSpacing;

                var render_angle = angle;
                var render_angle_step = Math.asin(Flynn.Font.CharacterSpacing*scale/radius);
                var renderAngleOffset = 0;
                if (isCentered){
                    renderAngleOffset = render_angle_step * (text.length / 2 - 0.5);
                    if(isReversed){
                        renderAngleOffset = -renderAngleOffset;
                    }
                }
                render_angle -= renderAngleOffset;
                var character_angle = render_angle + Math.PI/2;
                if(isReversed){
                    character_angle += Math.PI;
                    render_angle_step = - render_angle_step;
                }

                for(var i = 0, len = text.length; i<len; i++){
                    this.vectorStart(color);
                    var ch = text.charCodeAt(i);

                    if (ch === this.SPACECODE){
                        render_angle += render_angle_step;
                        character_angle += render_angle_step;
                        continue;
                    }

                    // Get the character vector points
                    var p = this.charToPolygon(ch);

                    // Render character
                    var pen_up = false;
                    this.beginPath();
                    for (var j=0, len2=p.length; j<len2; j+=2){
                        if(p[j]==Flynn.PEN_COMMAND){
                            pen_up = true;
                        }
                        else{
                            var x = p[j] - Flynn.Font.CharacterWidth/2;
                            var y = p[j+1] - Flynn.Font.CharacterHeight/2;
                            var c = Math.cos(character_angle);
                            var s = Math.sin(character_angle);
                            var draw_x = (c*x - s*y) * scale + Math.cos(render_angle) * radius + center_x;
                            var draw_y = (s*x + c*y) * scale + Math.sin(render_angle) * radius + center_y;

                            if(j===0 || pen_up){
                                this.vectorMoveToUnconstrained(draw_x, draw_y);
                                pen_up = false;
                            }
                            else{
                                this.vectorLineToUnconstrained(draw_x, draw_y);
                            }
                        }
                    }
                    this.vectorEnd();

                    render_angle += render_angle_step;
                    character_angle += render_angle_step;
                }
            };

            ctx.clearAll = function(){
                this.clearRect(0, 0, this.width, this.height);
            };

            return ctx;
        })(this.canvas.getContext("2d"));

        this.ctx.strokeStyle = Flynn.Colors.WHITE;

        document.body.appendChild(this.canvas);
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
            if(self.mcp.browserSupportsPerformance){
                timeNow = performance.now();
            }
            else{
                timeNow = timeStamp;
            }
            
            self.ctx.fpsMsecCount += timeNow - self.previousTimestamp;
            // paceFactor represents the % of a 60fps frame that has elapsed.
            // At 30fps the paceFactor is 2.0,  At 15fps it is 4.0
            var paceFactor = (60*(timeNow - self.previousTimestamp))/1000;
            if (paceFactor > Flynn.Config.MAX_PACE_RECOVERY_TICKS) {
                paceFactor = 1;
            }

            self.ctx.ticks += 1;

            ++self.ctx.fpsFrameCount;
            if (self.ctx.fpsFrameCount >= self.ctx.fpsFrameAverage){
                self.ctx.fpsFrameCount = 0;
                self.ctx.fps = Math.round(1000/(self.ctx.fpsMsecCount/self.ctx.fpsFrameAverage));
                self.ctx.fpsMsecCount = 0;
            }
            self.previousTimestamp = timeNow;
            
            //---------------------------
            // Do animation
            //---------------------------
            var start;
            var end;
            if(self.mcp.browserSupportsPerformance){
                start = performance.now();
            }
            
            animation_callback_f(paceFactor);
            
            if(self.mcp.browserSupportsPerformance){
                end = performance.now();
            }

            if (self.showMetrics){
                self.ctx.drawFpsGague(self.canvas.width-70, self.canvas.height-15, Flynn.Colors.GREEN, self.ctx.fps/120);
                if(self.mcp.browserSupportsPerformance){
                    self.ctx.drawFpsGague(self.canvas.width-70, self.canvas.height-21, Flynn.Colors.YELLOW, (end-start)/(1000/120));
                }
            }
            
            // Update screen and request callback
            refresh_f(callback_f, self.canvas);

        };
        refresh_f(callback_f, this.canvas );
    }
});