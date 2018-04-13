var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.State3D = Flynn.State.extend({
    ROTATE_SPEED: Math.PI/(60 * 6),
    CAMERA_DISTANCE: 40,
    CAMERA_SPEED: Math.PI/(60 * 3),
    CUBE_COLORS:[
        Flynn.Colors.MAGENTA,
        Flynn.Colors.DODGERBLUE,
        Flynn.Colors.CYAN,
        Flynn.Colors.GREEN,
        Flynn.Colors.LIGHTBLUE,
    ],
    CUBE_DISTANCE: 5,

    init: function() {
        var i, x, drone_type, info;
        this._super();
        this.cube = new Flynn._3DMeshCube('Cube', 2, Flynn.Colors.ORANGE);
        this.meshes = [
            this.cube
        ];
        for(i=1; i<10; i++){
            this.meshes.push(
                new Flynn._3DMeshCube('Cube', 2, Flynn.Util.randomChoice(this.CUBE_COLORS))
            );
            this.meshes[i].Position = new BABYLON.Vector3(
                Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE)
                );
            this.meshes[i].rot_speed_x = Flynn.Util.randomFromInterval(0, this.ROTATE_SPEED);
            this.meshes[i].rot_speed_y = Flynn.Util.randomFromInterval(0, this.ROTATE_SPEED);
        }
        this.camera = new Flynn._3DCamera();
        this.camera.Position =  new BABYLON.Vector3(0, 0, 10);
        this.camera.Target = new BABYLON.Vector3(0, 0, 0);
        this.renderer = new Flynn._3DRenderer(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

        this.cube.Position = new BABYLON.Vector3( 0,  0,  0);
        this.cube.rot_speed_x = 0;
        this.cube.rot_speed_y = 0;

        this.camera_angle = 0;
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);
    },

    update: function(elapsed_ticks) {
        var i;
        this.camera_angle += this.CAMERA_SPEED * elapsed_ticks;
        this.camera.Position =  new BABYLON.Vector3(
            Math.sin(this.camera_angle) * this.CAMERA_DISTANCE,
            0,
            Math.cos(this.camera_angle) * this.CAMERA_DISTANCE);

        for(i=0; i<this.meshes.length; i++){
            var mesh = this.meshes[i];
            mesh.Rotation.x += mesh.rot_speed_x * elapsed_ticks;
            mesh.Rotation.y += mesh.rot_speed_y * elapsed_ticks;
        }
        //this.cube.Rotation.x += this.ROTATE_SPEED;
        //this.cube.Rotation.y += this.ROTATE_SPEED;

    }, 

    render: function(ctx){
        var i;
        var left_margin = 8, scale = 1.5, top_margin = 5;
        var heading_color = Flynn.Colors.YELLOW;

        Game.render_page_frame(ctx);
        // ctx.vectorText(
        //     '3D RENDERING', 
        //     scale, null, Game.BOUNDS.bottom - 18, null, heading_color);

        this.renderer.render(ctx, this.camera, this.meshes);
    },
});

}()); // "use strict" wrapper
