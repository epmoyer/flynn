var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StatePacing = Flynn.State.extend({
    REGION_HEIGHT: 100,
    TICKS_PER_20FPS: 3,
    COLOR_60FPS: Flynn.Colors.GREEN,
    COLOR_20FPS: Flynn.Colors.MAGENTA,
    RESET_THRESHOLD: 60 * 8,

    init: function() {
        var i, x, drone_type, info;
        this._super();
        this.reset_counter = 0;
        this.region_info = [
            {name:'VELOCITY',     mode:Game.Drone.prototype.MODES.VELOCITY,      bounds:null},
            {name:'ACCELERATION', mode:Game.Drone.prototype.MODES.ACCELERATION,  bounds:null},
            {name:'FRICTION',     mode:Game.Drone.prototype.MODES.FRICTION,      bounds:null},
        ];
        this.counters = [
            {name:'  ELAPSED TICKS', value:0, color:this.COLOR_60FPS, is_20fps:false, is_ticks:true },
            {name:'ELAPSED SECONDS', value:0, color:this.COLOR_60FPS, is_20fps:false, is_ticks:false},
            {name:'  ELAPSED TICKS', value:0, color:this.COLOR_20FPS, is_20fps:false, is_ticks:true },
            {name:'ELAPSED SECONDS', value:0, color:this.COLOR_20FPS, is_20fps:false, is_ticks:false},
        ];
        this.drones = [];

        var drone_left_margin = 28;
        var drone_top_margin = 36;
        var drone_separation = 36;

        this.historic_elapsed_ticks = [];

        for(i=0; i<this.region_info.length; i++){
            info = this.region_info[i];
            info.bounds = 
                 new Flynn.Rect(
                    Game.BOUNDS.left,
                    Game.BOUNDS.top + i * this.REGION_HEIGHT,
                    Game.BOUNDS.width, 
                    this.REGION_HEIGHT + 1);
            this.drones.push(
                new Game.Drone(
                    new Victor(drone_left_margin, info.bounds.top + drone_top_margin),
                    this.COLOR_60FPS,
                    info.mode,
                    false  // is_20fps
                    )
            );
            this.drones.push(
                new Game.Drone(
                    new Victor(drone_left_margin, info.bounds.top + drone_top_margin + drone_separation),
                    this.COLOR_20FPS,
                    info.mode,
                    true   // is_20fps
                    )
            );
        }
    },

    handleInputs: function(input, elapsedTicks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsedTicks) {
        var i, j;

        //------------------------------
        // Reset drones periodically
        //------------------------------
        this.reset_counter += elapsedTicks;
        if(this.reset_counter > this.RESET_THRESHOLD){
            this.reset_counter = 0;
            for(i=0; i<this.drones.length; i++){
                this.drones[i].reinitialize();
            }
        }

        var elapsed_ticks_20fps = null;
        this.historic_elapsed_ticks.push(elapsedTicks);
        if(this.historic_elapsed_ticks.length == this.TICKS_PER_20FPS){
            elapsed_ticks_20fps = sum_array(this.historic_elapsed_ticks);
            this.historic_elapsed_ticks = [];
        }

        for(i=0; i<this.drones.length; i++){
            var drone = this.drones[i];
            if(!drone.is_20fps){
                drone.update(elapsedTicks);
            }
            if (drone.is_20fps && elapsed_ticks_20fps != null){
                // For the 20fps drones (the Magenta ones), call update only once
                // every 3 animation frames, and pass them the accumulated sum of the
                // elapsed ticks for the previous 3 frames.
                drone.update(elapsed_ticks_20fps);
            }
        }


        for(i=0; i<this.counters.length; i++){
            var counter = this.counters[i];
            if(!counter.is_20fps){
                this.update_counter(counter, elapsedTicks);
            }
            if(counter.is_20fps && elapsed_ticks_20fps != null){
                // For the 20fps counters (the Magenta ones), add time once
                // every 3 animation frames, adding the accumulated sum of the
                // elapsed ticks for the previous 3 frames.
                this.update_counter(counter, elapsed_ticks_20fps);
            }
        }
    },

    update_counter: function(counter, elapsedTicks){
        if(counter.is_ticks){
            // Accumulate elapsed game ticks
            counter.value += elapsedTicks;
        }
        else{
            // Accumulate elapsed seconds
            counter.value += elapsedTicks / Flynn.TICKS_PER_SECOND;
        }
    },  

    render: function(ctx){
        var i;
        var left_margin = 8, scale = 1.5, top_margin = 5;
        var heading_color = Flynn.Colors.YELLOW;

        Game.render_page_frame (ctx);
        ctx.vectorText(
            'GREEN ITEMS ARE UPDATED AT 60FPS. MAGENTA AT 20FPS.', 
            scale, null, Game.BOUNDS.bottom - 18, null, heading_color);

        // Regions
        for(i=0; i<this.region_info.length; i++){
            var info = this.region_info[i];
            ctx.vectorText(info.name, scale, info.bounds.left + left_margin, info.bounds.top + top_margin, 'left', heading_color);
            ctx.vectorRectR(info.bounds, Flynn.Colors.GREEN);
        }

        // Drones
        for(i=0; i<this.drones.length; i++){
            this.drones[i].render(ctx);
        }

        // Counters
        var pos_y = this.region_info[this.region_info.length - 1].bounds.bottom + 6;
        var line_height = 15;

        for(i=0; i<this.counters.length; i++){
            var counter = this.counters[i];
            ctx.vectorText(counter.name + ': ' + counter.value.toFixed(2), scale, left_margin, pos_y, 'left', counter.color);
            pos_y += line_height;
        }

    },
});

