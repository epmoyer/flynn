(function () { "use strict"; 

Flynn._3DCamera = Class.extend({
    init: function(){
        this.Position = BABYLON.Vector3.Zero();
        this.Target = BABYLON.Vector3.Zero();
    },
});

Flynn._3DMesh = Class.extend({
    init: function(name, verticesCount, lineCount, color){
        this.name = name;
        this.color = color;
        this.Vertices = new Array(verticesCount);
        this.ProjectedVertices = new Array(verticesCount);
        this.Lines = new Array(lineCount);
        this.Rotation = BABYLON.Vector3.Zero();
        this.Position = BABYLON.Vector3.Zero();
    },
});

Flynn._3DMeshCube = Flynn._3DMesh.extend({
    init: function(name, size, color){
        this._super(name, 8, 12, color);
        var loc = size/2;
        this.Vertices[0] = new BABYLON.Vector3( loc,  loc,  loc);
        this.Vertices[1] = new BABYLON.Vector3(-loc,  loc,  loc);
        this.Vertices[2] = new BABYLON.Vector3(-loc, -loc,  loc);
        this.Vertices[3] = new BABYLON.Vector3( loc, -loc,  loc);
        this.Vertices[4] = new BABYLON.Vector3( loc,  loc, -loc);
        this.Vertices[5] = new BABYLON.Vector3(-loc,  loc, -loc);
        this.Vertices[6] = new BABYLON.Vector3(-loc, -loc, -loc);
        this.Vertices[7] = new BABYLON.Vector3( loc, -loc, -loc);

        this.Lines =[
          [0, 1], [1, 2], [2, 3], [3, 0],
          [0, 4], [4, 5], [5, 6], [6, 7],
          [7, 4], [1, 5], [2, 6], [3, 7],
        ];
    },
});

Flynn._3DRenderer = Class.extend({
    DOT_SIZE: 4,

    init: function(width, height){
        this.width = width;
        this.height = height;
    },

    project: function(coord, transMat) {
        var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left.
        var x = point.x * this.width + this.width / 2.0 >> 0;
        var y = -point.y * this.height + this.height / 2.0 >> 0;
        return (new BABYLON.Vector2(x, y));
    },

    render: function(ctx, camera, meshes){
        var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
        var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                0.78, this.width / this.height, 0.01, 1.0);

        for (var index = 0; index < meshes.length; index++) {
            // current mesh to work on
            var cMesh = meshes[index];
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
                //ctx.fillStyle=cMesh.color;
                // Then we can draw on screen
                // ctx.fillRect(
                //     projectedPoint.x,
                //     projectedPoint.y,
                //     this.DOT_SIZE,
                //     this.DOT_SIZE);
            }
            var lines = cMesh.Lines;
            var verts = cMesh.ProjectedVertices;
            for(var indexLines = 0; indexLines < cMesh.Lines.length; indexLines++){
                ctx.vectorStart(cMesh.color, false, false);
                ctx.vectorMoveTo(verts[lines[indexLines][0]].x, verts[lines[indexLines][0]].y);
                ctx.vectorLineTo(verts[lines[indexLines][1]].x, verts[lines[indexLines][1]].y);
            }


        }
    },
});

}()); // "use strict" wrapper