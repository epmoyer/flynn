(function () { "use strict"; 
    
Flynn.Polygon = Class.extend({

    init: function(p, color, scale, position){
        if(typeof(position)==='undefined'){
            position={x:100, y:100, is_world:false};
        }
        if(typeof(scale)==='undefined'){
            scale=3;
        }
        this.color = color || Flynn.Colors.WHITE;
        this.position = position;

        this.points = p.slice(0);
        this.pointsMaster = p.slice(0);
        
        // Allow a boudary region polygon to be substituted for collision detection.
        this.bounding_enabled = false;
        this.bounding_visible = false;
        this.points_bounding = null;
        this.points_bounding_master = null;
        this.points_bounding_dirty = true;

        this.angle = 0;
        this.scale = scale;
        this.visible = true;
        this.setAngle(this.angle);
    },

    setBoundingPoly: function(points){
        // Enable bounding polygon (for collision detection)
        this.points_bounding_master = points.slice(0);
        this.points_bounding = points.slice(0);
        this.bounding_enabled = true;

        for(var i=0, len=this.points_bounding_master.length; i<len; i+=2){
            var x = this.points_bounding_master[i];

            if(x==Flynn.PEN_COMMAND){
                throw "Bounding poly cannot contain PEN_COMMAND.";
            }
        }
    },

    setAngle: function(theta){
        this.angle = theta;
        var c = Math.cos(theta);
        var s = Math.sin(theta);

        for(var i=0, len=this.pointsMaster.length; i<len; i+=2){
            var x = this.pointsMaster[i];
            var y = this.pointsMaster[i+1];

            if(x==Flynn.PEN_COMMAND){
                // Preserve pen commands
                this.points[i] = x;
                this.points[i+1] = y;
            }
            else{
                this.points[i] = (c*x - s*y) * this.scale;
                this.points[i+1] = (s*x + c*y) * this.scale;
            }
        }
        this.points_bounding_dirty = true;
    },

    setScale: function(c){
        this.scale = c;
        this.setAngle(this.angle);
        this.points_bounding_dirty = true;
    },

    updateBoundingPoly: function(){
        if(this.points_bounding_dirty){
            this.points_bounding_dirty = false;

            var c = Math.cos(this.angle);
            var s = Math.sin(this.angle);

            for(var i=0, len=this.points_bounding_master.length; i<len; i+=2){
                var x = this.points_bounding_master[i];
                var y = this.points_bounding_master[i+1];

                this.points_bounding[i] = (c*x - s*y) * this.scale;
                this.points_bounding[i+1] = (s*x + c*y) * this.scale;
            }
        }
    },


    /**
     * Useful point in polygon check, taken from:
     * http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
     *
     * @param  {number}  x test x coordinate
     * @param  {number}  y test y coordinate
     * @return {Boolean}   result from check
     */
    hasPoint: function(x, y) {
        var c = false;
        var p;
        var pos_x, pos_y;
        if(!this.bounding_enabled){
            p=this.points;
        }
        else{
            this.updateBoundingPoly();
            p=this.points_bounding;
        }

        pos_x = this.position.x;
        pos_y = this.position.y;

        var len = p.length;
        var i, j, px1, px2, py1, py2;

        // doing magic!
        for (i = 0, j = len-2; i < len; i += 2) {
            px1 = p[i] + pos_x;
            px2 = p[j] + pos_x;

            py1 = p[i+1] + pos_y;
            py2 = p[j+1] + pos_y;

            if (
                ( py1 > y != py2 > y ) &&
                ( x < (px2-px1) * (y-py1) / (py2-py1) + px1 )
            ) {
                c = !c;
            }
            j = i;
        }
        return c;
    },

    is_colliding: function(target_poly){
        // Test for collision with another polygon.
        // This is a lossy check.  It checks only whether the vertices of the 
        // poygon appear within this polygon, which is sufficient for game collision detection
        // between similar sized polygons.  It is possible to consruct polygons with long
        // appendages which can overlap withoug triggering collisioin detection.  Exhaustive 
        // general-case detection of edge intesection is not worth the performance hit.
        var i, len, pos_x, pos_y;

        if (!this.visible){
            return false;
        }
        pos_x = this.position.x;
        pos_y = this.position.y;
        for(i=0, len=this.points.length-2; i<len; i+=2){

            if (target_poly.hasPoint(
                    this.points[i]   + pos_x, 
                    this.points[i+1] + pos_y
                )){
                return true;
            }
        }
        return false;
    },

    render: function(ctx){
        if(!this.visible){
            return;
        }

        var vector_color = this.color;
        var points_x, points_y;
        var draw_x, draw_y;

        if(this.position.is_world){
            // Position is in world coordinates
            draw_x = this.position.x-Flynn.mcp.viewport.x;
            draw_y = this.position.y-Flynn.mcp.viewport.y;
        }
        else{
            // Position is in screen coordinates
            draw_x = this.position.x;
            draw_y = this.position.y;
        }

        ctx.vectorStart(vector_color);
        var pen_up = false;
        for (var i=0, len=this.points.length; i<len; i+=2){
            if(this.points[i] == Flynn.PEN_COMMAND){
                if(this.points[i+1] == Flynn.PEN_UP){
                    pen_up = true;
                }
                else{
                    vector_color = Flynn.ColorsOrdered[this.points[i+1] - Flynn.PEN_COLOR0];
                    ctx.vectorEnd();
                    ctx.vectorStart(vector_color);
                    if(i>0){
                        ctx.vectorMoveTo(points_x+draw_x, points_y+draw_y);
                    }
                }
            }
            else{
                points_x = this.points[i];
                points_y = this.points[i+1];
                if(i===0 || pen_up){
                    ctx.vectorMoveTo(points_x+draw_x, points_y+draw_y);
                    pen_up = false;
                }
                else {
                    ctx.vectorLineTo(points_x+draw_x, points_y+draw_y);
                }
            }
        }
        ctx.vectorEnd();

        // Draw bounding polygon (if enabled for devlopment debug)
        if(this.bounding_visible){
            this.updateBoundingPoly();
            vector_color=(Flynn.Colors.GRAY);
            pen_up = true;
            ctx.vectorStart(vector_color);
            for (i=0, len=this.points_bounding.length; i<len; i+=2){
                points_x = this.points_bounding[i];
                points_y = this.points_bounding[i+1];
                if(i===0 || pen_up){
                    ctx.vectorMoveTo(points_x+draw_x, points_y+draw_y);
                    pen_up = false;
                }
                else {
                    ctx.vectorLineTo(points_x+draw_x, points_y+draw_y);
                }
            }
            ctx.vectorEnd();
        }
    },

});

}()); // "use strict" wrapper