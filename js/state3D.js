var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.State3D = Flynn.State.extend({
    ROTATE_SPEED: Math.PI/(60 * 6),
    CAMERA_DISTANCE: 80,
    CAMERA_SPEED: Math.PI/(60 * 8),
    CUBE_COLORS:[
        Flynn.Colors.YELLOW,
        Flynn.Colors.GREEN,
        Flynn.Colors.BLUE,
        Flynn.Colors.RED,
        // Flynn.Colors.MAGENTA,
        // Flynn.Colors.DODGERBLUE,
        // Flynn.Colors.CYAN,
        // Flynn.Colors.LIGHTBLUE,
        // Flynn.Colors.ORANGE,
    ],
    CUBE_DISTANCE: 15,
    CUBE_SIZE: 2,
    NUM_CUBES: 80,

    init: function() {
        var i, x, drone_type, info;
        this._super();
        this.meshes = [];
        for(i=0; i<this.NUM_CUBES; i++){
            var color = i == 0 ? Flynn.Colors.WHITE :  Flynn.Util.randomChoice(this.CUBE_COLORS);
            var mesh = new Flynn._3DMeshCube('Cube', this.CUBE_SIZE, color);
            this.meshes.push(mesh);

            // Add rotational speed properties to the mesh
            mesh.rot_speed_x = 0;
            mesh.rot_speed_y = 0;

            if(i!=0){
                mesh.Position = new BABYLON.Vector3(
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE,   this.CUBE_DISTANCE),
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE/2, this.CUBE_DISTANCE/2),
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE,   this.CUBE_DISTANCE)
                    );
                mesh.rot_speed_x = Flynn.Util.randomFromInterval(0, this.ROTATE_SPEED);
                mesh.rot_speed_y = Flynn.Util.randomFromInterval(0, this.ROTATE_SPEED);
            }
        }
        this.camera = new Flynn._3DCamera();
        this.camera.Position =  new BABYLON.Vector3(0, 0, 10);
        this.camera.Target = new BABYLON.Vector3(0, 0, 0);
        this.renderer = new Flynn._3DRenderer(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, {near:70, far:100});
        this.camera_angle = 0;

        // Spin the center cube a bit
        this.meshes[0].Rotation.x = Math.PI/8;
        this.meshes[0].Rotation.y = Math.PI/8;
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
