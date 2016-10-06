// flynnMain
//------------
// This must be the first flynn script loaded

if (typeof Flynn == "undefined") {
  var Flynn = {};  // Create namespace
}

Flynn.init = function(
    canvasWidth,
    canvasHeight,
    noChangeState,
    gameSpeedFactor, 
    stateBuilderFunc){
    
    // The mcp will regester itself as Flynn.mcp when created
    new Flynn.Mcp(
        canvasWidth,
        canvasHeight,
        noChangeState,
        gameSpeedFactor,
        stateBuilderFunc);
};

Flynn.TICKS_PER_SECOND = 60;

Flynn.DevPacingMode = {
    NORMAL:  0,
    SLOW_MO: 1,
    FPS_20:  2,
};

//------------
// Colors 
//------------
Flynn.Colors = {
    BLACK:        "#000000",
    BLUE:         "#2020FF",
    WHITE:        "#FFFFFF",
    GREEN:        "#00FF00",
    YELLOW:       "#FFFF00",
    RED:          "#FF0000",
    CYAN:         "#00FFFF",
    MAGENTA:      "#FF00FF",
    CYAN_DK:      "#008080",
    ORANGE:       "#E55300",
    BROWN:        "#8B4513",
    YELLOW_DK:    "#807000",
    GRAY:         "#808080",
    GRAY_DK:      "#404040",
    LIGHTSKYBLUE: "#87CEFA",
    DODGERBLUE:   "#1E90FF",
    LIGHTBLUE:    "#ADD8E6",
};

Flynn.ColorsOrdered=[
    Flynn.Colors.BLACK,        // 00 
    Flynn.Colors.BLUE,         // 01
    Flynn.Colors.WHITE,        // 02
    Flynn.Colors.GREEN,        // 03
    Flynn.Colors.YELLOW,       // 04
    Flynn.Colors.RED,          // 05
    Flynn.Colors.CYAN,         // 06
    Flynn.Colors.MAGENTA,      // 07
    Flynn.Colors.CYAN_DK,      // 08
    Flynn.Colors.ORANGE,       // 09
    Flynn.Colors.BROWN,        // 10
    Flynn.Colors.YELLOW_DK,    // 11
    Flynn.Colors.GRAY,         // 12
    Flynn.Colors.GRAY_DK,      // 13
    Flynn.Colors.LIGHTSKYBLUE, // 14
    Flynn.Colors.DODGERBLUE,   // 15
    Flynn.Colors.LIGHTBLUE,    // 16
];

//------------
// Keyboard input 
//------------
Flynn.KeyboardMap = {
    'num_0':        48,
    'num_1':        49,
    'num_2':        50,
    'num_3':        51,
    'num_4':        52,
    'num_5':        53,
    'num_6':        54,
    'num_7':        55,
    'num_8':        56,
    'num_9':        57,

    'a':        65,
    'b':        66,
    'c':        67,
    'd':        68,
    'e':        69,
    'f':        70,
    'g':        71,
    'h':        72,
    'i':        73,
    'j':        74,
    'k':        75,
    'l':        76,
    'm':        77,
    'n':        78,
    'o':        79,
    'p':        80,
    'q':        81,
    'r':        82,
    's':        83,
    't':        84,
    'u':        85,
    'v':        86,
    'w':        87,
    'x':        88,
    'y':        89,
    'z':        90,

    'single_quote':  222, // '
    'comma':         188, // ,
    'dash':          189, // -
    'period':        190, // .
    'forward_slash': 191, // /
    'semicolon':     186, // ;
    'equals':        187, // =
    'left_bracket':  219, // [
    'backslash':     220, // \
    'right_bracket': 221, // ]
    'grave_accent':  192, // `

    'tab':      9,
    'enter':    13,
    'shift':    16,
    'control':  17,
    'option':   18,
    'escape':   27,
    'spacebar': 32,
    'left':     37,
    'up':       38,
    'right':    39,
    'down':     40,
    'command':  91,

    'f1':       112,
    'f2':       113,
    'f3':       114,
    'f4':       115,
    'f5':       116,
    'f6':       117,
    'f7':       118,
    'f8':       119,
    'f9':       120,
    'f10':      121,
    'f11':      122,
    'f12':      123,

    'icade_up':    -1,
    'icade_down':  -2,
    'icade_left':  -3,
    'icade_right': -4,
    'icade_t1':    -5,
    'icade_t2':    -6,
    'icade_t3':    -7,
    'icade_t4':    -8,
    'icade_b1':    -9,
    'icade_b2':    -10,
    'icade_b3':    -11,
    'icade_b4':    -12,
};


