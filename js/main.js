var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.CANVAS_HEIGHT = 768;
Game.CANVAS_WIDTH = 1024;
Game.SPEED_FACTOR = 1.0;

Game.BORDER_MARGIN = 3;
Game.BANNER_FONT_SCALE = 2;
Game.BANNER_HEIGHT = 28;

// The primary page display bounds (excludes the banner)
Game.BOUNDS = new Flynn.Rect(
    Game.BORDER_MARGIN,
    Game.BORDER_MARGIN + Game.BANNER_HEIGHT,
    Game.CANVAS_WIDTH - 2 * Game.BORDER_MARGIN,
    Game.CANVAS_HEIGHT - 2 * Game.BORDER_MARGIN - Game.BANNER_HEIGHT
    );

// The primary page font scale
Game.FONT_SCALE = 1.5;
Game.FONT_MARGIN_LEFT = 9;
Game.FONT_MARGIN_TOP = Flynn.Font.Normal.CharacterHeight * Game.FONT_SCALE + Game.FONT_MARGIN_LEFT;
Game.FONT_MARGIN_TOP = Game.FONT_MARGIN_LEFT;

Game.States = {
    NO_CHANGE: 0,
    
    HOME:        1,
    TEXT:        2,
    BOX2D:       3,
    COLLISION:   4,
    WORLD:       5,
    FONT:        6,
    UTIL:        7,
    PERFORMANCE: 8,
    INFO:        9,

    LAST_PAGE: 9, // Match highest page above (used for navigation)

    END:       90,
    CONFIG:    91,
};

