
# Flynn
`Flynn` is a vector graphics gaming framework for Javascript. It is the engine used on all the games
posted at www.vectoralchemy.com

[![Flynn](https://readthedocs.org/projects/flynn/badge/?version=latest)](http://flynn.readthedocs.io/en/latest/?badge=latest)  



## Overview

![logo][logo] 

The API is clean and the code is well organized, but there is (presently) not much end-user documentation.  You can find the current docs [here](http://flynn.readthedocs.io/en/latest).

I wrote Flynn to support my own game development and I've worked aggressively to push as much generalizable functionality into the engine as possible. Games implemented on top of Flynn end up having a light code base, and all browser issues (touch handling, window resizing, etc.) get handled by the engine. In practice, new game development stays very purely focused on game specifics & games run cross-platform "out of the box" with little effort. If you're mildly enterprising then the test app code and the code for the VA games should be sufficient for you to develop your own games on top of Flynn.  If there is developer interest then I'll start putting some more comprehensive documentation together.

![screen_flynn][screen_flynn] 
![screen_flynn_text][screen_flynn_text] 
![screen_flynn_box2d][screen_flynn_box2d] 
![screen_flynn_collision][screen_flynn_collision] 
![configuration][configuration] 
![code][code] 
![screen_polygondraw][screen_polygondraw] 

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


[logo]:  https://raw.githubusercontent.com/epmoyer/flynn/media/flynn_logo.png?raw=true "logo"
[screen_flynn]:  https://raw.githubusercontent.com/epmoyer/flynn/media/screen_flynn.png?raw=true&s=100 "screen_flynn"
[screen_flynn_text]: https://raw.githubusercontent.com/epmoyer/flynn/media/screen_flynn_text.png "screen_flynn_text"
[screen_flynn_collision]: https://raw.githubusercontent.com/epmoyer/flynn/media/screen_flynn_collision.png "screen_flynn_collision"
[screen_flynn_box2d]: https://raw.githubusercontent.com/epmoyer/flynn/media/screen_flynn_box2d.png "screen_flynn_box2d"
[configuration]:  https://raw.githubusercontent.com/epmoyer/flynn/media/flynn_configuration.png?raw=true "configuration"
[code]:  https://raw.githubusercontent.com/epmoyer/flynn/media/flynn_code-1024x674.png?raw=true "code"

[screen_polygondraw]: https://raw.githubusercontent.com/epmoyer/flynn/media/screen_polygondraw-1024x624.png "screen_polygondraw"