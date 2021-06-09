var Game = Game || {};

(function () {
    'use strict';

    Flynn._3DParticle = Class.extend({

        PARTICLE_LIFE_VARIATION: 20,
        PARTICLE_LIFE: 80,
        PARTICLE_FRICTION: 0.99,

        init: function (mesh, velocityV3, angularVelocityV3, lifetimeTicks) {
            this.mesh = mesh;
            this.velocityV3 = velocityV3;
            this.angularVelocityV3 = angularVelocityV3;
            // TODO: Require this parameter
            if (typeof (lifetimeTicks) === 'undefined') {
                this.lifetimeTicks = this.PARTICLE_LIFE + (Math.random() - 0.5) * this.PARTICLE_LIFE_VARIATION;
            } else {
                this.lifetimeTicks = lifetimeTicks;
            }
        },

        update: function (elapsedTicks) {
            let isAlive = true;
            // Decay and die
            this.lifetimeTicks -= elapsedTicks;
            if (this.lifetimeTicks <= 0) {
                // Kill particle
                isAlive = false;
            } else {
                // Add impulse
                this.mesh.position = this.mesh.position.add(this.velocityV3.scale(elapsedTicks));
                // Decay impulse
                this.velocityV3 = this.velocityV3.scale(Math.pow(this.PARTICLE_FRICTION, elapsedTicks));
                this.mesh.rotation = this.mesh.rotation.add(this.angularVelocityV3);
            }
            return isAlive;
        },
    });

    Flynn._3DParticles = Class.extend({

        EXPLOSION__VELOCITY_VARIATION: 0.8,

        SHATTER__DEFAULT_LIFETIME_TICKS_RANGE: {
            min: 50,
            max: 60,
        },
        SHATTER__DEFAULT_VELOCITY_RANGE: {
            min: 0.005,
            max: 0.02
        },
        SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE: {
            min: Math.PI / 600,
            max: Math.PI / 400,
        },

        init: function () {
            this.particles = [];
            this.timer = 0;
        },

        explosion: function (positionV3, quantity, length, maxVelocity, color, baseVelocityV3) {
            // TODO: Use opts object instead of argument list.  Pass min/max velocity.
            const points = [-length / 2, 0, length / 2, 0];
            for (let i = 0; i < quantity; i++) {
                const mesh = new Flynn._3DMeshFromPoints('line', points, 1.0, color);
                mesh.position = BABYLON.Vector3.Copy(positionV3);
                mesh.rotation = new BABYLON.Vector3(
                    0,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                );
                const angularVelocityV3 = new BABYLON.Vector3(
                    0,
                    Flynn.Util.randomNegate(
                        Flynn.Util.randomFromInterval(
                            this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE.min,
                            this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE.max,
                        )
                    ),
                    Flynn.Util.randomNegate(
                        Flynn.Util.randomFromInterval(
                            this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE.min,
                            this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE.max,
                        )
                    )
                );
                const particleVelocityV3 = Flynn.Util.randomUnitV3().scale(
                    maxVelocity * (1.0 - this.EXPLOSION__VELOCITY_VARIATION + Math.random() * this.EXPLOSION__VELOCITY_VARIATION)
                );

                this.particles.push(new Flynn._3DParticle(
                    mesh,
                    baseVelocityV3.add(particleVelocityV3),
                    angularVelocityV3
                ));
            }
        },

        shatter: function (mesh, opts) {
            // TODO: Add to opts
            //
            //  Args:
            //      polygon: The polygon object to shatter
            //      opts: Options object.  Can be omitted to use defaults.
            //      {
            //          lifetimeTicksRange: {
            //              min: <min particle life, in ticks>,
            //              max: <max particle life, in ticks>
            //          },
            //          velocityRange: {
            //              min: <min particle velocity (pixels/tick)>,
            //              max: <max particle velocity (pixels/tick)>
            //          },
            //          angularVelocityRange: {
            //              min: <min particle rotation velocity (radians/tick)>,
            //              max: <max particle rotation velocity (radians/tick)>
            //              // NOTE: Regardless of the range given, the resulting rotation
            //              //       velocity will be randomly (50%) negated, resulting in a mix
            //              //       of clockwise and counter-clockwise spins.
            //              // NOTE: Two independent, random, angular velocities will be assigned;
            //              //       one around the Y axis and the other around the Z axis.
            //          },
            //          baseVelocityV3: A Babylon.Vector3 object. If supplied, all particles will
            //              have this velocity added to their initial velocity. If omitted,
            //              a velocity of zero will be assumed.
            //      }
            //
            opts.lifetimeTicksRange = Flynn.Util.defaultArg(
                opts.lifetimeTicksRange,
                this.SHATTER__DEFAULT_LIFETIME_TICKS_RANGE);
            opts.velocityRange = Flynn.Util.defaultArg(
                opts.velocityRange,
                this.SHATTER__DEFAULT_VELOCITY_RANGE);
            opts.angularVelocityRange = Flynn.Util.defaultArg(
                opts.angularVelocityRange,
                this.SHATTER__DEFAULT_ANGULAR_VELOCITY_RANGE);

            const sourceVelocityV3 = new BABYLON.Vector3(0, 0, 0);

            const segments = mesh.to_segments();
            for (const segment of segments) {
                // Center of line segment
                const segmentCenterV3 = new BABYLON.Vector3(
                    (segment.from.x + segment.to.x) / 2,
                    (segment.from.y + segment.to.y) / 2,
                    (segment.from.z + segment.to.z) / 2
                );
                // Offset from center of mesh (mesh position) to center of line segment
                const segmentCenterOffsetV3 = segmentCenterV3.subtract(mesh.position);
                const shiftedFromV3 = segment.from.subtract(segmentCenterV3);
                const shiftedToV3 = segment.to.subtract(segmentCenterV3);
                const segmentMesh = new Flynn._3DMeshFromSegments(
                    'line',
                    [{
                        from: shiftedFromV3,
                        to: shiftedToV3
                    }],
                    mesh.color
                );
                segmentMesh.position = mesh.position.add(segmentCenterOffsetV3);
                const angularVelocityV3 = new BABYLON.Vector3(
                    0,
                    Flynn.Util.randomNegate(
                        Flynn.Util.randomFromInterval(
                            opts.angularVelocityRange.min,
                            opts.angularVelocityRange.max,
                        )
                    ),
                    Flynn.Util.randomNegate(
                        Flynn.Util.randomFromInterval(
                            opts.angularVelocityRange.min,
                            opts.angularVelocityRange.max,
                        )
                    )
                );
                // TODO: Protect against error normalizing an initial position of (0, 0, 0)

                let particleVelocityV3 = BABYLON.Vector3.Copy(segmentCenterOffsetV3);
                particleVelocityV3.normalize();
                const velocityScalar = Flynn.Util.randomFromInterval(
                    opts.velocityRange.min,
                    opts.velocityRange.max
                );
                particleVelocityV3 = particleVelocityV3.scale(velocityScalar);
                const lifetimeTicks = Flynn.Util.randomFromInterval(
                    opts.lifetimeTicksRange.min,
                    opts.lifetimeTicksRange.max
                );

                this.particles.push(new Flynn._3DParticle(
                    segmentMesh,
                    sourceVelocityV3.add(particleVelocityV3),
                    angularVelocityV3,
                    lifetimeTicks
                ));
            }
        },

        update: function (elapsedTicks) {
            for (let i = 0, len = this.particles.length; i < len; i += 1) {
                if (!this.particles[i].update(elapsedTicks)) {
                    // Particle has died.  Remove it
                    this.particles.splice(i, 1);
                    len--;
                    i--;
                }
            }
        },

        getRenderMeshes: function () {
            const renderMeshes = [];
            for (const particle of this.particles) {
                renderMeshes.push(particle.mesh);
            }
            return renderMeshes;
        },

        // randomVectorWithin: function (min, max, options) {
        //     const randomValueFor = function () {
        //         return (min + (Math.random() * max)) * (Math.floor(Math.random() * 2) === 0 ? 1 : -1);
        //     };

        //     const x = !(options || {}).skipX ? randomValueFor(min, max) : 0;
        //     const y = !(options || {}).skipY ? randomValueFor(min, max) : 0;
        //     const z = !(options || {}).skipZ ? randomValueFor(min, max) : 0;

        //     return new BABYLON.Vector3(x, y, z);
        // },

        // shatter: function (polygon, options) {
        //     this.removeFromMeshes(polygon);
        //     const meshes = this.meshesFor(polygon);
        //     const velocities = [];
        //     const rotations = [];

        //     for (let i = 0, length = meshes.length; i < length; i++) {
        //         this.meshes.push(meshes[i]);
        //         velocities.push(this.randomVectorWithin(options.minVelocity, options.maxVelocity));
        //         rotations.push(this.randomVectorWithin(options.minRotation, options.maxRotation, { skipZ: true }));
        //     }

        //     this.collection.push({
        //         shatteredAt: this.timer,
        //         expireAt: this.timer + options.duration,
        //         flashAt: this.timer + (options.duration * 0.5),
        //         velocities: velocities,
        //         rotations: rotations,
        //         meshes: meshes,
        //         removed: false,
        //         visible: true,
        //         color: polygon.color,
        //     });
        // },

        // meshesFor: function (polygon) {
        //     const meshes = [];
        //     const baseName = polygon.name + '_particle_';
        //     for (let i = 0, length = polygon.lines.length - 1; i < length; i++) {
        //         const pointA = polygon.lines[i];
        //         const pointB = polygon.lines[i + 1];
        //         if (pointA === Flynn.PEN_UP || pointB === Flynn.PEN_UP) continue;

        //         const lines = [0, 1];
        //         const vertices = [polygon.vertices[pointA], polygon.vertices[pointB]];
        //         const mesh = new Flynn._3DMesh(baseName + i, vertices, lines, polygon.color, null, polygon.alpha, null, null);

        //         mesh.position.x = polygon.position.x;
        //         mesh.position.y = polygon.position.y;
        //         mesh.position.z = polygon.position.z;
        //         mesh.rotation.x = polygon.rotation.x;
        //         mesh.rotation.y = polygon.rotation.y;
        //         mesh.rotation.z = polygon.rotation.z;

        //         meshes.push(mesh);
        //     }
        //     return meshes;
        // },

        // removeFromMeshes: function (mesh) {
        //     this.meshes.splice(this.meshes.indexOf(mesh), 1);
        // },

        // removeMeshesFor: function (item) {
        //     for (let i = 0, length = item.meshes.length; i < length; i++) {
        //         this.removeFromMeshes(item.meshes[i]);
        //     }
        // },

        // adjustRotationAndPositionFor: function (item, paceFactor) {
        //     for (let i = 0, length = item.meshes.length; i < length; i++) {
        //         const mesh = item.meshes[i];
        //         mesh.position.x += paceFactor * item.velocities[i].x;
        //         mesh.position.y += paceFactor * item.velocities[i].y;
        //         mesh.position.z += paceFactor * item.velocities[i].z;
        //         mesh.rotation.x += paceFactor * item.rotations[i].x;
        //         mesh.rotation.y += paceFactor * item.rotations[i].y;
        //         mesh.rotation.z += paceFactor * item.rotations[i].z;
        //     }
        // },

        // updateVisibilityFor: function (item, visible) {
        //     for (let i = 0, length = item.meshes.length; i < length; i++) {
        //         item.meshes[i].color = visible ? item.color : Flynn.Colors.BLACK;
        //     }
        // },

        // update: function (paceFactor) {
        //     this.timer += (Game.constants.SECOND_FRACTION * paceFactor);

        //     let i, length, visible;
        //     let allRemoved = true;
        //     for (i = 0, length = this.collection.length; i < length; i++) {
        //         const item = this.collection[i];
        //         if (item.removed) continue;

        //         if (this.timer < item.expireAt) {
        //             if (this.timer >= item.flashAt) {
        //                 visible = Math.floor(this.timer * this.flashSpeed) % 2;
        //                 if (visible !== item.visible) {
        //                     item.visible = visible;
        //                     this.updateVisibilityFor(item, visible);
        //                 }
        //             }
        //             this.adjustRotationAndPositionFor(item, paceFactor);
        //             allRemoved = false;
        //         } else {
        //             this.removeMeshesFor(item);
        //             item.removed = true;
        //         }
        //     }

        //     if (allRemoved) this.collection = [];
        // },
    });
}());
