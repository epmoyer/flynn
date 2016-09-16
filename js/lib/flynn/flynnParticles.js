// Note: This particle library is completely untested.
//       It is a genericised version of the radial particle library used by Roundabout, rewritten to use cartesian
//       coordinates only.  What could possibly go wrong? :)

Flynn.Particle = Class.extend({

	PARTICLE_LIFE_VARIATION: 20,
	PARTICLE_LIFE: 50,
	PARTICLE_FRICTION: 0.99,

	init: function(particles, x, y, dx, dy, color){
		this.particles = particles;
        this.x = x;
        this.y = y;
		this.dx = dx;
		this.dy = dy;
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
			this.x += this.dx * paceFactor;
			this.y += this.dy * paceFactor;
			// Decay impulse
			this.dx *= this.PARTICLE_FRICTION;
			this.dy *= this.PARTICLE_FRICTION;
		}
		return isAlive;
	},

	draw: function(ctx) {
		ctx.fillStyle=this.color;
		ctx.fillRect(this.x,this.y,2,2);
	}

});

Flynn.Particles = Class.extend({

	init: function(){
		this.particles=[];
	},

	explosion: function(x, y, quantity, velocity, color) {
		for(var i=0; i<quantity; i++){
			theta = Math.random() * Math.PI * 2;
			velocity = Math.random() * velocity;
			this.particles.push(new Flynn.Particle(
				this,
				x,
				y,
				Math.cos(theta) * velocity,
				Math.sin(theta) * velocity,
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
		for(var i=0, len=this.particles.length; i<len; i+=1){
			this.particles[i].draw(ctx);
		}
	}
});