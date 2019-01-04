var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StateColor = Flynn.State.extend({

    TEXT_MARGIN: 10,

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
    },

    render: function(ctx){
        var credit_text, y_step, y_text, x_text, line_text, line_color, i;

        Game.render_page_frame(ctx);

        y_step = 20;
        y_text = Game.BANNER_HEIGHT + Game.BORDER_MARGIN + this.TEXT_MARGIN;
        x_text = Game.BORDER_MARGIN + this.TEXT_MARGIN;

        for(var color_name in Flynn.Colors){
            if(color_name == 'BLACK'){
                continue;
            }
            var color = Flynn.Colors[color_name];
            ctx.vectorText2({
                text: color_name  + ': ' + color,
                scale: 1.5,
                y: y_text,
                x: x_text,
                color: color
            });
            y_text += y_step;
        }

        // credit_text = [
        //     'COLOR'
        // ];
        // y_step = 25;
        // // y_text = Game.CANVAS_HEIGHT/2 - y_step*credit_text.length/2; 
        // y_text = 100; 
        // for(i=0; i<credit_text.length; i++){
        //     line_text = credit_text[i];
        //     line_color = Flynn.Colors.CYAN;
        //     if(line_text.startsWith('*')){
        //         line_color = Flynn.Colors.ORANGE;
        //         line_text = line_text.substring(1);
        //     }
        //     ctx.vectorText2({
        //         text: line_text,
        //         scale: 2,
        //         y: y_text + y_step*i,
        //         color: line_color
        //     });
        // }
    }
});

}()); // "use strict" wrapper