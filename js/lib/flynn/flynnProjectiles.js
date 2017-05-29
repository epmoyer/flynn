(function () { "use strict"; 

Flynn.Projectile= Class.extend({
    init: function(position, velocity, lifetime, size, color, projectiles){

        this.position = position;
        this.velocity = velocity;
        this.lifetime = lifetime;
        this.size = size;
        this.radius = size/2;
        this.color = color;
        this.projectiles = projectiles; // The projectiles object which owns this projectile
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
            this.position.add(this.velocity.clone().multiplyScalar(paceFactor));
        }
        if(!this.projectiles.bounds_rect.hasPoint(this.position.x, this.position.y)){
            isAlive = false;
        }
        return isAlive;
    },

    render: function(ctx) {
        ctx.fillStyle=this.color;
        if(this.projectiles.is_world){
            // Render as world coordinates
            ctx.fillRect(
                this.position.x - Flynn.mcp.viewport.x,
                this.position.y - Flynn.mcp.viewport.y,
                this.size,
                this.size);
        }
        else{
            // Render as screen coordinates
            ctx.fillRect(
                this.position.x,
                this.position.y,
                this.size,
                this.size);
        }
    }

});

Flynn.Projectiles = Class.extend({

    init: function(bounds_rect, is_world){
        if(bounds_rect.object_id != "Flynn.Rect"){
            throw("API has changed. Expected bounds_rect type of Flynn.Rect");
        }
        if(typeof(is_world)=='undefined'){
            is_world = false; // Default to screen coordinates
        }
        this.bounds_rect = bounds_rect.clone();
        this.is_world = is_world;
        
        this.projectiles=[];
    },

    reset: function(){
        this.projectiles=[];
    },

    add: function(position, velocity, lifetime, size, color) {
        if(!((position instanceof Victor) && (velocity instanceof Victor))){
            throw("API has changed. Expected position and velocity to be instance of Victor."); 
        }
        this.projectiles.push(new Flynn.Projectile(
            position.clone(), velocity.clone(), lifetime, size, color, this));
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

}()); // "use strict" wrapper