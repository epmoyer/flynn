var Game = Game || {}; // Create namespace

(function () { "use strict";
    
Game.StateInfo = Flynn.State.extend({

    init: function() {
        this._super();
        
        this.center_x = Flynn.mcp.canvasWidth/2;
        this.center_y = Flynn.mcp.canvasHeight/2;
        this.viewport_v = new Victor(0,0);
    },

    handleInputs: function(input, paceFactor) {
        Game.handleInputs_common(input);
    },

    update: function(paceFactor) {
    },

    render: function(ctx){
        var credit_text, y_step, y_text, line_text, line_color;

        ctx.clearAll();

        Game.render_page_frame(ctx);

        credit_text = [
            'THIS TEST APP & THE "FLYNN" ENGINE CREATED BY ERIC MOYER',
            '',
            'MUSIC "HORIZON 515" BY DST (NOSOAPRADIO.US)',
            '',
            'FIND MY VECTOR GAMES AT VECTORALCHEMY.COM',
            '',
            'WANT TO HELP?',
            '*WWW.PATREON.COM/VECTORALCHEMY'
        ];
        y_step = 25;
        // y_text = Game.CANVAS_HEIGHT/2 - y_step*credit_text.length/2; 
        y_text = 100; 
        for(i=0; i<credit_text.length; i++){
            line_text = credit_text[i];
            line_color = Flynn.Colors.CYAN;
            if(line_text.startsWith('*')){
                line_color = Flynn.Colors.ORANGE;
                line_text = line_text.substring(1);
            }
            ctx.vectorText(line_text, 2, null, y_text + y_step*i, null, line_color);
        }
      
    }
});

}()); // "use strict" wrapper