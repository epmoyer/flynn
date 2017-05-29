(function () { "use strict"; 

Flynn.monkeyPatchVictor = function(){
    // Monkey path new functionality into the victor.js module
    // See:
    //    http://victorjs.org
    //

    if(typeof Victor === 'undefined'){
        throw "Victor.js must be loaded before monkeyPatchVictor() is run."
    }

    /**
     * Creates a new instance from polar coordinates
     *
     * ### Examples:
     *     var vec1 = Victor.fromPolar(Math.PI/2, 7);
     *     var vec2 = Victor.fromPolar(-Math.PI);
     *
     *     vec1.toString();
     *     // => x:0, y:7
     *     vec2.toString();
     *     // => x:-1, y:0
     *
     * @name Victor.fromPolar
     * @param {Number} angle Polar angle
     * @param {Number} distance Polar distance (default: 1)
     * @return {Victor} The new instance
     * @api public
     */
    Victor.fromPolar = function(angle, distance){
        if (typeof distance === 'undefined') { distance = 1; }
        return new Victor(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance
        );
    };

    /**
     * Creates a vector with a random direction and specified magnitude
     *
     * ### Examples:
     *     var vec1 = Victor.randomDirection();
     *     var vec2 = Victor.randomDirection(100);
     *
     *     vec1.toString();
     *     // => x:-0.1779, y:0.98404
     *     vec1.toString();
     *     // => x:-69.407, y:71.990
     *
     * @name Victor.randomDirection
     * @param {Number} magnitude Vector magnitude (default: 1)
     * @return {Victor} The new instance
     * @api public
     */
    Victor.randomDirection = function (magnitude) {
        if (typeof magnitude === 'undefined') { magnitude = 1; }
        var angle = Math.random() * Math.PI * 2;
        return new Victor(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    };

    /**
     * If the magnitude is greater than max, scale the vector to have a magnitude of max
     *
     * ### Examples:
     *     var vec = Victor(10, 10).boundMagnitude(2)
     *
     *     vec.toString();
     *     // => x:1.414, y:1.414
     *
     * @name Victor.boundMagnitude
     * @param {Number} max The maximum value for magnitude
     * @return {Victor} `this` for chaining capabilities
     * @api public
     */
    Victor.prototype.boundMagnitude = function (max) {
        var magnitude = this.magnitude();
        if(magnitude > max){
            this.multiplyScalar(max / magnitude);
        }

        return this;
    };
};

}()); // "use strict" wrapper