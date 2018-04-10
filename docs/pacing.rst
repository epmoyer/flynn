Pacing
######

"Pacing" is used to control the perceived speed a game runs at. Flynn strives to render games at 60 frames per second (FPS), but several factors can reduce the actual frame rate achieved by a game. A properly written game should run at a consistent speed regardless of the frame rate it achieves from moment to moment.

For example, suppose you write a game in which an airplane drops a bomb.  Running on your state-of-the-art laptop the game renders at 60FPS and the bomb takes 1 second to fall from the top of the screen to the bottom.  Now you run the same code on an old PC and, because the processor is slower, it only renders at 30FPS.  The animation will look choppier on the slower machine, but when you drop a bomb it should still take 1 second to fall.  Flynn's pacing infrastructure will help you achieve that.

Why frame rates vary
====================

The frame rate of a game is primarily affected by four things:

1. **CPU performance**: Slower CPUs may render at a lower frame rate than faster CPUs.
2. **CPU Load**: Other processes running on the machine may overburden the CPU, causing the frame rate to drop.
3. **Rendering Time**: At 60FPS, a game has 1/60 of a second (.0167 seconds) to update the game world and draw it.  For a game to render at 60FPS, the combined time for the browser to process an animation frame, the game to update the state of the game world, and the game to draw the new frame, must not exceed 0.167 seconds.  If it does, the frame rate will drop.
4. **Update Time**: See previous.

Callbacks
=========

The Flynn engine makes 3 callbacks to your game code each animation frame. Nominally (if maintaining 60FPS), they each get called 60 times per second:

- ``handleInputs(input, paceFactor)``: Processes all user input to your game (button presses, screen touch events).
- ``update(paceFactor)``: Updates the state of the game world.
- ``render(ctx)``: Draws the game world

Using paceFactor
================

Flynn calls each of your 3 callback functions once per frame. Each time Flynn calls ``update()`` and ``handleInputs()`` your game will change the game world a little. In practice, you need to know how much time has elapsed since the last call so that you can change the game world by the appropriate amount.  If 16.6 milliseconds have elapsed (1/60 of a second), then you may, for example, need to move a particular space ship 1 pixel.  But if 33.3 milliseconds have elapsed (1/30 of a second), then you should move that ship 2 pixels.

Flynn tells you how much time has elapsed by passing you a the parameter ``paceFactor``, which tells you how many nominal 60FPS game "ticks" have elapsed. If your game is running at 30FPS, then Flynn will pass a ``paceFactor`` of 2.0 to your callbacks. 

If you'd like to know the elapsed time in seconds, you can always calculate it like this:

.. code-block:: javascript

    update: function(paceFactor) {

        // ...

        var elapsed_seconds = paceFactor / Flynn.TICKS_PER_SECOND;
        // Note: Flynn.TICKS_PER_SECOND always == 60

        // ...
    }

In general, you'll use paceFactor to calculate the appropriate movement of objects by doing something like:

.. code-block:: javascript

    position = position + velocity * paceFactor;

Below you'll find code recipes for various common pacing scenarios. 

.. note ::
    ``paceFactor`` should probably have been called ``elapsedTicks``.  I plan to refactor it in a future version of Flynn.  In the meantime, you can name the argument passed to your ``update()`` and ``handleInputs()`` methods ``elapsedTicks`` (instead of ``paceFactor``) for improved readability.

Recipes
=======

Here are some code recipes for using ``paceFactor`` to update positions, velocities, and timers.

In the vectorized versions below, variables with the ``_v`` suffix are 2d vectors. They are instances of type ``Victor``, implemented by the victorjs_ library.

In all recipes below, variables have the following units:

  - Position: pixels
  - Velocity: pixels/tick (i.e. pixels per tick)
  - Acceleration: pixels/tick^2 (i.e. pixels per tick per tick)
  - Time Constant: ticks

Motion without acceleration
===========================

Governing equations:

  - position_new = position_old + velocity * elapsed_time

.. code-block:: javascript

   //-------------------
   // Single Axis form
   //-------------------

   // Position
   position_y += velocity_y * paceFactor;

   //-------------------
   // Vectorized form
   //-------------------

   // Position
   position_v += velocity_v.clone().multiplyScalar(paceFactor);

Motion with acceleration
========================

Governing equations:

  - position_new = position_old + acceleration * elapsed_time^2 / 2 + veocity_old * elapsed_time
  - velocity_new = velocity_old + acceleration * elapsed_time

.. code-block:: javascript

   // Where acceleration is in units of pixels/tick^2  (i.e pixels per tick per tick)
   
   //-------------------
   // Single Axis form
   //-------------------
   // Note: The position must be updated before the velocity, since the position
   //   equation presumes velocity_y is the old velocity.

   // Position (from equivalent physics equation p1 = P0 + a*t^2/2 + v0*t)
   position_y += acceleration_y * Math.pow(paceFactor, 2) / 2 + velocity_y * paceFactor;

   // Velocity
   velocity_y += acceleration_y * paceFactor;


   //-------------------
   // Vectorized form
   //-------------------
   // Note: The position must be updated before the velocity, since the position
   //   equation presumes velocity_v is the old velocity.

   // Position (from equivalent physics equation p1 = P0 + a*t^2/2 + v0*t)
   position_v += 
      acceleration_v.clone().multiplyScalar(Math.pow(paceFactor, 2) / 2) + 
      velocity_v.clone().multiplyScalar(paceFactor);

   // Acceleration
   velocity_v += acceleration_v.clone().multiplyScalar(paceFactor);

