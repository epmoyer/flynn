var Game = Game || {}; // Create namespace

(function () { "use strict";

// Star colors from http://www.vendian.org/mncharity/dir3/starcolor/
Game.star_colors_realistic = [
    '#9bb2ff', '#9eb5ff', '#a3b9ff', '#aabfff', '#b2c5ff', '#bbccff', '#c4d2ff', '#ccd8ff', 
    '#d3ddff', '#dae2ff', '#dfe5ff', '#e4e9ff', '#e9ecff', '#eeefff', '#f3f2ff', '#f8f6ff', 
    '#fef9ff', '#fff9fb', '#fff7f5', '#fff5ef', '#fff3ea', '#fff1e5', '#ffefe0', '#ffeddb', 
    '#ffebd6', '#ffe9d2', '#ffe8ce', '#ffe6ca', '#ffe5c6', '#ffe3c3', '#ffe2bf', '#ffe0bb', 
    '#ffdfb8', '#ffddb4', '#ffdbb0', '#ffdaad', '#ffd8a9', '#ffd6a5', '#ffd5a1', '#ffd29c', 
    '#ffd096', '#ffcc8f', '#ffc885', '#ffc178', '#ffb765', '#ffa94b', '#ff9523', '#ff7b00', 
    '#ff5200'
];

Game.star_colors_simple = [
    Flynn.Colors.DODGERBLUE,
    Flynn.Colors.CYAN,
    Flynn.Colors.RED,
    Flynn.Colors.YELLOW,    
];

Game.StarField = Flynn.State.extend({
    init: function(width, height, density, realistic_colors) {
        // density is in stars per 100x100 pixel area
        
        this.stars=[];
        var num_stars = Math.floor((width/100) * (height/100) * density);
        var i;
        var star_color;

        for(i=0; i<num_stars; i++){
            if(realistic_colors){
                star_color = Flynn.Util.randomChoice(Game.star_colors_realistic);
            }
            else{
                star_color = Flynn.Util.randomChoice(Game.star_colors_simple);
            }
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                color: Flynn.Util.shadeBlend(
                    -Math.random(),
                    star_color)
            });
        }
    },

    render: function(ctx){
        var i, len;

        for(i=0, len=this.stars.length; i<len; i++){
            ctx.fillStyle=this.stars[i].color;
            var world = ctx.worldToScreen(
                this.stars[i].x,
                this.stars[i].y,
                false);
            ctx.fillRect(
                world.x,
                world.y,
                2,
                2);
        }
    }
});

