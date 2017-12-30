Changelog
=========

All notable changes to this project will be documented in this file.

The format is based on `Keep a Changelog`_ and this project adheres to `Semantic Versioning`_.

.. _Keep a Changelog: http://keepachangelog.com/en/1.0.0/
.. _Semantic Versioning: http://semver.org/spec/v2.0.0.html

Unreleased
----------

(None)

3.3.0 - 2017-12-29
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