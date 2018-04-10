Introduction
############

Flynn is a vector graphics gaming framework for Javascript. It is the engine behind all the games posted at VectorAlchemy_.

I wrote Flynn to support my own game development. Along the way I've worked aggressively to push as much generalizable functionality into it as possible. Games implemented on top of Flynn end up having a light code base, and the engine handles all the pesky browser issues (touch events, window resizing, etc.). In practice, new game development stays focused on game mechanics.

 Games written on top of Flynn can run cross-platform (desktop/mobile) "out of the box" with little effort. If you're mildly enterprising then the Flynn test app code and the code for the existing VectorAlchemy_ games should be sufficient for you to develop your own games using Flynn.

I'm just starting to author this documentation so it's pretty light right now.  My plan is to hit the most non-intuitive issues first, then we'll see what happens next.

My minimum goal is to document:

- Pacing (the use of paceFactor in callbacks)
- Developer mode
- Polygon editing

Welcome aboard!

.. _VectorAlchemy: http://www.vectoralchemy.com