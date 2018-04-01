Changelog
=========

All notable changes to this project will be documented in this file.

The format is based on `Keep a Changelog`_ and this project adheres to `Semantic Versioning`_.

.. _Keep a Changelog: http://keepachangelog.com/en/1.0.0/
.. _Semantic Versioning: http://semver.org/spec/v2.0.0.html

Unreleased
----------

(None)

3.7.1 - 2018-3-31
------------------

Added
^^^^^

- Engine

  - Parameterized vector render modes.

    - Developers can overwrite Flynn.Config.VectorRender values to change render behaviors.

  - Improved vector render behavior and implementation.  

    - Vectors are brighter and more saturated in Normal and Thick modes.
    - Thickness reduced in Thick mode.
    - Improved vertex coloring (overdrive) algorithm to behave better with dark vectors.

  - Removed "flicker" mode from vector renderer.

- Test Application

  - Add vertex test for dark vector lines


3.6.2 - 2018-3-25
------------------

Added
^^^^^

- Test Application

  - Add rotation to font tab (block font)
  - Code cleanup

3.6.1 - 2018-3-25
------------------

Added
^^^^^
- Engine

  - Update minified versions

- Test Application

  - Fix anchor dot position for span

3.6.0 - 2018-3-25
------------------

Added
^^^^^
- Engine

  - Add .getSpan() to Flynn.Polygon

- Test Application

  - Add .getSpan() demo to UTIL panel

3.5.0 - 2018-3-3
------------------

Added
^^^^^
- Engine

  - Add text rotation via angle parameter to ctx.vectorText()

- Test Application

  - Add text rotation demo to TEXT panel


3.4.0 - 2018-3-3
------------------

Added
^^^^^
- Engine

  - Add ctx.world_wrap_enabled to wrap drawing
  - Add world_wrap parameter to Flynn.Projectiles

- Test Application

  - Change WORLD panel to demo draw wrapping.

3.2.2 - 2017-09-15
------------------

Changed
^^^^^^^
- Engine

  - Use Pixi.js for rendering (instead of HTML canvas draw)
  - Performance gauges are now scrolling graphs

- Test Application

  -  Performance test now iteratively adds/removes polygons to achieve 60 FPS.

Fixed
^^^^^
- "20 FPS" mode is now really 20 FPS (was 12 FPS)