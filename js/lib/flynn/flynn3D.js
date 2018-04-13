(function () { "use strict"; 

Flynn._3DCamera = Class.extend({
    init: function(){
        this.Position = BABYLON.Vector3.Zero();
        this.Target = BABYLON.Vector3.Zero();
    },
});

Flynn._3DMesh = Class.extend({
    init: function(name, vertices, lines, color){
        this.name = name;
        this.color = color;
        this.Vertices = vertices;
        this.ProjectedVertices = new Array(vertices.length);
        this.Lines = lines;
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

Flynn._3DRenderer = Class.extend({
    DOT_SIZE: 4,

    init: function(width, height, fog_distance){
        this.width = width;
        this.height = height;
        this.fog_distance = fog_distance;
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
        return (new BABYLON.Vector2(x, y));
    },

    render: function(ctx, camera, meshes){
        var cMesh;

        var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
        var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

        var color;
        var visible;
        var draw_list = [];
        for (var index = 0; index < meshes.length; index++) {
            // current mesh to work on
            cMesh = meshes[index];
            // Beware to apply rotation before translation
            var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
                 .multiply(BABYLON.Matrix.Translation(
                   cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));

            var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);

            for (var indexVertices = 0; indexVertices < cMesh.Vertices.length; indexVertices++) {
                // First, we project the 3D coordinates into the 2D space
                var projectedPoint = this.project(cMesh.Vertices[indexVertices], transformMatrix);
                cMesh.ProjectedVertices[indexVertices] = projectedPoint;

                // Draw vertices
                //ctx.fillStyle=cMesh.color;
                // ctx.fillRect(
                //     projectedPoint.x,
                //     projectedPoint.y,
                //     this.DOT_SIZE,
                //     this.DOT_SIZE);
            }

            visible = true;
            color = cMesh.color;
            var distance = 0;
            if(this.fog_distance){
                distance = BABYLON.Vector3.Distance(camera.Position, cMesh.Position);
                if(distance > this.fog_distance.far){
                    visible = false;
                }
                else if (distance > this.fog_distance.near){
                    var dim_factor = -((distance - this.fog_distance.near) / 
                        (this.fog_distance.far - this.fog_distance.near));
                    color = Flynn.Util.shadeColor(cMesh.color, dim_factor);
                }
            }
            if(visible){
                draw_list.push({mesh_index:index, distance:distance, color:color});
            }
        }

        // Sort draw order by distance
        draw_list.sort(function(a,b){return b.distance - a.distance;});

        for(var i=0; i<draw_list.length; i++){
            var target = draw_list[i];
            cMesh = meshes[target.mesh_index];
            var lines = cMesh.Lines;
            var vertices = cMesh.ProjectedVertices;
            var pen_up = true;
            var started = false;
            for(var index_lines = 0; index_lines < lines.length; index_lines++){
                var index_vertex = lines[index_lines];
                if (index_vertex == Flynn.PEN_UP){
                    ctx.vectorEnd();
                    pen_up = true;
                    continue;
                }
                var vertex = vertices[index_vertex];
                if(pen_up){
                    ctx.vectorStart(target.color, false, false);
                    ctx.vectorMoveTo(vertex.x, vertex.y);
                    pen_up = false;
                    started = true;
                }
                else{
                    ctx.vectorLineTo(vertex.x, vertex.y);
                }
            }
            if(started){
                ctx.vectorEnd();
            }
        }
    },
});

}()); // "use strict" wrapper