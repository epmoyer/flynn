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

        ZERO_V3: new BABYLON.Vector3.Zero(),

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
            opts.baseVelocityV3 = Flynn.Util.defaultArg(
                opts.baseVelocityV3,
                new BABYLON.Vector3.Zero());

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

                let particleVelocityV3 = BABYLON.Vector3.Copy(segmentCenterOffsetV3);
                if (particleVelocityV3.equals(this.ZERO_V3)) {
                    // If the center of the line segment is the center of the mesh then
                    // particleVelocityV3 will be zero, so we cannot normalize it.
                    // Instead, just assign a random direction for the
                    // segment to fly off in.
                    particleVelocityV3 = Flynn.Util.randomUnitV3();
                } else {
                    particleVelocityV3.normalize();
                }
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
                    opts.baseVelocityV3.add(particleVelocityV3),
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

    });
}());
