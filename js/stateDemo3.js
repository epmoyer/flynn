if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateDemo3 = Flynn.State.extend({

    init: function(mcp) {
        var i, x;
        this._super(mcp);
        
        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;
        this.center_x = this.canvasWidth/2;
        this.center_y = this.canvasHeight/2;
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

        this.box = {
            x:30,
            y:60,
            width:150,
            height:150
        };
        this.box.center_x = this.box.x + this.box.width/2;
        this.box.center_y = this.box.y + this.box.height/2;
        this.box.x_right = this.box.x + this.box.width;
        this.box.y_bottom = this.box.y + this.box.height;

        this.bullet = {
            x:this.box.center_x, 
            y:this.box.center_y,
            dx: 1,
            dy: 0.35,
            size:3,
        };

        this.targets=[
            {poly_index:1, x:this.box.center_x,  y:300},
            {poly_index:2, x:this.box.center_x+110, y:300}
        ];

        mcp.input.showTouchRegion('thrust');
        mcp.input.showTouchRegion('fire');
        mcp.input.showVirtualJoystick('stick');
    },

    handleInputs: function(input, paceFactor) {
        
        if (input.virtualButtonIsPressed("right")){
            this.mcp.nextState = Game.States.HOME;
        }
        if (input.virtualButtonIsPressed("left")){
            this.mcp.nextState = Game.States.DEMO2;
        }

        if(this.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonIsPressed("dev_metrics")){
                this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonIsPressed("dev_slow_mo")){
                this.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonIsPressed("dev_fps_20")){
                this.mcp.toggleDevPacingFps20();
            }
        }
    },

    update: function(paceFactor) {
        this.gameClock += paceFactor;

        var i;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/280.0 * Math.pow(1.2, i) * paceFactor);
        }

        this.bullet.x += this.bullet.dx * paceFactor;
        if(   (this.bullet.dx > 0 && this.bullet.x > this.box.x_right)
           || (this.bullet.dx < 0 && this.bullet.x < this.box.x)){
            this.bullet.dx = -this.bullet.dx;
            this.bullet.x += this.bullet.dx * paceFactor;
        }
        this.bullet.y += this.bullet.dy * paceFactor;
        if(   (this.bullet.dy > 0 && this.bullet.y > this.box.y_bottom)
           || (this.bullet.dy < 0 && this.bullet.y < this.box.y)){
            this.bullet.dy = -this.bullet.dy;
            this.bullet.y += this.bullet.dy * paceFactor;
        }

        if(this.polygons[0].hasPoint(
            0,0,
            this.bullet.x-this.box.center_x,
            this.bullet.y-this.box.center_y)){
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

        var left_x = 10;
        var i, j, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        Game.render_page_frame (ctx, Game.States.DEMO3);

        var curret_y = 42;
        ctx.vectorText("POINT COLLISIOIN", 1.5, left_x, curret_y, null, heading_color);
        ctx.vectorRect(
            this.box.x, 
            this.box.y, 
            this.box.width,
            this.box.height,
            Flynn.Colors.DODGERBLUE);
        ctx.drawPolygon(
            this.polygons[0],
            this.box.x + this.box.width/2,
            this.box.y + this.box.height/2
            );
        // Bullet
        ctx.fillStyle=Flynn.Colors.YELLOW;
        ctx.fillRect(
            this.bullet.x - this.bullet.size/2,
            this.bullet.y - this.bullet.size/2,
            this.bullet.size,
            this.bullet.size);

        curret_y = this.box.y_bottom + 10;
        ctx.vectorText("POLYGON COLLISIOIN", 1.5, left_x, curret_y, null, heading_color);

        for(i=0; i<this.targets.length; i++){
            ctx.drawPolygon(
                this.polygons[this.targets[i].poly_index],
                this.targets[i].x,
                this.targets[i].y
            );
        }
    },

});