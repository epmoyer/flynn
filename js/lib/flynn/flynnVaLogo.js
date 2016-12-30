//-----------------------------------
// flynnVaLogo
//
//    Implements the "Vector Alchemy" logo.
//
//-----------------------------------

var Game = Game || {}; // Create namespace

(function () { "use strict";

Flynn.VALogo = Class.extend({

    POINTS:{
        FLASK: [-6,-12,9000,8012,-5,-12,-5,-1,-10,6,-10,10,-8,12,8,12,10,10,10,6,5,-1,5,-12,6,-12,9000,7000,3,-9,9000,8009,3,0,8,7,8,9,7,10,-7,10,-8,9,-8,7,-3,0,-3,-9,3,-9],
        INNER_BOUNDS: [3,-9,3,0,8,7,8,9,7,10,-7,10,-8,9,-8,7,-3,0,-3,-9,3,-9],
    },

    FLASK_INNER_X_MAX: 8,
    FLASK_INNER_Y_MAX: 10,
    FLASK_INNER_Y_MIN: -9,

    FLASK_VAPOR_Y_MIN: -30,

    BUBBLE_BOTTOM_PROBABILITY: 0.8,
    BUBBLE_RATE: 4,
    BUBBLE_ACCELERATION: 0.002,
    BUBBLE_DECELERARION: 0.003,
    BUBBLE_DIE_VELOCITY: -0.001,
    BUBBLE_GROW_RATE: 0.007,
    BUBBLE_DIE_RATE_MIN: -0.001,
    BUBBLE_DIE_RATE_MAX: -0.05,

    WIGGLE_RATE_ACCELERATION: 0.0001,
    WIGGLE_RATE_MAX: 0.03,
    WIGGLE_DISPLACEMENT_ANGLE: Math.PI/6,

    init: function(x, y, scale, color){
        this.pos = {x: x, y:y};
        this.scale = scale;
        this.bubbles = [];
        this.wiggle_angle = 0;
        this.wiggle_rate = 0;
        if(typeof(color)==='undefined'){
            color = true;
        }
        if(color){
            this.text_color = "#C0E0C0";
        }
        else{
            this.text_color = Flynn.Colors.GRAY;
        }

        this.flask = new Flynn.Polygon(
            this.POINTS.FLASK,
            Flynn.Colors.WHITE,
            scale, // scale
            {   x: x, 
                y: y, 
                is_world:false}
            );
        this.inner_bounds = new Flynn.Polygon(
            this.POINTS.INNER_BOUNDS,
            Flynn.Colors.WHITE,
            scale, // scale
            {   x: x, 
                y: y, 
                is_world:false}
            );

        this.angle=0;
        this.spin_rate = Math.PI/300;
        this.bubble_time = 0;

        // Generate initial bubble state
        for(var i = 0; i<180; i++){
            this.update(1.0);
            // Re-initialize text position
            this.wiggle_angle = 0;
            this.wiggle_rate = 0;
        }
    },

    bubble_in_inner: function(bubble){
        var check_offset = bubble.x > 0 ? 2 : -1;
        return this.inner_bounds.hasPoint(
            bubble.x * this.scale + this.pos.x + check_offset,
            bubble.y * this.scale + this.pos.y);
    },

    update: function(paceFactor){
        // this.angle += this.spin_rate * paceFactor;
        this.wiggle_rate += this.WIGGLE_RATE_ACCELERATION * paceFactor;
        this.wiggle_rate = Math.min(this.wiggle_rate, this.WIGGLE_RATE_MAX);
        this.wiggle_angle += this.wiggle_rate * paceFactor;
        this.angle = Math.sin(this.wiggle_angle) * this.WIGGLE_DISPLACEMENT_ANGLE;

        // Create new bubbles
        this.bubble_time += paceFactor;
        if(this.bubble_time > this.BUBBLE_RATE){
            this.bubble_time -= this.BUBBLE_RATE;
            var new_bubble = { 
                velocity: 0,
                brightness: 0.0,
                die_rate: Flynn.Util.randomFromInterval(
                    this.BUBBLE_DIE_RATE_MIN,
                    this.BUBBLE_DIE_RATE_MAX
                    )
                };
            new_bubble.x = Flynn.Util.randomFromInterval(
                    -this.FLASK_INNER_X_MAX,
                    this.FLASK_INNER_X_MAX);
            new_bubble.x = this.FLASK_INNER_X_MAX * Flynn.Util.logish(
                    Math.random(),
                    0,
                    1,
                    2.0);
            if(Math.random()<0.5){
                new_bubble.x = - new_bubble.x;
            }
            if(Math.random() < this.BUBBLE_BOTTOM_PROBABILITY){
                new_bubble.y = this.FLASK_INNER_Y_MAX - 1;
            }
            else{
                new_bubble.y = Flynn.Util.randomFromInterval(
                        this.FLASK_INNER_Y_MIN,
                        this.FLASK_INNER_Y_MAX);
            }
            if(this.bubble_in_inner(new_bubble)){
                this.bubbles.push(new_bubble);
            }
        }

        // Update bubbles
        var length = this.bubbles.length;
        var pacedAcceleration = this.BUBBLE_ACCELERATION * paceFactor;
        var pacedDeceleration = this.BUBBLE_DECELERARION * paceFactor;
        for(var i=0; i<length; i++){
            var bubble = this.bubbles[i];

            // Brighten / Darken
            if(bubble.y > this.FLASK_INNER_Y_MIN){
                bubble.brightness += this.BUBBLE_GROW_RATE * paceFactor;
            }
            else{
                bubble.brightness += bubble.die_rate * paceFactor;
            }
            bubble.brightness = Flynn.Util.minMaxBound(bubble.brightness, 0, 1);

            // Accelerate
            if(bubble.y > this.FLASK_INNER_Y_MIN){
                bubble.velocity -= pacedAcceleration;
            }
            else{
                bubble.velocity += pacedDeceleration;
                if(bubble.velocity >= this.BUBBLE_DIE_VELOCITY){
                    // Remove slow exit bubble (smoke)
                    this.bubbles.splice(i, 1);
                    i-=1;
                    length-=1;
                    continue;
                }
            }
            bubble.y += bubble.velocity * paceFactor;
            
            // Drift
            if(bubble.y > this.FLASK_INNER_Y_MIN){
                // Wall drift
                if(!this.bubble_in_inner(bubble))
                {
                    if(bubble.x > 0){
                        bubble.x-=0.2;
                    }else{
                        bubble.x+=0.2;
                    }
                }
            }
            else{
                // Smoke drift
                bubble.x += 0.2 * paceFactor * Math.sin(this.wiggle_angle - Math.PI/4) * this.wiggle_rate/this.WIGGLE_RATE_MAX;
            }

            // Expire
            if(bubble.y < this.FLASK_VAPOR_Y_MIN){
                this.bubbles.splice(i, 1);
                i-=1;
                length-=1;
            }
        }
    },

    render: function(ctx){
        var text_scale = 1.4;
        var radius_scale = 40;
        var stretch = 2.0;

        // Draw bubbles
        var length = this.bubbles.length;
        for(var i=0; i<length; i++){
            ctx.fillStyle=Flynn.Colors.ORANGE;
            if(this.bubbles[i].y > this.FLASK_INNER_Y_MIN){
                ctx.fillStyle=Flynn.Util.shadeBlend(-(1-this.bubbles[i].brightness), Flynn.Colors.ORANGE);
            }
            else{
                ctx.fillStyle=Flynn.Util.shadeBlend(-(1-this.bubbles[i].brightness), Flynn.Colors.GRAY);
            }
            ctx.fillRect(
                this.bubbles[i].x * this.scale + this.pos.x,
                this.bubbles[i].y * this.scale + this.pos.y + 1,
                2,
                2);
        }

        this.flask.render(ctx);
        ctx.vectorTextArc(
            "VECTOR", 
            this.scale * text_scale,
            this.pos.x,
            this.pos.y, 
            -Math.PI/2 + this.angle, 
            this.scale * radius_scale, 
            this.text_color, 
            true,  // is_centered
            false, // is_reversed
            false, // is_world
            Flynn.Font.Block,
            stretch
            );

        ctx.vectorTextArc(
            "ALCHEMY", 
            this.scale * text_scale,
            this.pos.x,
            this.pos.y, 
            Math.PI/2 + this.angle, 
            this.scale * radius_scale, 
            this.text_color, 
            true,  // is_centered
            true,  // is_reversed 
            false, // is_world
            Flynn.Font.Block,
            stretch
            );
    }
});

}()); // "use strict" wrapper
