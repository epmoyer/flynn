# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres
to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
**(None)**

## 3.20.0 2021-03-02
### Added
- Optional dotSize argument to Flynn.Particles
- Flynn.InputHandler.flushButtons()
- Flynn.Util.randomShuffle()
- Ability to decompose meshes into individual line segments (and back).
    - Break meshes into segments with Flynn._3DMesh.to_segments()
    - Make meshes from segments with Flynn._3DMeshFromSegments()

## 3.19.1 - 2020-12-12
### Added
- On-screen touch keyboard for high score name entry on touch devices (in flynnStateEnd).
- Add .getLastTouchLocation() to Flynn.InputHandler. Allows games to interrogate the position of touch events to implement their own full-screen touch handlers.
- Add "!" character to Flynn.Font.Block
- Remember high-score name (within the current session) and default to the previous name on subsequent high-score entry screens.
### Changed
- Flynn.Util.doBoundsBounce returns boolean (true if bounce occurred)
### Fixed
- Backspace key is now captured again (it used to work, but then broke with browser evolution).
- flynnCanvas was inspecting Game object for canvas size. Fixed to use Flynn.mcp object.
- flynnStateEnd will accept names for up to {leaderboard}.maxItems entries if Leaderboard not yet full.
- VA logo smoke restored.

## 3.18.0 - 2020-02-09
### Changed
- Engine
  - Adopt PixiJS v5.2.1

## 3.17.0 - 2019-12-08
### Added
- Engine
  - Add support for monochrome polygons to Flynn.Particles.shatter()
  - Flynn.Particles.shatter() **API changed**
    - Support min/max range for life, velocity, angular_velocity, and options for uniformly distributed exit angles.
- Test Application
  - Test monochrome polygon shatter.
  - Test new shatter options. Add "caret" ship.

### Fixed
- Engine
  - ctx.vectorText2 options opts.x, .y, and .angle now properly handle values of 0 (0 was getting overridden by null default).

## 3.19.0 - 2020-10-23
### Added
- Engine
  - Add "!" to Flynn.Font.Block.

## 3.16.0 - 2019-11-17
### Added
- Engine
  - transform_f argument to vectorText2 (callback function for vertex transformation).
- Test Application
  - Text transformation test/demo.

## 3.14.0 - 2019-08-10
### Added
- Engine
  - Lowercase characters now supported in Normal font.
  - Flynn.init() now takes forceUpperCase argument (defaults to true).
- Test Application
  - Show lowercase characters in ASCII table and sample text.

### Changed
- Engine
  - Improve some characters in Normal font: 'K', '(', ')'.

## 3.14.0 - 2019-07-13
### Fixed
- Engine
  - Flynn._3DRenderer.renderPoint() will now properly not render points which are behind the camera.
  - Buttons no longer get "stuck" DOWN if focus is switched away from the app while they are held. On restoration of focus, all pressed buttons are now forced into the UP state.
### Added
- Engine 
  - Flynn._3DMeshText() renders text to a 3D mesh object.
  - Flynn._3DMesh now has .pre_rotation
  - color alpha support
    - Flynn._3DMesh.init() now accepts alpha (defaults to 1.0)
    - ctx.vectoStart() now accepts alpha (defaults to 1.0)
    - Alpha is now supported in color values. Before alpha, vectors which used dark colors (grays, or dim colors) could be drawn atop brighter colors and obscure them, which does not match vector display behavior.
      - Colors can use either form:
        - "#RRGGBB"
        - "#RRGGBBAA"
      - Some standard Flynn colors (Flynn.Colors.[CYAN_DK, GRAY, GRAY_DK]) now use alpha.
  - Flynn.Util.heatmap()
  - Flynn.init() now accepts an optional disableUI parameter. 
    - If true the UI sounds will not be loaded.  Applications which do not use the Flynn UI can set disableUI, and omit the UI sounds from their site. 
    - NOTE: Without setting this option omitting the UI sounds will result in console errors being logged when Flynn attempts to load the UI sounds.
- Test Application
  - Add text meshes to 3D demo panel.
  - Add alpha color demos.