Game.StateWorld = Flynn.State.extend({

    VIEWPORT_SWEEP_ANGLE_SPEED: 0.008,
    TIMER_EXPLODE_TICKS: 0.3 * Flynn.TICKS_PER_SECOND,
    TIMER_SHOOT_TICKS: 1.0 * Flynn.TICKS_PER_SECOND,
    BULLET_LIFETIME: 1.0 * Flynn.TICKS_PER_SECOND,
    BULLET_SPEED: 1,

    init: function() {
        var i, x, len;
        this._super();
   
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;

        this.world_rect = new Flynn.Rect(
            0, 0, Flynn.mcp.canvasWidth * 1.1, Flynn.mcp.canvasHeight * 1.25
            );
        Flynn.mcp.canvas.ctx.world_bounds = this.world_rect;
        Flynn.mcp.canvas.ctx.world_wrap_enabled = true;
        this.wrap_util = new Flynn.WrapUtil(this.world_rect);

        this.starfield = new Game.StarField(
            this.world_rect.width,
            this.world_rect.height,
            4,    // density
            false // realistic_colors
            );
        this.viewport_sweep_angle = 3 * Math.PI/2;

        this.viewport_sweep_radius = Flynn.mcp.canvasHeight / 2;

        var poly_init = [
            {points:Game.Points.SHIP,        scale:3, color: Flynn.Colors.DODGERBLUE},
            {points:Game.Points.SHIPB,       scale:3, color: Flynn.Colors.RED},
            {points:Game.Points.POINTY_SHIP, scale:3, color: Flynn.Colors.GREEN},
            {points:Game.Points.STAR_WING,   scale:3, color: Flynn.Colors.ORANGE},
            {points:Game.Points.ABSTRACT,    scale:3, color: Flynn.Colors.MAGENTA},
            {points:Game.Points.RESPAWN,     scale:3, color: Flynn.Colors.CYAN}
            ];
        this.polygons = [];
        var poly_radius = 280;
        var angle_step = Math.PI*2/poly_init.length;
        for (i=0,len=poly_init.length; i<len; i++){
            this.polygons.push(new Flynn.Polygon(
                poly_init[i].points,
                poly_init[i].color,
                poly_init[i].scale, 
                new Victor(
                    this.world_rect.center_x + Math.cos(i*angle_step) * poly_radius, 
                    this.world_rect.center_y + Math.sin(i*angle_step) * poly_radius),
                false, // constrained
                true   // is_world
                ));
        }

        // Make Drones
        this.drones = [];
        var angle_margin = Math.PI*2/64;
        var drone_radius = 340;
        angle_step = Math.PI*2/4;
        var margin = 40;
        var drone_locations = [
            // Corners
            new Victor(margin, margin),
            new Victor(this.world_rect.right - margin, this.world_rect.bottom - margin),

            // Center, vertical
            new Victor(this.world_rect.center_x, margin),
            new Victor(this.world_rect.center_x, this.world_rect.bottom - margin),

            // Center, horizontal
            new Victor(margin, this.world_rect.center_y),
            new Victor(this.world_rect.right - margin, this.world_rect.center_y),
        ];
        // Radial 
        for (var angle=0; angle<Math.PI*2; angle+=angle_step){
            for (var offset=-1; offset<=1; offset+=2){
                drone_locations.push(new Victor(
                        this.world_rect.center_x + Math.cos(angle + angle_margin * offset) * drone_radius,
                        this.world_rect.center_y + Math.sin(angle + angle_margin * offset) * drone_radius
                        ));
            }
        }
        for (i=0,len=drone_locations.length; i<len; i++){
            this.drones.push(new Flynn.Polygon(
                Game.Points.DRONE,
                Flynn.Colors.GREEN,
                3, // scale
                drone_locations[i],
                false, // constrained
                true   // is_world
                ));
        }

        this.extra_lives_poly = new Flynn.Polygon(
            Game.Points.SHIP,
            Flynn.Colors.DODGERBLUE,
            3.0, // scale
            new Victor(0, 70), // Will be set when rendering instances
            false, // constrained
            false  // is_world
            );
        this.extra_lives_poly.setAngle(-Math.PI/2);

        this.particles = new Flynn.Particles(
                true // is_world
            ); 

        this.timers = new Flynn.Timers();
        this.timers.add("Explode", this.TIMER_EXPLODE_TICKS, null);
        this.timers.add("Shoot", this.TIMER_SHOOT_TICKS, null);

        this.colors=[
            Flynn.Colors.DODGERBLUE,
            Flynn.Colors.RED,
            Flynn.Colors.GREEN,
            Flynn.Colors.ORANGE,
            Flynn.Colors.MAGENTA,
            Flynn.Colors.CYAN ];

        this.projectiles = new Flynn.Projectiles(
            this.world_rect,
            true, // is_world
            true  // world_wrap
            );

    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        var i, j, len;

        this.particles.update(elapsed_ticks);
        this.projectiles.update(elapsed_ticks);
        
        // Swirl the viewport around the world center
        this.viewport_sweep_angle += this.VIEWPORT_SWEEP_ANGLE_SPEED * elapsed_ticks;

        var camera_zoom = 0.9 + 2.0 * ((Math.sin(this.viewport_sweep_angle)+1)/2);
        // The point (in the world) to look at
        var camera_v = new Victor(
            this.world_rect.center_x + Math.cos(this.viewport_sweep_angle) * this.viewport_sweep_radius,
            this.world_rect.center_y + Math.sin(this.viewport_sweep_angle) * this.viewport_sweep_radius
            );
        // Where the point at camera_v should show up on the screen
        var screen_target_v = new Victor(
            Flynn.mcp.canvasWidth / 2,
            Flynn.mcp.canvasHeight / 2
            );
        Flynn.mcp.setViewport(camera_v, screen_target_v, camera_zoom);

        // Rotate polygons
        for (i=0,len=this.polygons.length; i<len; i++){
            this.polygons[i].setAngle(this.polygons[i].angle - Math.PI/60.0 * elapsed_ticks * (1 + 0.2*i));
        }

        this.timers.update(elapsed_ticks);

        if(this.timers.hasExpired("Explode")){
            this.timers.set("Explode", this.TIMER_EXPLODE_TICKS);

            // Explode center
            this.particles.explosion(
                this.world_rect.center_position, 
                Flynn.Util.randomIntFromInterval(10, 200),      // quantity
                2,                                              // max_velocity
                Flynn.Util.randomChoice(this.colors),           // color
                new Victor(0,0)                                 // velocity
                );
        }

        if(this.timers.hasExpired("Shoot")){
            this.timers.set("Shoot", this.TIMER_SHOOT_TICKS);
            // Drones shoot
            len=this.drones.length
            for(i=0; i<len; i++){
                var min_distance = 9000000;
                var closest_v = null;
                for(j=0; j<len; j++){
                    if(j != i){
                        var relative_v = this.wrap_util.getRelativePosition(
                            this.drones[i].position,
                            this.drones[j].position
                            );
                        var distance = relative_v.length();
                        if(distance < min_distance){
                            min_distance = distance;
                            closest_v = relative_v;
                        }
                    }
                }
                this.projectiles.add(
                    this.drones[i].position,
                    closest_v.normalize().multiplyScalar(this.BULLET_SPEED),
                    this.BULLET_LIFETIME,
                    3,
                    Flynn.Colors.YELLOW
                    );

                // Drones explode center
                this.particles.explosion(
                    this.drones[i].position, 
                    10,                  // quantity
                    0.5,                 // max_velocity
                    Flynn.Colors.GREEN,  // color
                    new Victor(0,0)      // velocity
                    );
            }

        }

    },

    render: function(ctx){

        var left_x = 10;
        var margin = 3;
        var i, j, x, len;
        var heading_color = Flynn.Colors.YELLOW;
        var curret_y = 42;

        ctx.vectorText("SCREEN COORDINATES VS. WORLD COORDINATES", 1.5, left_x, curret_y, 'left', heading_color);
        
        this.starfield.render(ctx);
        for (i=0,len=this.polygons.length; i<len; i++){
            this.polygons[i].render(ctx);
            // Render text in world coordinates
            ctx.vectorText(
                "SHIP "+i, 
                1.5, // scale
                this.polygons[i].position.x, 
                this.polygons[i].position.y+30, 
                'center',
                Flynn.Colors.YELLOW,
                true // is_world
                );
            }
        for (i=0,len=this.drones.length; i<len; i++){
            this.drones[i].render(ctx);
            }

        // World boundary
        ctx.vectorRect(
            (this.world_rect.left - Flynn.mcp.viewport.x) * Flynn.mcp.viewportZoom,
            (this.world_rect.top - Flynn.mcp.viewport.y) * Flynn.mcp.viewportZoom,
            this.world_rect.width * Flynn.mcp.viewportZoom,
            this.world_rect.height * Flynn.mcp.viewportZoom,
            Flynn.Colors.GRAY_DK,
            null,   // fill_color
            false   // is_world
            );

        ctx.vectorTextArc(
            "ARC TEXT IN WORLD COORDINATES",
            2.0, 
            this.world_rect.center_x, 
            this.world_rect.center_y, 
            -Math.PI/2, 
            100,   // radius
            Flynn.Colors.CYAN,
            true,  // is_centered
            false, // is_reversed
            true   // is_world
            );

        var box_size = 80;
        ctx.vectorRect(
            this.world_rect.center_x - box_size/2,
            this.world_rect.center_y - box_size/2,
            box_size,
            box_size,
            Flynn.Colors.MAGENTA,
            null,   // fill_color
            true    // is_world
            );


        Game.render_page_frame (ctx);

        // Extra lives
        for(i=0;i<3;i++){
            this.extra_lives_poly.position.x = Flynn.mcp.canvasWidth - 30 - i*30;
            this.extra_lives_poly.render(ctx);
        }

        this.particles.render(ctx);
        this.projectiles.render(ctx);
    },
});
    
}()); // "use strict" wrapper