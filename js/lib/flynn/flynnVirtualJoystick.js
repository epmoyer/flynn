(function () { "use strict";
    
Flynn.VirtualJoystick = Class.extend({

    STICK_LIMIT_RATIO: 0.9,
    D_WITDH: 0.6,
    D_LENGH: 0.85,
    INNER_RADIUS_RATIO: 0.66,

    init: function(opts) {
        opts                  = opts                    || {};
        opts.button_map       = opts.button_map         || {};
        this.color            = opts.color              || 0xFFFFFF;
        this.alpha            = opts.alpha              || 0.3;
        this.pos              = opts.pos                || {x:100, y:100};
        this.radius           = opts.radius             || 60;
        this.deadzone_radius  = opts.deadzone_radius    || 8;
        this.capture_radius   = opts.capture_radius     || this.radius;
        this.visible_states   = opts.visible_states     || null;
        this.type             = opts.type               || 'stick';
        this.name             = opts.name               || 'joystick0';
        this.buttons          = {
            up:{
                name: (opts.button_map.up || null),
                pressed: false},
            down:{
                name: (opts.button_map.down || null),
                pressed: false},
            right:{
                name: (opts.button_map.right || null),
                pressed: false},
            left:{
                name: (opts.button_map.left || null),
                pressed: false},
        };

        this.limit_radius     = this.radius * this.STICK_LIMIT_RATIO;
        this.touchstart_pos   = {x:0, y:0};
        this.stick_offset     = {x:0, y:0};
        this.analog_pos       = {x:0, y:0}; // Analog stick position in range [1.0, -1.0]
        this.in_use           = false;
        this.touch_identifier = null;
        this.is_visible       = false;
        this.theshold         = Math.sin(Math.PI / 8);
    },

    clear_all: function(){
        this.in_use                = false;
        this.touch_identifier      = null;
        this.stick_offset          = {x:0, y:0};
        this.buttons.down.pressed  = false;
        this.buttons.up.pressed    = false;
        this.buttons.right.pressed = false;
        this.buttons.left.pressed  = false;
    },

    updateVisibility: function(current_state){
        var i, len;
        if(!this.visible_states){
            this.is_visible = true;
            return;
        }
        else{
            for(i=0, len=this.visible_states; i<len; i++){
                if(current_state == this.visible_states[i]){
                    this.is_visible = true;
                    return;
                }
            }
        }
        // Stick is not declared as visible in the current state.  Hide it.
        this.is_visible = false;
    },

    // hide: function(){
    //     this.is_visible = false;
    //     this.clear_all();
    // },

    handleTouchStart: function(x, y, touch_identifier){
        // Returns true if this joystick caught the event
        var event_caught = false;

        if(this.is_visible && Flynn.Util.distance(x, y, this.pos.x, this.pos.y) < this.capture_radius){
            this.touch_identifier = touch_identifier;
            this.in_use           = true;
            if(this.type=='stick' || this.type=='analog'){
                this.touchstart_pos   = {x:x, y:y};
                this.stick_offset     = {x:0, y:0};
            }
            else{
                // D-Pad
                this.handleTouchMove(x, y, touch_identifier);
            }
            event_caught = true;
        }
        return event_caught;
    },

    handleTouchEnd: function(x, y, touch_identifier){
        // Returns True if the touch end event caused this joystick to be released
        // (Signals input handler to clear all associated buttons)
        var released = false;
        if(this.is_visible && touch_identifier == this.touch_identifier){
            this.clear_all();
            released = true;
            if(this.type == 'analog'){
                this.analog_pos.x = 0;
                this.analog_pos.y = 0;
            }
        }
        return(released);
    },

    handleTouchMove: function(x, y, touch_identifier){
        if(this.is_visible && touch_identifier == this.touch_identifier){
            var touch_offset_v, normalized_v, offset_length;

            if(this.type == 'stick' || this.type == 'analog'){
                touch_offset_v = new Victor(x-this.touchstart_pos.x, y-this.touchstart_pos.y);
                normalized_v = touch_offset_v.clone().normalize();
                offset_length = touch_offset_v.length();

                if(offset_length > this.limit_radius){
                    touch_offset_v = normalized_v.clone().multiply(new Victor(this.limit_radius, this.limit_radius));
                    offset_length = this.limit_radius;
                }

                this.stick_offset.x = touch_offset_v.x;
                this.stick_offset.y = touch_offset_v.y;

                if(this.type == 'analog'){
                    this.analog_pos.x = touch_offset_v.x / this.limit_radius;
                    this.analog_pos.y = touch_offset_v.y / this.limit_radius;
                }
                else{
                    if(offset_length > this.deadzone_radius){
                        this.buttons.down.pressed  = (normalized_v.y >  this.theshold);
                        this.buttons.up.pressed    = (normalized_v.y < -this.theshold);
                        this.buttons.right.pressed = (normalized_v.x >  this.theshold);
                        this.buttons.left.pressed  = (normalized_v.x < -this.theshold);
                    }
                    else{
                        this.buttons.down.pressed  = false;
                        this.buttons.up.pressed    = false;
                        this.buttons.right.pressed = false;
                        this.buttons.left.pressed  = false;
                    }
                }
            }
            else{
                // D-Pad
                touch_offset_v = new Victor(x-this.pos.x, y-this.pos.y);
                normalized_v = touch_offset_v.clone().normalize();
                offset_length = touch_offset_v.length();
                
                if(  (offset_length > this.deadzone_radius)
                   && (offset_length < this.limit_radius)){
                    this.buttons.down.pressed  = (normalized_v.y >  this.theshold);
                    this.buttons.up.pressed    = (normalized_v.y < -this.theshold);
                    this.buttons.right.pressed = (normalized_v.x >  this.theshold);
                    this.buttons.left.pressed  = (normalized_v.x < -this.theshold);
                }
                else{
                    this.buttons.down.pressed  = false;
                    this.buttons.up.pressed    = false;
                    this.buttons.right.pressed = false;
                    this.buttons.left.pressed  = false;
                }
            }

        }
    },

    render: function(ctx){
        if(this.is_visible){
            var graphics = ctx.graphics;

            if(this.type == 'dpad'){
                // Draw d-pad cross
                var hw = this.radius*this.D_WITDH/2;  // Half-width
                var l = this.radius*this.D_LENGH;
                var x = this.pos.x;
                var y = this.pos.y;
                
                graphics.lineStyle(6, this.color, this.alpha);
                graphics.moveTo(x+hw, y-l);
                graphics.lineTo(x+hw, y-hw);
                graphics.lineTo(x+l, y-hw);
                graphics.lineTo(x+l, y+hw);
                graphics.lineTo(x+hw, y+hw);
                graphics.lineTo(x+hw, y+l);
                graphics.lineTo(x-hw, y+l);
                graphics.lineTo(x-hw, y+hw);
                graphics.lineTo(x-l, y+hw);
                graphics.lineTo(x-l, y-hw);
                graphics.lineTo(x-hw, y-hw);
                graphics.lineTo(x-hw, y-l);
                graphics.lineTo(x+hw, y-l);
            }
            else{
                // Draw thick stick head home position circle
                graphics.lineStyle(6, this.color, this.alpha);
                graphics.drawCircle(
                    this.pos.x,
                    this.pos.y,
                    this.radius * this.INNER_RADIUS_RATIO);
            }
            if(this.type == 'stick'){
                // Draw 8 pos region lines
                var i, angle, cos, sin;

                graphics.lineStyle(1, this.color, this.alpha);
                for(i=0; i<8; i++){
                    angle = Math.PI/4 * i + Math.PI/8;
                    cos = Math.cos(angle);
                    sin = Math.sin(angle);
                    graphics.moveTo(
                        cos * (this.radius * this.INNER_RADIUS_RATIO + 3) + this.pos.x,
                        sin * (this.radius * this.INNER_RADIUS_RATIO + 3) + this.pos.y);
                    graphics.lineTo(
                        cos * (this.radius - 1) + this.pos.x,
                        sin * (this.radius - 1) + this.pos.y);
                }
            }

            // Draw thin outer bound circle
            graphics.lineStyle(2, this.color, this.alpha);
            ctx.graphics.drawCircle(this.pos.x, this.pos.y, this.radius);

            if(this.in_use && (this.type=='stick' || this.type=='analog')){
                // Draw thick stick head current position circle
                graphics.lineStyle(6, this.color, this.alpha);
                ctx.graphics.drawCircle(
                    this.pos.x + this.stick_offset.x,
                    this.pos.y + this.stick_offset.y, 
                    this.radius * this.INNER_RADIUS_RATIO); 
            }
        }
    },
});

}()); // "use strict" wrapper