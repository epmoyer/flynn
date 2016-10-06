Flynn.Projectile= Class.extend({
    init: function(position_v, velocity_v, lifetime, size, color, min_bounds_v, max_bounds_v, is_world){

        this.position_v = position_v.clone();
        this.velocity_v = velocity_v.clone();
        this.lifetime = lifetime;
        this.size = size;
        this.color = color;
        this.min_bounds_v = min_bounds_v;
        this.max_bounds_v = max_bounds_v;
        this.is_world = is_world;
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
            this.position_v.x += this.velocity_v.x * paceFactor;
            this.position_v.y += this.velocity_v.y * paceFactor;
        }
        if ((this.position_v.x < this.min_bounds_v.x) ||
            (this.position_v.y < this.min_bounds_v.y) ||
            (this.position_v.x > this.max_bounds_v.x) ||
            (this.position_v.y > this.max_bounds_v.y)){
            isAlive = false;
        }
        return isAlive;
    },

    render: function(ctx) {
        ctx.fillStyle=this.color;
        if(this.is_world){
            // Render as world coordinates
            ctx.fillRect(
                this.position_v.x - Flynn.mcp.viewport.x,
                this.position_v.y - Flynn.mcp.viewport.y,
                this.size,
                this.size);
        }
        else{
            // Render as screen coordinates
            ctx.fillRect(
                this.position_v.x,
                this.position_v.y,
                this.size,
                this.size);
        }
    }

});

Flynn.Projectiles = Class.extend({

    init: function(min_bounds_v, max_bounds_v, is_world){
        if(typeof(is_world)=='undefined'){
            is_world = false; // Default to screen coordinates
        }
        this.projectiles=[];
        this.min_bounds_v = min_bounds_v;
        this.max_bounds_v = max_bounds_v;
        this.is_world = is_world;
    },

    reset: function(){
        this.init(this.min_bounds_v, this.max_bounds_v);
    },

    add: function(position_v, velocity_v, lifetime, size, color) {
        this.projectiles.push(new Flynn.Projectile(
            position_v, velocity_v, lifetime, size, color, this.min_bounds_v, this.max_bounds_v, this.is_world));
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

    render: function(ctx) {
        for(var i=0, len=this.projectiles.length; i<len; i+=1){
            this.projectiles[i].render(ctx);
        }
    }
});