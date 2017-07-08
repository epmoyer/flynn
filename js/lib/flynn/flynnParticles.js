(function () { "use strict"; 

Flynn.Particle = Class.extend({

    PARTICLE_LIFE_VARIATION: 20,
    PARTICLE_LIFE: 50,
    PARTICLE_FRICTION: 0.99,

    init: function(particles, position, velocity, color, length, angle, angular_velocity){
        if(typeof(length)==='undefined'){
            // Particle is a point
            this.length = null;
            this.angle = null;
            this.angular_velocity = null;
        }
        else{
            // Particle is a line
            this.length = length;
            this.angle = angle;
            this.angular_velocity = angular_velocity;
        }
        this.particles = particles;
        this.position = position;
        this.velocity = velocity;
        this.color = color;

        this.life = this.PARTICLE_LIFE + (Math.random()-0.5) * this.PARTICLE_LIFE_VARIATION;
    },

    update: function(paceFactor) {
        var isAlive = true;
        // Decay and die
        this.life -= paceFactor;
        if(this.life <= 0){
            // Kill particle
            isAlive = false;
        }
        else{
            // Add impulse
            this.position.add(this.velocity.clone().multiplyScalar(paceFactor));
            // Decay impulse
            this.velocity.multiplyScalar(Math.pow(this.PARTICLE_FRICTION, paceFactor));
            if(this.length !== null){
                // Rotate line
                this.angle += this.angular_velocity * paceFactor;
            }
        }
        return isAlive;
    },

    render: function(ctx){
        var position;
        var is_world = this.particles.is_world;

        if(is_world){
            // Render in world coordinates
            position = new Victor(
                this.position.x - Flynn.mcp.viewport.x,
                this.position.y - Flynn.mcp.viewport.y 
            );
        }
        else{
            // Render in screen coordinates
            position = this.position;
        }

        if(this.length === null){
            // Render point
            ctx.fillStyle=this.color;
            ctx.fillRect(position.x, position.y, 2, 2);
        }
        else{
            position = this.position;

            // Render line
            var offset_x = Math.cos(this.angle) * this.length/2;
            var offset_y = Math.sin(this.angle) * this.length/2;

            ctx.vectorStart(this.color, is_world, false);
            ctx.vectorMoveTo(position.x + offset_x, position.y + offset_y);
            ctx.vectorLineTo(position.x - offset_x, position.y - offset_y);
            ctx.vectorEnd();
        }
    }

});

Flynn.Particles = Class.extend({

    VELOCITY_VARIATION: 1.0,
    ANGULAR_VELOCITY_MAX: Math.PI / 120,

    init: function(is_world){
        if(typeof(is_world)==='undefined'){
            is_world = false;
        }
        this.particles = [];
        this.is_world = is_world;
        this.draw_warning_issued = false;
    },

    explosion: function(position, quantity, max_velocity, color, velocity) {
        if(!((arguments.length == 5 && position instanceof Victor) && (velocity instanceof Victor))){
            throw("API has changed. 5 args. Position and velocity must be instance of Victor."); 
        }

        for(var i=0; i<quantity; i++){
            var theta = Math.random() * Math.PI * 2;
            var particle_velocity = max_velocity * (1.0 - this.VELOCITY_VARIATION + Math.random() * this.VELOCITY_VARIATION);
            this.particles.push(new Flynn.Particle(
                this,
                position.clone(),
                velocity.clone().add(
                    new Victor(
                        Math.cos(theta) * particle_velocity,
                        Math.sin(theta) * particle_velocity)),
                color
            ));
        }
    },

    shatter: function(polygon, max_velocity, velocity){
        var i, len, pen_up, first_point, color, position, segment, particle_velocity, polygon_velocity;
        var velocity_scalar;
        var point_x, point_y, previous_x, previous_y;

        if(polygon.is_world != this.is_world){
            throw(".is_world must match for polygon and the Particles object.");
        }
       
        if(typeof(velocity)!='undefined'){
            polygon_velocity = velocity;
        }
        else{
            if(typeof(polygon.velocity)=='undefined'){
                raise("Must pass velocity parameter if polygon has no .velocity");
            }
            polygon_velocity = polygon.velocity;
        }

        pen_up = false;
        color = Flynn.Colors.WHITE;
        first_point = true;

        for (i=0, len=polygon.points.length; i<len; i+=2){
            if(polygon.points[i] == Flynn.PEN_COMMAND){
                if(polygon.points[i+1] == Flynn.PEN_UP){
                    pen_up = true;
                }
                else{
                    color = Flynn.ColorsOrdered[polygon.points[i+1] - Flynn.PEN_COLOR0];
                }
            }
            else{
                point_x = polygon.points[i];
                point_y = polygon.points[i+1];
                if(!first_point && !pen_up){
                    // Add line as particle
                    position = new Victor(
                        (point_x + previous_x) / 2,
                        (point_y + previous_y) /2).add(polygon.position);
                    segment = new Victor(
                        point_x - previous_x,
                        point_y - previous_y);
                    velocity_scalar = max_velocity * (1.0 - this.VELOCITY_VARIATION + Math.random() * this.VELOCITY_VARIATION);
                    particle_velocity = 
                        position.clone().subtract(polygon.position).normalize()
                        .multiplyScalar(velocity_scalar).add(polygon_velocity);
                    this.particles.push(new Flynn.Particle(
                        this,
                        position,
                        particle_velocity,
                        color,
                        segment.length(),
                        segment.angle(),
                    // Math.PI/60
                    Flynn.Util.randomFromInterval(
                        -this.ANGULAR_VELOCITY_MAX,
                        this.ANGULAR_VELOCITY_MAX)
                    ));
                }
                first_point = false;
                pen_up = false;
                previous_x = point_x;
                previous_y = point_y;
            }
        }

    },

    update: function(paceFactor) {
        for(var i=0, len=this.particles.length; i<len; i+=1){
            if(!this.particles[i].update(paceFactor)){
                // Particle has died.  Remove it
                this.particles.splice(i, 1);
                len--;
                i--;
            }
        }
    },

    draw: function(ctx) {
        if(!this.draw_warning_issued){
            this.draw_warning_issued = true;
            console.error("Flynn.Particles.Draw() had been deprecated.  Use render()");
        }
        this.render(ctx);
    },

    render: function(ctx) {
        for(var i=0, len=this.particles.length; i<len; i+=1){
            this.particles[i].render(ctx);
        }
    }
});

}()); // "use strict" wrapper