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
        TETRAHEDRON_COLORS: [
            Flynn.Colors.CYAN,
            Flynn.Colors.MAGENTA,
            Flynn.Colors.ORANGE
        ],
        CUBE_DISTANCE: 15,
        CUBE_SIZE: 2,
        MIN_CUBE_SEPARATION: 3.5,
        NUM_CUBES: 30,

        NUM_TETRAHEDRONS: 15,
        TETRAHEDRON_HEIGHT: 2,

        // Text meshes
        TEXT_SIZE: 0.5,
        TEXT_DISTANCE: 15,

        init: function () {
            let i, j, color, meshBox, meshText;
            this._super();

            this.meshes = [];

            // --------------------
            // Add cubes
            // --------------------
            for (i = 0; i < this.NUM_CUBES; i++) {
                color = i === 0 ? Flynn.Colors.WHITE : Flynn.Util.randomChoice(this.CUBE_COLORS);
                meshBox = new Flynn._3DMeshCube('Cube', this.CUBE_SIZE, color);

                // Add rotational speed properties to the mesh
                // TODO: Remove?
                meshBox.rot_speed_x = 0;
                meshBox.rot_speed_y = 0;

                if (i === 0) {
                    // Center cube
                    this.meshes.push(meshBox);
                    continue;
                }

                // -------------------------
                // Position new box at least MIN_CUBE_SEPARATION from all others.
                // -------------------------
                let numRetries = 0;
                let done = false;
                while (numRetries < 20000 && !done) {
                    numRetries += 1;
                    meshBox.position = new BABYLON.Vector3(
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE / 2, this.CUBE_DISTANCE / 2),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE)
                    );
                    done = true;
                    for (const mesh of this.meshes) {
                        // if (mesh === meshBox) {
                        //     // Don't compare against ourselves
                        //     continue;
                        // }
                        const distance = mesh.position.subtract(meshBox.position).length();
                        if (distance < this.MIN_CUBE_SEPARATION) {
                            done = false;
                        }
                    }
                }
                if (numRetries === 0) {
                    console.log('Unable to place box MIN_CUBE_SEPARATION form all others.');
                }

                meshBox.rotation.x = Flynn.Util.randomFromInterval(0, Math.PI);
                meshBox.rotation.y = Flynn.Util.randomFromInterval(0, Math.PI * 2);

                // -----------------------------
                // Add text to one face of box
                // -----------------------------
                meshText = new Flynn._3DMeshText(
                    'Text',
                    Flynn.mcp.canvas.ctx,
                    this.TEXT_SIZE,
                    color,
                    'TEXT',
                    Flynn.Font.Normal);
                this.meshes.push(meshText);

                // Determine the offset vector (vOffset) from the center of the box
                // to the surface where the text will appear.
                let vOffset = new BABYLON.Vector3(0, this.CUBE_SIZE / 2, 0);
                const transformMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    meshBox.rotation.y, meshBox.rotation.x, meshBox.rotation.z);
                vOffset = BABYLON.Vector3.TransformCoordinates(vOffset, transformMatrix);

                // Position the text on the surface of the box, with the same rotation
                // as the box.
                meshText.position = meshBox.position.add(vOffset);
                meshText.rotation = meshBox.rotation;

                this.meshes.push(meshBox);
            }

            // --------------------
            // Add tetrahedrons
            // --------------------
            for (i = 0; i < this.NUM_TETRAHEDRONS; i++) {
                color = Flynn.Util.randomChoice(this.TETRAHEDRON_COLORS);
                const meshTetrahedron = new Flynn._3DMeshTetrahedron(
                    'Tetrahedron', this.TETRAHEDRON_HEIGHT, color);

                // -------------------------
                // Position new tetrahedron at least MIN_CUBE_SEPARATION from all others.
                // -------------------------
                let numRetries = 0;
                let done = false;
                while (numRetries < 20000 && !done) {
                    numRetries += 1;
                    meshTetrahedron.position = new BABYLON.Vector3(
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE / 2, this.CUBE_DISTANCE / 2),
                        Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE)
                    );
                    done = true;
                    for (const mesh of this.meshes) {
                        const distance = mesh.position.subtract(meshTetrahedron.position).length();
                        if (distance < this.MIN_CUBE_SEPARATION) {
                            done = false;
                        }
                    }
                }
                if (numRetries === 0) {
                    console.log('Unable to place tetrahedron MIN_CUBE_SEPARATION form all others.');
                }

                meshTetrahedron.rotation.x = Flynn.Util.randomFromInterval(0, Math.PI);
                meshTetrahedron.rotation.y = Flynn.Util.randomFromInterval(0, Math.PI);

                this.meshes.push(meshTetrahedron);
            }

            this.camera = new Flynn._3DCamera();
            this.camera.position = new BABYLON.Vector3(0, 0, 10);
            this.camera.target = new BABYLON.Vector3(0, 0, 0);
            this.camera_angle = 0;

            this.renderers = [
                {
                    name: 'FOG (GRADUAL), BACK-FACE CULLING, HIDDEN LINE REMOVAL',
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
