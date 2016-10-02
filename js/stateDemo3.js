if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateDemo3 = Flynn.State.extend({

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

        this.polygons = [];
        var poly_info = [
            {points:Game.Points.COLLISION1, scale:10.5},
            {points:Game.Points.COLLISION1, scale:10.5},
            {points:Game.Points.COLLISION2, scale:7.0},
            ];
        for (i=0; i<poly_info.length; i++){
            this.polygons.push(new Flynn.Polygon(poly_info[i].points, Flynn.Colors.GRAY));
            this.polygons[i].setScale(poly_info[i].scale);
        }

        this.collision_rect     = new Flynn.Rect( 30, 60, 150, 150);
        // this.joystick_test_rect = new Flynn.Rect(400, 60, 450, 450);
        this.joystick_test_rect = new Flynn.Rect(Flynn.mcp.canvasWidth-476, 60, 450, 450);

        this.crosshair_poly = new Flynn.Polygon(Game.Points.CROSSHAIR, Flynn.Colors.WHITE);
        this.crosshair_poly.setScale(3);
        this.crosshair_poly.x = this.joystick_test_rect.center_x;
        this.crosshair_poly.y = this.joystick_test_rect.center_y;

        this.projectiles = new Flynn.Projectiles(
            new Victor(this.joystick_test_rect.left, this.joystick_test_rect.top),
            new Victor(this.joystick_test_rect.right, this.joystick_test_rect.bottom)
            );

        this.bullet = {
            x:this.collision_rect.center_x, 
            y:this.collision_rect.center_y,
            dx: 1,
            dy: 0.35,
            size:3,
        };

        this.targets=[
            {poly_index:1, x:this.collision_rect.center_x,     y:310},
            {poly_index:2, x:this.collision_rect.center_x+110, y:310}
        ];

        Flynn.mcp.input.showTouchRegion('fire_l');
        Flynn.mcp.input.showTouchRegion('fire_r');
        Flynn.mcp.input.showVirtualJoystick('stick');
        Flynn.mcp.input.showVirtualJoystick('stick2');
    },

    handleInputs: function(input, paceFactor) {
        
        if (input.virtualButtonWasPressed("UI_right")){
            Flynn.mcp.nextState = Game.States.DEMO4;
        }
        if (input.virtualButtonWasPressed("UI_left")){
            Flynn.mcp.nextState = Game.States.DEMO2;
        }

        if(Flynn.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonWasPressed("dev_metrics")){
                Flynn.mcp.canvas.showMetrics = !Flynn.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonWasPressed("dev_slow_mo")){
                Flynn.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonWasPressed("dev_fps_20")){
                Flynn.mcp.toggleDevPacingFps20();
            }
        }

        // Move crosshair
        if (input.virtualButtonIsDown("left")){
            this.crosshair_poly.x = Math.max(
                this.crosshair_poly.x - this.CROSSHAIR_SPEED * paceFactor,
                this.joystick_test_rect.left);
        }
        if (input.virtualButtonIsDown("right")){
            this.crosshair_poly.x = Math.min(
                this.crosshair_poly.x + this.CROSSHAIR_SPEED * paceFactor,
                this.joystick_test_rect.right);
        }
        if (input.virtualButtonIsDown("up")){
            this.crosshair_poly.y = Math.max(
                this.crosshair_poly.y - this.CROSSHAIR_SPEED * paceFactor,
                this.joystick_test_rect.top);
        }
        if (input.virtualButtonIsDown("down")){
            this.crosshair_poly.y = Math.min(
                this.crosshair_poly.y + this.CROSSHAIR_SPEED * paceFactor,
                this.joystick_test_rect.bottom);
        }

        // Fire
        if (input.virtualButtonWasPressed("fire_l")){
            console.log("fire left");
            this.projectiles.add(
                new Victor(this.crosshair_poly.x, this.crosshair_poly.y),
                new Victor(-this.BULLET_SPEED, 0),
                this.BULLET_LIFETIME,
                3,
                Flynn.Colors.YELLOW
                );
        }
        if (input.virtualButtonWasPressed("fire_r")){
            console.log("fire right");
            this.projectiles.add(
                new Victor(this.crosshair_poly.x, this.crosshair_poly.y),
                new Victor(this.BULLET_SPEED, 0),
                this.BULLET_LIFETIME,
                3,
                Flynn.Colors.YELLOW
                );
        }
    },

    update: function(paceFactor) {
        this.gameClock += paceFactor;
        this.projectiles.update(paceFactor);

        var i;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/280.0 * Math.pow(1.2, i) * paceFactor);
        }

        this.bullet.x += this.bullet.dx * paceFactor;
        if(   (this.bullet.dx > 0 && this.bullet.x > this.collision_rect.right)
           || (this.bullet.dx < 0 && this.bullet.x < this.collision_rect.left)){
            this.bullet.dx = -this.bullet.dx;
            this.bullet.x += this.bullet.dx * paceFactor;
        }
        this.bullet.y += this.bullet.dy * paceFactor;
        if(   (this.bullet.dy > 0 && this.bullet.y > this.collision_rect.bottom)
           || (this.bullet.dy < 0 && this.bullet.y < this.collision_rect.top)){
            this.bullet.dy = -this.bullet.dy;
            this.bullet.y += this.bullet.dy * paceFactor;
        }

        if(this.polygons[0].hasPoint(
            0,0,
            this.bullet.x-this.collision_rect.center_x,
            this.bullet.y-this.collision_rect.center_y)){
            // Collided
            this.polygons[0].color = Flynn.Colors.RED;
        }
        else{
            // Not collided
            this.polygons[0].color = Flynn.Colors.GRAY;
        }
    },

    render: function(ctx){

        ctx.clearAll();

        this.projectiles.draw(ctx, new Victor(0,0));

        var left_x = 10;
        var indent = 20;
        var i, j, x, name, color;
        var heading_color = Flynn.Colors.YELLOW;
        var button_list=['up', 'left', 'right', 'down', 'fire_l', 'fire_r'];
        var curret_y = 42;
        
        Game.render_page_frame (ctx, Game.States.DEMO3);

        ctx.vectorText("POINT COLLISIOIN", 1.5, left_x, curret_y, null, heading_color);
        ctx.vectorRect(
            this.collision_rect.left, 
            this.collision_rect.top, 
            this.collision_rect.width,
            this.collision_rect.height,
            Flynn.Colors.DODGERBLUE);
        ctx.drawPolygon(
            this.polygons[0],
            this.collision_rect.left + this.collision_rect.width/2,
            this.collision_rect.top + this.collision_rect.height/2
            );
        // Bullet
        ctx.fillStyle=Flynn.Colors.YELLOW;
        ctx.fillRect(
            this.bullet.x - this.bullet.size/2,
            this.bullet.y - this.bullet.size/2,
            this.bullet.size,
            this.bullet.size);

        curret_y = this.collision_rect.bottom + 10;
        ctx.vectorText("POLYGON COLLISIOIN", 1.5, left_x, curret_y, null, heading_color);

        for(i=0; i<this.targets.length; i++){
            ctx.drawPolygon(
                this.polygons[this.targets[i].poly_index],
                this.targets[i].x,
                this.targets[i].y
            );
        }

        left_x = 450;
        curret_y = 42;
        ctx.vectorText("BUTTONS", 1.5, left_x, curret_y, null, heading_color);
        for (i=0; i<button_list.length; i++){
            name = button_list[i];
            if(Flynn.mcp.input.virtualButtonIsDown(name)){
                color = Flynn.Colors.GREEN;
            }
            else{
                color = Flynn.Colors.GRAY;
            }
            curret_y += 20;
            ctx.vectorText(name, 1.5, left_x + indent, curret_y, null, color);
        }

        ctx.vectorRect(
            this.joystick_test_rect.left, 
            this.joystick_test_rect.top, 
            this.joystick_test_rect.width,
            this.joystick_test_rect.height,
            Flynn.Colors.DODGERBLUE);
        ctx.drawPolygon(this.crosshair_poly, this.crosshair_poly.x, this.crosshair_poly.y);
    },

});