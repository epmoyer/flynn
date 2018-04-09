Pacing
######

"Pacing" is used to control the perceived speed a game runs at. Flynn strives to render games at 60 frames per second (FPS), but several factors can reduce the actual frame rate achieved by a game. A properly written game should run at a consistent speed regardless of the frame rate it achieves at any given moment.

For example, suppose you write a game in which an airplane drops a bomb.  Running on your state-of-the-art laptop the game renders at 60FPS and the bomb takes 1 second to fall from the top of the screen to the bottom.  Now you run the same code on an old PC and, because the processor is slower, it only renders at 30FPS.  The animation will look choppier, but when you drop a bomb it should still take 1 second to fall.  Flynn's Pacing infrastructure will help you achieve that.

Why frame rates vary
====================

Callbacks
=========

Using paceFactor
================

The speed at which events occur (the velocity of ships, the action of gravity, the frequency of enemy shots, etc.) should be invariant to the frame rate of a game. 


Recipes
=======

Validating your implementation
==============================