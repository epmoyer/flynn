:author: `Eric Moyer`_
:copyright: Copyright © 2015-2017 Eric Moyer <eric@lemoncrab.com>
:license: MIT

#########
Flynn
#########


Overview
========

Flynn is a vector graphics gaming framework for Javascript. It is the engine used on all the games
posted at www.vectoralchemy.com

The API is clean and the code is well organized, but there is (presently) no end-user documentation. I wrote it to support my own game development and I've worked aggressively to push as much generalizable functionality into Flynn as possible. Games implemented on top of Flynn end up having a light code base, and all browser issues (touch handling, window resizing, etc.) get handled by the engine. In practice, new game development stays very purely focused on game specifics & games run cross-platform "out of the box" with little effort. If you're mildly enterprising then the test app code and the code for the VA games should be sufficient for you to develop your own games on top of Flynn.  If there is developer interest then I'll start putting some documentation together.
As of this writing (v2.5.1), Flynn supports the following features:

- Vector rendering
   - Draw Modes:
      - None (Lines only, no endpoint bloom)
      - Regular (Dimmer lines with endpoint bloom)
      - Thick (Regular, but thicker)
      - Flicker (Simulates vector display flicker)
   - World / Screen coordinate systems
   - Draw types:
      - Lines
      - Rects
      - Polygons
         - Rotation / Scaling
         - Multicolor
         - Collision detection
         - Pen-up (line discontinuities)
- Particle effects
- Timers
- Physics
   - Wrapper around Box2D, with vector rendering
- Font rendering
   - Justify Left/Center/Right
   - Arc text
   - Two fonts (Standard & Block)
- Controls
   - Laptop/Desktop
      - Keyboard binding
   - Virtual (touch) controls (on mobile devices)
      - Buttons
      - 8 position joystick
      - Analog joystick
      - D-Pad
- Configuration manager
   - Option selection
   - Save/Restore from cookies
   - Key configuration
- Score manager
   - Name entry
   - Score display
   - Save/Restore from cookies
- Projectiles
- Game State Manager
- Pacing management
   - Render FPS independent of execution rate
- Development tools
   - 20 FPS mode
   - Slow-motion mode
   - Frame rate monitor
   - Mousetouch (emulate touch on desktop machines)
- Canvas management
   - Browser resize
   - Screen rotation (mobile devices)

.. _`Eric Moyer`: mailto:eric@lemoncrab.com  