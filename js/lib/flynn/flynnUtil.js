Flynn.Util = {
    getUrlValue: function(VarSearch){
        var SearchString = window.location.search.substring(1);
        var VariableArray = SearchString.split('&');
        for(var i = 0; i < VariableArray.length; i++){
            var KeyValuePair = VariableArray[i].split('=');
            if(KeyValuePair[0] == VarSearch){
                return KeyValuePair[1];
            }
        }
    },

    getUrlFlag: function(VarSearch){
        var SearchString = window.location.search.substring(1);
        var VariableArray = SearchString.split('&');
        for(var i = 0; i < VariableArray.length; i++){
            var KeyValuePair = VariableArray[i].split('=');
            if(KeyValuePair[0] == VarSearch){
                return true;
            }
        }
        return false;
    },

    hexToRgb: function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    componentToHex: function(c) {
        var hex = Math.floor(c).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    },

    rgbToHex: function(r, g, b) {
        return "#" + Flynn.Util.componentToHex(r) + Flynn.Util.componentToHex(g) + Flynn.Util.componentToHex(b);
    },

    rgbOverdirve: function(rgb, overdrive) {
        // Inputs:
        //   rgb:       Object with r,g,b components
        //   overdrive: Float between 0 and 1.
        // Returns an rgb object in with the color overdiven toward white.  Calling with an overdirve of 1.0 will return white.
        var rgb_retutn = {
            r: Math.floor(rgb.r + (255 - rgb.r)*overdrive),
            g: Math.floor(rgb.g + (255 - rgb.g)*overdrive),
            b: Math.floor(rgb.b + (255 - rgb.b)*overdrive),
        };
        return rgb_retutn;
    },

    angleBound2Pi: function(angle){
        var boundAngle = angle % (Math.PI * 2);
        if(boundAngle<0){
            boundAngle += (Math.PI * 2);
        }
        return (boundAngle);
    },

    minMaxBound: function(value, min, max){
        if (value<min){
            return min;
        } else if (value>max){
            return max;
        }
        return value;
    },

    proximal: function(distance, a, b){
        return Math.abs(a-b) <= distance;
    },

    distance: function(x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
    },

    interceptSolution: function(B_v, u_v, A_v, gun_velocity){
        // Returns a targeting solution object
        //    Input:
        //       B_v      Target position vector
        //       u_v      Target velocity vector
        //       A_v      Gun position vectorr
        //   
        //    perfect:    Boolean   (true if a perfect solution was possible.  Otherwise a "near" solution will be returned)
        //    velocity_v: Victor    (solution velocity vector)
        //
        //  Input and output vectors are 2d victor.js objects (http://victorjs.org/)
        //
        // Method is described by http://danikgames.com/blog/how-to-intersect-a-moving-target-in-2d/
        //
        var solution = {perfect:false, velocity_v:null};

        // Find normalized vector AB (Gun A to target B)
        var AB_v = B_v.clone().subtract(A_v).normalize();
        // Project u (target velocity) onto AB 
        var uDotAB = AB_v.dot(u_v);
        var uj_v = AB_v.clone().multiply(new Victor(uDotAB, uDotAB));

        // Subtract uj from u to get ui
        var ui_v = u_v.clone().subtract(uj_v);

        // Set vi to ui (for clarity)
        var vi_v = ui_v.clone();

        // Caclulate the magnitude of vj
        var vi_magnitude = vi_v.magnitude();
        var vj_magnitude_squared = gun_velocity * gun_velocity - vi_magnitude * vi_magnitude;
        var vj_magnitude = 0;
        if(vj_magnitude_squared > 0){
            vj_magnitude = Math.sqrt(vj_magnitude_squared);
        }
        else{
            // console.log("Flynn.Util.interceptSolution: No solution.");
        }

        // Get vj by multiplying it's magnitude with the unit vector AB
        var vj_v = AB_v.clone().multiply(new Victor(vj_magnitude, vj_magnitude));

        // Add vj and vi to get v
        solution.velocity_v = vj_v.add(vi_v);

        return solution;
    },

    zeroPad: function(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    },

    ticksToTime: function(ticks){
        var time_in_seconds = (ticks / 60);
        var hundredths = Math.floor((time_in_seconds - Math.floor(time_in_seconds)) * 100);
        var minutes = Math.floor(time_in_seconds / 60);
        var seconds = Math.floor((ticks - (minutes * 60 * 60)) / 60);
        return(
            Flynn.Util.zeroPad(minutes,2) + ':' +
            Flynn.Util.zeroPad(seconds,2) + '.' +
            Flynn.Util.zeroPad(hundredths,2)
            );
    },

    randomIntFromInterval: function(min,max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    },

    randomChoice: function(array)
    {
        return array[this.randomIntFromInterval(0, array.length-1)];
    },

    // Color shade / blend transformation
    // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    shadeBlend: function(p,c0,c1) {
        var n=p<0?p*-1:p,u=Math.round,w=parseInt;
        if(c0.length>7){
            var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
            return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
        }else{
            var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
            return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
        }
    },

};