var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.State3D = Flynn.State.extend({
    CAMERA_DISTANCE: 80,
    CAMERA_SPEED: Math.PI/(60 * 8),
    CUBE_COLORS:[
        Flynn.Colors.YELLOW,
        Flynn.Colors.GREEN,
        Flynn.Colors.BLUE,
        Flynn.Colors.RED,
    ],
    CUBE_DISTANCE: 15,
    CUBE_SIZE: 2,
    NUM_CUBES: 40,

    // Text meshes
    NUM_TEXTS: 40,
    TEXT_SIZE: 0.5,
    TEXT_DISTANCE: 15,

    init: function() {
        var i, j, color, mesh, text_mesh;
        this._super();

        this.meshes = [];
        for(i=0; i<this.NUM_CUBES; i++){
            color = i == 0 ? Flynn.Colors.WHITE :  Flynn.Util.randomChoice(this.CUBE_COLORS);
            mesh = new Flynn._3DMeshCube('Cube', this.CUBE_SIZE, color);
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
                mesh.Rotation.x = Flynn.Util.randomFromInterval(0, Math.PI);
                mesh.Rotation.y = Flynn.Util.randomFromInterval(0, Math.PI);

                // Add text to one face of box
                text_mesh = new Flynn._3DMeshText('Text', Flynn.mcp.canvas.ctx, this.TEXT_SIZE, color, "TEXT", Flynn.Font.Normal );
                this.meshes.push(text_mesh);
                var offset = new BABYLON.Vector3(0, this.CUBE_SIZE/2, 0);
                for(j=0; j<text_mesh.Vertices.length; j++){
                    text_mesh.Vertices[j] = text_mesh.Vertices[j].add(offset);
                }
                text_mesh.Position = mesh.Position;
                text_mesh.Rotation = mesh.Rotation;

            }
        }

        this.camera = new Flynn._3DCamera();
        this.camera.Position =  new BABYLON.Vector3(0, 0, 10);
        this.camera.Target = new BABYLON.Vector3(0, 0, 0);
        this.camera_angle = 0;

        this.renderers = [
            {   name:"FOG (GRADUAL)",
                renderer: new Flynn._3DRenderer({fog_distance:{near:70, far:100}})},
            {   name:"FOG (GRADUAL), DISABLE DISTANCE ORDERING",
                renderer: new Flynn._3DRenderer({fog_distance:{near:70, far:100}, enable_distance_order:false})},
            {   name:"FOG (HARD CUTOFF)",
                renderer: new Flynn._3DRenderer({fog_distance:{near:82, far:82}})},
            {   name:"(DEFAULTS)", 
                renderer: new Flynn._3DRenderer()},
            {   name:"VERTICES", 
                renderer: new Flynn._3DRenderer({enable_lines:false, enable_vertices:true})},
            {   name:"VERTICES, WITH FOG", 
                renderer: new Flynn._3DRenderer({enable_lines:false, enable_vertices:true, fog_distance:{near:70, far:100}})},
        ];
        this.index_renderer = 0;

        // Spin the center cube a bit
        this.meshes[0].Rotation.x = Math.PI/8;
        this.meshes[0].Rotation.y = Math.PI/8;
    },

    handleInputs: function(input, elapsed_ticks) {
        Game.handleInputs_common(input);

        if (input.virtualButtonWasPressed("up")){
            this.index_renderer = Flynn.Util.minMaxBoundWrap(
                this.index_renderer - 1, 0, this.renderers.length - 1);
        }
        if (input.virtualButtonWasPressed("down")){
            this.index_renderer = Flynn.Util.minMaxBoundWrap(
                this.index_renderer + 1, 0, this.renderers.length - 1);
        }
    },

    update: function(elapsed_ticks) {
        var i;
        this.camera_angle += this.CAMERA_SPEED * elapsed_ticks;
        this.camera.Position =  new BABYLON.Vector3(
            Math.sin(this.camera_angle) * this.CAMERA_DISTANCE,
            0,
            Math.cos(this.camera_angle) * this.CAMERA_DISTANCE);
    }, 

    render: function(ctx){
        var i;
        var left_margin = 8, scale = 1.5, top_margin = 5, text_step = 16;
        var heading_color = Flynn.Colors.YELLOW;

        // Do 3D Rendering
        this.renderers[this.index_renderer].renderer.render(ctx, this.camera, this.meshes);

        Game.render_page_frame(ctx);

        var input = Flynn.mcp.input;
        ctx.vectorText2({
            text: 'USE UP (' +
                input.getVirtualButtonBoundKeyName('up') +
                ') / DOWN (' +
                input.getVirtualButtonBoundKeyName('down') +
                ') TO SELECT A RENDERER', 
            scale: scale,
            y: Game.BOUNDS.bottom - 18,
            color: heading_color
        });

        // List all 3D renderers
        var text_x = left_margin;
        var text_y = Game.BOUNDS.top + top_margin;
        for(i=0; i<this.renderers.length; i++){
            var color = i == this.index_renderer ? Flynn.Colors.YELLOW : Flynn.Colors.GRAY_DK;
            ctx.vectorText2({
                text: this.renderers[i].name, 
                scale: scale,
                x: text_x,
                y: text_y,
                color: color
            });
            text_y += text_step;
        }

        ctx.vectorText2({
            text: '3D API IS STILL IN BETA AND MAY CHANGE', 
            scale: scale,
            x: Game.BOUNDS.right - left_margin,
            y: Game.BOUNDS.top + top_margin,
            justify: 'right',
            color: Flynn.Colors.RED
        });
    },
});

}()); // "use strict" wrapper
