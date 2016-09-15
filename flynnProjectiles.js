Flynn.Projectile= Class.extend({
	init: function(world_position_v, velocity_v, lifetime, size, color, min_bounds_v, max_bounds_v){

        this.world_position_v = world_position_v.clone();
        this.velocity_v = velocity_v.clone();
		this.lifetime = lifetime;
		this.size = size;
		this.color = color;
		this.min_bounds_v = min_bounds_v;
		this.max_bounds_v = max_bounds_v;
	},

	kill: function(){
		// Mark this projectile dead.  It will be removed on the next update of FlynnProjectiles.
		this.lifetime = 0;
	},

	update: function(paceFactor) {
		var isAlive = true;

		// Decay and die
		this.lifetime -= paceFactor;
		if(this.lifetime <= 0){
			// Kill particle
			isAlive = false;
		}
		else{
			// Add impulse
			this.world_position_v.x += this.velocity_v.x * paceFactor;
			this.world_position_v.y += this.velocity_v.y * paceFactor;
		}
		if ((this.world_position_v.x < this.min_bounds_v.x) ||
			(this.world_position_v.y < this.min_bounds_v.y) ||
			(this.world_position_v.x > this.max_bounds_v.x) ||
			(this.world_position_v.y > this.max_bounds_v.y)){
			isAlive = false;
		}
		return isAlive;
	},

	draw: function(ctx, viewport_v) {
		ctx.fillStyle=this.color;
		ctx.fillRect(
			this.world_position_v.x - viewport_v.x,
			this.world_position_v.y - viewport_v.y,
			this.size,
			this.size);
	}

});

Flynn.Projectiles = Class.extend({

	init: function(min_bounds_v, max_bounds_v){
		this.projectiles=[];
		this.min_bounds_v = min_bounds_v;
		this.max_bounds_v = max_bounds_v;
	},

	reset: function(){
		this.init(this.min_bounds_v, this.max_bounds_v);
	},

	add: function(world_position_v, velocity_v, lifetime, size, color) {
		this.projectiles.push(new Flynn.Projectile(
			world_position_v, velocity_v, lifetime, size, color, this.min_bounds_v, this.max_bounds_v));
	},

	advanceFrame: function() {
		// Advance the newest projectile one frame.  
		this.projectiles[this.projectiles.length-1].update(1.0);
	},

	update: function(paceFactor) {
		for(var i=0, len=this.projectiles.length; i<len; i+=1){
			if(!this.projectiles[i].update(paceFactor)){
				// Projectile has died.  Remove it
				this.projectiles.splice(i, 1);
				len--;
				i--;
			}
		}
	},

	draw: function(ctx, viewport_v) {
		for(var i=0, len=this.projectiles.length; i<len; i+=1){
			this.projectiles[i].draw(ctx, viewport_v);
		}
	}
});