Motion with friction
====================

Friction is modeled using an exponential decay time constant.  The time constant is equal to the time, in game ticks, for the velocity to decay to about 37% of its initial value (1/e ≈ 0.367879441).

Governing equations:

  - position_new = position_old + (velocity_old - velocity_old * e^(-time_constant * elapsed_time)) / time_constant
  - velocity_new = velocity_old * e^(-time_constant * elapsed_time)

.. code-block:: javascript

   //-------------------
   // Single Axis form
   //-------------------
   // Note: The position must be updated before the velocity, since the position
   //   equation presumes velocity_y is the old velocity.

   // Position 
   position_y += 
      (velocity_y - velocity_y * Math.pow(Math.E, -time_constant * paceFactor)) /
      time_constant ;

   // Velocity
   velocity_y *= Math.pow(Math.E, -time_constant * paceFactor);

   //-------------------
   // Vectorized form
   //-------------------
   // Note: The position must be updated before the velocity, since the position
   //   equation presumes velocity_v is the old velocity.

   // Position 
   position_v += 
      (velocity_v - velocity_v.clone().multiplyScalar(Math.pow(Math.E, -time_constant * paceFactor) /
      time_constant) ;

   // Velocity
   velocity_y.multiplyScalar(Math.pow(Math.E, -time_constant * paceFactor));

Game timers
===========

To keep track of the total elapsed time (in seconds) in your game, you need to accumulate the elapsed time for each game tick.

.. code-block:: javascript

    update: function(paceFactor) {

        // ...

        // Game timer in seconds
        this.game_timer_sec += paceFactor / Flynn.TICKS_PER_SECOND; 

        // Game timer in ticks
        this.game_timer_ticks += paceFactor; 

        // ...
    }
   
.. note ::
    ``Flynn.mcp.gameSpeedFactor`` is a single parameter which can be used to speed up or slow down an entire game.  It gets passed as a parameter to ``Flynn.Mcp.init()`` during initialization to set the overall speed of a game. Setting the ``gameSpeedFactor`` to a value other than 1.0 causes Flynn to  *lie to you* when it calls ``handleInputs()`` and ``update()``, by artificially scaling paceFactor accordingly.

Validating your implementation
==============================

Properly applying ``paceFactor`` in your game logic can be tricky. Personally I get it wrong *all the time*. But don't worry, Flynn has your back! 

First, activate "Developer mode", by adding "?develop" to the end of your game's URL in the browser (for example, you can start Roundabout in developer mode like this:

`http://www.vectoralchemy.com/Roundabout/index.html?develop <http://www.vectoralchemy.com/Roundabout/index.html?develop>`_.

There are three "Developer mode" features specifically designed to help you validate pacing...

- **FPS20**: Press the ``\`` key to toggle FPS20 mode.  The text "FPS_20" will appear in the lower-left corner of the screen, and your game will be forced to run at 20 frames per second. If you've applied paceFactor correctly, the "speed" of your game should remain unchanged.  If, for example, you discover that in FPS20 mode your space ship moves at normal speed but its bullets move slowly, then you have forgotten to apply paceFactor to your bullet code.

- **SLOWMO**: Press the ``7`` key to toggle SLOWMO mode.  The text "SLOWMO" will appear in the lower-left corner of the screen, and your game will be forced to run in slow motion (though still at nominally 60FPS). If you've applied paceFactor correctly, everything should be super slow. If, for example, you discover that your space ship moves slowly in SNOWMO mode but its bullets move at their normal speed, then you have forgotten to apply paceFactor to your bullet code.

- **STATS**: Press the ``6`` key to toggle the STATS display.  Flynn will show you four real-time graphs:

  - **Yellow**: The actual frame rate of your game.
  - **Dark Blue**: The total (combined) time (in milliseconds) spent in your handleInputs(), update(), and render() methods.
  - **Light Blue**: The total (combined) time (in milliseconds) spent by the WebGL renderer (PixiJS) to draw frames.
  - **Magenta**: The total (combined) time spent in the browser's animation callback (includes game logic, Pixi rendering and browser rendering).  If this time exceeds 16.6ms, your frame rate will drop below 60FPS.

.. note ::
    The keyboard keys assigned to the various "Developer Mode" functions can vary from game to game.  Most "Official" Flynn games bind them to the values shown above, but you can bind them to anything (or nothing).  When in doubt, you can find a game's key bindings in its ``main.js`` file.

.. _victorjs: http://www.http://victorjs.org