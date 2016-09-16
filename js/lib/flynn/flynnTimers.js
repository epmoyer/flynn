Flynn.Timer = Class.extend({
    init: function(timerName, initialTicks, callback){
        this.name = timerName;
        this.tickCounter = initialTicks;
        this.callback = callback;
        this.expired = false;
    },
});

Flynn.Timers = Class.extend({
    //-----------------------------------------------------------------------------------------------------
    // Timers
    //
    // Timer expiration can be reported in two ways:
    //    1) hasExpired() will return 'true' on the first call after the timer has been set
    //       and the timer has subsequently expired.  Subsequent calls will return 'false' (until the timer
    //       has again been set and expired).
    //    2) If a callback funciton is supplied then it will be called when the timer expires.
    //-----------------------------------------------------------------------------------------------------

    init: function(){
        this.timers = {};
    },

    add: function(timerName, initialTicks, callback){
        if (timerName in this.timers){
            // Timer already exists. 
            this.set(timerName, initialTicks);
            this.timers[timerName].callback=callback;
        }
        else{
            // Create new timer
            newTimer = new Flynn.Timer(timerName, initialTicks, callback);
            this.timers[timerName]=newTimer;
        }
    },

    set: function(timerName, ticks){
        // Setting a timer to zero also deactivates it.
        var timer = this.timers[timerName];
        timer.tickCounter = ticks;
        timer.expired = false;
    },

    get: function(timerName){
        return(this.timers[timerName].tickCounter);
    },

    isRunning: function(timerName){
        return(this.timers[timerName].tickCounter > 0);
    },

    hasExpired: function(timerName){
        // Will return true on first call following timer expiration.
        // Subsequent calls will return false until the timer has been reset and has expired again.
        var timer = this.timers[timerName];
        if(timer.expired){
            timer.expired = false;
            return(true);
        }
        return(false);
    },

    remove: function(timerName){
        delete this.timers[timerName];
    },

    update: function(paceFactor) {
        for (var timerName in this.timers){
            var timer = this.timers[timerName];
            if (timer.tickCounter > 0){
                timer.tickCounter -= paceFactor;
                if (timer.tickCounter < 0){
                    // Timer has expired
                    timer.tickCounter = 0;
                    timer.expired = true;
                    if(timer.callback){
                        timer.callback();
                    }
                }
            }
        }
    },

});