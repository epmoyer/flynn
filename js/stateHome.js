var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.render_page_frame = function(ctx){
    // Render the frame for the current page

    var i, text, color;
    var x=10;
    var page_names = ["HOME", "TEXT", "COLOR", "BOX2D", "COLLISION", "WORLD", "FONT", "UTIL", "PACING", "3D", "PERFORMANCE", "INFO"];
    var page_id = Flynn.mcp.current_state_id;

    // Render frame box
    ctx.vectorLine(
        Game.BORDER_MARGIN, 
        Game.BANNER_HEIGHT + Game.BORDER_MARGIN, 
        ctx.width-Game.BORDER_MARGIN-1, 
        Game.BANNER_HEIGHT + Game.BORDER_MARGIN,
        Flynn.Colors.GREEN);
    ctx.vectorRect(
        Game.BORDER_MARGIN, 
        Game.BORDER_MARGIN, 
        ctx.width-2*Game.BORDER_MARGIN,
        ctx.height-2*Game.BORDER_MARGIN,
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
        ctx.vectorText2({
            text:text,
            scale: Game.BANNER_FONT_SCALE,
            x: x,
            y: 11,
            color: color
        });
        x += Flynn.Font.Normal.CharacterSpacing * Game.BANNER_FONT_SCALE * (text.length + 2);
    }
};

