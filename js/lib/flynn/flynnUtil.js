(function () { "use strict";

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
        //       B_v          Victor    Target position vector
        //       u_v          Victor    Target velocity vector
        //       A_v          Victor    Gun position vector
        //       gun_velocity number    Gun velocity
        //   
        //    Returns:
        //    {
        //       perfect:    Boolean   (true if a perfect solution was possible.  Otherwise a "near" solution will be returned)
        //       velocity_v: Victor    (solution velocity vector)
        //    }
        //
        //  Input and output vectors are 2d victor.js objects (http://victorjs.org/)
        //
        //  Method is described by http://danikgames.com/blog/how-to-intersect-a-moving-target-in-2d/
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

    randomFromInterval: function(min, max){
        return Math.random() * (max - min) + min;
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

    is_mobile_browser: function(){
        // Returns true if running on a mobile browser.  Does not include tablets.
        // From: http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    },

    logish: function(value, min, max, power){
        var normalized = (value-min)/(max-min);
        return(Math.pow(normalized, power)*(max-min) + min);
    },

    event_simulator: {
        // Issues a simulated event to a dom element.
        // Adapted from http://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript/6158050#6158050

        simulate: function(element, eventName)
        {
            var sim = Flynn.Util.event_simulator;
            var options = sim.extend(sim.defaultOptions, arguments[2] || {});
            var oEvent, eventType = null;

            for (var name in sim.eventMatchers)
            {
                if (sim.eventMatchers[name].test(eventName)) { eventType = name; break; }
            }

            if (!eventType)
                throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

            if (document.createEvent)
            {
                oEvent = document.createEvent(eventType);
                if (eventType == 'HTMLEvents')
                {
                    oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                }
                else
                {
                    oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                    options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
                }
                element.dispatchEvent(oEvent);
            }
            else
            {
                options.clientX = options.pointerX;
                options.clientY = options.pointerY;
                var evt = document.createEventObject();
                oEvent = sim.extend(evt, options);
                element.fireEvent('on' + eventName, oEvent);
            }
            return element;
        },

        extend: function(destination, source) {
            for (var property in source)
              destination[property] = source[property];
            return destination;
        },

        eventMatchers: {
            'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
            'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
        },

        defaultOptions: {
            pointerX: 0,
            pointerY: 0,
            button: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            bubbles: true,
            cancelable: true
        }

    },


};

}()); // "use strict" wrapper