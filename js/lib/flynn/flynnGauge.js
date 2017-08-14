(function () { "use strict"; 
    
Flynn.Gauge = Class.extend({

    PAD: 6,

    init: function(position, num_samples, range, scale, tick_interval, color, title){
        var i, width, height;

        this.position = position;
        this.num_samples = num_samples;
        this.range = range;
        this.scale = scale;
        this.tick_interval = tick_interval;
        this.color_number = Flynn.Util.parseColor(color, true);
        this.title = title;
        
        this.text_items = [];

        height = range * scale + (2 * this.PAD);
        width = num_samples + 2;
        this.rect = new Flynn.Rect(position.x, position.y, width, height);
        
        this.samples = [];

        for(i = 0; i < num_samples; i++) {
            this.samples.push(0);
        }

        this._buildText();
    },

    _buildText: function(){
        var font_size = 10;
        var text;
        this.text_items = [];

        text = new PIXI.Text(
                this.title,
                {   fontFamily: "Arial",
                    fontSize: font_size, 
                    fill: "#fff8",
                    fontWeight: "bold"
                }
            );
        text.anchor.set(0.5, 0.5);
        text.position.set(
            this.rect.left + this.rect.width/2,
            this.rect.top + this.rect.height - this.PAD - 5
            );
        this.text_items.push(text);

        var y, x, tick;
        x = this.rect.left + 5;
        for(tick=0; tick<=this.range; tick+=this.tick_interval){
            y=this.rect.top + this.rect.height - this.PAD - (tick * this.scale);
            text = new PIXI.Text(
                tick.toString(),
                {   fontFamily: "Arial", fontSize: font_size, 
                    fill: "#aaa", fontWeight: "bold"}
            );
            text.anchor.set(0, 0.5);
            text.position.set(
                x,
                y
            );
            this.text_items.push(text);
        }
    },

    moveTo: function(position){
        this.rect.moveTo(position);
        this._buildText();
    },

    record: function(sample){
        this.samples.shift();
        this.samples.push(sample);
    },

    render: function(ctx){
        var graphics = ctx.graphics;
        var offset, y, x, i, tick;


        
        // Bounding Box
        graphics.lineStyle(1, 0xcccccc, 1);
        graphics.beginFill(0x000000);
        graphics.drawRect(
            this.rect.left+0.5,
            this.rect.top+0.5, 
            this.rect.width,
            this.rect.height);
        graphics.endFill();

        // Scale lines
        graphics.lineStyle(1, 0x555555, 1);
        for(tick=0; tick<=this.range; tick+=this.tick_interval){
            y=this.rect.top + this.rect.height - this.PAD - (tick * this.scale);
            graphics.moveTo(this.rect.left + 1, y);
            graphics.lineTo(this.rect.left + this.rect.width - 1, y);
        }

        // Samples
        graphics.lineStyle();
        graphics.beginFill(this.color_number);
        for(i=0; i<this.samples.length; i++){
            x = this.rect.left + 1 + i;
            y = y=this.rect.top + this.rect.height - this.PAD - (this.samples[i] * this.scale);
            if(y>this.rect.top + 1){
                graphics.drawRect(x, y, 2, 2);
            }
        }
        graphics.endFill();

        for(i=0; i<this.text_items.length; i++){
            ctx.stage.addChild(this.text_items[i]);
        }
    },


});

}()); // "use strict" wrapper