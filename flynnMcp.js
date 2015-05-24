// Master Control Program 

var FlynnDevPacingMode = {
	NORMAL:  0,
	SLOW_MO: 1,
	FPS_20:  2,
};

var FlynnMcp = Class.extend({

	init: function(canvasWidth, canvasHeight, input, noChangeState, gameSpeedFactor) {
		"use strict";

		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.input = input;
		this.noChangeState = noChangeState;
		this.developerModeEnabled = false;
		this.gameSpeedFactor = gameSpeedFactor;

		this.credits = 0;
		this.arcadeModeEnabled = false;
		this.nextState = noChangeState;
		this.currentState = null;

		this.devPacingMode = FlynnDevPacingMode.NORMAL;
		this.devLowFpsPaceFactor = 0;
		this.devLowFpsFrameCount = 0;

		this.version = 'v1.0';

		this.stateBuilderFunc = null;
		this.resizeFunc = null;
		this.slowMoDebug = false;
        this.clock = 0;
        this.timers = new FlynnTimers();

		this.custom={}; // Container for custom game data which needs to be exchanged globally.

		// Highscores
		this.highscores = [
			["No Name", 100],
		];

		// Detect developer mode from URL arguments ("?develop=true")
        if(flynnGetUrlValue("develop")=='true'){
            this.developerModeEnabled = true;
        }
		
		this.canvas = new FlynnCanvas(this, canvasWidth, canvasHeight);

		// Detect arcade mode from URL arguments ("?arcade=true")
        if(flynnGetUrlValue("arcade")=='true'){
            this.arcadeModeEnabled = true;
        }

		//--------------------------
		// Browser/platform support
		//--------------------------

		// SUPPORT: performance.now()
		this.browserSupportsPerformance = true;
		try{
			var time = performance.now();
		}
		catch(err){
			this.browserSupportsPerformance = false;
		}

		// SUPPORT: iOS
		this.browserIsIos = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

		// SUPPORT: Touch
		this.browserSupportsTouch = ('ontouchstart' in document.documentElement);

		if (this.developerModeEnabled){
			console.log("DEV: browserSupportsPeformance=", this.browserSupportsPerformance);
			console.log("DEV: browserIsIos=", this.browserIsIos);
			console.log("DEV: browserSupportsTouch=", this.browserSupportsTouch);
		}

		// Set Vector mode
		this.vectorMode = null;
		var vectorMode = flynnGetUrlValue("vector");
		for (var key in FlynnVectorMode){
			if (vectorMode === key){
				this.vectorMode = FlynnVectorMode[key];
			}
		}
		if (this.vectorMode === null){
			// No vector mode specified on command line (or no match)
			if(this.browserSupportsTouch){
				// Default to plain lines on phones/pads for visibility and performance
				this.vectorMode = FlynnVectorMode.V_THICK;
			}
			else{
				this.vectorMode = FlynnVectorMode.V_THIN;
			}
		}

		//--------------------------
		// Resize handler
		//--------------------------
		var self = this;
		this.resize = function(){
			// Get the dimensions of the viewport
			var viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};

			// Determine game size
			var targetWidth = 1024;
			var targetHeight = 768;
			var multiplier = Math.min((viewport.height / targetHeight), (viewport.width / targetWidth));
			var actualCanvasWidth = Math.floor(targetWidth * multiplier);
			var actualCanvasHeight = Math.floor(targetHeight * multiplier);
			var top = Math.floor(viewport.height/2 - actualCanvasHeight/2);
			var left = Math.floor(viewport.width/2 - actualCanvasWidth/2);

			var element = document.getElementById("gameCanvas");
			element.style.display = "block";
			element.style.width = actualCanvasWidth + "px";
			element.style.height = actualCanvasHeight + "px";
			element.style.top = top + "px";
			element.style.left = left + "px";

			if(self.resizeFunc){
				self.resizeFunc(viewport.width, viewport.height);
			}
		};
		window.addEventListener("resize", this.resize);
	},

	setStateBuilderFunc: function(stateBuilderFunc){
		this.stateBuilderFunc = stateBuilderFunc;
	},

	setResizeFunc: function(resizeFunc){
		this.resizeFunc = resizeFunc;
	},

	cycleDevPacingMode: function(){
		switch(this.devPacingMode){
			case FlynnDevPacingMode.NORMAL:
				this.devPacingMode = FlynnDevPacingMode.SLOW_MO;
				break;
			case FlynnDevPacingMode.SLOW_MO:
				this.devPacingMode = FlynnDevPacingMode.FPS_20;
				break;
			case FlynnDevPacingMode.FPS_20:
				this.devPacingMode = FlynnDevPacingMode.NORMAL;
		}
	},

	toggleDevPacingSlowMo: function(){
		if(this.devPacingMode === FlynnDevPacingMode.SLOW_MO){
			this.devPacingMode = FlynnDevPacingMode.NORMAL;
		}
		else{
			this.devPacingMode = FlynnDevPacingMode.SLOW_MO;
		}
	},

	toggleDevPacingFps20: function(){
		if(this.devPacingMode === FlynnDevPacingMode.FPS_20){
			this.devPacingMode = FlynnDevPacingMode.NORMAL;
		}
		else{
			this.devPacingMode = FlynnDevPacingMode.FPS_20;
		}
	},

	updateHighScores: function (nickName, score){
		"use strict";
		this.highscores.push([nickName, score]);

		// sort hiscore in ascending order
		this.highscores.sort(function(a, b) {
			return b[1] - a[1];
		});

		// Drop the last
		this.highscores.splice(this.highscores.length-1, 1);
	},

	run: function(){
		"use strict";
		var self = this;

		this.canvas.animate( function(paceFactor) {

			var skipThisFrame = false;
			var label = null;

			switch(self.devPacingMode){
				case FlynnDevPacingMode.NORMAL:
					paceFactor *= self.gameSpeedFactor;
					break;
				case FlynnDevPacingMode.SLOW_MO:
					paceFactor *= self.gameSpeedFactor * 0.2;
					label = "SLOW_MO";
					break;
				case FlynnDevPacingMode.FPS_20:
					paceFactor *= self.gameSpeedFactor;
					++self.devLowFpsFrameCount;
					self.devLowFpsPaceFactor += paceFactor;
					if(self.devLowFpsFrameCount === 5){
						self.devLowFpsFrameCount = 0;
						paceFactor = self.devLowFpsPaceFactor;
						self.devLowFpsPaceFactor = 0;
					}
					else{
						// Skip this frame (to simulate low frame rate)
						skipThisFrame = true;
					}
					label = "FPS_20";
					break;
			}

			if(!skipThisFrame){
				// Change state (if pending)
				if (self.nextState !== self.noChangeState) {
					self.currentState = self.stateBuilderFunc(self.nextState);
					self.nextState = self.noChangeState;
				}

				// Update clock and timers
				self.clock += paceFactor;
				self.timers.update(paceFactor);

				// Process state (if set)
				if(self.currentState){
					self.currentState.handleInputs(self.input, paceFactor);
					self.currentState.update(paceFactor);
					self.currentState.render(self.canvas.ctx);

					if(label){
						self.canvas.ctx.vectorText(label, 1.5, 0, self.canvasHeight-20, null, FlynnColors.GRAY);
					}
				}
			}
		});
	},

});