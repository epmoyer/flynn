Flynn.Polygon = Class.extend({

	init: function(p, color){
		if(typeof(color)==='undefined'){
			color = Flynn.Colors.WHITE;
		}

		this.color = color;
		//console.log(this.color);
		this.points = p.slice(0);
		this.pointsMaster = p.slice(0);
		this.angle = 0;
		this.scale = 1;
		this.setAngle(this.angle);
	},

	setAngle: function(theta){
		this.angle = theta;
		var c = Math.cos(theta);
		var s = Math.sin(theta);

		for(var i=0, len=this.pointsMaster.length; i<len; i+=2){
			var x = this.pointsMaster[i];
			var y = this.pointsMaster[i+1];

			//console.log(">>");
			//console.log(c, s, x, y, (c*x - s*y), (s*x + c*y));

			this.points[i] = (c*x - s*y) * this.scale;
			this.points[i+1] = (s*x + c*y) * this.scale;
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
	}
});