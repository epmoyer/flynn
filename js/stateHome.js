if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.render_page_frame = function(ctx, page_id){
    // Render the frame for the current page

    var i, text, color;
    var margin=3;
    var x=10;
    var scale=3;
    var page_names = ["HOME", "TEXT", "BOX2D", "COLLISION", "WORLD"];

    // Render frame box
    ctx.vectorLine(margin, 37, ctx.width-margin-1, 37, Flynn.Colors.GREEN);
    ctx.vectorRect(
        margin, 
        margin, 
        ctx.width-2*margin,
        ctx.height-2*margin,
        Flynn.Colors.GREEN);

    // Render page names
    for(i=0; i<page_names.length; ++i){
        text = page_names[i];
        if(i==page_id-1){
            color = Flynn.Colors.YELLOW;   
        }
        else{
            color = Flynn.Colors.GRAY_DK;
        }
        ctx.vectorText(text, scale, x, 11, 'left', color);
        x += Flynn.Font.CharacterSpacing * scale * (text.length + 2);
    }
};

Game.StateHome = Flynn.State.extend({

    TIMER_EXPLODE1_TICKS: 0.3 * Flynn.TICKS_PER_SECOND,
    TIMER_POLLED_TICKS: 5,
    TIMER_CALLBACK_TICKS: 5,
    COUNTER_ROLLOVER: 999,

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
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
            this.polygons.push(new Flynn.Polygon(
                points[i],
                this.colors[i],
                3, // scale
                {
                    x: 40 + i*50,
                    y: 207,
                    is_world: false
                }));
        }

        this.penup_polygons = [];
        var penup_info = [
            {points:Game.Points.PENUP_TEST1, scale:2.5},
            {points:Game.Points.PENUP_TEST2, scale:3},
            {points:Game.Points.PENUP_TEST3, scale:2},
            {points:Game.Points.PENUP_TEST4, scale:2.6},
            {points:Game.Points.PENUP_TEST5, scale:2.6},
            {points:Game.Points.PENUP_TEST6, scale:2.0},
            ];
        for (i=0; i<penup_info.length; i++){
            this.penup_polygons.push(new Flynn.Polygon(
                penup_info[i].points,
                this.colors[i],
                penup_info[i].scale,
                {
                    x: 40 + i*50,
                    y: 207 + 65,
                    is_world: false
                }));
        }

        this.multicolor_polygons = [];
        var multicolor_info = [
            {points:Game.Points.MUTICOLOR1, scale:3},
            {points:Game.Points.MUTICOLOR2, scale:3},
            {points:Game.Points.MUTICOLOR3, scale:3},
            {points:Game.Points.MUTICOLOR4, scale:4.2},
            {points:Game.Points.MUTICOLOR5, scale:2.3},
            {points:Game.Points.MUTICOLOR6, scale:3.2},
            ];
        for (i=0; i<multicolor_info.length; i++){
            this.multicolor_polygons.push(new Flynn.Polygon(
                multicolor_info[i].points,
                this.colors[i],
                multicolor_info[i].scale,
                {
                    x: 40 + i*50,
                    y: 207 + 65 + 65,
                    is_world: false
                }));
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
            x: Flynn.mcp.canvasWidth * 0.65,
            y: Flynn.mcp.canvasHeight * 4 / 7,
            length: 100,
            angular_velocity: Math.PI / 600,
            muzzle_velocity: 3
        };

    },

    handleInputs: function(input, paceFactor) {

        if (input.virtualButtonWasPressed("UI_right")){
            Flynn.mcp.changeState(Game.States.DEMO1);
        }
        if (input.virtualButtonWasPressed("UI_left")){
            Flynn.mcp.changeState(Game.States.DEMO4);
        }
        if (input.virtualButtonWasPressed("UI_enter")){
            Flynn.mcp.changeState(Game.States.END);
        }

        if (input.virtualButtonWasPressed("UI_escape")) {
            Flynn.mcp.changeState(Game.States.CONFIG);
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
    },

    update: function(paceFactor) {
        this.gameClock += paceFactor;
        
        this.timers.update(paceFactor);
        this.particles.update(paceFactor);

        if(this.timers.hasExpired("Explode1")){
            this.timers.set("Explode1", this.TIMER_EXPLODE1_TICKS);
            this.particles.explosion(
                Flynn.Util.randomIntFromInterval(
                    Flynn.mcp.canvasWidth-130, Flynn.mcp.canvasWidth-80), // x
                Flynn.Util.randomIntFromInterval(350, 450),     // y
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

        Game.render_page_frame (ctx, Game.States.HOME);

        var curret_y = 42;
        ctx.vectorText("LINES", 1.5, left_x, curret_y, 'left', heading_color);

        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorLine(x-15, curret_y+15, x+15, curret_y+15, this.colors[i]);
            ctx.vectorLine(x,    curret_y,    x,    curret_y+30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText("RECTS", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorRect(x-15, curret_y,  30, 30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText("POLYGONS", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 35;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].render(ctx);
        }

        curret_y += 30;
        ctx.vectorText("POLYGONS WITH PENUP NODES", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 35;
        for (i=0; i<this.penup_polygons.length; i++){
            this.penup_polygons[i].render(ctx);
        }

        curret_y += 30;
        ctx.vectorText("POLYGONS WITH COLOR NODES", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 35;
        for (i=0; i<this.multicolor_polygons.length; i++){
            this.multicolor_polygons[i].render(ctx);
        }

        curret_y += 30;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText("TEXT", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 15;
        var low, high;
        var x_step = 20;
        var y_step = 20;
        var indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText(high.toString(16), 2, left_x + indent + x_step * (high+1), curret_y, 'left', Flynn.Colors.CYAN);
            for (low=0; low<=15; ++low){
                if(high === 0){
                    ctx.vectorText(low.toString(16), 2, left_x + indent, curret_y + y_step * (low + 1), 'left', Flynn.Colors.CYAN);
                }
                ctx.vectorText(String.fromCharCode(high*16 + low), 2, 
                    left_x + indent + x_step * (high+1),
                    curret_y + y_step * (low + 1),
                    'left', text_color);
            }
        }
        ctx.vectorText("JACKDAWS LOVE MY BIG SPHINX OF QUARTZ", 2, 
            left_x + indent, 
            curret_y + y_step * 18,
            'left', text_color);

        curret_y = 42;
        left_x = 400;
        ctx.vectorText("TIMERS", 1.5, left_x, curret_y, 'left', heading_color);
        curret_y += 20;
        ctx.vectorText("TIMER, POLLED: " + this.counter_polled, 1.5, left_x + indent, curret_y, 'left', Flynn.Colors.WHITE);
        curret_y += 20;
        ctx.vectorText("TIMER, CALLBACK: " + this.counter_callback, 1.5, left_x + indent, curret_y, 'left', Flynn.Colors.WHITE);

        curret_y += 40;
        ctx.vectorText("KEYBOARD CONTROLS:", 1.5, left_x, curret_y, 'left', heading_color);
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
                curret_y, 'right', Flynn.Colors.ORANGE);
            ctx.vectorText(options[i][1], scale, left_x + (indent_chars+2) * Flynn.Font.CharacterSpacing * scale,
                curret_y, 'left', Flynn.Colors.WHITE);            
        }

        curret_y += 40;
        ctx.vectorText("PARTICLES", 1.5, left_x, curret_y, 'left', heading_color);

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

        Flynn.mcp.renderLogo(
            ctx, 
            {   x:Flynn.mcp.canvasWidth-78, 
                y:75
            });

        this.particles.draw(ctx);

    }
});