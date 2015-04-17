var FlynnTimer = Class.extend({
	init: function(timerName, initialTicks){
		this.name = timerName;
		this.tickCounter = initialTicks;
		if (initialTicks > 0){
			this.isActive = true;
		}
		else{
			this.isActive = false;
		}
	},
});

var FlynnTimers = Class.extend({
	init: function(){
		this.timers = {};
	},

	add: function(timerName, initialTicks){
		if (timerName in this.timers){
			// Timer already exists. 
			this.timers[timerName].tickCounter =initialTicks;
		}
		else{
			// Create new timer
			newTimer = new FlynnTimer(timerName, initialTicks);
			this.timers[timerName]=newTimer;
		}
	},

	set: function(timerName, ticks){
		// Setting a timer to zero also deactivates it.
		this.timers[timerName].tickCounter = ticks;
		this.timers[timerName].isActive = (ticks > 0);
	},

	get: function(timerName){
		return(this.timers[timerName].tickCounter);
	},

	isActive: function(timerName){
		return(this.timers[timerName].isActive);
	},

	isExpired: function(timerName){
		// NOTE: isExpired will still return true if a counter
		//       is inactive.
		return(this.timers[timerName].tickCounter <= 0);
	},

	remove: function(timerName){
		delete this.timers[timerName];
	},

	update: function(paceFactor) {
		for (var timerName in this.timers){
			var timer = this.timers[timerName];
			if (timer.isActive){
				timer.tickCounter -= paceFactor;
				if (timer.tickCounter < 0){
					timer.tickCounter = 0;
				}
			}
		}
	},

});