var FlynnMaxPaceRecoveryTicks = 5; // Max elapsed 60Hz frames to apply pacing (beyond this, just jank)

var FlynnTextWidth = 4;
var FlynnTextHeight = 6;
var FlynnTextCenterOffsetX = FlynnTextWidth/2;
var FlynnTextCenterOffsetY = FlynnTextHeight/2;
var FlynnTextGap = 2;
var FlynnTextSpacing = FlynnTextWidth + FlynnTextGap;

var FlynnCanvas = Class.extend({

	init: function(game, width, height) {
		this.game = game;

		this.showMetrics = false;
		this.canvas = document.getElementById("gameCanvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.previousTimestamp = 0;

		this.DEBUGLOGGED = false;

		this.ctx = (function(ctx) {
			ctx.width = ctx.canvas.width;
			ctx.height = ctx.canvas.height;
			ctx.fps = 0;
			ctx.fpsFrameAverage = 10; // Number of frames to average over
			ctx.fpsFrameCount = 0;
			ctx.fpsMsecCount = 0;

			ctx.ACODE = "A".charCodeAt(0);
			ctx.ZEROCODE = "0".charCodeAt(0);
			ctx.SPACECODE = " ".charCodeAt(0);
			ctx.EXCLAMATIONCODE = "!".charCodeAt(0);
			ctx.ACCENTCODE = '`'.charCodeAt(0);
			
			ctx.drawPolygon = function(p, x, y) {
				var points = p.points;

				this.strokeStyle = p.color;
				this.beginPath();
				//this.lineWidth = "6"; // Fat lines for screenshot thumbnail generation
				this.moveTo(points[0]+x, points[1]+y);
				for (var i=2, len=points.length; i<len; i+=2){
					this.lineTo(points[i]+x, points[i+1] +y);
				}
				
				this.stroke();
			};

			ctx.drawFpsGague = function(x, y, color, percentage){
				x += 0.5;
				y += 0.5;
				this.beginPath();
				var length = 60;
				var height = 6;
				var x_needle = percentage * length;

				ctx.fillStyle="#FFFFFF";
				ctx.rect(x,y,length,height);
				ctx.fillStyle=color;
				ctx.fillRect(x, y, x_needle, height);

				this.stroke();
			};

			ctx.vectorText = function(text, scale, x, y, offset, color){
				if(typeof(color)==='undefined'){
					color = FlynnColors.GREEN;
				}

				text = text.toString().toUpperCase();
				var step = scale*FlynnTextSpacing;

				// add offset if specified
				if (typeof offset === "number") {
					x += step*(offset - text.length);
				}

				// Center x/y if they are not numbers
				if (typeof x !== "number"){
					x = Math.round((this.width - text.length*step)/2);
				}
				if (typeof y !== "number"){
					y = Math.round((this.height - step)/2);
				}

				x += 0.5;
				y += 0.5;

				this.strokeStyle = color;
				for(var i = 0, len = text.length; i<len; i++){
					var ch = text.charCodeAt(i);

					if (ch === this.SPACECODE){
						x += step;
						continue;
					}
					var p;
					if ((ch >= this.EXCLAMATIONCODE) && (ch <= this.ACCENTCODE)){
						p = FlynnPoints.ASCII[ch - this.EXCLAMATIONCODE];
					}
					else{
						p = FlynnPoints.UNIMPLEMENTED_CHAR;
					}

					this.beginPath();
					var pen_up = false;
					for (var j=0, len2=p.length; j<len2; j+=2){
						if(p[j]==FlynnPoints.PEN_UP){
							pen_up = true;
						}
						else{
							if(j===0 || pen_up){
								this.moveTo(p[j]*scale+x, p[j+1]*scale +y);
								pen_up = false;
							}
							else{
								this.lineTo(p[j]*scale+x, p[j+1]*scale +y);
							}
						}
					}
					this.stroke();
					x += step;
				}
				this.DEBUGLOGGED = true;
			};

			ctx.vectorTextArc = function(text, scale, center_x, center_y, angle, radius, color, isCentered, isReversed){
				if(typeof(color)==='undefined'){
					color = FlynnColors.GREEN;
				}
				if(typeof(isCentered)==='undefined'){
					isCentered = false;
				}
				if(typeof(isReversed)==='undefined'){
					isReversed = false;
				}

				text = text.toString().toUpperCase();
				var step = scale*FlynnTextSpacing;

				center_x += 0.5;
				center_y += 0.5;

				var render_angle = angle;
				var render_angle_step = Math.asin(FlynnTextSpacing*scale/radius);
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

				this.strokeStyle = color;
				for(var i = 0, len = text.length; i<len; i++){
					var ch = text.charCodeAt(i);

					if (ch === this.SPACECODE){
						render_angle += render_angle_step;
						character_angle += render_angle_step;
						continue;
					}

					// Get the character vector points
					var p;
					if ((ch >= this.EXCLAMATIONCODE) && (ch <= this.ACCENTCODE)){
						p = FlynnPoints.ASCII[ch - this.EXCLAMATIONCODE];
					}
					else{
						p = FlynnPoints.UNIMPLEMENTED_CHAR;
					}

					// Render character
					var pen_up = false;
					this.beginPath();
					for (var j=0, len2=p.length; j<len2; j+=2){
						if(p[j]==FlynnPoints.PEN_UP){
							pen_up = true;
						}
						else{
							var x = p[j] - FlynnTextCenterOffsetX;
							var y = p[j+1] - FlynnTextCenterOffsetY;
							var c = Math.cos(character_angle);
							var s = Math.sin(character_angle);
							var draw_x = (c*x - s*y) * scale + Math.cos(render_angle) * radius + center_x;
							var draw_y = (s*x + c*y) * scale + Math.sin(render_angle) * radius + center_y;

							if(j===0 || pen_up){
								this.moveTo(draw_x, draw_y);
								pen_up = false;
							}
							else{
								this.lineTo(draw_x, draw_y);
							}
						}
					}
					this.stroke();

					render_angle += render_angle_step;
					character_angle += render_angle_step;
				}
			};

			ctx.clearAll = function(){
				this.clearRect(0, 0, this.width, this.height);
			};

			return ctx;
		})(this.canvas.getContext("2d"));

		this.ctx.strokeStyle = FlynnColors.WHITE;

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
			if(self.game.browserSupportsPerformance){
				timeNow = performance.now();
			}
			else{
				timeNow = timeStamp;
			}
			
			self.ctx.fpsMsecCount += timeNow - self.previousTimestamp;
			// paceFactor represents the % of a 60fps frame that has elapsed.
			// At 30fps the paceFactor is 2.0,  At 15fps it is 4.0
			var paceFactor = (60*(timeNow - self.previousTimestamp))/1000;
			if (paceFactor > FlynnMaxPaceRecoveryTicks) {
				paceFactor = 1;
			}

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
			if(self.game.browserSupportsPerformance){
				start = performance.now();
			}
			
			animation_callback_f(paceFactor);
			
			if(self.game.browserSupportsPerformance){
				end = performance.now();
			}

			if (self.showMetrics){
				self.ctx.drawFpsGague(self.canvas.width-65, self.canvas.height-10, FlynnColors.GREEN, self.ctx.fps/120);
				if(self.game.browserSupportsPerformance){
					self.ctx.drawFpsGague(self.canvas.width-65, self.canvas.height-16, FlynnColors.YELLOW, (end-start)/(1000/120));
				}
			}
			
			// Update screen and request callback
			refresh_f(callback_f, self.canvas);

		};
		refresh_f(callback_f, this.canvas );
	}
});