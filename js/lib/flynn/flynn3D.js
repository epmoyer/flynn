(function () { "use strict"; 

Flynn._3DCamera = Class.extend({
    init: function(){
        this.Position = BABYLON.Vector3.Zero();
        this.Target = BABYLON.Vector3.Zero();
    },
});

Flynn._3DMesh = Class.extend({
    init: function(name, vertices, lines, color, custom_palette){
        this.name = name;
        this.Vertices = vertices;
        this.Lines = lines;
        this.color = color;
        this.custom_palette = typeof(custom_palette)==='undefined' ? null : custom_palette;

        this.ProjectedVertices = new Array(vertices.length);
        this.CheckVertices = new Array(vertices.length);
        this.Rotation = BABYLON.Vector3.Zero();
        this.Position = BABYLON.Vector3.Zero();
    },
});

Flynn._3DMeshCube = Flynn._3DMesh.extend({
    init: function(name, size, color){
        var loc = size/2;
        var vertices = [
            new BABYLON.Vector3( loc,  loc,  loc),
            new BABYLON.Vector3(-loc,  loc,  loc),
            new BABYLON.Vector3(-loc, -loc,  loc),
            new BABYLON.Vector3( loc, -loc,  loc),
            new BABYLON.Vector3( loc,  loc, -loc),
            new BABYLON.Vector3(-loc,  loc, -loc),
            new BABYLON.Vector3(-loc, -loc, -loc),
            new BABYLON.Vector3( loc, -loc, -loc)
        ];

        var lines =[
          0, 1, 2, 3, 0,  // Top
          4,              // Side 1
          5, 6, 7, 4,     // Bottom
          Flynn.PEN_UP,
          1, 5,           // Side 2
          Flynn.PEN_UP,
          2, 6,           // Side 3
          Flynn.PEN_UP,
          3, 7            // Side 4
        ];

        this._super(name, vertices, lines, color);
    },
});

Flynn._3DMeshFromPoints = Flynn._3DMesh.extend({
    init: function(name, points, scale, color){
        var i;
        var vertices = [];
        var lines = [];
        var num_vertices = 0;
        for(i=0; i<points.length; i+=2){
            if(points[i] == Flynn.PEN_COMMAND){
                if(points[i+1] == Flynn.PEN_UP){
                    lines.push(Flynn.PEN_UP);
                }
                continue;
            }
            vertices.push( new BABYLON.Vector3(
                points[i]*scale,
                0,
                points[i+1]*scale));
            lines.push(num_vertices++);
        }
        this._super(name, vertices, lines, color);
    }
});

Flynn._3DMeshPlate = Flynn._3DMesh.extend({
    init: function(name, width, depth, color){
        var loc_x = width/2;
        var loc_z = depth/2;
        var vertices = [
            new BABYLON.Vector3( loc_x, 0,  loc_z),
            new BABYLON.Vector3(-loc_x, 0,  loc_z),
            new BABYLON.Vector3(-loc_x, 0, -loc_z),
            new BABYLON.Vector3( loc_x, 0, -loc_z),
        ];

        var lines =[0, 1, 2, 3, 0];

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
    init: function(name, ctx, height, color, text, font){
        var i, j, len, len2, character, polygon, pen_up;
        var draw_z = -height/2;
        var vertices = [];
        var lines = [];
        var scale = height;
        var step = scale * font.CharacterSpacing;
        var draw_x = Math.round((-(text.length * step - (font.CharacterGap * scale))) / 2);
        var aspect_ratio = 1.0;

        this._super(name, vertices, lines, color);
        for(i=0, len=text.length; i < len; i++){
            if(i>0){
                // lift pen between characters
                lines.push(Flynn.PEN_UP);
            }
            character = text.charCodeAt(i);

            if (character === ctx.SPACECODE){
                draw_x += step;
                continue;
            }
            polygon = ctx.charToPolygon(character, font);

            pen_up = false;
            for (j=0, len2=polygon.length; j<len2; j+=2){
                if(polygon[j]==Flynn.PEN_COMMAND){
                    pen_up = true;
                    lines.push(Flynn.PEN_UP);
                }
                else{
                    vertices.push(
                        new BABYLON.Vector3(
                            polygon[j] * scale + draw_x,
                            0,
                            polygon[j + 1] * scale / aspect_ratio + draw_z)
                    );
                    if(j===0 || pen_up){
                        pen_up = false;
                    }
                    lines.push(vertices.length - 1);
                }
            }
            draw_x += step;
        }
        this._super(name, vertices, lines, color);
    },
});

Flynn._3DRenderer = Class.extend({
    VERTEX_SIZE: 2,

    init: function(opts){
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
        //        vertices (per the mesh.Lines array)
        //    enable_distance_order: (boolean) Set true to sort meshes by their
        //        distance from the camera and draw in order from farthest 
        //        to closest.
        //         
        opts                       = opts                    || {};
        this.width                 = opts.width              || Flynn.mcp.canvasWidth;
        this.height                = opts.height             || Flynn.mcp.canvasHeight;
        this.fog_distance          = opts.fog_distance       || null;
        this.enable_vertices       = opts.enable_vertices    || false;
        this.enable_lines          = Flynn.Util.defaultTrue(opts.enable_lines);
        this.enable_distance_order = Flynn.Util.defaultTrue(opts.enable_distance_order);
    },

    project: function(coord, transMat) {
        var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left.
        // var x = point.x * this.width + this.width / 2.0 >> 0;
        // var y = -point.y * this.height + this.height / 2.0 >> 0;
        var x = point.x * this.width + this.width / 2.0;
        var y = -point.y * this.height + this.height / 2.0;
        return (new BABYLON.Vector3(x, y, point.z));
    },

    prepare: function(camera){
        // Prepare a transformation matrix for future point rendering using .renderPoint()
        var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
        var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);
        this.pointTransformMatrix = viewMatrix.multiply(projectionMatrix);
    },

    renderPoint: function(ctx, location_v, size, color, alpha){
        // Must call .prepare() before calling this method
        var projectedPoint = this.project(location_v, this.pointTransformMatrix);
        ctx.fillStyle=color;
        ctx.fillRect(
            projectedPoint.x - size/2,
            projectedPoint.y - size/2,
            size,
            size,
            alpha);
    },

    projectPoint: function(location_v){
        // Must call .prepare() before calling this method
        return(this.project(location_v, this.pointTransformMatrix));
    },

    render: function(ctx, camera, meshes){
        var cMesh;

        var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
        var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

        var color;
        var dim_factor = 0;
        var visible;
        var draw_list = [];
        for (var index = 0; index < meshes.length; index++) {
            // current mesh to work on
            cMesh = meshes[index];

            //------------------------
            // Find distance to mesh
            //------------------------
            var distance = 0;
            if(this.fog_distance || this.enable_distance_order){
                distance = BABYLON.Vector3.Distance(camera.Position, cMesh.Position);
            }

            //------------------------
            // Distance fogging
            //------------------------
            visible = true;
            color = cMesh.color;
            if(this.fog_distance){
                if(distance > this.fog_distance.far){
                    visible = false;
                }
                else if (distance > this.fog_distance.near){
                    dim_factor = -((distance - this.fog_distance.near) / 
                        (this.fog_distance.far - this.fog_distance.near));
                    color = Flynn.Util.shadeColor(cMesh.color, dim_factor);
                }
            }

            
            if(visible){
                //------------------------------
                // Project vertices to screen
                //------------------------------
                // Apply rotation before translation
                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
                     .multiply(BABYLON.Matrix.Translation(
                       cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));

                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
                // Transform for checking whether vertices are behind camera
                var transformCheckMatrix = worldMatrix.multiply(viewMatrix);

                for (var indexVertices = 0; indexVertices < cMesh.Vertices.length; indexVertices++) {
                    // First, we project the 3D coordinates into the 2D space
                    var projectedPoint = this.project(cMesh.Vertices[indexVertices], transformMatrix);
                    cMesh.ProjectedVertices[indexVertices] = projectedPoint;
                    cMesh.CheckVertices[indexVertices] = BABYLON.Vector3.TransformCoordinates(cMesh.Vertices[indexVertices], transformCheckMatrix);

                    if(this.enable_vertices && cMesh.CheckVertices[indexVertices].z>0){
                        // Draw vertices
                        ctx.fillStyle=color;
                        ctx.fillRect(
                            projectedPoint.x - this.VERTEX_SIZE/2,
                            projectedPoint.y - this.VERTEX_SIZE/2,
                            this.VERTEX_SIZE,
                            this.VERTEX_SIZE);
                    }
                }
                draw_list.push({mesh_index:index, distance:distance, color:color, dim_factor:dim_factor});
            }
        }


        if(this.enable_lines){
            
            // Sort draw order by distance
            if(this.enable_distance_order){
                draw_list.sort(function(a,b){return b.distance - a.distance;});
            }

            //------------------------
            // Draw vectors
            //------------------------
            for(var i=0; i<draw_list.length; i++){
                var target = draw_list[i];
                color = target.color;
                cMesh = meshes[target.mesh_index];
                var lines = cMesh.Lines;
                var vertices = cMesh.ProjectedVertices;
                var pen_up = true;
                var started = false;
                for(var index_lines = 0; index_lines < lines.length; index_lines++){
                    var index_vertex = lines[index_lines];
                    if (index_vertex == Flynn.PEN_UP){
                        // Pen up
                        ctx.vectorEnd();
                        pen_up = true;
                        continue;
                    }
                    if (index_vertex >= Flynn.PEN_COLOR0){
                        // Switch colors
                        var color_index = index_vertex-Flynn.PEN_COLOR0;
                        if(cMesh.custom_palette == null){
                            color = Flynn.ColorsOrdered[color_index];
                        }
                        else{
                            color = cMesh.custom_palette[color_index];
                        }
                        if(target.dim_factor != 0){
                            color = Flynn.Util.shadeColor(color, target.dim_factor);
                        }
                        if(started){
                            ctx.vectorEnd();
                        }
                        pen_up = true;
                        continue;
                    }
                    var vertex = vertices[index_vertex];
                    if(pen_up){
                        // Start line if vertex in front of camera
                        if(cMesh.CheckVertices[index_vertex].z >0){
                            ctx.vectorStart(color, false, false);
                            ctx.vectorMoveTo(vertex.x, vertex.y);
                            pen_up = false;
                            started = true;
                        }
                    }
                    else{
                        // Draw line if vertex in front of camera
                        if(cMesh.CheckVertices[index_vertex].z >0){
                            ctx.vectorLineTo(vertex.x, vertex.y);
                        }
                    }
                }
                if(started){
                    ctx.vectorEnd();
                }
            }
        }
    },

    renderToPolygon: function(camera, meshes){
        // Given a camera and a list of meshes, return a Flynn.Polygon containing the rendered lines.
        // 
        // Note:
        // * Polygons do not (yet) support custom palettes, so this method always renders a 
        //   monochromatic polygon.
        // * This method does no distance ordering or fogging.
        //
        var cMesh;

        var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
        var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

        var color;
        var points = [];
        var pending_disconnect = false
        for (var index = 0; index < meshes.length; index++) {

            // If polygon points exist (from a previous mesh), append a 
            // PEN_UP command do disconnect the previous mesh from the next.
            pending_disconnect = points.length == 0 ? false : true;

            // current mesh to work on
            cMesh = meshes[index];

            //------------------------------
            // Project vertices to screen
            //------------------------------
            // Apply rotation before translation
            var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
                 .multiply(BABYLON.Matrix.Translation(
                   cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));

            var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
            // Transform for checking whether vertices are behind camera
            var transformCheckMatrix = worldMatrix.multiply(viewMatrix);

            for (var indexVertices = 0; indexVertices < cMesh.Vertices.length; indexVertices++) {
                // First, we project the 3D coordinates into the 2D space
                var projectedPoint = this.project(cMesh.Vertices[indexVertices], transformMatrix);
                cMesh.ProjectedVertices[indexVertices] = projectedPoint;
            }            

            //------------------------
            // Compose vectors
            //------------------------
            var lines = cMesh.Lines;
            var vertices = cMesh.ProjectedVertices;
            var pen_up = true;
            var started = false;
            for(var index_lines = 0; index_lines < lines.length; index_lines++){
                var index_vertex = lines[index_lines];
                if (index_vertex == Flynn.PEN_UP){
                    // Pen up
                    points.push(Flynn.PEN_COMMAND);
                    points.push(Flynn.PEN_UP);
                    pen_up = true;
                    continue;
                }
                if (index_vertex >= Flynn.PEN_COLOR0){
                    // Switch colors
                    points.push(Flynn.PEN_COMMAND);
                    points.push(Flynn.PEN_UP);
                    pen_up = true;
                    continue;
                }

                // Push new vertex
                if(pending_disconnect){
                    pending_disconnect = false;
                    points.push(Flynn.PEN_COMMAND);
                    points.push(Flynn.PEN_UP);
                }
                var vertex = vertices[index_vertex];
                points.push(vertex.x);
                points.push(vertex.y);
            }
        }

        return(
            new Flynn.Polygon(
                points,
                Flynn.Colors.WHITE,
                1.0, // scale
                new Victor(0,0),
                false, // constrained
                false  // is_world
            )
        );
    },
});

}()); // "use strict" wrapper