var FlynnBullet = Class.extend({
	maxX: null,
	maxY: null,

	init: function(x, y, angle, velocity, lifeFrames, color){
		this.x = x;
		this.y = y;
		this.color = color;

		this.shallRemove = false;
		this.life = lifeFrames;

		this.vel = {
			x: velocity * Math.cos(angle),
			y: velocity * Math.sin(angle)
		};
	},

	update: function(paceFactor){
		this.prevx = this.x;
		this.prevy = this.y;

		if (0 > this.x || this.x > this.maxX ||
			0 > this.y || this.y > this.maxY
		){
			this.shallRemove = true;
		}

		this.x += this.vel.x * paceFactor;
		this.y += this.vel.y * paceFactor;
		
		this.life -= paceFactor;
		if(this.life <= 0){
			this.shallRemove = true;
		}
	},

	draw: function(ctx) {
		ctx.beginPath();
		ctx.fillStyle=this.color;
		ctx.fillRect(this.x, this.y, 2, 2);
		ctx.stroke();
	}
});