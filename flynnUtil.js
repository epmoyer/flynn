function flynnGetUrlValue(VarSearch){
    var SearchString = window.location.search.substring(1);
    var VariableArray = SearchString.split('&');
    for(var i = 0; i < VariableArray.length; i++){
        var KeyValuePair = VariableArray[i].split('=');
        if(KeyValuePair[0] == VarSearch){
            return KeyValuePair[1];
        }
    }
}

function flynnHexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function flynnComponentToHex(c) {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function flynnRgbToHex(r, g, b) {
    return "#" + flynnComponentToHex(r) + flynnComponentToHex(g) + flynnComponentToHex(b);
}

function flynnRgbOverdirve(rgb, overdrive) {
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
}

function flynnUtilAngleBound2Pi(angle){
	var boundAngle = angle % (Math.PI * 2);
	if(boundAngle<0){
		boundAngle += (Math.PI * 2);
	}
	return (boundAngle);
}

function flynnMinMaxBound(value, min, max){
    if (value<min){
        return min;
    } else if (value>max){
        return max;
    }
    return value;
}

function flynnProximal(distance, a, b){
    return Math.abs(a-b) <= distance;
}

function flynnInterceptSolution(B_v, u_v, A_v, gun_velocity){
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
        // console.log("flynnInterceptSolution: No solution.");
    }

    // Get vj by multiplying it's magnitude with the unit vector AB
    var vj_v = AB_v.clone().multiply(new Victor(vj_magnitude, vj_magnitude));

    // Add vj and vi to get v
    solution.velocity_v = vj_v.add(vi_v);

    return solution;
}