## 3.13.1 - 2019-01-11
### Fixed
- Engine
  - ctx.vectorText2 (and deprecated ctx.vectorText) now convert text argument to a string (so they can be used to display a number).

## 3.13.0 - 2018-10-09
### Changed
- Engine
  - Polygon's .getSpan method now returns min and max of each coordinate (e.g. .up is now the min of all y coordinates, .down is the max of all y).  This fixes a bug where if all coordinates in either axis were positive or negative then one of the return metrics (.up, .down, .left, .right) would return -1000.


## 3.12.1 - 2018-5-21
### Fixed
- Engine
  - Correct the default value logic for several arguments to .vectorText2() & .vectorTextArc2() (and by association to .vectorText() and .vectorTextArc() ) so that passing a value of 0 does not (incorrectly) default to null.

## Added
- Engine
  - Add .spacing option to .vectorText2
  - Improve shape of "E" in main vector font.
  - Add _3DRenderer.projectPoint()
  - Add Flynn.Polygon.normalizeScale()

## Changed
- Engine
  - _3DRenderer.render_point() became .renderPoint()
  - _3DRenderer.prepare() API change

## 3.11.0 - 2018-6-10

### Added
- Engine
  - Add ctx.vectorText2(), which takes an options object.
  - Deprecate ctx.vectorText().
  - Add ctx.vectorTextArc2(), which takes an options object.
  - Deprecate ctx.vectorTextArc().
- Test Application
  - Adopt ctx.vectorText2() and ctx.vectorTextArc2()

## 3.10.0 - 2018-5-10
### Added

- Engine
  - flynn3D.js library (3D wireframes)
  - Flynn.devlog().  Logs text/objects to console when in development mode.
  - aspect_ratio argument to ctx.vectorText
  - .applyAspectRatio() to Flynn.Polygon
- Test Application
  - 3D Tab

### Changed
- Engine
  - Improve shape of ")", "(", and "B" in main vector font.
  - Add characters to main vector font: "{}|~"

### Fixed
- Engine
  - Support aspect ratios & resolutions other that 1024 x 768

## 3.9.0 - 2018-5-10
### Added
- Engine
  - Viewport (rendering of world coordinates) now supports zoom via Flynn.mcp.viewportZoom
  - Pan/zoom helper function Flynn.mcp.setViewport()
- Test Application
  - Pan/zoom demo on WORLD tab.

## 3.7.3 - 2018-4-10
### Added
- Sphinx documentation (http://flynn.readthedocs.io/en/latest/index.html)
- Engine
  - Pacing tab

### Changed
- paceFactor renamed to elapsed_ticks (in Engine and Test Application)

## 3.7.2 - 2018-4-7
### Changed
- Engine
  - Vertices no longer appear for black vectors (allows a clean "fade-out" effect to be achieved).

### Added
- Test Application
  - Fade out demo (on "Home" tab)

## 3.7.1 - 2018-3-31
### Added

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

## 3.6.2 - 2018-3-25
### Added
- Test Application
  - Add rotation to font tab (block font)
  - Code cleanup

## 3.6.1 - 2018-3-25
### Added
- Engine
  - Update minified versions
- Test Application
  - Fix anchor dot position for span

## 3.6.0 - 2018-3-25
### Added
- Engine
  - Add .getSpan() to Flynn.Polygon
- Test Application
  - Add .getSpan() demo to UTIL panel

## 3.5.0 - 2018-3-3
### Added
- Engine
  - Add text rotation via angle parameter to ctx.vectorText()
- Test Application
  - Add text rotation demo to TEXT panel


## 3.4.0 - 2018-3-3
### Added
- Engine
  - Add ctx.world_wrap_enabled to wrap drawing
  - Add world_wrap parameter to Flynn.Projectiles
- Test Application
  - Change WORLD panel to demo draw wrapping.

## 3.2.2 - 2017-09-15
### Changed
- Engine
  - Use Pixi.js for rendering (instead of HTML canvas draw)
  - Performance gauges are now scrolling graphs
- Test Application
  -  Performance test now iteratively adds/removes polygons to achieve 60 FPS.

### Fixed
- "20 FPS" mode is now really 20 FPS (was 12 FPS)