Game.Main = Class.extend({
    
    init: function() {

        var self = this;
        
        Flynn.init(
            Game.CANVAS_WIDTH,
            Game.CANVAS_HEIGHT, 
            Game.States.NO_CHANGE,
            Game.SPEED_FACTOR,
            function(state){
                switch(state){
                    case Game.States.HOME:
                        return new Game.StateHome();
                    case Game.States.TEXT:
                        return new Game.StateText();
                    case Game.States.BOX2D:
                        return new Game.StateBox2d();
                    case Game.States.COLLISION:
                        return new Game.StateCollision();
                    case Game.States.WORLD:
                        return new Game.StateWorld();
                    case Game.States.FONT:
                        return new Game.StateFont();
                    case Game.States.UTIL:
                        return new Game.StateUtil();
                    case Game.States.PERFORMANCE:
                        return new Game.StatePerformance();
                    case Game.States.INFO:
                        return new Game.StateInfo();
                    case Game.States.END:
                        return new Flynn.StateEnd(
                            Game.config.score,
                            Game.config.leaderboard,
                            Flynn.Colors.GREEN,
                            'HIGH SCORES',
                            "YOU'VE MADE IT TO THE HIGH SCORE LIST!",
                            Game.States.HOME // Parent state
                            );
                    case Game.States.CONFIG:
                        return new Flynn.StateConfig(
                            Flynn.Colors.CYAN, 
                            Flynn.Colors.YELLOW, 
                            Flynn.Colors.GREEN,
                            Flynn.Colors.MAGENTA,
                            Game.States.HOME, // Parent state
                            Game.States.HOME, // Abort state
                            false             // Abort enable
                            );
                }
            }
        );
        Flynn.mcp.changeState(Game.States.HOME);

        Game.config = {};
        Game.config.score = 500000;
        Game.config.leaderboard = new Flynn.Leaderboard(
            ['name', 'score'],  // attributeList
            6,                  // maxItems
            true                // sortDescending
            );
        Game.config.leaderboard.setDefaultList(
            [
                {'name': 'FLOATINHEAD', 'score': 6000000},
                {'name': 'FIENDFODDER', 'score':  500000},
                {'name': 'DIO',         'score':   40000},
                {'name': 'JOTARO',      'score':    3000},
                {'name': 'JOSEPH',      'score':     200},
                {'name': 'JONATHAN',    'score':      10},
            ]);
        Game.config.leaderboard.loadFromCookies();
        Game.config.leaderboard.saveToCookies();

        // Setup inputs
        var input = Flynn.mcp.input;
        if(!Flynn.mcp.iCadeModeEnabled){
            input.addVirtualButton('fire_l', Flynn.KeyboardMap.z, Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('fire_r', Flynn.KeyboardMap.spacebar, Flynn.BUTTON_CONFIGURABLE);
            // Apologies to the world.  The default WASD is WARS because all my keyboards are Colemak :) 
            input.addVirtualButton('up', Flynn.KeyboardMap.w, Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('left', Flynn.KeyboardMap.a, Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('down', Flynn.KeyboardMap.r, Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('right', Flynn.KeyboardMap.s, Flynn.BUTTON_CONFIGURABLE);
        }
        else{
            input.addVirtualButton('fire_l', Flynn.KeyboardMap.icade_t2, Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('fire_r', Flynn.KeyboardMap.icade_t1, Flynn.BUTTON_NOT_CONFIGURABLE);
        }
        

        if(Flynn.mcp.developerModeEnabled){
            input.addVirtualButton('dev_metrics', Flynn.KeyboardMap.num_6, Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_slow_mo', Flynn.KeyboardMap.num_7, Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_fps_20', Flynn.KeyboardMap.backslash, Flynn.BUTTON_NOT_CONFIGURABLE);
        }

        //----------------------
        // Sounds
        //----------------------
        Game.sounds = {
            music:{ 
                background: new Howl({
                    // src: ['sounds/SpaceThemev3.mp3'],
                    src: ['sounds/DST-Horizon515.mp3'],
                    loop: true,
                    buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
                    volume: 0.5 }),
            },

            // Interface
            acknowledge: new Howl({
                src: ['sounds/InsertCoin.ogg','sounds/InsertCoin.mp3'],
                volume: 0.5 }),
            navigate: new Howl({
                src: ['sounds/MenuBlip.ogg','sounds/MenuBlip.mp3'],
                volume: 1.0 }),
        };

        Game.updateMusic = function(){
            var enabled = (
                Flynn.mcp.optionManager.getOption('musicEnabled') &&
                Flynn.mcp.optionManager.getOption('soundEnabled')
                );
            if(enabled){
                if(!Game.sounds.music.background.playing()){
                    Game.sounds.music.background.play();
                }
            }
            else{
                Game.sounds.music.background.stop();
            }
        };
        Game.updateSound = function(){
            var sound_enabled = Flynn.mcp.optionManager.getOption('soundEnabled');
            Flynn.mcp.muteAudio(!sound_enabled);
            Game.updateMusic();
        };
        Game.updateSoundOptionChange = function(){
            Game.updateSound();
            var sound;
            var sound_enabled = Flynn.mcp.optionManager.getOption('soundEnabled');
            if (sound_enabled){
                Flynn.sounds.ui_select.play();
            }
        };

        // Options
        Flynn.mcp.optionManager.addOptionFromVirtualButton('fire_l');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('fire_r');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('up');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('left');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('right');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('down');
        Flynn.mcp.optionManager.addOption('soundEnabled', Flynn.OptionType.BOOLEAN, true, true, 'SOUND', null,
            Game.updateSoundOptionChange // Callback on option change
            );
        Flynn.mcp.optionManager.addOption('musicEnabled', Flynn.OptionType.BOOLEAN, true, true, 'MUSIC', null,
            Game.updateMusic // Callback on option change
            );
        Flynn.mcp.optionManager.addOption('resetScores', Flynn.OptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
            function(){self.resetScores();} // Callback on option command
            );

        // Default to thick vector display
        Flynn.mcp.optionManager.setDefault('vectorMode', Flynn.VectorMode.V_THICK);

        // Restore user option settings from cookies
        Flynn.mcp.optionManager.loadFromCookies();
        
        // Setup touch controls
        var button_size = 130;
        var joystick_radius = button_size/2;
        var button_margin = 10;
        var button_gap = 10;
        var x, y;
        if(Flynn.mcp.browserSupportsTouch){

            x = Game.CANVAS_WIDTH - button_size - button_margin;
            y = Game.CANVAS_HEIGHT - button_size - button_margin;
            Flynn.mcp.input.addTouchRegion("UI_right",
                x, y, x+button_size, y+button_size,
                'round',
                null // Visible in all states
                );
            x -= button_size + button_gap; 
            Flynn.mcp.input.addTouchRegion("UI_left",
                x, y, x+button_size, y+button_size,
                'round',
                null // Visible in all states
                ); 

            x -= button_size + button_gap; 
            Flynn.mcp.input.addTouchRegion("fire_r",
                x, y, x+button_size, y+button_size,
                'rect',
                [Game.States.DEMO3]  // visible_states
                );
            x -= button_size + button_gap; 
            Flynn.mcp.input.addTouchRegion("fire_l",
                x, y, x+button_size, y+button_size,
                'rect',
                [Game.States.DEMO3]  // visible_states
                ); 
            //self.input.addTouchRegion("enter",0,0,width,height); // Whole screen

        }

        // Set resize handler and force a resize
        Flynn.mcp.setResizeFunc( function(width, height){

            // var spacing = 140;
            // var x_start = 80;
            x = button_margin + joystick_radius;
            y = Game.CANVAS_HEIGHT - button_margin - joystick_radius;

            Flynn.mcp.input.addVirtualJoystick({
                pos: {x: x, y: y},
                name: 'd_stick',
                button_map: {
                    up:    'up',
                    down:  'down',
                    left:  'left',
                    right: 'right'
                },
                radius: joystick_radius,
                visible_states: [Game.States.DEMO3],
            });

            x += button_gap + 2 * joystick_radius;
            Flynn.mcp.input.addVirtualJoystick({
                pos: {x: x, y: y},
                name: 'a_stick',
                type: 'analog',
                radius: joystick_radius,
                visible_states: [Game.States.DEMO3],
            });

            x += button_gap + 2 * joystick_radius;
            Flynn.mcp.input.addVirtualJoystick({
                pos: {x: x, y: y},
                name: 'dpad_stick',
                type: 'dpad',
                button_map: {
                    up:    'up',
                    down:  'down',
                    left:  'left',
                    right: 'right'
                },
                radius: joystick_radius,
                visible_states: [Game.States.DEMO3],
            });
        });
        Flynn.mcp.resize();

        // Initialize sound and music
        Game.updateSound();
        Game.updateMusic();
    },

    resetScores: function(){
        Game.config.leaderboard.restoreDefaults();
    },

    run: function() {
        // Start the game
        Flynn.mcp.run();
    }
});

}()); // "use strict" wrapper