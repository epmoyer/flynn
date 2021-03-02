(function () {
    'use strict';

    Flynn.Util = {
        getUrlValue: function (VarSearch) {
            const SearchString = window.location.search.substring(1);
            const VariableArray = SearchString.split('&');
            for (let i = 0; i < VariableArray.length; i++) {
                const KeyValuePair = VariableArray[i].split('=');
                if (KeyValuePair[0] == VarSearch) {
                    return KeyValuePair[1];
                }
            }
        },

        getUrlFlag: function (VarSearch) {
            const SearchString = window.location.search.substring(1);
            const VariableArray = SearchString.split('&');
            for (let i = 0; i < VariableArray.length; i++) {
                const KeyValuePair = VariableArray[i].split('=');
                if (KeyValuePair[0] == VarSearch) {
                    return true;
                }
            }
            return false;
        },

        hexToRgb: function (hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
                ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                }
                : null;
        },

        componentToHex: function (c) {
            const hex = Math.floor(c).toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        },

        defaultTrue: function (value) {
        // For use in parsing default arguments.
        // The pattern..
        //    mufunc(ops){
        //       opts       = opts     || {};
        //       this.foo   = opts.foo || true;
        //       this.bar   = opts.bar || false;
        //    }
        // ..works for this.bar but not for this.foo.  If you try to pass
        // false to foo, it will become true.  Instead, use defaultTrue() for
        // arguments which should default to true like..
        //    mufunc(ops){
        //       opts       = opts     || {};
        //       this.foo   = Flynn.Util.defaultTrue(opts.foo);
        //       this.bar   = opts.bar || false;
        //    }
            if (typeof value === 'undefined') {
                return true;
            }
            return (value);
        },

        defaultArg: function (value, default_value) {
        // For use in parsing default arguments.
            return value == undefined ? default_value : value;
        },

        defaultText: function (value, default_text) {
        // For use in parsing default arguments.
        // The pattern..
        //    mufunc(ops){
        //       opts       = opts.text || "default text"
        // ..would replace a blank value of opts.text with the default.
        //   instead we only wish to replace the text if null or undefined.
        //   using...
        //    mufunc(ops){
        //       this.text   = Flynn.Util.defaultText(opts.text, "default text");
        //    }
            if (value == undefined || value == null) {
                return (default_text);
            }
            return (value);
        },

        rgbToHex: function (r, g, b) {
        // Convert color from r, g, b components to hex string of the form "#RRGGBB"
        // Arguments:
        //     r: red   (0-255)
        //     g: green (0-255)
        //     b: blue  (0-255)
        // Returns:
        //     Hex color string of the form "#RRGGBB"
            return '#' + Flynn.Util.componentToHex(r) + Flynn.Util.componentToHex(g) + Flynn.Util.componentToHex(b);
        },

        heatmap: function (magnitude) {
        // Convert an 0.0 to 1.0 value to a "#RRGGBB" heat map
        // Low values are cool (blue).  High values are hot (red)
            let r, g, b;
            magnitude = Flynn.Util.minMaxBound(magnitude, 0, 1);
            r = 0;
            b = 0;
            if (magnitude >= 0.5) {
                r = 255 * (magnitude - 0.5) * 2;
                g = 255 * (-magnitude + 1) * 2;
            }
            if (magnitude < 0.5) {
                b = 255 * (-magnitude + 0.5) * 2;
                g = 255 * (magnitude) * 2;
            }
            // Normalize brightness to pin the highest color component at 255
            const max = Math.max(r, g, b);
            return Flynn.Util.rgbToHex(255 * r / max, 255 * g / max, 255 * b / max);
        },

        colorOverdrive: function (color, increase) {
        // Takes a color and increases it by some amount.  Once a color channel saturates, the color
        // will overdrive towards pure white.  This color transformation is used to determine the color
        // of vector vertices, to simulate the effect of the CRT beam pausing at vertices.
        // Arguments:
        //     color: A color of the form "#FF1200"
        //     increase: A brightness increase in the range (0.0 to 2.0)
            let gain, rgb, max_brightness, white_distance, overdrive_gain, saturated_color;

            rgb = Flynn.Util.hexToRgb(color);
            max_brightness = Math.max(rgb.r, rgb.g, rgb.b) / 255;
            white_distance = 1.0 - max_brightness;

            const scale_factor = 0.20;
            increase = increase * (scale_factor + ((1 - scale_factor) * max_brightness));

            if (max_brightness == 0) {
            // Started with black.  Always return black for overdrive of black.
                return ('#000000');
            }
            if (increase <= white_distance) {
            // Increase does not saturate any color channel
                gain = (max_brightness + increase) / max_brightness;
                rgb.r = rgb.r * gain;
                rgb.g = rgb.g * gain;
                rgb.b = rgb.b * gain;
                rgb.r = Math.min(rgb.r, 255);
                rgb.g = Math.min(rgb.g, 255);
                rgb.b = Math.min(rgb.b, 255);
                return (Flynn.Util.rgbToHex(rgb.r, rgb.g, rgb.b));
            }

            // Increase saturates a color channel

            // Make saturated color fist
            gain = (max_brightness + white_distance) / max_brightness;
            rgb.r = rgb.r * gain;
            rgb.g = rgb.g * gain;
            rgb.b = rgb.b * gain;
            rgb.r = Math.min(rgb.r, 255);
            rgb.g = Math.min(rgb.g, 255);
            rgb.b = Math.min(rgb.b, 255);

            overdrive_gain = Math.min(increase - white_distance, 1.0);
            saturated_color = Flynn.Util.rgbToHex(rgb.r, rgb.g, rgb.b);
            return (Flynn.Util.shadeColor(saturated_color, overdrive_gain));
        },

        angleBound2Pi: function (angle) {
            let boundAngle = angle % (Math.PI * 2);
            if (boundAngle < 0) {
                boundAngle += (Math.PI * 2);
            }
            return (boundAngle);
        },

        minMaxBound: function (value, min, max) {
            if (value < min) {
                return min;
            }
            if (value > max) {
                return max;
            }
            return value;
        },

        minMaxBoundWrap: function (value, min, max) {
            if (value < min) {
                return max;
            }
            if (value > max) {
                return min;
            }
            return value;
        },

        proximal: function (distance, a, b) {
            return Math.abs(a - b) <= distance;
        },

        distance: function (x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        },

        interceptSolution: function (B_v, u_v, A_v, gun_velocity) {
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
            const solution = { perfect: false, velocity_v: null };

            // Find normalized vector AB (Gun A to target B)
            const AB_v = B_v.clone().subtract(A_v).normalize();
            // Project u (target velocity) onto AB
            const uDotAB = AB_v.dot(u_v);
            const uj_v = AB_v.clone().multiply(new Victor(uDotAB, uDotAB));

            // Subtract uj from u to get ui
            const ui_v = u_v.clone().subtract(uj_v);

            // Set vi to ui (for clarity)
            const vi_v = ui_v.clone();

            // Calculate the magnitude of vj
            const vi_magnitude = vi_v.magnitude();
            const vj_magnitude_squared = gun_velocity * gun_velocity - vi_magnitude * vi_magnitude;
            let vj_magnitude = 0;
            if (vj_magnitude_squared > 0) {
                vj_magnitude = Math.sqrt(vj_magnitude_squared);
            } else {
            // console.log("Flynn.Util.interceptSolution: No solution.");
            }

            // Get vj by multiplying it's magnitude with the unit vector AB
            const vj_v = AB_v.clone().multiply(new Victor(vj_magnitude, vj_magnitude));

            // Add vj and vi to get v
            solution.velocity_v = vj_v.add(vi_v);

            return solution;
        },

        zeroPad: function (num, places) {
            const zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join('0') + num;
        },

        ticksToTime: function (ticks) {
            const time_in_seconds = (ticks / 60);
            const hundredths = Math.floor((time_in_seconds - Math.floor(time_in_seconds)) * 100);
            const minutes = Math.floor(time_in_seconds / 60);
            const seconds = Math.floor((ticks - (minutes * 60 * 60)) / 60);
            return (
                Flynn.Util.zeroPad(minutes, 2) + ':' +
            Flynn.Util.zeroPad(seconds, 2) + '.' +
            Flynn.Util.zeroPad(hundredths, 2)
            );
        },

        randomAngle: function () {
            return Math.random() * Math.PI * 2;
        },

        randomIntFromInterval: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        randomFromInterval: function (min, max) {
            return Math.random() * (max - min) + min;
        },

        randomChoice: function (array) {
            return array[this.randomIntFromInterval(0, array.length - 1)];
        },

        randomShuffleInPlace: function (array) {
            let currentIndex = array.length; let temporaryValue; let randomIndex;

            // While there remain elements to shuffle...
            while (currentIndex !== 0) {
            // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        },

        // Color shade / blend transformation
        // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        shadeBlend: function (p, c0, c1) {
            const n = p < 0 ? p * -1 : p; const u = Math.round; const w = parseInt;
            if (c0.length > 7) {
                var f = c0.split(','); var t = (c1 || (p < 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)')).split(','); const R = w(f[0].slice(4)); const G = w(f[1]); const B = w(f[2]);
                return 'rgb(' + (u((w(t[0].slice(4)) - R) * n) + R) + ',' + (u((w(t[1]) - G) * n) + G) + ',' + (u((w(t[2]) - B) * n) + B) + ')';
            } else {
                var f = w(c0.slice(1), 16); var t = w((c1 || (p < 0 ? '#000000' : '#FFFFFF')).slice(1), 16); const R1 = f >> 16; const G1 = f >> 8 & 0x00FF; const B1 = f & 0x0000FF;
                return '#' + (0x1000000 + (u(((t >> 16) - R1) * n) + R1) * 0x10000 + (u(((t >> 8 & 0x00FF) - G1) * n) + G1) * 0x100 + (u(((t & 0x0000FF) - B1) * n) + B1)).toString(16).slice(1);
            }
        },

        // Color shade / blend transformation
        // From http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        // (original was called "ShadeColor2")
        //
        // Arguments:
        //    color: rgb color string of the form "#01ffce"
        //    percentage: float range (-1.0, 1.0)
        //        Positive values brighten the color toward white.
        //        Negative values darken the color toward black
        shadeColor: function (color, percent) {
            const f = parseInt(color.slice(1), 16); const t = percent < 0 ? 0 : 255; const p = percent < 0 ? percent * -1 : percent; const R = f >> 16; const G = f >> 8 & 0x00FF; const B = f & 0x0000FF;
            return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        },

        is_mobile_browser: function () {
        // Returns true if running on a mobile browser.  Does not include tablets.
        // From: http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        // Originally From: http://detectmobilebrowsers.com
            let check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        },

        is_mobile_or_tablet_browser: function () {
        // Returns true if running on a mobile or tablet browser.
        // From: http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        // Originally From: http://detectmobilebrowsers.com
            let check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        },

        logish: function (value, min, max, power) {
            const normalized = (value - min) / (max - min);
            return (Math.pow(normalized, power) * (max - min) + min);
        },

        event_simulator: {
        // Issues a simulated event to a dom element.
        // Adapted from http://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript/6158050#6158050

            simulate: function (element, eventName) {
                const sim = Flynn.Util.event_simulator;
                const options = sim.extend(sim.defaultOptions, arguments[2] || {});
                let oEvent; let eventType = null;

                for (const name in sim.eventMatchers) {
                    if (sim.eventMatchers[name].test(eventName)) { eventType = name; break; }
                }

                if (!eventType) { throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported'); }

                if (document.createEvent) {
                    oEvent = document.createEvent(eventType);
                    if (eventType == 'HTMLEvents') {
                        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                    } else {
                        oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
                    }
                    element.dispatchEvent(oEvent);
                } else {
                    options.clientX = options.pointerX;
                    options.clientY = options.pointerY;
                    const evt = document.createEventObject();
                    oEvent = sim.extend(evt, options);
                    element.fireEvent('on' + eventName, oEvent);
                }
                return element;
            },

            extend: function (destination, source) {
                for (const property in source) { destination[property] = source[property]; }
                return destination;
            },

            eventMatchers: {
                HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
                MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
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

        make_regular_polygon_points: function (num_sides, radius) {
        // Returns an array of points [x0, y0, x1, y1, ... xn, yn] representing a regular polygon
        // (suitable for passing to Flynn.Polygon to create a Polygon object)
        // Args:
        //     num_sides: The number of sides (must be 3 or greater)
        //     radius: The radius of the polygon vertices
        //
            if (num_sides < 3) {
                throw 'make_regular_polygon_points(): num_sides must be 3 or greater';
            }

            let points, angle;

            points = [];
            for (angle = 0; angle <= Math.PI * 2; angle += Math.PI * 2 / num_sides) {
                points.push(Math.cos(angle) * radius);
                points.push(Math.sin(angle) * radius);
            }
            return points;
        },

        is_colliding: function (object_1, object_2) {
        // Returns True if the two objects are colling.
        //
        // Args:
        //    object_1: An object
        //    object_2: An object
        //
        // Both objects must have the following properties:
        //    .position instance of Victor
        //    .radius
        //
            return object_1.position.distance(object_2.position) < object_1.radius + object_2.radius;
        },

        resolve_collision: function (object_1, object_2) {
        // Update the velocity and position of two colliding objects
        //
        // Args:
        //    object_1: An object
        //    object_2: An object
        //
        // Both objects must have the following properties:
        //    .position instance of Victor
        //    .velocity instance of Victor
        //    .radius
        //
            const RESTITUTION = 1.0;

            // Algorithm from:
            // https://stackoverflow.com/questions/345838/ball-to-ball-collision-detection-and-handling

            // Get the mtd (minimum translation distance to bush the objects
            // apart after intersecting)
            const delta = object_1.position.clone().subtract(object_2.position);
            const distance = delta.length();
            const mtd = delta.clone().multiplyScalar((object_1.radius + object_2.radius - distance) / distance);

            // resolve intersection --
            // inverse mass quantities
            const im1 = 1 / object_1.mass;
            const im2 = 1 / object_2.mass;

            // push-pull them apart based off their mass
            object_1.position.add(mtd.clone().multiplyScalar(im1 / (im1 + im2)));
            object_2.position.subtract(mtd.clone().multiplyScalar(im2 / (im1 + im2)));

            // impact speed
            const velocity = (object_1.velocity.clone().subtract(object_2.velocity));
            const velocity_normal = velocity.dot(mtd.clone().normalize());

            // If the objects are moving toward each other
            if (velocity_normal < 0) {
            // Collision impulse
                const impulse = (-(1 + RESTITUTION) * velocity_normal) / (im1 + im2);
                const impulse_v = mtd.clone().normalize().multiplyScalar(impulse);

                object_1.velocity.add(impulse_v.clone().multiplyScalar(im1));
                object_2.velocity.subtract(impulse_v.clone().multiplyScalar(im2));
            }
        },

        doBoundsBounce: function (object, bounds, restitution) {
        // Bounce object at bounds edges
        //
        // Args:
        //    object: object to bounce
        //       Must have .position and .velocity (type: Victor)
        //    bounds:
        //       Rectangle bounds (type: Flynn.Rect)
        //    restitution:
        //       bounce restitution (0 to 1)
        // Returns:
        //    True if bounced, False if not.
            if (object.position.x < bounds.left + object.radius) {
                object.position.x = bounds.left + object.radius + (bounds.left + object.radius - object.position.x);
                object.velocity.x = -object.velocity.x * restitution;
                return true;
            } else if (object.position.x > bounds.right - object.radius) {
                object.position.x = bounds.right - object.radius - (object.position.x - (bounds.right - object.radius));
                object.velocity.x = -object.velocity.x * restitution;
                return true;
            }
            if (object.position.y < bounds.top + object.radius) {
                object.position.y = bounds.top + object.radius + (bounds.top + object.radius - object.position.y);
                object.velocity.y = -object.velocity.y * restitution;
                return true;
            } else if (object.position.y > bounds.bottom - object.radius) {
                object.position.y = bounds.bottom - object.radius - (object.position.y - (bounds.bottom - object.radius));
                object.velocity.y = -object.velocity.y * restitution;
                return true;
            }
            return false;
        },

        doBoundsWrap: function (object, bounds) {
        // Wrap object at bounds edges
        //
        // Args:
        //    object: object to bounce
        //       Must have .position and .velocity (type: Victor)
        //    bounds:
        //       Rectangle bounds (type: Flynn.Rect)
        //
            if (object.position.x < bounds.left) {
                object.position.x += bounds.width;
            } else if (object.position.x > bounds.right) {
                object.position.x -= bounds.width;
            }
            if (object.position.y < bounds.top) {
                object.position.y += bounds.height;
            } else if (object.position.y > bounds.bottom) {
                object.position.y -= bounds.height;
            }
        },

        parseColor: function (color, toNumber) {
        // Translate a color from ASCII format to hex number or vice versa
            if (toNumber === true) {
                if (typeof color === 'number') {
                    return (color | 0); // chop off decimal
                }
                if (typeof color === 'string' && color[0] === '#') {
                    color = color.slice(1);
                }
                return window.parseInt(color, 16);
            } else {
                if (typeof color === 'number') {
                // make sure our hexadecimal number is padded out
                    color = '#' + ('00000' + (color | 0).toString(16)).substr(-6);
                }
                return color;
            }
        },

        validateProperties: function (target, required_keys, defaults) {
        // - Validate that object has all required keys
        // - Validate that object has no unexpected keys
        // - Apply defaults
        //
        // Arguments:
        //     target: The object to validate
        //     required_keys: List of strings
        //     defaults: Object containing key/value pairs
        //
            let i, key;

            const default_keys = Object.keys(defaults);
            const permitted_keys = required_keys.concat(default_keys);
            const target_keys = Object.keys(target);

            // Validate that object has all required keys
            for (i = 0; i < required_keys.length; i++) {
                key = required_keys[i];
                if (target_keys.indexOf(key) == -1) {
                    throw Error('Required key "' + key + '" not present in object.');
                }
            }

            // Validate that object has no unexpected keys
            for (i = 0; i < target_keys.length; i++) {
                key = target_keys[i];
                if (permitted_keys.indexOf(key) == -1) {
                    throw Error('Unexpected key "' + key + '" in object.');
                }
            }

            // Apply defaults
            for (i = 0; i < default_keys.length; i++) {
                key = default_keys[i];
                if (target_keys.indexOf(key) == -1) {
                    target[key] = defaults[key];
                }
            }
        },

    };

    Flynn.WrapUtil = Class.extend({

        init: function (bounds) {
        // bounds: Flynn.Rect

            this.bounds = bounds;
        },

        getRelativePosition: function (primary, secondary) {
        // Given a two object positions (primary and secondary),
        // return a vector pointing from primary to secondary
        // along the shortest path when taking into consideration
        // wrap-around at the world boundaries.

            const quadrant_origin_x = primary.x - this.bounds.width / 2;
            const quadrant_origin_y = primary.y - this.bounds.height / 2;

            let quadrant_secondary_x = secondary.x - quadrant_origin_x;
            let quadrant_secondary_y = secondary.y - quadrant_origin_y;

            if (quadrant_secondary_x < 0) {
                quadrant_secondary_x += this.bounds.width;
            } else if (quadrant_secondary_x > this.bounds.width) {
                quadrant_secondary_x -= this.bounds.width;
            }

            if (quadrant_secondary_y < 0) {
                quadrant_secondary_y += this.bounds.height;
            } else if (quadrant_secondary_y > this.bounds.height) {
                quadrant_secondary_y -= this.bounds.height;
            }

            return new Victor(
                (quadrant_origin_x + quadrant_secondary_x) - primary.x,
                (quadrant_origin_y + quadrant_secondary_y) - primary.y
            );
        },

    });
}()); // "use strict" wrapper