//------------
// Points
//------------
Flynn.Points = {
    FLYNN_LOGO: [9000,8014,-21,-9,-21,5,-19,5,-19,-1,-15,-1,-15,-3,-19,-3,-19,-7,17,-7,17,-9,-21,-9,9000,7000,-13,5,-13,-5,-11,-5,-11,3,-7,3,-7,5,-13,5,9000,7000,-9,-5,9000,8005,-4,0,-4,5,-2,5,-2,0,3,-5,0,-5,-3,-2,-6,-5,-9,-5,9000,7000,1,5,9000,8014,1,-1,9000,8001,4,-4,9000,8014,6,0,6,-5,8,-5,8,5,6,5,3,-1,3,5,1,5,9000,7000,10,-5,10,5,12,5,12,-1,15,5,17,5,17,-5,15,-5,15,0,13,-5,10,-5,9000,7000,19,-9,19,7,-21,7,-21,9,21,9,21,-9,19,-9],
};

//------------
// Vector Font 
//------------
Flynn.PEN_COMMAND = 9000;
Flynn.PEN_UP      = 7000;
Flynn.PEN_COLOR0  = 8000;

Flynn.Font = {
    UnimplementedChar: [0,6,0,0,4,0,4,6,0,6,4,0,4,6,0,0,0,6],
    CharacterHeight: 6,
    CharacterWidth: 4,
    CharacterGap: 2
};
Flynn.Font.CharacterSpacing = Flynn.Font.CharacterWidth + Flynn.Font.CharacterGap;
Flynn.Font.Points = {
    UNIMPLEMENTED_CHAR: Flynn.Font.UnimplementedChar,
    
    ASCII: [
        [1,0,2,5,1.5,5,1.5,6,2.5,6,2.5,5,2,5,3,0,1,0],                       // !
        [1,0,1,1,9000,7000,3,0,3,1],                                         // "
        [1,5,1,1,9000,7000,0,2,4,2,9000,7000,3,1,3,5,9000,7000,4,4,0,4],     // #
        [0,6,3,6,4,5,4,4,3,3,1,3,0,2,0,1,1,0,4,0,9000,7000,2,0,2,6],         // $        
        [0,6,4,0,9000,7000,2,5,2,1,0,1,0,3,4,3,4,5,2,5],                     // %  
        [4,6,1,2,1,1,2,0,3,1,3,2,0,4,0,5,1,6,2,6,4,4],                       // &  
        [2,0,2,1,2,0],                                                       // '  
        [4,6,3,6,2,5,2,1,3,0,4,0],                                           // (  
        [1,0,2,0,3,1,3,5,2,6,1,6],                                           // )  
        [0,1,4,5,9000,7000,2,5,2,1,9000,7000,4,3,0,3,9000,7000,0,5,4,1],     // *  
        [2,5,2,1,9000,7000,0,3,4,3],                                         // +  
        [2,5,1,6,2,5],                                                       // ,  
        [1,3,3,3],                                                           // -  
        [1.5,6,1.5,5,2.5,5,2.5,6,1.5,6],                                     // .  
        [1,6,3,0,1,6],                                                       // /  
        [0,0,0,6,4,6,4,0,0,0],                                               // 0
        [2,0,2,6],                                                           // 1
        [0,0,4,0,4,3,0,3,0,6,4,6],                                           // 2
        [0,0,4,0,4,6,0,6,9000,7000,0,3,4,3],                                 // 3
        [4,6,4,0,9000,7000,0,0,0,3,4,3],                                     // 4
        [4,0,0,0,0,3,4,3,4,6,0,6],                                           // 5
        [0,0,0,6,4,6,4,3,0,3],                                               // 6
        [0,0,4,0,4,6],                                                       // 7
        [4,0,4,6,0,6,0,0,4,0,9000,7000,0,3,4,3],                             // 8
        [4,3,0,3,0,0,4,0,4,6],                                               // 9
        [2,1,1.5,1.5,2,2,2.5,1.5,2,1,9000,7000,2,4,1.5,4.5,2,5,2.5,4.5,2,4], // :
        [2,1,1.5,1.5,2,2,2.5,1.5,2,1,9000,7000,1.5,4,2.5,4,1.5,6,1.5,4],     // ;
        [4,1,0,3,4,5,0,3,4,1],                                               // <  
        [0,1.5,4,1.5,9000,7000,0,4.5,4,4.5],                                 // = 
        [0,1,4,3,0,5,4,3,0,1],                                               // >  
        [0,2,0,1,1,0,3,0,4,1,4,2,2,3,2,6,2,3,4,2,4,1,3,0,1,0,0,1,0,2],       // ?  
        [3,4,3,2,1,2,1,4,4,4,4,2,3,1,1,1,0,2,0,4,1,5,3,5],                   // @
        [0,6,0,2,2,0,4,2,4,6,9000,7000,0,4,4,4],                             // A
        [2,3,3,4,3,5,2,6,0,6,0,0,2,0,3,1,3,2,2,3,0,3],                       // B
        [4,0,0,0,0,6,4,6],                                                   // C
        [0,0,0,6,2,6,4,4,4,2,2,0,0,0],                                       // D
        [4,0,0,0,0,6,4,6,9000,7000,0,3,4,3],                                 // E
        [0,6,0,0,4,0,9000,7000,0,3,3,3],                                     // F
        [4,2,4,0,0,0,0,6,4,6,4,4,2,4],                                       // G
        [0,0,0,6,9000,7000,4,6,4,0,9000,7000,0,3,4,3],                       // H
        [0,0,4,0,9000,7000,0,6,4,6,9000,7000,2,0,2,6],                       // I
        [4,0,4,6,2,6,0,4],                                                   // J
        [0,0,0,6,9000,7000,3,6,0,3,3,0],                                     // K
        [0,0,0,6,4,6],                                                       // L
        [0,6,0,0,2,2,4,0,4,6],                                               // M
        [0,6,0,0,4,6,4,0],                                                   // N
        [0,0,4,0,4,6,0,6,0,0],                                               // O
        [0,6,0,0,4,0,4,3,0,3],                                               // P
        [0,0,0,6,2,6,4,4,4,0,0,0,9000,7000,2,4,4,6],                         // Q
        [0,3,4,3,4,0,0,0,0,6,9000,7000,4,6,1,3],                             // R
        [4,0,0,0,0,3,4,3,4,6,0,6],                                           // S
        [0,0,4,0,9000,7000,2,6,2,0],                                         // T
        [0,0,0,6,4,6,4,0],                                                   // U
        [0,0,2,6,4,0],                                                       // V
        [0,0,0,6,2,4,4,6,4,0],                                               // W
        [0,0,4,6,9000,7000,4,0,0,6],                                         // X
        [2,6,2,3,4,0,9000,7000,0,0,2,3],                                     // Y
        [0,0,4,0,0,6,4,6],                                                   // Z
        [3,0,1,0,1,6,3,6],                                                   // [  
        [1,0,3,6],                                                           // /  
        [1,0,3,0,3,6,1,6],                                                   // ]  
        [1,1,2,0,3,1],                                                       // ^ 
        [0,6,4,6],                                                           // _
        [1.5,0,2.5,1],                                                       // `
    ],
};

Flynn.Rect= Class.extend({
    init: function(left, top, width, height){
        this.object_id = 'Flynn.Rect';

        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.center_x = this.left + this.width/2;
        this.center_y = this.top + this.height/2;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    },

    clone: function(){
        return new Flynn.Rect(
            this.left,
            this.top,
            this.width,
            this.height
            );
    }
});