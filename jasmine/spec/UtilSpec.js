describe("Util.minMaxBound()", function() {
    var bottom = 6;
    var top = 9;
    var original_value;
    var bounded_value;

    it("returns original value if within bounds", function() {
        for(original_value=bottom; original_value<=top; ++original_value){
            bounded_value = Flynn.Util.minMaxBound(original_value, bottom, top);
            expect(bounded_value).toEqual(original_value);
        }
    });

    it("returns upper bound for values that are above bounds", function() {
        for(original_value=top+1; original_value<=top+3; ++original_value){
            bounded_value = Flynn.Util.minMaxBound(original_value, bottom, top);
            expect(bounded_value).toEqual(top);
        }
    });

    it("returns lower bound for values that are below bounds", function() {
        for(original_value=bottom-3; original_value<bottom; ++original_value){
            bounded_value = Flynn.Util.minMaxBound(original_value, bottom, top);
            expect(bounded_value).toEqual(bottom);
        }
    });

});

describe("Util.angleBound2Pi()", function() {
    var original_angle;
    var bounded_angle;
    var offset_angle;
    it("returns original angle > 0 and < 2*Pi", function() {
        for(original_angle=0; original_angle<Math.PI*2; original_angle+=Math.PI/8){
            bounded_angle = Flynn.Util.angleBound2Pi(original_angle);
            expect(bounded_angle).toEqual(original_angle);
        }
    });

    it("returns equivalent angle between 0 and 2*Pi if angle > 2*Pi", function() {
        for(offset_angle=Math.PI*2; offset_angle<=Math.PI*4; offset_angle+=Math.PI*2){
            for(original_angle=0; original_angle<=Math.PI*2; original_angle+=Math.PI/8){
                bounded_angle = Flynn.Util.angleBound2Pi(original_angle+offset_angle);
                expect(bounded_angle).toBeCloseTo(original_angle);
            }
        }
    });

    it("returns equivalent angle between 0 and 2*Pi if angle < 0", function() {
        for(offset_angle=-Math.PI*2; offset_angle>=-Math.PI*4; offset_angle-=Math.PI*2){
            for(original_angle=0; original_angle<=Math.PI*2; original_angle+=Math.PI/8){
                bounded_angle = Flynn.Util.angleBound2Pi(original_angle+offset_angle);
                expect(bounded_angle).toBeCloseTo(original_angle);
            }
        }
    });
});

describe("Util.zeroPad()", function() {
    var i;
    var result_text;
    var data = [
        [ 1, 2,     "01"],
        [ 9, 3,    "009"],
        [10, 3,    "010"],
        [99, 3,    "099"],
        [ 9, 6, "000009"],
    ];
    it("returns a zero padded string when passed a number shorter than the requested pad length", function() {
        for(i=0; i<data.length; i++){
            result_text = Flynn.Util.zeroPad(data[i][0], data[i][1]);
            expect(result_text).toEqual(data[i][2]);
        }
    });

    data = [
        [   11, 2, "11"  ],
        [  999, 3, "999" ],
        [ 9999, 3, "9999"],
    ];
    it("returns an unpadded string when passed a number longer than or equal to the requested pad length", function() {
        for(i=0; i<data.length; i++){
            result_text = Flynn.Util.zeroPad(data[i][0], data[i][1]);
            expect(result_text).toEqual(data[i][2]);
        }
    });


});

describe("Victor.fromPolar()", function() {
    // Extend victor
    Flynn.monkeyPatchVictor();

    var i;
    var result_v;
    var data = [
        [ 0, 0,  new Victor(0,0)],
        [ 0, 1,  new Victor(1,0)],
        [ 0, 2,  new Victor(2,0)],
        [ -Math.PI, 2,  new Victor(-2,0)],
    ];
    it("returns a Victor object from polar coordinates", function() {
        for(i=0; i<data.length; i++){
            result_v = Victor.fromPolar(data[i][0], data[i][1]);
            expect(result_v.x).toBeCloseTo(data[i][2].x);
            expect(result_v.y).toBeCloseTo(data[i][2].y);
        }
    });

});

describe("Victor.randomDirection()", function() {
    // Extend victor
    Flynn.monkeyPatchVictor();

    var magnitude;

    it("returns a unit vector when called with no args", function() {
        result_v = Victor.randomDirection();
        expect(result_v.magnitude()).toBeCloseTo(1.0);
    });
    it("returns a vector of the requested magnitude", function() {
        for(magnitude=0; magnitude<3; magnitude += 0.5){
            result_v = Victor.randomDirection(magnitude);
            expect(result_v.magnitude()).toBeCloseTo(magnitude);
        }
    });

});

describe("Victor.boundMagnitude()", function() {
    // Extend victor
    Flynn.monkeyPatchVictor();

    var i;
    var result_v;
    var data = [
        [new Victor(0, 10), 0, new Victor(0, 0)],
        [new Victor(0, 10), 4, new Victor(0, 4)],
        [new Victor(7, 0), 2, new Victor(2, 0)],
        [new Victor(5, 5), 1, new Victor(Math.cos(Math.PI/4), Math.sin(Math.PI/4))],

    ];
    it("returns a Victor object with no greater than the requested max magnitude", function() {
        for(i=0; i<data.length; i++){
            var result_v = data[i][0].boundMagnitude(data[i][1]);
            expect(result_v.magnitude()).toBeCloseTo(data[i][1]);
            expect(result_v.x).toBeCloseTo(data[i][2].x);
            expect(result_v.y).toBeCloseTo(data[i][2].y);
        }
    });

});

describe("Util.validateProperties()", function() {

    it("does nothing if target validates and has no defaults", function() {
        target = {'arg_1': 1, 'arg_2': 2};
        target_copy = Object.assign({}, target);
        var result = Flynn.Util.validateProperties(
            target,
            ['arg_1', 'arg_2'],
            {}
        );
        expect(target).toEqual(target_copy);
    });

    it("adds defaults to target if they do not exist", function() {
        target = {'arg_1': 1, 'arg_2': 2};
        var result = Flynn.Util.validateProperties(
            target,
            ['arg_1', 'arg_2'],
            {'arg_2': 222, 'arg_3': 3, 'arg_4': 4}
        );
        expect(target).toEqual({'arg_1': 1, 'arg_2': 2, 'arg_3':3, 'arg_4': 4});
    });

    it("throws Error if required key does not exist", function() {
        target = {'arg_1': 1, 'arg_2': 2};
        expect( function(){
            Flynn.Util.validateProperties(
                target,
                ['arg_1', 'arg_2', 'arg_3'],
                {}
            );
        }).toThrow(new Error('Required key "arg_3" not present in object.'));
    });

    it("throws Error for unexpected key", function() {
        target = {'arg_1': 1, 'arg_2': 2, 'arg_3': 3};
        expect( function(){
            Flynn.Util.validateProperties(
                target,
                ['arg_1', 'arg_2'],
                {}
            );
        }).toThrow(new Error('Unexpected key "arg_3" in object.'));
    });

});
