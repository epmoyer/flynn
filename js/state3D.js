var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.State3D = Flynn.State.extend({
    ROTATE_SPEED: Math.PI/(60 * 5),

    init: function() {
        var i, x, drone_type, info;
        this._super();
        this.cube = new Flynn._3DMeshCube('Cube', 2, Flynn.Colors.ORANGE);
        this.meshes = [
            this.cube
        ];
        this.camera = new Flynn._3DCamera();
        this.camera.Position =  new BABYLON.Vector3(0, 0, 10);
        this.camera.Target = new BABYLON.Vector3(0, 0, 0);
        this.renderer = new Flynn._3DRenderer(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        var i;
        this.cube.Rotation.x += this.ROTATE_SPEED;
        this.cube.Rotation.y += this.ROTATE_SPEED;
    }, 

    render: function(ctx){
        var i;
        var left_margin = 8, scale = 1.5, top_margin = 5;
        var heading_color = Flynn.Colors.YELLOW;

        Game.render_page_frame(ctx);
        ctx.vectorText(
            '3D RENDERING', 
            scale, null, Game.BOUNDS.bottom - 18, null, heading_color);

        this.renderer.render(ctx, this.camera, this.meshes);
    },
});

}()); // "use strict" wrapper
