var Game = Game || {}; // Create namespace

(function () {
    'use strict';

    Game.State3D = Flynn.State.extend({
        CAMERA_DISTANCE: 80,
        CAMERA_SPEED: Math.PI / (60 * 8),
        CUBE_COLORS: [
            Flynn.Colors.YELLOW,
            Flynn.Colors.GREEN,
            Flynn.Colors.BLUE,
            Flynn.Colors.RED,
        ],
        CUBE_DISTANCE: 15,
        CUBE_SIZE: 2,
        NUM_CUBES: 60,

        // Text meshes
        TEXT_SIZE: 0.5,
        TEXT_DISTANCE: 15,

        init: function () {
            let i, j, color, mesh_box, mesh_text;
            this._super();

            this.meshes = [];
            for (i = 0; i < this.NUM_CUBES; i++) {
                color = i == 0 ? Flynn.Colors.WHITE : Flynn.Util.randomChoice(this.CUBE_COLORS);
                mesh_box = new Flynn._3DMeshCube('Cube', this.CUBE_SIZE, color);
                this.meshes.push(mesh_box);

                // Add rotational speed properties to the mesh
                mesh_box.rot_speed_x = 0;
                mesh_box.rot_speed_y = 0;

                if (i != 0) {
                    mesh_box.position = new BABYLON.Vector3(
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE / 2, this.CUBE_DISTANCE / 2),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE)
                    );
                    mesh_box.rotation.x = Flynn.Util.randomFromInterval(0, Math.PI);
                    mesh_box.rotation.y = Flynn.Util.randomFromInterval(0, Math.PI);

                    if (false) {
                        // -----------------------------
                        // Add text to one face of box
                        // -----------------------------
                        mesh_text = new Flynn._3DMeshText(
                            'Text',
                            Flynn.mcp.canvas.ctx,
                            this.TEXT_SIZE,
                            color,
                            'TEXT',
                            Flynn.Font.Normal);
                        this.meshes.push(mesh_text);
                        // Flynn._3DMeshText() returns text in the X/Z plane.  Add a Y offset to bring the
                        // text to the top face of the box.
                        const offset = new BABYLON.Vector3(0, this.CUBE_SIZE / 2, 0);
                        for (j = 0; j < mesh_text.vertices.length; j++) {
                            mesh_text.vertices[j] = mesh_text.vertices[j].add(offset);
                        }
                        // Give text same position/rotation as box
                        mesh_text.position = mesh_box.position;
                        mesh_text.rotation = mesh_box.rotation;
                    }
                }
            }

            this.camera = new Flynn._3DCamera();
            this.camera.position = new BABYLON.Vector3(0, 0, 10);
            this.camera.target = new BABYLON.Vector3(0, 0, 0);
            this.camera_angle = 0;

            this.renderers = [
                {
                    name: 'FOG (GRADUAL), BACK-SIDE CULLING',
                    renderer: new Flynn._3DRenderer(
                        { fog_distance: { near: 70, far: 100 }, enable_backface_culling: true })
                },
                {
                    name: 'FOG (GRADUAL)',
                    renderer: new Flynn._3DRenderer({ fog_distance: { near: 70, far: 100 } })
                },
                {
                    name: 'FOG (GRADUAL), DISABLE DISTANCE ORDERING',
                    renderer: new Flynn._3DRenderer(
                        { fog_distance: { near: 70, far: 100 }, enable_distance_order: false })
                },
                {
                    name: 'FOG (HARD CUTOFF)',
                    renderer: new Flynn._3DRenderer({ fog_distance: { near: 82, far: 82 } })
                },
                {
                    name: '(DEFAULTS)',
                    renderer: new Flynn._3DRenderer()
                },
                {
                    name: 'VERTICES',
                    renderer: new Flynn._3DRenderer({ enable_lines: false, enable_vertices: true })
                },
                {
                    name: 'VERTICES, WITH FOG',
                    renderer: new Flynn._3DRenderer(
                        { enable_lines: false, enable_vertices: true, fog_distance: { near: 70, far: 100 } })
                },
            ];
            this.index_renderer = 0;

            // Spin the center cube a bit
            this.meshes[0].rotation.x = Math.PI / 8;
            this.meshes[0].rotation.y = Math.PI / 8;
        },

        handleInputs: function (input, elapsed_ticks) {
            Game.handleInputs_common(input);

            if (input.virtualButtonWasPressed('up')) {
                this.index_renderer = Flynn.Util.minMaxBoundWrap(
                    this.index_renderer - 1, 0, this.renderers.length - 1);
            }
            if (input.virtualButtonWasPressed('down')) {
                this.index_renderer = Flynn.Util.minMaxBoundWrap(
                    this.index_renderer + 1, 0, this.renderers.length - 1);
            }
        },

        update: function (elapsed_ticks) {
            let i;
            this.camera_angle += this.CAMERA_SPEED * elapsed_ticks;
            this.camera.position = new BABYLON.Vector3(
                Math.sin(this.camera_angle) * this.CAMERA_DISTANCE,
                0,
                Math.cos(this.camera_angle) * this.CAMERA_DISTANCE);
        },

        render: function (ctx) {
            let i;
            const left_margin = 8; const scale = 1.5; const top_margin = 5; const text_step = 16;
            const heading_color = Flynn.Colors.YELLOW;

            // Do 3D Rendering
            this.renderers[this.index_renderer].renderer.render(ctx, this.camera, this.meshes);

            Game.render_page_frame(ctx);

            const input = Flynn.mcp.input;
            ctx.vectorText2({
                text: 'USE UP (' +
                input.getVirtualButtonBoundKeyName('up').toUpperCase() +
                ') / DOWN (' +
                input.getVirtualButtonBoundKeyName('down').toUpperCase() +
                ') TO SELECT A RENDERER',
                scale: scale,
                y: Game.BOUNDS.bottom - 18,
                color: heading_color
            });

            // List all 3D renderers
            const text_x = left_margin;
            let text_y = Game.BOUNDS.top + top_margin;
            for (i = 0; i < this.renderers.length; i++) {
                const color = i == this.index_renderer ? Flynn.Colors.YELLOW : Flynn.Colors.GRAY_DK;
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
