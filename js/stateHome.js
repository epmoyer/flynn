if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.render_page_name = function(ctx, page_id){
    // Render the name of the current page

    var i, text, color;
    var x=10;
    var scale=3;
    var page_names = ["HOME", "TEXT", "BOX2D"];
    for(i=0; i<page_names.length; ++i){
        text = page_names[i];
        if(i==page_id-1){
            color = Flynn.Colors.YELLOW;   
        }
        else{
            color = Flynn.Colors.GRAY_DK;
        }
        ctx.vectorText(text, scale, x, 11, null, color);
        x += Flynn.Font.CharacterSpacing * scale * (text.length + 2);
    }
};

Game.StateHome = Flynn.State.extend({

    TIMER_EXPLODE1_TICKS: 0.3 * Flynn.TICKS_PER_SECOND,
    TIMER_POLLED_TICKS: 5,
    TIMER_CALLBACK_TICKS: 5,
    COUNTER_ROLLOVER: 999,

    init: function(mcp) {
        this._super(mcp);
        
        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;
        this.center_x = this.canvasWidth/2;
        this.center_y = this.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
        this.gameClock = 0;

        this.logo = new Flynn.Polygon(Game.Points.LOGO, Flynn.Colors.DODGERBLUE);
        this.logo.setScale(3);

        this.polygons = [];
        this.colors=[
            Flynn.Colors.DODGERBLUE,
            Flynn.Colors.RED,
            Flynn.Colors.GREEN,
            Flynn.Colors.ORANGE,
            Flynn.Colors.MAGENTA,
            Flynn.Colors.CYAN ];

        var points = [
            Game.Points.SHIP,
            Game.Points.SHIPB,
            Game.Points.POINTY_SHIP,
            Game.Points.STAR_WING,
            Game.Points.ABSTRACT,
            Game.Points.RESPAWN,
            ];

        var i;
        for (i=0; i<points.length; i++){
            this.polygons.push(new Flynn.Polygon(points[i], this.colors[i]));
            this.polygons[i].setScale(3);
        }

        this.penup_polygons = [];
        var penup_points = [
            // [points, scale]
            [Game.Points.PENUP_TEST1, 2.5],
            [Game.Points.PENUP_TEST2, 3],
            [Game.Points.PENUP_TEST3, 2],
            [Game.Points.PENUP_TEST4, 2.6],
            [Game.Points.PENUP_TEST5, 2.6],
            ];
        for (i=0; i<penup_points.length; i++){
            this.penup_polygons.push(new Flynn.Polygon(penup_points[i][0], this.colors[i]));
            this.penup_polygons[i].setScale(penup_points[i][1]);
        }

        this.multicolor_polygons = [];
        var multicolor_points = [
            // [points, scale]
            [Game.Points.MUTICOLOR1, 3],
            [Game.Points.MUTICOLOR2, 3],
            [Game.Points.MUTICOLOR3, 3],
            [Game.Points.MUTICOLOR4, 4.2],
            [Game.Points.MUTICOLOR5, 2.3],
            [Game.Points.MUTICOLOR6, 3.2],
            // [Game.Points.PENUP_TEST1, 2.5],
            ];
        for (i=0; i<multicolor_points.length; i++){
            this.multicolor_polygons.push(new Flynn.Polygon(multicolor_points[i][0], this.colors[i]));
            this.multicolor_polygons[i].setScale(multicolor_points[i][1]);
        }

        this.particles = new Flynn.Particles();
        this.timers = new Flynn.Timers();
        this.timers.add("Explode1", this.TIMER_EXPLODE1_TICKS, null);
        this.timers.add("Polled", this.TIMER_POLLED_TICKS, null);
        var self = this;
        this.timers.add("Callback", this.TIMER_CALLBACK_TICKS, function(){
                self.counter_callback += 1;
                self.timers.set("Callback", self.TIMER_CALLBACK_TICKS);
                if(self.counter_callback > self.COUNTER_ROLLOVER){
                    self.counter_callback = 0;
                }
            });

        this.counter_polled = 0;
        this.counter_callback = 0;

        this.partice_gun = {
            angle: 0,
            x: this.canvasWidth * 0.7 ,
            y: this.canvasHeight/2,
            length: 100,
            angular_velocity: Math.PI/600,
            muzzle_velocity: 3
        };

    },

    handleInputs: function(input, paceFactor) {

        if (input.virtualButtonIsPressed("right")){
            this.mcp.nextState = Game.States.DEMO1;
        }
        if (input.virtualButtonIsPressed("left")){
            this.mcp.nextState = Game.States.DEMO2;
        }
        if (input.virtualButtonIsPressed("UI_enter")){
            this.mcp.nextState = Game.States.END;
        }

        if (input.virtualButtonIsPressed("UI_escape")) {
            this.mcp.nextState = Game.States.CONFIG;
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
        
        this.timers.update(paceFactor);
        this.particles.update(paceFactor);

        if(this.timers.hasExpired("Explode1")){
            this.timers.set("Explode1", this.TIMER_EXPLODE1_TICKS);
            this.particles.explosion(
                Flynn.Util.randomIntFromInterval(
                    this.canvasWidth-130, this.canvasWidth-80), // x
                Flynn.Util.randomIntFromInterval(120, 220),     // y
                Flynn.Util.randomIntFromInterval(10,200),       // quantity
                2,                                              // max_velocity
                Flynn.Util.randomChoice(this.colors)            // color
                );

            this.particles.explosion(
                this.partice_gun.x + Math.cos(this.partice_gun.angle) * this.partice_gun.length, // x
                this.partice_gun.y + Math.sin(this.partice_gun.angle) * this.partice_gun.length, // y
                Flynn.Util.randomIntFromInterval(10, 40),    // quantity
                1,                                           // max_velocity
                Flynn.Colors.RED,                            // color
                Math.cos(this.partice_gun.angle) * this.partice_gun.muzzle_velocity, // dx
                Math.sin(this.partice_gun.angle) * this.partice_gun.muzzle_velocity  // dy
                );
        }

        if(this.timers.hasExpired("Polled")){
            this.counter_polled += 1;
            this.timers.set("Polled", this.TIMER_POLLED_TICKS);
            if(this.counter_polled > this.COUNTER_ROLLOVER){
                this.counter_polled = 0;
            }
        }

        var i;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/60.0 * paceFactor * (1 + 0.2*i));
        }
        for (i=0; i<this.penup_polygons.length; i++){
            this.penup_polygons[i].setAngle(this.penup_polygons[i].angle + Math.PI/60.0 * paceFactor * (1 + 0.2*i));
        }
        for (i=0; i<this.multicolor_polygons.length; i++){
            this.multicolor_polygons[i].setAngle(this.multicolor_polygons[i].angle + Math.PI/60.0 * paceFactor * (1 + 0.2*i));
        }

        this.partice_gun.angle += this.partice_gun.angular_velocity * paceFactor;
    },

    render: function(ctx){
        ctx.clearAll();

        var left_x = 10;
        var margin = 3;
        var i, x;
        var heading_color = Flynn.Colors.YELLOW;

        Game.render_page_name (ctx, Game.States.HOME);
        ctx.vectorLine(margin, 37, this.canvasWidth-margin-1, 37, Flynn.Colors.GREEN);
        ctx.vectorRect(
            margin, 
            margin, 
            this.canvasWidth-2*margin,
            this.canvasHeight-2*margin,
            Flynn.Colors.GREEN);

        var curret_y = 42;
        ctx.vectorText("LINES", 1.5, left_x, curret_y, null, heading_color);
        ctx.vectorText("PARTICLES", 1.5, this.canvasWidth-90, curret_y, null, heading_color);

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
        ctx.vectorText("POLYGONS WITH PENUP NODES", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 35;
        for (i=0; i<this.penup_polygons.length; i++){
            ctx.drawPolygon(this.penup_polygons[i], 40 + i*50, curret_y);
        }

        curret_y += 30;
        ctx.vectorText("POLYGONS WITH COLOR NODES", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 35;
        for (i=0; i<this.multicolor_polygons.length; i++){
            ctx.drawPolygon(this.multicolor_polygons[i], 40 + i*50, curret_y);
        }

        curret_y += 30;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText("TEXT", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 15;
        var low, high;
        var x_step = 20;
        var y_step = 20;
        var indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText(high.toString(16), 2, left_x + indent + x_step * (high+1), curret_y, null, Flynn.Colors.CYAN);
            for (low=0; low<=15; ++low){
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
            curret_y + y_step * 18,
            null, text_color);

        //curret_y += y_step * 18 + 10;
        curret_y = 42;
        left_x = 400;
        ctx.vectorText("TIMERS", 1.5, left_x, curret_y, null, heading_color);
        curret_y += 20;
        ctx.vectorText("TIMER, POLLED: " + this.counter_polled, 1.5, left_x + indent, curret_y, null, Flynn.Colors.WHITE);
        curret_y += 20;
        ctx.vectorText("TIMER, CALLBACK: " + this.counter_callback, 1.5, left_x + indent, curret_y, null, Flynn.Colors.WHITE);

        curret_y += 40;
        // ctx.vectorText("PRESS <ESCAPE> TO ACCESS CONFIGURATION MENU", 1.5, left_x, curret_y, null, heading_color);
        ctx.vectorText("KEYBOARD CONTROLS:", 1.5, left_x, curret_y, null, heading_color);
        // ctx.vectorText("PRESS <ENTER> TO TEST HIGH SCORE SCREEN", 1.5, left_x, curret_y, null, heading_color);
        var indent_chars = 9;
        var scale = 1.5;
        options=[
            ['ESCAPE', 'CONFIGURATION MENU'],
            ['ENTER', 'HIGH SCORE SCREEN'],
            ['6', '(DEVELOPER MODE) TOGGLE METRICS'],
            ['7', '(DEVELOPER MODE) TOGGLE SLOW MO'],
            ['\\', '(DEVELOPER MODE) TOGGLE 20 FPS'],
        ];
        for(i=0; i<options.length; i++){
            curret_y += 20;
            ctx.vectorText(options[i][0], scale, left_x + indent_chars * Flynn.Font.CharacterSpacing * scale,
                curret_y, 0, Flynn.Colors.ORANGE);
            ctx.vectorText(options[i][1], scale, left_x + (indent_chars+2) * Flynn.Font.CharacterSpacing * scale,
                curret_y, null, Flynn.Colors.WHITE);            
        }


        
        //-----------------
        // Particle gun
        //-----------------
        var size = 10;
        ctx.vectorRect(
            this.partice_gun.x - size/2, 
            this.partice_gun.y - size/2,
            size,
            size,
            Flynn.Colors.GRAY); 

        ctx.vectorLine(
            this.partice_gun.x, 
            this.partice_gun.y, 
            this.partice_gun.x + Math.cos(this.partice_gun.angle) * this.partice_gun.length, 
            this.partice_gun.y + Math.sin(this.partice_gun.angle) * this.partice_gun.length, 
            Flynn.Colors.GRAY);

        ctx.drawPolygon(this.logo, this.canvasWidth-80, this.canvasHeight-30);

        this.particles.draw(ctx);

    }
});