Game.handleInputs_common = function(input){
    // Handle input commands common to all screens

    var next_state = Flynn.mcp.current_state_id;

    if (input.virtualButtonWasPressed("UI_right")){
        next_state += 1;
        if(next_state > Game.States.LAST_PAGE){
            next_state = Game.States.HOME;
        }
        Flynn.mcp.changeState(next_state);
        Flynn.sounds.ui_move.play();
    }
    if (input.virtualButtonWasPressed("UI_left")){
        next_state -= 1;
        if(next_state < Game.States.HOME){
            next_state = Game.States.LAST_PAGE;
        }
        Flynn.mcp.changeState(next_state);
        Flynn.sounds.ui_move.play();
    }
    if (input.virtualButtonWasPressed("UI_enter")){
        Flynn.mcp.changeState(Game.States.END);
        Flynn.sounds.ui_select.play();
    }
    if (input.virtualButtonWasPressed("UI_escape")) {
        Flynn.mcp.changeState(Game.States.CONFIG);
    }
    if (input.virtualButtonWasPressed("UI_exit") && Flynn.mcp.backEnabled){
        window.history.back();
        Flynn.sounds.ui_cancel.play();
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
                new Victor(
                    40 + i*50,
                    207),
                false, // constrained
                false  // is_world
                ));
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
                new Victor(
                    40 + i*50,
                    207 + 65),
                false, // constrained
                false  // is_world
                ));
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
                new Victor(
                    40 + i*50,
                    207 + 65 + 65),
                false, // constrained
                false  // is_world
                ));
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

        this.va_logo = new Flynn.VALogo(
            new Victor(
                Flynn.mcp.canvasWidth/2,
                Flynn.mcp.canvasHeight - 150),
            2 // scale
            );
        this.va_logo2 = new Flynn.VALogo(
            new Victor(
                Flynn.mcp.canvasWidth/2 + 170,
                Flynn.mcp.canvasHeight - 94),
            1, // scale
            false // enable_color
            );
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        this.gameClock += elapsed_ticks;
        
        this.timers.update(elapsed_ticks);
        this.particles.update(elapsed_ticks);

        if(this.timers.hasExpired("Explode1")){
            this.timers.set("Explode1", this.TIMER_EXPLODE1_TICKS);
            this.particles.explosion(
                // position
                new Victor(
                    Flynn.Util.randomIntFromInterval(
                        Flynn.mcp.canvasWidth - 130, Flynn.mcp.canvasWidth - 80), 
                    Flynn.Util.randomIntFromInterval(350, 450)), 
                Flynn.Util.randomIntFromInterval(10, 200),       // quantity
                2,                                               // max_velocity
                Flynn.Util.randomChoice(this.colors),            // color
                // velocity
                new Victor(0,0)
                );

            this.particles.explosion(
                // position
                new Victor(
                    this.partice_gun.x + Math.cos(this.partice_gun.angle) * this.partice_gun.length,
                    this.partice_gun.y + Math.sin(this.partice_gun.angle) * this.partice_gun.length 
                ),
                Flynn.Util.randomIntFromInterval(10, 40),    // quantity
                1,                                           // max_velocity
                Flynn.Colors.RED,                            // color
                // velocity
                new Victor(
                    Math.cos(this.partice_gun.angle) * this.partice_gun.muzzle_velocity,
                    Math.sin(this.partice_gun.angle) * this.partice_gun.muzzle_velocity)
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
            this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/60.0 * elapsed_ticks * (1 + 0.2*i));
        }
        for (i=0; i<this.penup_polygons.length; i++){
            this.penup_polygons[i].setAngle(this.penup_polygons[i].angle + Math.PI/60.0 * elapsed_ticks * (1 + 0.2*i));
        }
        for (i=0; i<this.multicolor_polygons.length; i++){
            this.multicolor_polygons[i].setAngle(this.multicolor_polygons[i].angle + Math.PI/60.0 * elapsed_ticks * (1 + 0.2*i));
        }

        this.partice_gun.angle += this.partice_gun.angular_velocity * elapsed_ticks;

        this.va_logo.update(elapsed_ticks);
        this.va_logo2.update(elapsed_ticks);
    },

    render: function(ctx){
        var left_x = 10;
        var margin = 3;
        var i, x;
        var heading_color = Flynn.Colors.YELLOW;

        Game.render_page_frame (ctx);

        var curret_y = 42;
        ctx.vectorText2({
            text:"LINES",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });

        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorLine(x-15, curret_y+15, x+15, curret_y+15, this.colors[i]);
            ctx.vectorLine(x,    curret_y,    x,    curret_y+30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText2({
            text:"RECTS",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 20;
        for (i=0; i<this.colors.length; i++){
            x = left_x + 30 + i*50;
            ctx.vectorRect(x-15, curret_y,  30, 30, this.colors[i]);
        }

        curret_y += 45;
        ctx.vectorText2({
            text:"POLYGONS",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 35;
        for (i=0; i<this.polygons.length; i++){
            this.polygons[i].render(ctx);
        }

        curret_y += 30;
        ctx.vectorText2({
            text:"POLYGONS WITH PENUP NODES",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 35;
        for (i=0; i<this.penup_polygons.length; i++){
            this.penup_polygons[i].render(ctx);
        }

        curret_y += 30;
        ctx.vectorText2({
            text:"POLYGONS WITH COLOR NODES",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 35;
        for (i=0; i<this.multicolor_polygons.length; i++){
            this.multicolor_polygons[i].render(ctx);
        }

        //------------------
        // ASCII Table
        //------------------
        curret_y += 30;
        var text_color = Flynn.Colors.WHITE;
        ctx.vectorText2({
            text:"TEXT",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 15;
        var low, high;
        var x_step = 20;
        var y_step = 20;
        var indent = 20;
        for (high=0; high<=15; ++high){
            ctx.vectorText2({
                text:high.toString(16).toUpperCase(),
                scale: 2,
                x: left_x + indent + x_step * (high+1),
                y: curret_y,
                color: Flynn.Colors.CYAN
            });
            for (low=0; low<=15; ++low){
                if(high === 0){
                    ctx.vectorText2({
                        text:low.toString(16).toUpperCase(),
                        scale: 2,
                        x: left_x + indent,
                        y: curret_y + y_step * (low + 1),
                        color: Flynn.Colors.CYAN
                    });
                }
                ctx.vectorText2({
                    text:String.fromCharCode(high*16 + low),
                    scale: 2,
                    x: left_x + indent + x_step * (high+1),
                    y: curret_y + y_step * (low + 1),
                    color: text_color
                });
            }
        }
        ctx.vectorText2({
            text:"JACKDAWS LOVE MY BIG SPHINX OF QUARTZ    jackdaws love my big sphinx of quartz",
            scale: 2,
            x: left_x + indent,
            y: curret_y + y_step * 18,
            color: text_color
        });

        curret_y = 42;
        left_x = 400;
        ctx.vectorText2({
            text:"TIMERS",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        curret_y += 20;
        ctx.vectorText2({
            text:"TIMER, POLLED: " + this.counter_polled,
            scale: 1.5,
            x: left_x + indent,
            y: curret_y,
            color: Flynn.Colors.WHITE
        });
        curret_y += 20;
        ctx.vectorText2({
            text:"TIMER, CALLBACK: " + this.counter_callback,
            scale: 1.5,
            x: left_x + indent,
            y: curret_y,
            color: Flynn.Colors.WHITE
        });

        curret_y += 40;
        ctx.vectorText2({
            text:"KEYBOARD CONTROLS:",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });
        var indent_chars = 9;
        var scale = 1.5;
        var options=[
            ['LEFT', 'PREVIOUS PAGE'],
            ['RIGHT', 'NEXT PAGE'],
            ['ESCAPE', 'CONFIGURATION MENU'],
            ['ENTER', 'HIGH SCORE SCREEN'],
        ];
        if(Flynn.mcp.backEnabled){
            options = options.concat([
                ['TAB', 'EXIT (BROWSER BACK)'],
            ]);
        }
        if(Flynn.mcp.developerModeEnabled){
            options = options.concat([
                ['6', '(DEVELOPER MODE) TOGGLE METRICS'],
                ['7', '(DEVELOPER MODE) TOGGLE SLOW MO'],
                ['\\', '(DEVELOPER MODE) TOGGLE 20 FPS'],
            ]);
        }

        for(i=0; i<options.length; i++){
            curret_y += 20;
            ctx.vectorText2({
                text:options[i][0],
                scale: scale,
                x: left_x + indent_chars * Flynn.Font.Normal.CharacterSpacing * scale,
                y: curret_y,
                justify: 'right',
                color: Flynn.Colors.ORANGE
            });
            ctx.vectorText2({
                text:options[i][1],
                scale: scale,
                x: left_x + (indent_chars+2) * Flynn.Font.Normal.CharacterSpacing * scale,
                y: curret_y,
                color: Flynn.Colors.WHITE
            });          
        }

        curret_y += 40;
        ctx.vectorText2({
            text:"PARTICLES",
            scale: 1.5,
            x: left_x,
            y: curret_y,
            color: heading_color
        });

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
            {   x:Flynn.mcp.canvasWidth-55, 
                y:65
            });

        this.particles.render(ctx);
        this.va_logo.render(ctx);
        this.va_logo2.render(ctx);
    }
});

}()); // "use strict" wrapper