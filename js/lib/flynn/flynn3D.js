(function () {
    'use strict';

    Flynn._3DCamera = Class.extend({
        init: function () {
            this.position = BABYLON.Vector3.Zero();
            this.target = BABYLON.Vector3.Zero();
        },
    });

    Flynn._3DMesh = Class.extend({
        init: function (name, vertices, lines, color, custom_palette, alpha, culling_faces, culling_lines) {
            this.name = name;
            this.vertices = vertices;
            this.lines = lines;
            this.color = color;
            this.custom_palette = typeof (custom_palette) === 'undefined' ? null : custom_palette;
            this.alpha = alpha === undefined ? 1.0 : alpha;
            this.culling_faces = typeof (culling_faces) === 'undefined' ? null : culling_faces;
            this.culling_lines = typeof (culling_lines) === 'undefined' ? null : culling_lines;

            this.world_vertices = new Array(vertices.length);
            this.projected_vertices = new Array(vertices.length);
            this.check_vertices = new Array(vertices.length);
            this.pre_rotation = null;
            this.rotation = BABYLON.Vector3.Zero();
            this.position = BABYLON.Vector3.Zero();
        },

        to_segments: function () {
            // Return mesh segments (i.e. all individual line segments) as an array of
            // segment objects with the form:
            // {from: <BABYLON.Vector3>, to: <BABYLON.Vector3>}
            let transformMatrix = null;
            if (this.pre_rotation) {
                transformMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    this.pre_rotation.y, this.pre_rotation.x, this.pre_rotation.z)
                    .multiply(BABYLON.Matrix.RotationYawPitchRoll(
                        this.rotation.y, this.rotation.x, this.rotation.z))
                    .multiply(BABYLON.Matrix.Translation(
                        this.position.x, this.position.y, this.position.z));
            } else {
                transformMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    this.rotation.y, this.rotation.x, this.rotation.z)
                    .multiply(BABYLON.Matrix.Translation(
                        this.position.x, this.position.y, this.position.z));
            }

            const segments = [];
            let previousVertex = null;
            for (const vertexIndex of Object.values(this.lines)) {
                if (vertexIndex === Flynn.PEN_UP) {
                    previousVertex = null;
                    continue;
                }
                const currentVertex = this.vertices[vertexIndex];
                if (previousVertex !== null) {
                    segments.push({
                        // from: previousVertex.add(this.position),
                        from: BABYLON.Vector3.TransformCoordinates(previousVertex, transformMatrix),
                        // to: currentVertex.add(this.position)
                        to: BABYLON.Vector3.TransformCoordinates(currentVertex, transformMatrix)
                    });
                }
                previousVertex = currentVertex;
            }
            return segments;
        }
    });

    Flynn._3DMeshCube = Flynn._3DMesh.extend({
        init: function (name, size, color) {
            const loc = size / 2;
            //
            //    1 --------------- 0
            //    | \             / |
            //    |  5 ----------4  |
            //    |  |           |  |
            //    |  |           |  |
            //    |  |           |  |
            //    |  |           |  |
            //    |  6 ----------7  |
            //    | /             \ |
            //    2 --------------- 3
            //
            //   Y
            //   ^  Z
            //   | /
            //   +--> X
            //
            const vertices = [
                new BABYLON.Vector3(loc, loc, loc), // 0
                new BABYLON.Vector3(-loc, loc, loc), // 1
                new BABYLON.Vector3(-loc, -loc, loc), // 2
                new BABYLON.Vector3(loc, -loc, loc), // 3
                new BABYLON.Vector3(loc, loc, -loc), // 4
                new BABYLON.Vector3(-loc, loc, -loc), // 5
                new BABYLON.Vector3(-loc, -loc, -loc), // 6
                new BABYLON.Vector3(loc, -loc, -loc) // 7
            ];

            const lines = [
                0, 1, 2, 3, 0, // Front
                4, // Top right edge
                5, 6, 7, 4, // Back
                Flynn.PEN_UP,
                1, 5, // Top left edge
                Flynn.PEN_UP,
                2, 6, // Bottom left edge
                Flynn.PEN_UP,
                3, 7 //  Bottom right edge
            ];

            // - All face vertices MUST be in the same plane.
            // - The two vectors defined by (V_0, V_1) and (V_0, V_N-1) must have a <180 degree
            //   interior angle. Together they define the normal vector of the face's VISIBLE
            //   side per the "right hand rule".
            //
            const culling_faces = [
                [0, 1, 2, 3], // Face 0 (front)
                [7, 6, 5, 4], // Face 1 (back)
                [0, 3, 7, 4], // Face 2 (right)
                [0, 4, 5, 1], // Face 3 (top)
                [1, 5, 6, 2], // Face 4 (left)
                [2, 6, 7, 3], // Face 5 (bottom)
            ];

            const culling_lines = [
                // [Vertex A, Vertex B, [List of faces that include the line]]
                // TODO: It would be possible for code to algorithmically determine
                //       the list of faces which include each line.  Do that instead
                //       so it is easier to author this data structure.
                [0, 1, [0, 3]],
                [1, 2, [0, 4]],
                [2, 3, [0, 5]],
                [3, 0, [0, 2]],
                [0, 4, [2, 3]],
                [1, 5, [3, 4]],
                [2, 6, [4, 5]],
                [3, 7, [5, 2]],
                [7, 4, [1, 2]],
                [4, 5, [1, 3]],
                [5, 6, [1, 4]],
                [6, 7, [1, 5]],
            ];

            this._super(name, vertices, lines, color, null, 1.0, culling_faces, culling_lines);
        },
    });

    Flynn._3DMeshFromPoints = Flynn._3DMesh.extend({
        init: function (name, points, scale, color) {
            let i;
            const vertices = [];
            const lines = [];
            let num_vertices = 0;
            for (i = 0; i < points.length; i += 2) {
                if (points[i] === Flynn.PEN_COMMAND) {
                    if (points[i + 1] === Flynn.PEN_UP) {
                        lines.push(Flynn.PEN_UP);
                    }
                    continue;
                }
                vertices.push(new BABYLON.Vector3(
                    points[i] * scale,
                    0,
                    points[i + 1] * scale));
                lines.push(num_vertices++);
            }
            this._super(name, vertices, lines, color);
        }
    });

    Flynn._3DMeshFromSegments = Flynn._3DMesh.extend({
        // Create a 3D mesh from an array of line segments of the form:
        // {from: <BABYLON.Vector3>, to: <BABYLON.Vector3>}
        // Note:
        //    This is not the most efficient way to construct a mesh of CONNECTED
        //    line segments, and will result in "double bloom" IF the ends of line
        //    segments touch (since a vector bloom is drawn at the end of each line).
        //
        //    The intended use case is to call .to_segments() on a 3D mesh to deconstruct
        //    it into line segments, parse those segment to animate them somehow (such as
        //    exploding an object into pieces), then use this function to convert them back
        //    into a mesh for rendering.
        //
        init: function (name, segments, color) {
            const vertices = [];
            const lines = [];
            let vertexIndex = 0;
            for (const segment of Object.values(segments)) {
                vertices.push(segment.from);
                lines.push(vertexIndex++);
                vertices.push(segment.to);
                lines.push(vertexIndex++);
                lines.push(Flynn.PEN_UP);
            }
            this._super(name, vertices, lines, color);
        }
    });

    Flynn._3DMeshPlate = Flynn._3DMesh.extend({
        init: function (name, width, depth, color) {
            const loc_x = width / 2;
            const loc_z = depth / 2;
            const vertices = [
                new BABYLON.Vector3(loc_x, 0, loc_z),
                new BABYLON.Vector3(-loc_x, 0, loc_z),
                new BABYLON.Vector3(-loc_x, 0, -loc_z),
                new BABYLON.Vector3(loc_x, 0, -loc_z),
            ];

            const lines = [0, 1, 2, 3, 0];

            this._super(name, vertices, lines, color);
        },
    });

    Flynn._3DMeshText = Flynn._3DMesh.extend({
    // Make a (flat) 3d mesh containing text.
    // The mesh will be created in the X/Z plane, and will be flat in Y.
    // The text will be scaled to match the requested height (Z).
    // The final width of the mesh (i.e. the largest X value) will be..
    // ..governed by the width of the text.
    // The mesh will be centered about the origin, (i.e. the..
    // ..rendered text will be centered about the origin)
        init: function (name, ctx, height, color, text, font) {
            let i, j, len, len2, character, polygon;
            text = String(text);

            // var pen_up;
            const draw_z = -height / 2;
            const vertices = [];
            const lines = [];
            const scale = height / font.CharacterHeight;
            const step = scale * font.CharacterSpacing;
            let draw_x = ((text.length * step - (font.CharacterGap * scale))) / 2;
            const aspect_ratio = 1.0;

            this._super(name, vertices, lines, color);
            for (i = 0, len = text.length; i < len; i++) {
                if (i > 0) {
                // lift pen between characters
                    lines.push(Flynn.PEN_UP);
                }
                character = text.charCodeAt(i);

                if (character === ctx.SPACECODE) {
                    draw_x += step;
                    continue;
                }
                polygon = ctx.charToPolygon(character, font);

                // pen_up = false;
                for (j = 0, len2 = polygon.length; j < len2; j += 2) {
                    if (polygon[j] == Flynn.PEN_COMMAND) {
                    // pen_up = true;
                        lines.push(Flynn.PEN_UP);
                    } else {
                        vertices.push(
                            new BABYLON.Vector3(
                                draw_x - polygon[j] * scale,
                                0,
                                polygon[j + 1] * scale / aspect_ratio + draw_z)
                        );
                        // if(j===0 || pen_up){
                        //     pen_up = false;
                        // }
                        lines.push(vertices.length - 1);
                    }
                }
                draw_x -= step;
            }
            this._super(name, vertices, lines, color);
        },
    });

    Flynn._3DRenderer = Class.extend({
        VERTEX_SIZE: 2,

        init: function (opts) {
        // Options:
        //    width: (int) The width of the display canvas
        //    height: (int) The height of the display canvas
        //    fog_distance: Either null for no fog, or an object of the
        //        form {near:float, far:float}
        //           near: The distance from camera beyond which meshes
        //                 will begin to fade out.
        //           far:  The distance from camera beyond which meshes
        //                 will fade out entirely (not be drawn)
        //    enable_vertices: (boolean) Set true to draw vertices as points.
        //    enable_lines: (boolean) Set true to draw lines (vectors) between
        //        vertices (per the mesh.lines array)
        //    enable_distance_order: (boolean) Set true to sort meshes by their
        //        distance from the camera and draw in order from farthest
        //        to closest.
        //    enable_backface_culling: (boolean) Enable back-face culling for those
        //        meshes which declare culling info.
        //    screenOffsetV: (Victor) a 2d vector specifying a screen offset.
        //        screenOffsetV will be added to the final screen location of rendered
        //        objects before drawing.  Can be used to translate the rendering, or
        //        implement screen shake effects.
        //
            opts = opts || {};
            this.width = opts.width || Flynn.mcp.canvasWidth;
            this.height = opts.height || Flynn.mcp.canvasHeight;
            this.fog_distance = opts.fog_distance || null;
            this.enable_vertices = opts.enable_vertices || false;
            this.enable_lines = Flynn.Util.defaultTrue(opts.enable_lines);
            this.enable_distance_order = Flynn.Util.defaultTrue(opts.enable_distance_order);
            this.enable_backface_culling = opts.enable_backface_culling || false;
            this.screenOffsetV = opts.screenOffsetV || new Victor(0, 0);
        },

        project: function (coord, transMat) {
            const point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
            // The transformed coordinates will be based on coordinate system
            // starting on the center of the screen. But drawing on screen normally starts
            // from top left. We then need to transform them again to have x:0, y:0 on top left.
            // var x = point.x * this.width + this.width / 2.0 >> 0;
            // var y = -point.y * this.height + this.height / 2.0 >> 0;
            const x = point.x * this.width + this.width / 2.0 + this.screenOffsetV.x;
            const y = -point.y * this.height + this.height / 2.0 + this.screenOffsetV.y;
            return (new BABYLON.Vector3(x, y, point.z));
        },

        prepare: function (camera) {
        // Prepare a transformation matrix for future point rendering using .renderPoint()
            const viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
            const projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);
            this.pointTransformMatrix = viewMatrix.multiply(projectionMatrix);
            this.transformCheckMatrix = viewMatrix;
        },

        renderPoint: function (ctx, location_v, size, color, alpha) {
        // Must call .prepare() before calling this method
            const checkPoint = BABYLON.Vector3.TransformCoordinates(location_v, this.transformCheckMatrix);
            // Only render the point if it is in front of the camera
            if (checkPoint.z > 0) {
                const projectedPoint = this.project(location_v, this.pointTransformMatrix);
                ctx.fillStyle = color;
                ctx.fillRect(
                    projectedPoint.x - size / 2,
                    projectedPoint.y - size / 2,
                    size,
                    size,
                    alpha);
            }
        },

        projectPoint: function (location_v) {
        // Must call .prepare() before calling this method
            return (this.project(location_v, this.pointTransformMatrix));
        },

        render: function (ctx, camera, meshes) {
            let cMesh;

            const viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
            const projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

            let color;
            let dimFactor = 0;
            let visible;
            const drawList = [];
            for (let index = 0; index < meshes.length; index++) {
            // current mesh to work on
                cMesh = meshes[index];

                // ------------------------
                // Find distance to mesh
                // ------------------------
                let distance = 0;
                if (this.fog_distance || this.enable_distance_order) {
                    distance = BABYLON.Vector3.Distance(camera.position, cMesh.position);
                }

                // ------------------------
                // Distance fogging
                // ------------------------
                visible = true;
                color = cMesh.color;
                if (this.fog_distance) {
                    if (distance > this.fog_distance.far) {
                        visible = false;
                    } else if (distance > this.fog_distance.near) {
                        dimFactor = -((distance - this.fog_distance.near) /
                        (this.fog_distance.far - this.fog_distance.near));
                        color = Flynn.Util.shadeColor(cMesh.color, dimFactor);
                    }
                }

                if (visible) {
                // ------------------------------
                // Project vertices to screen
                // ------------------------------
                // Apply rotation before translation
                    let worldMatrix = null;
                    if (cMesh.pre_rotation) {
                        worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                            cMesh.pre_rotation.y, cMesh.pre_rotation.x, cMesh.pre_rotation.z)
                            .multiply(BABYLON.Matrix.RotationYawPitchRoll(
                                cMesh.rotation.y, cMesh.rotation.x, cMesh.rotation.z))
                            .multiply(BABYLON.Matrix.Translation(
                                cMesh.position.x, cMesh.position.y, cMesh.position.z));
                    } else {
                        worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                            cMesh.rotation.y, cMesh.rotation.x, cMesh.rotation.z)
                            .multiply(BABYLON.Matrix.Translation(
                                cMesh.position.x, cMesh.position.y, cMesh.position.z));
                    }

                    const transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                    // Transform for checking whether vertices are behind camera
                    const transformCheckMatrix = worldMatrix.multiply(viewMatrix);

                    for (let indexVertices = 0; indexVertices < cMesh.vertices.length; indexVertices++) {
                        // Transform into world coordinates (for backside culling)
                        cMesh.world_vertices[indexVertices] = BABYLON.Vector3.TransformCoordinates(cMesh.vertices[indexVertices], worldMatrix);
                        // First, we project the 3D coordinates into the 2D space
                        const projectedPoint = this.project(cMesh.vertices[indexVertices], transformMatrix);
                        cMesh.projected_vertices[indexVertices] = projectedPoint;
                        cMesh.check_vertices[indexVertices] = BABYLON.Vector3.TransformCoordinates(cMesh.vertices[indexVertices], transformCheckMatrix);

                        if (this.enable_vertices && cMesh.check_vertices[indexVertices].z > 0) {
                        // Draw vertices
                            ctx.fillStyle = color;
                            ctx.fillRect(
                                projectedPoint.x - this.VERTEX_SIZE / 2,
                                projectedPoint.y - this.VERTEX_SIZE / 2,
                                this.VERTEX_SIZE,
                                this.VERTEX_SIZE);
                        }
                    }
                    drawList.push({ mesh_index: index, distance: distance, color: color, dim_factor: dimFactor });
                }
            }

            // Sort draw order by distance
            if (this.enable_distance_order) {
                drawList.sort(function (a, b) { return b.distance - a.distance; });
            }

            if (this.enable_lines) {
                if (this.enable_backface_culling) {
                    this._render_culled(ctx, camera, meshes, drawList);
                } else {
                    // this._render_lines(ctx, meshes, drawList);
                    this._render_all_wireframe(ctx, meshes, drawList);
                }
            }
        },

        _render_culled: function (ctx, camera, meshes, drawList) {
            let cMesh, color;

            // Fer each mesh, farthest to nearest
            for (const drawItem of drawList) {
                color = drawItem.color;
                cMesh = meshes[drawItem.mesh_index];
                if (cMesh.culling_lines === null || cMesh.culling_faces == null) {
                    // This mesh has no culling information
                    continue;
                }

                const worldVertices = cMesh.world_vertices;
                const screenVertices = cMesh.projected_vertices;

                // ----------------------------
                // Determine visible faces
                // ----------------------------
                const visibleFaces = [];
                for (const [i, faceVertexList] of cMesh.culling_faces.entries()) {
                    const point1 = worldVertices[faceVertexList[0]];
                    let point2 = worldVertices[faceVertexList[1]];
                    const vector1 = point2.subtract(point1);

                    point2 = worldVertices[faceVertexList[faceVertexList.length - 1]];
                    const vector2 = point2.subtract(point1);
                    const vNormal = BABYLON.Vector3.Cross(vector1, vector2);

                    const vLineOfSight = point1.subtract(camera.position);
                    const dot = BABYLON.Vector3.Dot(vLineOfSight, vNormal);
                    if (dot < 0) {
                        visibleFaces.push(i);

                        // ----------------------------
                        // Fill visible face
                        // ----------------------------
                        const polygonPoints = [];
                        for (const vertexIndex of faceVertexList) {
                            const screenVertex = screenVertices[vertexIndex];
                            polygonPoints.push(screenVertex.x);
                            polygonPoints.push(screenVertex.y);
                        }
                        // ctx.graphics.beginFill(0x00ffff, 0.5);
                        ctx.graphics.beginFill(0x000000, 1.0);
                        ctx.graphics.drawPolygon(polygonPoints);
                        ctx.graphics.endFill();
                    }
                }

                // ----------------------------
                // Render lines
                // ----------------------------
                for (const lineDescriptor of cMesh.culling_lines) {
                    const lineFaces = lineDescriptor[2];
                    const filteredArray = lineFaces.filter(value => visibleFaces.includes(value));
                    if (filteredArray.length === 0) {
                        // This line does not appear in a visible face, do do not draw it.
                        continue;
                    }

                    const vertex1 = screenVertices[lineDescriptor[0]];
                    const vertex2 = screenVertices[lineDescriptor[1]];
                    ctx.vectorStart(color, false, false, cMesh.alpha);
                    ctx.vectorMoveTo(vertex1.x, vertex1.y);
                    ctx.vectorLineTo(vertex2.x, vertex2.y);
                    ctx.vectorEnd();
                }
            }
        },

        _render_all_wireframe: function (ctx, meshes, drawList) {
            for (const drawItem of drawList) {
                this._render_mesh_wireframe(
                    ctx, meshes[drawItem.mesh_index], drawItem.color, drawItem.dim_factor);
            }
        },

        _render_mesh_wireframe: function (ctx, cMesh, color, dimFactor) {
            const lines = cMesh.lines;
            const vertices = cMesh.projected_vertices;
            let penUp = true;
            let started = false;
            for (let indexLines = 0; indexLines < lines.length; indexLines++) {
                const indexVertex = lines[indexLines];
                if (indexVertex == Flynn.PEN_UP) {
                // Pen up
                    ctx.vectorEnd();
                    penUp = true;
                    continue;
                }
                if (indexVertex >= Flynn.PEN_COLOR0) {
                // Switch colors
                    const colorIndex = indexVertex - Flynn.PEN_COLOR0;
                    if (cMesh.custom_palette == null) {
                        color = Flynn.ColorsOrdered[colorIndex];
                    } else {
                        color = cMesh.custom_palette[colorIndex];
                    }
                    if (dimFactor !== 0) {
                        color = Flynn.Util.shadeColor(color, dimFactor);
                    }
                    if (started) {
                        ctx.vectorEnd();
                    }
                    penUp = true;
                    continue;
                }
                const vertex = vertices[indexVertex];
                if (penUp) {
                // Start line if vertex in front of camera
                    if (cMesh.check_vertices[indexVertex].z > 0) {
                        ctx.vectorStart(color, false, false, cMesh.alpha);
                        ctx.vectorMoveTo(vertex.x, vertex.y);
                        penUp = false;
                        started = true;
                    }
                } else {
                // Draw line if vertex in front of camera
                    if (cMesh.check_vertices[indexVertex].z > 0) {
                        ctx.vectorLineTo(vertex.x, vertex.y);
                    }
                }
            }
            if (started) {
                ctx.vectorEnd();
            }
        },

        renderToPolygon: function (camera, meshes) {
        // Given a camera and a list of meshes, return a Flynn.Polygon containing the rendered lines.
        //
        // Note:
        // * Polygons do not (yet) support custom palettes, so this method always renders a
        //   monochromatic polygon.
        // * This method does no distance ordering or fogging.
        //
            let cMesh;

            const viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
            const projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

            let color;
            const points = [];
            let pending_disconnect = false;
            for (let index = 0; index < meshes.length; index++) {
            // If polygon points exist (from a previous mesh), append a
                // PEN_UP command do disconnect the previous mesh from the next.
                pending_disconnect = points.length != 0;

                // current mesh to work on
                cMesh = meshes[index];

                // ------------------------------
                // Project vertices to screen
                // ------------------------------
                // Apply rotation before translation
                const worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    cMesh.rotation.y, cMesh.rotation.x, cMesh.rotation.z)
                    .multiply(BABYLON.Matrix.Translation(
                        cMesh.position.x, cMesh.position.y, cMesh.position.z));

                const transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                // Transform for checking whether vertices are behind camera
                const transformCheckMatrix = worldMatrix.multiply(viewMatrix);

                for (let indexVertices = 0; indexVertices < cMesh.vertices.length; indexVertices++) {
                // First, we project the 3D coordinates into the 2D space
                    const projectedPoint = this.project(cMesh.vertices[indexVertices], transformMatrix);
                    cMesh.projected_vertices[indexVertices] = projectedPoint;
                }

                // ------------------------
                // Compose vectors
                // ------------------------
                const lines = cMesh.lines;
                const vertices = cMesh.projected_vertices;
                let pen_up = true;
                const started = false;
                for (let index_lines = 0; index_lines < lines.length; index_lines++) {
                    const index_vertex = lines[index_lines];
                    if (index_vertex == Flynn.PEN_UP) {
                    // Pen up
                        points.push(Flynn.PEN_COMMAND);
                        points.push(Flynn.PEN_UP);
                        pen_up = true;
                        continue;
                    }
                    if (index_vertex >= Flynn.PEN_COLOR0) {
                    // Switch colors
                        points.push(Flynn.PEN_COMMAND);
                        points.push(Flynn.PEN_UP);
                        pen_up = true;
                        continue;
                    }

                    // Push new vertex
                    if (pending_disconnect) {
                        pending_disconnect = false;
                        points.push(Flynn.PEN_COMMAND);
                        points.push(Flynn.PEN_UP);
                    }
                    const vertex = vertices[index_vertex];
                    points.push(vertex.x);
                    points.push(vertex.y);
                }
            }

            return (
                new Flynn.Polygon(
                    points,
                    Flynn.Colors.WHITE,
                    1.0, // scale
                    new Victor(0, 0),
                    false, // constrained
                    false // is_world
                )
            );
        },
    });
}()); // "use strict" wrapper
