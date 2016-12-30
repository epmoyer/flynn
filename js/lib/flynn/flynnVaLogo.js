var Game = Game || {}; // Create namespace

(function () { "use strict";



Flynn.VALogo = Class.extend({

    POINTS:{
        // FLASK: [-5,-12,9000,8012,-4,-12,-4,-1,-9,6,-9,10,-7,12,8,12,10,10,10,6,5,-1,5,-12,6,-12,9000,7000,3,-9,9000,8009,3,0,8,7,8,9,7,10,9000,8009,-6,10,-7,9,-7,7,-2,0,-2,-9,3,-9],
        FLASK: [-6,-12,9000,8012,-5,-12,-5,-1,-10,6,-10,10,-8,12,8,12,10,10,10,6,5,-1,5,-12,6,-12,9000,7000,3,-9,9000,8009,3,0,8,7,8,9,7,10,-7,10,-8,9,-8,7,-3,0,-3,-9,3,-9],
        INNER_BOUNDS: [3,-9,3,0,8,7,8,9,7,10,-7,10,-8,9,-8,7,-3,0,-3,-9,3,-9],
    },

    FLASK_INNER_X_MAX: 8,
    FLASK_INNER_Y_MAX: 10,
    FLASK_INNER_Y_MIN: -9,

    BUBBLE_BOTTOM_PROBABILITY: 0.8,
    BUBBLE_RATE: 4,
    BUBBLE_ACCELERATION: 0.002,


    init: function(x, y, scale){
        this.pos = {x: x, y:y};
        this.scale = scale;
        this.bubbles = [];

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
    },

    bubble_in_inner: function(bubble){
        return this.inner_bounds.hasPoint(
            bubble.x * this.scale + this.pos.x,
            bubble.y * this.scale + this.pos.y);
    },

    update: function(paceFactor){
        this.angle += this.spin_rate * paceFactor;

        // Create new bubbles
        this.bubble_time += paceFactor;
        if(this.bubble_time > this.BUBBLE_RATE){
            this.bubble_time -= this.BUBBLE_RATE;
            var new_bubble = { velocity: 0 };
            if(Math.random() < this.BUBBLE_BOTTOM_PROBABILITY){
                new_bubble.x = Flynn.Util.randomFromInterval(
                        -this.FLASK_INNER_X_MAX,
                        this.FLASK_INNER_X_MAX);
                new_bubble.y = this.FLASK_INNER_Y_MAX - 1;
            }
            else{
                new_bubble.x = Flynn.Util.randomFromInterval(
                        -this.FLASK_INNER_X_MAX,
                        this.FLASK_INNER_X_MAX);
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
        var pacedAcceleration = Math.pow(this.BUBBLE_ACCELERATION, paceFactor);
        for(var i=0; i<length; i++){
            // Accelerate
            this.bubbles[i].velocity -= pacedAcceleration;
            this.bubbles[i].y += this.bubbles[i].velocity;
            
            // Wall drift
            // if(!this.inner_bounds.hasPoint(
            //     this.bubbles[i].x * this.scale + this.pos.x,
            //     this.bubbles[i].y * this.scale + this.pos.y))
            if(!this.bubble_in_inner(this.bubbles[i]))
            {
                if(this.bubbles[i].x > 0){
                    this.bubbles[i].x-=0.2;
                }else{
                    this.bubbles[i].x+=0.2;
                }
            }

            // Expire
            if(this.bubbles[i].y < this.FLASK_INNER_Y_MIN){
                this.bubbles.splice(i, 1);
                i-=1;
                length-=1;
            }
        }
    },

    render: function(ctx){
        var text_scale = 1.4;
        var radius_scale = 35;
        var stretch = true;
        var text_color = "#C0E0C0";

        this.flask.render(ctx);
        ctx.vectorTextArc(
            "VECTOR", 
            this.scale * text_scale,
            this.pos.x,
            this.pos.y, 
            -Math.PI/2 + this.angle, 
            this.scale * radius_scale, 
            text_color, 
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
            text_color, 
            true,  // is_centered
            true,  // is_reversed 
            false, // is_world
            Flynn.Font.Block,
            stretch
            );

        ctx.fillStyle=Flynn.Colors.ORANGE;
        
        var length = this.bubbles.length;
        for(var i=0; i<length; i++){
            ctx.fillRect(
                this.bubbles[i].x * this.scale + this.pos.x,
                this.bubbles[i].y * this.scale + this.pos.y + 1,
                1,
                1);
        }
    }
});

}()); // "use strict" wrapper
