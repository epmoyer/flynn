(function () { "use strict"; 
    
Flynn.Gauge = Class.extend({

    PAD: 4,

    init: function(position, num_samples, range, scale, tick_interval, color){
        var i;

        this.position = position;
        this.num_samples = num_samples;
        this.range = range;
        this.scale = scale;
        this.tick_interval = tick_interval;
        this.color_number = Flynn.Util.parseColor(color, true);
        
        this.samples = [];

        for(i = 0; i < num_samples; i++) {
            this.samples.push(0);
        }
    },

    record: function(sample){
        this.samples.shift();
        this.samples.push(sample);
    },

    render: function(ctx){
        var graphics = ctx.graphics;
        var height = this.range * this.scale + (2 * this.PAD);
        var width = this.num_samples + 2;
        var offset, y, x, i, tick;

        // Bounding Box
        graphics.lineStyle(1, 0xcccccc, 1);
        graphics.beginFill(0x000000);
        graphics.drawRect(
            this.position.x,
            this.position.y, 
            width,
            height);
        graphics.endFill();

        // Scale lines
        graphics.lineStyle(1, 0x555555, 1);
        for(tick=0; tick<=this.range; tick+=this.tick_interval){
            y=this.position.y + height - this.PAD - (tick * this.scale);
            graphics.moveTo(this.position.x, y);
            graphics.lineTo(this.position.x + width, y);
        }

        // Samples
        graphics.lineStyle();
        graphics.beginFill(this.color_number);
        for(i=0; i<this.samples.length; i++){
            x = this.position.x + 1 + i;
            y = y=this.position.y + height - this.PAD - (this.samples[i] * this.scale);
            if(y>this.position.y + 1){
                graphics.drawRect(x, y, 2, 2);
            }
        }
        graphics.endFill();
    },


});

}()); // "use strict" wrapper