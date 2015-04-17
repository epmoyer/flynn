// Note: This particle library is completely untested.
//       It is a genericised version of the radial particle library used by Roundabout, rewritten to use cartesian
//       coordinates only.  What could possibly go wrong? :)

var FlynnParticleLife = 50;
var FlynnParticleLifeVariation = 20;
var FlynnParticleFriction = 0.99;

var FlynnParticle = Class.extend({
	init: function(particles, x, y, dx, dy, color){
		this.particles = particles;
        this.x = x;
        this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.color = color;

		this.life = FlynnParticleLife + (Math.random()-0.5) * FlynnParticleLifeVariation;
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
			this.dx *= FlynnParticleFriction;
			this.dy *= FlynnParticleFriction;
		}
		return isAlive;
	},

	draw: function(ctx) {
		ctx.fillStyle=this.color;
		ctx.fillRect(this.x,this.y,2,2);
	}

});

var FlynnParticles = Class.extend({

	init: function(){
		this.particles=[];
	},

	explosion: function(x, y, quantity, velocity, color) {
		for(var i=0; i<quantity; i++){
			theta = Math.random() * Math.PI * 2;
			velocity = Math.random() * velocity;
			this.particles.push(new FlynnParticle(
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