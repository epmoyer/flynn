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
        this.velocity = {x:0, y:0};
        this.angular_velocity = 0;

        this.points = p.slice(0);
        this.pointsMaster = p.slice(0);
        this.angle = 0;
        this.scale = scale;
        this.setAngle(this.angle);
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
    },

    setScale: function(c){
        this.scale = c;
        this.setAngle(this.angle);
    },


    /**
     * Useful point in polygon check, taken from:
     * http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
     *
     * @param  {number} ox offset x coordinate
     * @param  {number} oy offset y coordinate
     * @param  {number}  x test x coordinate
     * @param  {number}  y test y coordinate
     * @return {Boolean}   result from check
     */
    hasPoint: function(ox, oy, x, y) {
        var c = false;
        var p = this.points;
        var len = p.length;

        // doing magic!
        for (var i = 0, j = len-2; i < len; i += 2) {
            var px1 = p[i] + ox;
            var px2 = p[j] + ox;

            var py1 = p[i+1] + oy;
            var py2 = p[j+1] + oy;

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

    render: function(ctx){
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
    },

});