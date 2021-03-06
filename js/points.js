var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.Points = {
    SHIP:   [0,-6,-3,3,0,2,3,3,0,-6],
    SHIPB:  [0,-6,1,-3,2,-4,3,2,0,1,-3,2,-2,-4,-1,-3,0,-6],
    POINTY_SHIP: [3,0,5,-2,1,-1,2,-3,-3,-6,0,-3,-1,-1,-2,-1,-1,0,-2,1,-1,1,0,3,-3,6,2,3,1,1,5,2,3,0],
    ABSTRACT: [5,-1,5,1,2,2,2,-2,-2,2,-2,-2,-5,-1,-5,1,-2,2,2,2,-2,-2,-1,-5,1,-5,2,-2,-2,-2,-2,2,-1,5,1,5,2,2,2,-2,5,-1],
    STAR_WING: [5,0,2,-2,0,-1,-2,-2,-1,-4,-3,-2,-4,-2,-4,-1,-3,0,-4,1,-4,2,-3,2,-1,4,-2,2,0,1,2,2,5,0],
    RESPAWN: [1,-2,0,-6,-1,-2,-3,-3,-2,-1,-6,0,-2,1,-3,3,-1,2,0,6,1,2,3,3,2,1,6,0,2,-1,3,-3,1,-2],
    // CARET: [0,-4,10,8,0,1.78,-10,8,0,-4],
    // CARET: [0,-17,-10,-5,0,-11.22,10,-5,0,-17],
    CARET: [0,-17,10,-5,0,-11.22,-10,-5,0,-17],
    // CARET: [0,-4,10,8,0,1.78,-10,8,0,-4],

    DRONE: [9000,8003,0,-3,3,0,0,3,-3,0,0,-3],

    PENUP_TEST1: [-3,-5,-3,5,-7,0,-3,-5,9000,7000,3,-5,3,5,7,0,3,-5],
    PENUP_TEST2: [-2,0,-5,-3,-5,3,-2,0,9000,7000,0,-2,-3,-5,3,-5,0,-2,9000,7000,2,0,5,-3,5,3,2,0,9000,7000,0,2,3,5,-3,5,0,2],
    PENUP_TEST3: [-3,1,-4,0,-3,-1,-8,-6,-8,-2,-6,0,-8,2,-8,6,-3,1,9000,7000,-1,3,-6,8,-2,8,0,6,2,8,6,8,1,3,0,4,-1,3,9000,7000,3,-1,4,0,3,1,8,6,8,2,6,0,8,-2,8,-6,3,-1,9000,7000,1,-3,0,-4,-1,-3,-6,-8,-2,-8,0,-6,2,-8,6,-8,1,-3],
    PENUP_TEST4: [-5,-5,-5,5,3,0,-5,-5,9000,7000,5,-5,5,5,-3,0,5,-5],
    PENUP_TEST5: [0,-4,-1,-1,-4,0,-1,1,0,4,1,1,4,0,1,-1,0,-4,9000,7000,0,-7,2,-2,7,0,2,2,0,7,-2,2,-7,0,-2,-2,0,-7],
    PENUP_TEST6: [-5,-7,-1,-7,-3,7,-5,-7,9000,7000,1,7,3,-7,5,7,1,7,9000,7000,7,-5,7,-1,-7,-3,7,-5,9000,7000,-7,1,-7,5,7,3,-7,1],

    MUTICOLOR1: [-4,-4,9000,8004,-4,4,4,4,9000,8005,4,-4,-4,-4],
    MUTICOLOR2: [-4,-2,9000,8004,-4,4,2,4,9000,7000,4,2,9000,8005,4,-4,-2,-4],
    MUTICOLOR3: [-1,-1,9000,8005,-1,-4,-4,-4,-4,-1,-1,-1,9000,7000,-1,1,9000,8004,-4,1,-4,4,-1,4,-1,1,9000,7000,1,1,9000,8006,1,4,4,4,4,1,1,1,9000,7000,1,-1,9000,8003,4,-1,4,-4,1,-4,1,-1],
    MUTICOLOR4: [0,-3,9000,8006,-1,0,-2,-1,-2,2,0,1,2,2,2,-1,1,0,0,-3,9000,7000,2,0,9000,8007,4,2,2,2,9000,7000,-2,0,-4,2,-2,2],
    MUTICOLOR5: [0,-6,9000,8005,-2,-2,-3,-3,-3,1,-6,-1,-9,3,-6,2,-5,4,0,3,5,4,6,2,9,3,6,-1,3,1,3,-3,2,-2,0,-6,9000,7000,0,-4,9000,8004,-1,-3,-1,1,0,0,1,1,1,-3,0,-4,9000,7000,1,2,9000,8003,6,1,4,3,1,2,9000,7000,-1,2,-6,1,-4,3,-1,2,9000,7000,-5,4,9000,8006,-1,5,0,3,1,5,5,4],
    MUTICOLOR6: [-4,-5,9000,8014,-2,-5,0,-3,2,-5,4,-5,4,-3,3,-2,3,-1,4,0,3,1,3,2,4,3,4,5,2,5,0,3,-2,5,-4,5,-4,3,-3,2,-3,1,-4,0,-3,-1,-3,-2,-4,-3,-4,-5,9000,7000,-3,-4,9000,8015,-2,-2,-2,-1,-3,0,-2,1,-2,2,-3,4,0,2,3,4,2,2,2,1,3,0,2,-1,2,-2,3,-4,0,-2,-3,-4,9000,7000,0,-1,9000,8001,-2,0,0,1,2,0,0,-1],

    COLLISION1: [-1,-6,-7,0,-1,6,-4,1,4,1,1,6,7,0,1,-6,4,-1,-4,-1,-1,-6],
    COLLISION2: [-8,1,-6,1,-6,9,-3,9,-3,1,8,1,8,-2,2,-2,0,-8,-2,-2,-8,-2,-8,1],

    TRI4_MAIN: [1,1,9000,8005,1,3,3,1,1,1,9000,7000,3,-1,9000,8006,1,-3,1,-1,3,-1,9000,7000,-1,1,9000,8003,-1,3,-3,1,-1,1,9000,7000,-1,-1,9000,8004,-3,-1,-1,-3,-1,-1,9000,8004],
    TRI4_BOUNDS: [1,3,3,1,3,-1,1,-3,-1,-3,-3,-1,-3,1,-1,3,1,3],

    CROSSHAIR: [-1,-1,9000,8003,-3,-3,9000,7000,3,-3,1,-1,9000,7000,1,1,3,3,9000,7000,-3,3,-1,1,9000,7000,-5,-5,9000,8006,5,-5,5,5,-5,5,-5,-5,9000,8006],

    SPIRAL: [9000,8004,0,0,0,-1,1,-1,1,1,-1,1,9000,8005,-1,-2,2,-2,2,2,9000,8006,-2,2,-2,-3,2,-3],
};

}()); // "use strict" wrapper