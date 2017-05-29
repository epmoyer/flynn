(function () { "use strict"; 

Flynn.Particle = Class.extend({

    PARTICLE_LIFE_VARIATION: 20,
    PARTICLE_LIFE: 50,
    PARTICLE_FRICTION: 0.99,

    init: function(particles, position, velocity, color){
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
        }
        return isAlive;
    },

    render: function(ctx){
        if(this.particles.is_world){
            // Render as world coordinates
            ctx.fillStyle=this.color;
            ctx.fillRect(
                this.position.x - Flynn.mcp.viewport.x,
                this.position.y - Flynn.mcp.viewport.y,
                2,
                2);
        }
        else{
            // Render in screen coordinates
            ctx.fillStyle=this.color;
            ctx.fillRect(this.position.x, this.position.y, 2, 2);
        }
    }

});

Flynn.Particles = Class.extend({

    VELOCITY_VARIATION: 1.0,

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