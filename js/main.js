var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.CANVAS_HEIGHT = 768;
Game.CANVAS_WIDTH = 1024;
Game.SPEED_FACTOR = 1.0;

Game.States = {
    NO_CHANGE: 0,
    
    HOME:      1,
    DEMO1:     2,
    DEMO2:     3,
    DEMO3:     4,
    DEMO4:     5,
    DEMO5:     6,

    LAST_PAGE: 6, // Match highest page above (used for navigation)

    END:       90,
    CONFIG:    91,
};

Game.Main = Class.extend({
    
    init: function() {

        Flynn.init(
            Game.CANVAS_WIDTH,
            Game.CANVAS_HEIGHT, 
            Game.States.NO_CHANGE,
            Game.SPEED_FACTOR,
            function(state){
                switch(state){
                    case Game.States.HOME:
                        return new Game.StateHome();
                    case Game.States.DEMO1:
                        return new Game.StateDemo1();
                    case Game.States.DEMO2:
                        return new Game.StateDemo2();
                    case Game.States.DEMO3:
                        return new Game.StateDemo3();
                    case Game.States.DEMO4:
                        return new Game.StateDemo4();
                    case Game.States.DEMO5:
                        return new Game.StateDemo5();
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
                            Game.States.HOME // Parent state
                            );
                }
            }
        );
        Flynn.mcp.changeState(Game.States.HOME);

        Game.config = {};
        Game.config.score = 500001;
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
            // Apologies to the world.  The defalt WASD is WARS because all my keyboards are Colemak :) 
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
                    src: ['sounds/SpaceThemev3.mp3'],
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
                Game.sounds.acknowledge.play();
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
            function(){self.resetScores();});
        // Restore user option settings from cookies
        Flynn.mcp.optionManager.loadFromCookies();
        
        // Setup touch controls
        var button_size = 80;
        var x, y;
        if(Flynn.mcp.browserSupportsTouch){

            x = Game.CANVAS_WIDTH - 1.4*button_size;
            y = Game.CANVAS_HEIGHT - 1.4*button_size;
            Flynn.mcp.input.addTouchRegion("UI_right",
                x, y, x+button_size, y+button_size,
                'round',
                null // Visible in all states
                );
            x -= 1.5 * button_size; 
            Flynn.mcp.input.addTouchRegion("UI_left",
                x, y, x+button_size, y+button_size,
                'round',
                null // Visible in all states
                ); 

            x = Game.CANVAS_WIDTH - 1.4*button_size;
            y = Game.CANVAS_HEIGHT - 2.9*button_size;
            Flynn.mcp.input.addTouchRegion("fire_r",
                x, y, x+button_size, y+button_size,
                'rect',
                [Game.States.DEMO3]  // visible_states
                );
            x -= 1.5 * button_size; 
            Flynn.mcp.input.addTouchRegion("fire_l",
                x, y, x+button_size, y+button_size,
                'rect',
                [Game.States.DEMO3]  // visible_states
                ); 
            //self.input.addTouchRegion("enter",0,0,width,height); // Whole screen

        }

        // Set resize handler and force a resize
        Flynn.mcp.setResizeFunc( function(width, height){

            Flynn.mcp.input.addVirtualJoystick({
                pos: {x: 80, y: Game.CANVAS_HEIGHT-80},
                name: 'stick',
                button_map: {
                    up:    'up',
                    down:  'down',
                    left:  'left',
                    right: 'right'
                },
                visible_states: [Game.States.DEMO3],
            });

            Flynn.mcp.input.addVirtualJoystick({
                pos: {x: 250, y: Game.CANVAS_HEIGHT-80},
                name: 'stick2',
                type: 'dpad',
                button_map: {
                    up:    'up',
                    down:  'down',
                    left:  'left',
                    right: 'right'
                },
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