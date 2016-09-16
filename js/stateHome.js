if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateHome = Flynn.State.extend({

	init: function(mcp) {
		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;
		this.viewport_v = new Victor(0,0);
		this.gameClock = 0;

		this.polygons = [];
		this.polygons.push(new Flynn.Polygon(Game.Points.SHIP, Flynn.Colors.DODGERBLUE));
		this.polygons.push(new Flynn.Polygon(Game.Points.SHIPB, Flynn.Colors.RED));
		this.polygons.push(new Flynn.Polygon(Game.Points.POINTY_SHIP, Flynn.Colors.GREEN));
		this.polygons.push(new Flynn.Polygon(Game.Points.STAR_WING, Flynn.Colors.ORANGE));
		this.polygons.push(new Flynn.Polygon(Game.Points.ABSTRACT, Flynn.Colors.MAGENTA));
		this.polygons.push(new Flynn.Polygon(Game.Points.RESPAWN, Flynn.Colors.CYAN));
		var i;
		for (i=0; i<this.polygons.length; i++){
			this.polygons[i].setScale(3);
		}
	
	},

	handleInputs: function(input, paceFactor) {

		if(this.mcp.developerModeEnabled){
			// Metrics toggle
			if (input.virtualButtonIsPressed("dev_metrics")){
				this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
			}

			// Toggle DEV pacing mode slow mo
			if (input.virtualButtonIsPressed("dev_slow_mo")){
				this.mcp.toggleDevPacingSlowMo();
			}

			// Toggle DEV pacing mode fps 20
			if (input.virtualButtonIsPressed("dev_fps_20")){
				this.mcp.toggleDevPacingFps20();
			}
		}
	},

	update: function(paceFactor) {
		this.gameClock += paceFactor;
		var i;
		for (i=0; i<this.polygons.length; i++){
			this.polygons[i].setAngle(this.polygons[i].angle + Math.PI/60.0 * paceFactor * (1 + 0.2*i));
		}
	},

	render: function(ctx){
		ctx.clearAll();

		// Scores
		//ctx.vectorText(this.score, 3, 15, 15, null, Flynn.Colors.YELLOW);
		//ctx.vectorText(this.highscore, 3, this.canvasWidth - 6	, 15, 0 , FlynnColors.YELLOW);
		var text_x = 10
		var margin = 3;
		
		ctx.vectorText("HOME", 3, text_x, 11, null, Flynn.Colors.GREEN);
		ctx.vectorLine(margin, 37, this.canvasWidth-margin-1, 37, Flynn.Colors.GREEN);
		ctx.vectorRect(
			margin, 
			margin, 
			this.canvasWidth-2*margin,
			this.canvasHeight-2*margin,
			Flynn.Colors.GREEN);

		ctx.vectorText("POLYGONS", 1.5, text_x, 42, null, Flynn.Colors.YELLOW);

		var i;
		for (i=0; i<this.polygons.length; i++){
			ctx.drawPolygon(this.polygons[i], 40 + i*50, 80);
		}


	}
});