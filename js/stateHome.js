if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateHome = Flynn.State.extend({

    init: function(mcp) {
        this._super(mcp);
        
        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;
        this.center_x = this.canvasWidth/2;
        this.center_y = this.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;

        this.polygons = [];
        this.colors=[
            Flynn.Colors.DODGERBLUE,
            Flynn.Colors.RED,
            Flynn.Colors.GREEN,
            Flynn.Colors.ORANGE,
            Flynn.Colors.MAGENTA,
            Flynn.Colors.CYAN ];

        points = [
            Game.Points.SHIP,
            Game.Points.SHIPB,
            Game.Points.POINTY_SHIP,
            Game.Points.STAR_WING,
            Game.Points.ABSTRACT,
            Game.Points.RESPAWN];

        var i;
        for (i=0; i<points.length; i++){
            this.polygons.push(new Flynn.Polygon(points[i], this.colors[i]));
            this.polygons[i].setScale(3);
        }
        
        // this.polygons.push(new Flynn.Polygon(Game.Points.SHIPB, Flynn.Colors.RED));
        // this.polygons.push(new Flynn.Polygon(Game.Points.POINTY_SHIP, Flynn.Colors.GREEN));
        // this.polygons.push(new Flynn.Polygon(Game.Points.STAR_WING, Flynn.Colors.ORANGE));
        // this.polygons.push(new Flynn.Polygon(Game.Points.ABSTRACT, Flynn.Colors.MAGENTA));
        // this.polygons.push(new Flynn.Polygon(Game.Points.RESPAWN, Flynn.Colors.CYAN));
        // var i;
        // for (i=0; i<this.polygons.length; i++){
        //     this.polygons[i].setScale(3);
        // }
    
    },

    handleInputs: function(input, paceFactor) {

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
            this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/60.0 * paceFactor * (1 + 0.2*i));
        }
    },

    render: function(ctx){
        ctx.clearAll();

        var left_x = 10;
        var margin = 3;
        var i, x;
        var heading_color = Flynn.Colors.YELLOW;
        
        ctx.vectorText("HOME", 3, left_x, 11, null, heading_color);
        ctx.vectorLine(margin, 37, this.canvasWidth-margin-1, 37, Flynn.Colors.GREEN);
        ctx.vectorRect(
            margin, 
            margin, 
            this.canvasWidth-2*margin,
            this.canvasHeight-2*margin,
            Flynn.Colors.GREEN);

        var curret_y = 42;
        ctx.vectorText("LINES", 1.5, left_x, curret_y, null, heading_color);

        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorLine(x-15, curret_y+15, x+15, curret_y+15, this.colors[i]);
            ctx.vectorLine(x,    curret_y,    x,    curret_y+30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText("RECTS", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorRect(x-15, curret_y,  30, 30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText("POLYGONS", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 35;
        for (i=0; i<this.polygons.length; i++){
            ctx.drawPolygon(this.polygons[i], 40 + i*50, curret_y);
        }

        curret_y += 30;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText("TEXT", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 25;
        var low, high;
        var x_step = 20;
        var y_step = 20;
        var indent = 20;
        for (high=0; high<15; ++high){
            ctx.vectorText(high.toString(16), 2, left_x + indent + x_step * (high+1), curret_y, null, Flynn.Colors.CYAN);
            for (low=0; low<15; ++low){
                if(high === 0){
                    ctx.vectorText(low.toString(16), 2, left_x + indent, curret_y + y_step * (low + 1), null, Flynn.Colors.CYAN);
                }
                ctx.vectorText(String.fromCharCode(high*16 + low), 2, 
                    left_x + indent + x_step * (high+1),
                    curret_y + y_step * (low + 1),
                    null, text_color);
            }
        }
        ctx.vectorText("JACKDAWS LOVE MY BIG SPHINX OF QUARTZ", 2, 
            left_x + indent, 
            curret_y + y_step * 17, 
            null, text_color);
        

    }
});