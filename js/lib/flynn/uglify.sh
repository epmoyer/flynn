#!/bin/bash
uglifyjs \
flynnMain.js flynnUtil.js flynnTimers.js flynnCanvas.js flynnInput.js \
flynnPolygon.js flynnState.js flynnStateEnd.js flynnStateConfig.js \
flynnProjectiles.js flynnOptionManager.js flynnMcp.js flynnLeaderboard.js \
flynnParticles.js flynnPhysics.js flynnVirtualJoystick.js flynnVaLogo.js \
flynnVictor.js \
-o flynn.min.js --source-map flynn.min.js.source-map -c -m

uglifyjs \
flynnMain.js flynnUtil.js flynnTimers.js flynnCanvas.js flynnInput.js \
flynnPolygon.js flynnState.js flynnStateEnd.js flynnStateConfig.js \
flynnProjectiles.js flynnOptionManager.js flynnMcp.js flynnLeaderboard.js \
flynnParticles.js flynnVirtualJoystick.js flynnVaLogo.js flynnVictor.js \
-o flynn.core.min.js --source-map flynn.core.min.js.source-map -c -m