Game.Drone = Flynn.Polygon.extend({

    FRICTION_TIME_CONSTANT: 180,
    SCALE: 2.0,
    INITIAL_VELOCITY_STANDARD: 2.0,
    INITIAL_VELOCITY_FRICTION: 5.0,
    ROTATE_SPEED: Math.PI / 60,
    ACCELERATION: 0.05,

    MODES: {
        VELOCITY:     0,
        ACCELERATION: 1,
        FRICTION:     2,
    },

    init: function(position, color, mode, is_20fps){
        this._super(
            Game.Points.PENUP_TEST5,
            color,
            this.SCALE,
            position,
            false, // constrained
            false // is_world
            );

        this.reset_position = position.clone();
        this.reset_angle = 0;
        this.mode = mode;
        this.is_20fps = is_20fps;
        this.acceleration_v = new Victor(this.ACCELERATION, 0);

        this.reinitialize();
    },

    reinitialize: function(){
        this.position = this.reset_position.clone();
        this.setAngle(this.reset_angle);
        this.velocity = new Victor(0, 0);
        if(this.mode == this.MODES.VELOCITY){
            this.velocity = new Victor(this.INITIAL_VELOCITY_STANDARD, 0);
        }
        else if (this.mode == this.MODES.ACCELERATION){
            this.velocity = new Victor(0, 0);
        }
        else if (this.mode == this.MODES.FRICTION){
            this.velocity = new Victor(this.INITIAL_VELOCITY_FRICTION, 0);
        }
    },

    update: function(elapsedTicks){

        this.setAngle(this.angle + this.ROTATE_SPEED * elapsedTicks);

        if(this.mode == this.MODES.VELOCITY){
            this.position.add(this.velocity.clone().multiplyScalar(elapsedTicks));
        }
        else if (this.mode == this.MODES.ACCELERATION){
            this.position.add(
                this.acceleration_v.clone().multiplyScalar(Math.pow(elapsedTicks, 2) / 2).add(
                    this.velocity.clone().multiplyScalar(elapsedTicks)
                )
            );
            this.velocity.add(
                this.acceleration_v.clone().multiplyScalar(elapsedTicks)
            );
        }
        else if (this.mode == this.MODES.FRICTION){
            this.position.add(
               this.velocity.clone().subtract(
                    this.velocity.clone().multiplyScalar(
                        Math.pow(Math.E, - elapsedTicks / this.FRICTION_TIME_CONSTANT)
                    )
                ).multiplyScalar(this.FRICTION_TIME_CONSTANT)
            );
            this.velocity.multiplyScalar(Math.pow(Math.E, - elapsedTicks / this.FRICTION_TIME_CONSTANT ));
        }
    },
});

function sum_array(array){
    // Add the elements of an array, return the sum
    return array.reduce(add, 0);
}

function add(a, b){
    return a + b;
}

}()); // "use strict" wrapper