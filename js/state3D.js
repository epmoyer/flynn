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
        MIN_OBJECT_SEPARATION: 3.5,
        NUM_CUBES: 30,

        NUM_TETRAHEDRONS: 15,
        TETRAHEDRON_HEIGHT: 2,

        // Text meshes
        TEXT_SIZE: 0.5,
        TEXT_DISTANCE: 15,

        // Explosions
        EXPLOSION_PROBABILITY: 0.05,
        EXPLOSION_PARTICLE_NUM: 20,
        EXPLOSION_PARTICLE_LENGTH: 0.5,
        EXPLOSION_MAX_VELOCITY: 0.04,

        init: function () {
            let i, j, color, meshBox, meshText;
            this._super();

            this.meshes = [];
            this.particles3d = new Flynn._3DParticles();

            // --------------------
            // Add cubes
            // --------------------
            for (i = 0; i < this.NUM_CUBES; i++) {
                color = i === 0 ? Flynn.Colors.WHITE : Flynn.Util.randomChoice(this.CUBE_COLORS);
                meshBox = new Flynn._3DMeshCube('Cube', this.CUBE_SIZE, color);

                if (i === 0) {
                    // Center cube
                    this.meshes.push(meshBox);
                    continue;
                }
                meshBox.position = this._getNewObjectLocation();
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
                // TODO: Bring meshText back. Figure out how to reconcile with shatter
                // this.meshes.push(meshText);

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

                meshTetrahedron.position = this._getNewObjectLocation();
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
                    name: 'FOG (GRADUAL), BACK-FACE CULLING, OPACITY',
                    renderer: new Flynn._3DRenderer(
                        {
                            fog_distance: { near: 70, far: 100 },
                            enable_backface_culling: true,
                            enable_opacity: true
                        })
                },
                {
                    name: 'FOG (GRADUAL), BACK-FACE CULLING, (NO OPACITY)',
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

        _getNewObjectLocation: function () {
            // Find a location at least MIN_OBJECT_SEPARATION form all existing objects.
            let position;
            let numRetries = 0;
            let done = false;
            while (numRetries < 10000 && !done) {
                numRetries += 1;
                position = new BABYLON.Vector3(
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE),
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE / 2, this.CUBE_DISTANCE / 2),
                    Flynn.Util.randomFromInterval(-this.CUBE_DISTANCE, this.CUBE_DISTANCE)
                );
                done = true;
                for (const mesh of this.meshes) {
                    const distance = mesh.position.subtract(position).length();
                    if (distance < this.MIN_OBJECT_SEPARATION) {
                        done = false;
                    }
                }
            }
            if (numRetries === 0) {
                console.log('Unable to place object at least MIN_OBJECT_SEPARATION form all others.');
            }
            return position;
        },

        handleInputs: function (input, elapsedTicks) {
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

        update: function (elapsedTicks) {
            this.particles3d.update(elapsedTicks);
            this.camera_angle += this.CAMERA_SPEED * elapsedTicks;
            this.camera.position = new BABYLON.Vector3(
                Math.sin(this.camera_angle) * this.CAMERA_DISTANCE,
                0,
                Math.cos(this.camera_angle) * this.CAMERA_DISTANCE);

            // Spawn new explosion
            if (Math.random() < this.EXPLOSION_PROBABILITY) {
                const mesh = Flynn.Util.randomChoice(this.meshes);
                this.particles3d.shatter(mesh);
                // let color = Flynn.Util.randomChoice(this.TETRAHEDRON_COLORS.concat(this.CUBE_COLORS));
                // this.particles3d.explosion(
                //     this._getNewObjectLocation(),
                //     this.EXPLOSION_PARTICLE_NUM,
                //     this.EXPLOSION_PARTICLE_LENGTH,
                //     this.EXPLOSION_MAX_VELOCITY,
                //     // Flynn.Colors.YELLOW,
                //     color,
                //     new BABYLON.Vector3(0, 0, 0), // Initial velocity
                // );
            }
        },

        render: function (ctx) {
            let i;
            const left_margin = 8; const scale = 1.5; const top_margin = 5; const text_step = 16;
            const heading_color = Flynn.Colors.YELLOW;

            // Do 3D Rendering
            const particleMeshes = this.particles3d.getRenderMeshes();
            const renderMeshes = this.meshes.concat(particleMeshes);
            this.renderers[this.index_renderer].renderer.render(ctx, this.camera, renderMeshes);

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
