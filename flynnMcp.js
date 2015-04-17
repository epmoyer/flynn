// Master Control Program 

var FlynnMcp = Class.extend({

	init: function(canvasWidth, canvasHeight, input, noChangeState, developerModeEnabled) {
		"use strict";

		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.developerModeEnabled = developerModeEnabled;
		this.input = input;
		this.noChangeState = noChangeState;

		this.nextState = noChangeState;
		this.currentState = null;

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

		this.canvas = new FlynnCanvas(this, canvasWidth, canvasHeight);

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
            // Update clock and timers
            self.clock += paceFactor;
            self.timers.update(paceFactor);

			// Change state (if pending)
			if (self.nextState !== self.noChangeState) {
				self.currentState = self.stateBuilderFunc(self.nextState);
				self.nextState = self.noChangeState;
			}

			// Process state (if set)
			if(self.currentState){
				self.currentState.handleInputs(self.input);
				if(self.slowMoDebug){
					self.currentState.update(paceFactor * 0.1); // Slow Mo
					//self.currentState.update(0); // Freeze Frame
				}
				else{
					self.currentState.update(paceFactor * 0.7);
				}
				self.currentState.render(self.canvas.ctx);
			}
		});
	},

});