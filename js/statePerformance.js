var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StatePerformance = Flynn.State.extend({

    SPIRAL_SIZE: 5,
    SPIRAL_GAP: 2,
    SPIRAL_SCALE: 4,
    ANGLE_STEP: Math.PI/60,

    init: function() {
        this._super();

        // Set world viewport
        Flynn.mcp.viewport.x = 0;
        Flynn.mcp.viewport.y = 0;
        
        this.polygon_spiral = new Flynn.Polygon(
            Game.Points.SPIRAL,
            Flynn.Colors.WHITE,
            this.SPIRAL_SCALE, // scale
            new Victor(0,0),
            true, // constrained
            false  // is_world
            );

        this.angle = 0;
        this.num_spirals = 500;
        var offset = Game.BOUNDS.top + Game.FONT_MARGIN_TOP * 2 + Game.FONT_SCALE * Flynn.Font.Normal.CharacterHeight;
        this.spiral_bounds = new Flynn.Rect(
            Game.BOUNDS.left,
            offset,
            Game.BOUNDS.width,
            Game.BOUNDS.height - offset);
        this.fps_update_ticks = Flynn.mcp.canvas.ctx.fpsFrameAverage * 2;
        this.fps_update_counter = this.fps_update_ticks;
        this.pace_samples = [];
        this.polygons_per_frame_samples = [];
        this.pace_window = 10;
    },

    median: function(values) {
        var values_copy = values.slice();
        values_copy.sort( function(a,b) {return a - b;} );
        var half = Math.floor(values_copy.length/2);
        if (values_copy.length % 2) {
            return values_copy[half];
        } else {
            return (values_copy[half-1] + values_copy[half]) / 2.0;
        }
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        var avg_pace_factor, i;
        this.angle += this.ANGLE_STEP * elapsed_ticks;
        this.polygon_spiral.setAngle(this.angle);
        // console.log(elapsed_ticks);

        if(elapsed_ticks > 1.06){
            this.num_spirals = Math.max(this.num_spirals-1, 1);
        }
        else{
            this.num_spirals += 0.05;
        }


        // this.pace_samples.push(elapsed_ticks);
        // if(this.pace_samples.length == this.pace_window){
        //     avg_pace_factor = 0;
        //     for(i=0; i<this.pace_window; i++){
        //         avg_pace_factor += this.pace_samples[i];
        //     }
        //     avg_pace_factor = avg_pace_factor/this.pace_window;
        //     // console.log(avg_pace_factor, this.pace_window, this.pace_samples.length, this.pace_samples);
        //     if(avg_pace_factor > 1.1){
        //         this.num_spirals -= 10;
        //     }
        //     else if(avg_pace_factor > 1.05){
        //         this.num_spirals -= 0.5;
        //     }
        //     else{
        //         this.num_spirals += 0.5;
        //     }
        //     this.pace_samples = [];
        // }

        // this.fps_update_counter--;
        // if(this.fps_update_counter <= 0){
        //     this.fps_update_counter = this.fps_update_ticks;

        //     var fps = Flynn.mcp.canvas.ctx.fps;
        //     if(fps<60){
        //         this.num_spirals -= 1;
        //     }
        //     else{
        //         this.num_spirals += 1;
        //     }
        // }

        // if(elapsed_ticks<1.0){
        //     this.num_spirals += 1;
        // }
        // else{
        //     if(this.num_spirals >= 2){
        //         this.num_spirals -= 1;
        //     }
        // }
    },

    render: function(ctx){
        var i;
        var spiral_step = (this.SPIRAL_SIZE + this.SPIRAL_GAP) * this.SPIRAL_SCALE;
        var spiral_x_reset = this.spiral_bounds.left + spiral_step/2 + this.SPIRAL_GAP * this.SPIRAL_SCALE;
        var spiral_x = spiral_x_reset;
        var spiral_y = this.spiral_bounds.top + spiral_step/2;
        var start_milliseconds, stop_milliseconds;
        

        // var num_spirals = 800;
        //-----------------------
        //  BEGIN TIMED SECTION
        //-----------------------
        // start_milliseconds = window.performance.now();
        // ctx.clearRect(
        //     this.spiral_bounds.left,
        //     this.spiral_bounds.top,
        //     this.spiral_bounds.width,
        //     this.spiral_bounds.height
        //     );

        for(i=0; i<this.num_spirals; i++){
            this.polygon_spiral.position.x = spiral_x;
            this.polygon_spiral.position.y = spiral_y;
            this.polygon_spiral.render(ctx);
            spiral_x += spiral_step;
            if(spiral_x > this.spiral_bounds.right - spiral_step/2){
                spiral_x = spiral_x_reset;
                spiral_y += spiral_step;
            }   
        }
        // stop_milliseconds = window.performance.now();
        //-----------------------
        //  END TIMED SECTION
        //-----------------------

        // var polygons_per_second = this.num_spirals / ((stop_milliseconds - start_milliseconds) / 1000);
        // var polygons_per_frame = polygons_per_second / 60;

        // this.polygons_per_frame_samples.push(polygons_per_frame);
        // if(this.polygons_per_frame_samples.length > this.pace_window){
        //     this.polygons_per_frame_samples.splice(0,1);
        // }
        // var median_polygons_per_frame = this.median(this.polygons_per_frame_samples);

        Game.render_page_frame(ctx);

        ctx.vectorText2({
            text: "NUM POLYGONS: " + Math.floor(this.num_spirals),
            scale: Game.FONT_SCALE, 
            x: Game.BOUNDS.left + Game.FONT_MARGIN_LEFT,
            y: Game.BOUNDS.top + Game.FONT_MARGIN_TOP, 
            color: Flynn.Colors.YELLOW
        });
    }
});

}()); // "use strict" wrapper