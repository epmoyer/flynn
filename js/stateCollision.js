var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StateCollision = Flynn.State.extend({

    CROSSHAIR_SPEED: 3,
    BULLET_SPEED: 4,
    BULLET_LIFETIME: 2 * 60,

    init: function() {
        var i, x;
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;

        this.collision_rects = [
            new Flynn.Rect( 30,   60, 150, 150),
            new Flynn.Rect( 30,  240, 150, 150),
            new Flynn.Rect( 200, 240, 150, 150)
            ];

        this.joystick_test_rect = new Flynn.Rect(Flynn.mcp.canvasWidth-476, 60, 450, 450);

        this.polygons = [];
        var poly_info = [
                {   points: Game.Points.COLLISION1, 
                    scale: 10.5, 
                    position: new Victor(
                        this.collision_rects[0].center_x,
                        this.collision_rects[0].center_y)
                    
                },
                {   points: Game.Points.COLLISION1, 
                    scale: 10.5,
                    position: new Victor(
                        this.collision_rects[1].center_x,
                        this.collision_rects[1].bottom + 100)
                },
                {   points:Game.Points.COLLISION2, 
                    scale:7.0,
                    position: new Victor(
                        this.collision_rects[1].center_x + 110, 
                        this.collision_rects[1].bottom + 100)
                },
                {   points:Game.Points.TRI4_MAIN, 
                    scale: 15.0, 
                    position: new Victor(
                        this.collision_rects[1].center_x,
                        this.collision_rects[1].center_y)
                },
                {   points:Game.Points.TRI4_MAIN, 
                    scale: 15.0, 
                    position: new Victor(
                        this.collision_rects[2].center_x,
                        this.collision_rects[2].center_y)
                }
            ];
        for (i=0; i<poly_info.length; i++){
            this.polygons.push(new Flynn.Polygon(
                poly_info[i].points, 
                Flynn.Colors.GRAY,
                poly_info[i].scale,
                poly_info[i].position,
                false, // constrained
                false  // is_world
                ));
        }

        this.polygons[3].setBoundingPoly(Game.Points.TRI4_BOUNDS);
        this.polygons[4].setBoundingPoly(Game.Points.TRI4_BOUNDS);
        this.polygons[4].bounding_visible = true;
        this.bounding_collision = false;

        this.crosshair_poly = new Flynn.Polygon(
            Game.Points.CROSSHAIR, 
            Flynn.Colors.WHITE,
            3,
            new Victor(
                this.joystick_test_rect.center_x,
                this.joystick_test_rect.center_y),
            false, // constrained
            false  // is_world
            );

        this.projectiles = new Flynn.Projectiles(
            this.joystick_test_rect, // bounds_rect
            false                    // is_world=false (use screen coordinates)
            );

        this.bullet = {
            position: new Victor(
                this.collision_rects[0].center_x, 
                this.collision_rects[0].center_y),
            velocity: new Victor(1, 0.35),
            size:3,
        };
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);

        // Move cross-hair
        if (input.virtualButtonIsDown("left")){
            this.crosshair_poly.position.x -= this.CROSSHAIR_SPEED * elapsed_ticks;
        }
        if (input.virtualButtonIsDown("right")){
            this.crosshair_poly.position.x += this.CROSSHAIR_SPEED * elapsed_ticks;
        }
        if (input.virtualButtonIsDown("up")){
            this.crosshair_poly.position.y -= this.CROSSHAIR_SPEED * elapsed_ticks;
        }
        if (input.virtualButtonIsDown("down")){
            this.crosshair_poly.position.y += this.CROSSHAIR_SPEED * elapsed_ticks;
        }
        var analog_pos = Flynn.mcp.input.getAnalogJoystickPosition("a_stick");
        this.crosshair_poly.position.x += analog_pos.x * this.CROSSHAIR_SPEED * elapsed_ticks;
        this.crosshair_poly.position.y += analog_pos.y * this.CROSSHAIR_SPEED * elapsed_ticks;
        this.crosshair_poly.position.x = Flynn.Util.minMaxBound(
            this.crosshair_poly.position.x,
            this.joystick_test_rect.left,
            this.joystick_test_rect.right
            );
        this.crosshair_poly.position.y = Flynn.Util.minMaxBound(
            this.crosshair_poly.position.y,
            this.joystick_test_rect.top,
            this.joystick_test_rect.bottom
            );

        // Fire
        if (input.virtualButtonWasPressed("fire_l")){
            console.log("fire left");
            this.projectiles.add(
                this.crosshair_poly.position,
                new Victor(-this.BULLET_SPEED, 0),
                this.BULLET_LIFETIME,
                3,
                Flynn.Colors.YELLOW
                );
        }
        if (input.virtualButtonWasPressed("fire_r")){
            console.log("fire right");
            this.projectiles.add(
                this.crosshair_poly.position,
                new Victor(this.BULLET_SPEED, 0),
                this.BULLET_LIFETIME,
                3,
                Flynn.Colors.YELLOW
                );
        }
    },

    update: function(elapsed_ticks) {
        this.gameClock += elapsed_ticks;
        this.projectiles.update(elapsed_ticks);

        var i;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].setAngle(this.polygons[i].angle + 
            Math.PI/280.0 * Math.pow(1.2, Math.min(i,3)) * elapsed_ticks);
        }

        this.bullet.position.add(this.bullet.velocity.clone().multiplyScalar(elapsed_ticks));
        // this.bullet.x += this.bullet.dx * elapsed_ticks;
        if(   (this.bullet.velocity.x > 0 && this.bullet.position.x > this.collision_rects[0].right)
           || (this.bullet.velocity.x < 0 && this.bullet.position.x < this.collision_rects[0].left)){
            this.bullet.velocity.x = -this.bullet.velocity.x;
            this.bullet.position.x += this.bullet.velocity.x * elapsed_ticks;
        }
        // this.bullet.y += this.bullet.dy * elapsed_ticks;
        if(   (this.bullet.velocity.y > 0 && this.bullet.position.y > this.collision_rects[0].bottom)
           || (this.bullet.velocity.y < 0 && this.bullet.position.y < this.collision_rects[0].top)){
            this.bullet.velocity.y = -this.bullet.velocity.y;
            this.bullet.position.y += this.bullet.velocity.y * elapsed_ticks;
        }

        if(this.polygons[0].hasPoint(this.bullet.position.x, this.bullet.position.y)){
            // Collided
            this.polygons[0].color = Flynn.Colors.RED;
        }
        else{
            // Not collided
            this.polygons[0].color = Flynn.Colors.GRAY;
        }

        this.bounding_collision = this.polygons[3].hasPoint(
                this.bullet.position.x-this.collision_rects[0].center_x+this.collision_rects[1].center_x,
                this.bullet.position.y-this.collision_rects[0].center_y+this.collision_rects[1].center_y
            );

        if(this.polygons[2].is_colliding(this.polygons[1])){
            // Collided
            this.polygons[1].color = Flynn.Colors.RED;
            this.polygons[2].color = Flynn.Colors.RED;
        }
        else{
            // Not collided
            this.polygons[1].color = Flynn.Colors.GRAY;
            this.polygons[2].color = Flynn.Colors.GRAY;
        }
    },

    render: function(ctx){

        this.projectiles.render(ctx);

        var left_x = 10;
        var indent = 20;
        var i, j, x, name, color, len;
        var heading_color = Flynn.Colors.YELLOW;
        var button_list=['up', 'left', 'right', 'down', 'fire_l', 'fire_r'];
        var curret_y = 42;
        
        Game.render_page_frame (ctx);

        ctx.vectorText2({
            text: "POINT COLLISION",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 175;
        ctx.vectorText2({
            text: "POINT COLLISION WITH BOUNDING POLYGON",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        for(i=0; i<this.collision_rects.length; i++){
            ctx.vectorRect(
                this.collision_rects[i].left, 
                this.collision_rects[i].top, 
                this.collision_rects[i].width,
                this.collision_rects[i].height,
                Flynn.Colors.DODGERBLUE);
        }
        ctx.vectorText2({
            text: "HIDDEN", 
            scale: 1.5, 
            x: this.collision_rects[1].left + 8, 
            y: this.collision_rects[1].top + 8,
            color: Flynn.Colors.YELLOW
        });
        ctx.vectorText2({
            text: "VISIBLE", 
            scale: 1.5, 
            x: this.collision_rects[2].left + 8, 
            y: this.collision_rects[2].top + 8,
            color: Flynn.Colors.YELLOW
        });

        ctx.fillStyle=Flynn.Colors.YELLOW;
        ctx.fillRect(
            this.bullet.position.x - this.bullet.size/2,
            this.bullet.position.y - this.bullet.size/2,
            this.bullet.size,
            this.bullet.size);

        if(this.bounding_collision){
            ctx.fillStyle=Flynn.Colors.RED;
        }
        else{
            ctx.fillStyle=Flynn.Colors.YELLOW;
        }
        var y_offset = this.collision_rects[1].top - this.collision_rects[0].top;
        ctx.fillRect(
            this.bullet.position.x - this.bullet.size/2,
            this.bullet.position.y - this.bullet.size/2 + y_offset,
            this.bullet.size,
            this.bullet.size);
        var x_offset = this.collision_rects[2].left - this.collision_rects[1].left;
        ctx.fillRect(
            this.bullet.position.x - this.bullet.size/2 + x_offset,
            this.bullet.position.y - this.bullet.size/2 + y_offset,
            this.bullet.size,
            this.bullet.size);

        curret_y = this.collision_rects[1].bottom + 10;
        ctx.vectorText2({
            text: "LOSSY POLYGON COLLISION",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });

        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].render(ctx);
        }
        // Show collision verticies
        for (i=0, len=this.polygons[2].points.length; i<len; i+=2){
            ctx.fillStyle=Flynn.Colors.YELLOW;
            ctx.fillRect(
                this.polygons[2].position.x + this.polygons[2].points[i]-1,
                this.polygons[2].position.y + this.polygons[2].points[i+1]-1,
                3,
                3);
        }

        left_x = 450;
        curret_y = 42;
        ctx.vectorText2({
            text: "BUTTONS",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        for (i=0; i<button_list.length; i++){
            name = button_list[i];
            if(Flynn.mcp.input.virtualButtonIsDown(name)){
                color = Flynn.Colors.GREEN;
            }
            else{
                color = Flynn.Colors.GRAY;
            }
            curret_y += 20;
            ctx.vectorText2({
                text: name,
                scale: 1.5,
                x: left_x + indent,
                y: curret_y,
                color: color
            });
        }

        ctx.vectorRect(
            this.joystick_test_rect.left, 
            this.joystick_test_rect.top, 
            this.joystick_test_rect.width,
            this.joystick_test_rect.height,
            Flynn.Colors.DODGERBLUE);

        this.crosshair_poly.render(ctx);
    },
});

}()); // "use strict" wrapper