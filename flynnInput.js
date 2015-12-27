var FlynnConfigurable = true;
var FlynnNotConfigurable = false;

var FlynnTouchRegion = Class.extend({
	init: function(name, left, top, right, bottom) {
		this.name = name;
		this.left = left;
		this.top = top;
		this.right = right;
		this.bottom = bottom;

		this.touchStartIdentifier = 0; // Unique identifier of most recent touchstart event
	}
});

var FlynnVirtualButton = Class.extend({
	init: function(name, isConfigurable) {
		this.name = name;
		this.isConfigurable = isConfigurable;

		this.isDown = false;
		this.pressWasReported = false;
		this.boundKeyCode = null; // The ascii code of the bound key.  Can be null if no key bound.
	}
});

var FlynnInputHandler = Class.extend({
	//init: function(keys) {
	init: function() {
		this.iCadeModeEnabled = false;

		this.virtualButtons = {};
		this.touchRegions = {};
		this.keyCodeToVirtualButtonName = {};

		this.uiButtons = {};
		this.keyCodeToUiButtonName = {};

		// Key Code capture support for user configuration of key assignments
		this.keyCodeCaptureArmed = false;
		this.capturedKeyCode = null;

		// Add UI Buttons
		this.addUiButton('UI_enter',  FlynnKeyboardMap['enter']);
		this.addUiButton('UI_escape', FlynnKeyboardMap['escape']);
		this.addUiButton('UI_up',     FlynnKeyboardMap['up']);
		this.addUiButton('UI_down',   FlynnKeyboardMap['down']);
		this.addUiButton('UI_right',  FlynnKeyboardMap['right']);
		this.addUiButton('UI_left',   FlynnKeyboardMap['left']);
		this.addUiButton('UI_exit',	  FlynnKeyboardMap['tab']);

		// iCade button mapping
		this.iCade = {
			keyDownCodes: [],
			keyUpCodes:   [],
			buttonNames:  [],
			buttonCodes:  [],
		};
		//                    Name          Down Up
		this.addiCadeMapping('ICADE_up',    'w', 'e'); // Joytick
		this.addiCadeMapping('ICADE_down',  'x', 'z');
		this.addiCadeMapping('ICADE_left',  'a', 'q');
		this.addiCadeMapping('ICADE_right', 'd', 'c');
		this.addiCadeMapping('ICADE_T1',    'y', 't'); // Top row buttons
		this.addiCadeMapping('ICADE_T2',    'u', 'f');
		this.addiCadeMapping('ICADE_T3',    'i', 'm');
		this.addiCadeMapping('ICADE_T4',    'o', 'g');
		this.addiCadeMapping('ICADE_B1',    'h', 'r'); // Bottom row buttons
		this.addiCadeMapping('ICADE_B2',    'j', 'n');
		this.addiCadeMapping('ICADE_B3',    'k', 'p');
		this.addiCadeMapping('ICADE_B4',    'l', 'v');

		var self = this;
		this.keyDownHandler = function(evt){
			//console.log("KeyDown: Code:" + evt.keyCode);
			if(self.iCadeModeEnabled){
				var index = self.iCade.keyDownCodes.indexOf(evt.keyCode);
				if(index > -1){
					// Re-throw event as an iCade button down event
					var newEvt = {keyCode: self.iCade.buttonCodes[index]};
					self.keyDownHandler(newEvt);
					return;
				}
			}

			// Capture key codes (for user configuration of virualButtons).  Ignore <escape>.
			if(self.keyCodeCaptureArmed && evt.keyCode != FlynnKeyboardMap['escape']){
				self.capturedKeyCode = evt.keyCode;
				self.keyCodeCaptureArmed = false;
				// Exit without recording any .isDown events
				return;
			}

			var name;
			if (self.keyCodeToVirtualButtonName[evt.keyCode]){
				name = self.keyCodeToVirtualButtonName[evt.keyCode];
				self.virtualButtons[name].isDown = true;
			}
			if (self.keyCodeToUiButtonName[evt.keyCode]){
				name = self.keyCodeToUiButtonName[evt.keyCode];
				self.uiButtons[name].isDown = true;
			}
		};
		document.addEventListener("keydown", this.keyDownHandler);

		this.keyUpHandler = function(evt){
			//console.log("KeyUp: Code:" + evt.keyCode);
			var name;
			if(self.iCadeModeEnabled){
				var index = self.iCade.keyUpCodes.indexOf(evt.keyCode);
				if(index > -1){
					// Re-throw event as an iCade button up event
					var newEvt = {keyCode: self.iCade.buttonCodes[index]};
					self.keyUpHandler(newEvt);
					return;
				}
			}

			if (self.keyCodeToVirtualButtonName[evt.keyCode]){
				name = self.keyCodeToVirtualButtonName[evt.keyCode];
				self.virtualButtons[name].isDown = false;
				self.virtualButtons[name].pressWasReported = false;
			}
			if (self.keyCodeToUiButtonName[evt.keyCode]){
				name = self.keyCodeToUiButtonName[evt.keyCode];
				self.uiButtons[name].isDown = false;
				self.uiButtons[name].pressWasReported = false;
			}
		};
		document.addEventListener("keyup", this.keyUpHandler);

		try{
			document.addEventListener(
				'touchstart',
				function(event){
					event.preventDefault();
					var touch=event.changedTouches[0];
					var x = touch.pageX;
					var y = touch.pageY;
					//console.log("DEV: Touch ",x,y);
					for(var name in self.touchRegions){
						var region = self.touchRegions[name];
						if ((x>region.left) && (x<region.right) && (y>region.top) && (y<region.bottom)){
							// A touch event was detected in the region 'name'
							//console.log("DEV: Touch in region:", name);
							if(self.virtualButtons[name]){
								self.virtualButtons[name].isDown = true;
							} else if (self.uiButtons[name]){
								self.uiButtons[name].isDown = true;
							}
							else {
								console.log('Flynn: Warning: touch detected in touch region "' + name +
									'" but no virtual button exists with that name.  The touch will go unreported.');
							}
							region.touchStartIdentifier = touch.identifier;
						}
					}
				},
				false
			);
			document.addEventListener(
				'touchend',
				function(event){
					event.preventDefault();
					var touch=event.changedTouches[0];
					var x = touch.pageX;
					var y = touch.pageY;
					for(var name in self.touchRegions){
						var region = self.touchRegions[name];
						// If the unique identifier associated with this touchend event matches
						// the identifier associated with the most recent touchstart event
						// for this touchRegion.
						if (region.touchStartIdentifier == touch.identifier){
							if(self.virtualButtons[name]){
								// Mark the associated virtual button as not down and clear its press reporting.
								self.virtualButtons[name].isDown = false;
								self.virtualButtons[name].pressWasReported = false;
							}
						}
					}
				},
				false
			);
		}
		catch(err){
		}
	},

	addiCadeMapping: function(iCadeButtonName, keyDown, keyUp){
		this.iCade.buttonNames.push(iCadeButtonName);
		this.iCade.buttonCodes.push(FlynnKeyboardMap[iCadeButtonName]);
		this.iCade.keyDownCodes.push(FlynnKeyboardMap[keyDown]);
		this.iCade.keyUpCodes.push(FlynnKeyboardMap[keyUp]);
	},

	enableICade: function(){
		this.iCadeModeEnabled = true;
	},

	addUiButton: function(name, keyCode){
		if (this.uiButtons[name]){
			console.log(
				'Flynn: Warning: addUiButton() was called for UI button  "' + name +
				'" but that UI button already exists. The old UI button will be removed first.');
			delete(this.uiButtons[name]);
		}
		this.uiButtons[name] = new FlynnVirtualButton(name, FlynnNotConfigurable);
		this.uiButtons[name].boundKeyCode = keyCode;
		this.keyCodeToUiButtonName[keyCode] = name;
	},

	addVirtualButton: function(name, keyCode, isConfigurable){
		if (this.virtualButtons[name]){
			console.log(
				'Flynn: Warning: addVirtualButton() was called for virtual button  "' + name +
				'" but that virtual button already exists. The old virtual button will be removed first.');
			delete(this.virtualButtons[name]);
		}
		this.virtualButtons[name] = new FlynnVirtualButton(name, isConfigurable);
		this.bindVirtualButtonToKey(name, keyCode);
	},

	bindVirtualButtonToKey: function(name, keyCode){
		if (keyCode === undefined){
			console.log(
				'Flynn: Warning: bindVirtualButtonToKey() was called for virtual button  "' + name +
				'" with keyCode "undefined". Assuming "null" instead, but this may indicate a mistake.');
			keyCode = null;
		}
		if (this.virtualButtons[name]){
			// Remove old binding (if one exists)
			this.unbindVirtualButtonFromKey(name);

			// Add new binding (which may be null)
			this.virtualButtons[name].boundKeyCode = keyCode;
			if(keyCode){
				// Non-null bindings get added to keyCodeToVirtualButtonName
				this.keyCodeToVirtualButtonName[keyCode] = name;
			}
		} else{
			console.log(
				'Flynn: Warning: bindVirtualButtonToKey() was called for virtual button  "' + name +
				'", but that virtual button does not exist. Doing nothing.');
		}
	},

	getConfigurableVirtualButtonNames: function(){
		names = [];
		for (var name in this.virtualButtons){
			if(this.virtualButtons[name].isConfigurable){
				names.push(name);
			}
		}
		return names;
	},

	getVirtualButtonBoundKeyName: function(name){
		if(this.virtualButtons[name]){
			var boundKeyCode = this.virtualButtons[name].boundKeyCode;
			var boundKeyName = this.keyCodeToKeyName(boundKeyCode);
			return(boundKeyName);
		}
		else{
			// Button does not exist
			console.log(
				'Flynn: Warning: getVirtualButtonBoundKeyName() was called for virtual button  "' + name +
				'", but that virtual button does not exist.');
			return("ERROR");
		}
	},

	getVirtualButtonBoundKeyCode: function(name){
		if(this.virtualButtons[name]){
			return(this.virtualButtons[name].boundKeyCode);
		}
		else{
			// Button does not exist
			console.log(
				'Flynn: Warning: getVirtualButtonBoundKeyCode() was called for virtual button  "' + name +
				'", but that virtual button does not exist. Returning null.');
			return(null);
		}
	},

	keyCodeToKeyName: function(keyCode){
		for(var keyName in FlynnKeyboardMap){
			if(FlynnKeyboardMap[keyName]===keyCode){
				return keyName;
			}
		}
		return("(Unknown)");
	},

	unbindVirtualButtonFromKey: function(name){
		if (this.virtualButtons[name]){
			// Remove binding from keyCodeToVirtualButtonName
			for (var keyCode in this.keyCodeToVirtualButtonName){
				if (this.keyCodeToVirtualButtonName[keyCode] === name){
					delete(this.keyCodeToVirtualButtonName[keyCode]);
				}
			}
			// Remove binding from virtualButtons
			this.virtualButtons[name].boundKeyCode = null;
		} else{
			console.log(
				'Flynn: Warning: unbindVirtualButtonFromKey() was called for virtual button  "' + name +
				'", but that virtual button does not exist. Doing nothing.');
		}
	},

	addTouchRegion: function(name, left, top, right, bottom){
		// The 'name' must match a virtual button for touches to be reported.
		// All touches are reported as virtual buttons.
		// Touch regions can be bound to virtual buttons which are also bound to keys.
		//console.log("DEV: Added touch region ", name);
		if (name in this.touchRegions){
			// Remove old region if it exists.  Regions can thus be 
			// redefined by calling addTouchRegion again with the 
			// same name
			delete this.touchRegions[name];
		}
		touchRegion = new FlynnTouchRegion(name, left, top, right, bottom);
		this.touchRegions[name] = touchRegion;
		if (!(name in this.virtualButtons) && !(name in this.uiButtons)){
			console.log('Flynn: Warning: touch region name "' + name +
						'" does not match an existing virtual button name.  Touches to this region will be unreported' +
						' unless (until) a virtual button with the same name is created.');
		}
	},

	virtualButtonIsDown: function(name) {
		if(this.virtualButtons[name]){
			return this.virtualButtons[name].isDown;
		}
		else if (this.uiButtons[name]){
			return this.uiButtons[name].isDown;
		}
		else {
			console.log('Flynn: Warning: isDown() was called for virtual button  "' + name +
				'" but no virtual button with that name exists.');
		}
	},

	virtualButtonIsPressed: function(name) {
		if(this.virtualButtons[name]){
			if (this.virtualButtons[name].pressWasReported){
				// The current press was already reported, so don't report it again.
				return false;
			} else if (this.virtualButtons[name].isDown){
				// The button is down and no press has (yet) been reported, so report this one.
				this.virtualButtons[name].pressWasReported = true;
				return true;
			}
			// Button is not down
			return false;
		}
		else if(this.uiButtons[name]){
			if (this.uiButtons[name].pressWasReported){
				// The current press was already reported, so don't report it again.
				return false;
			} else if (this.uiButtons[name].isDown){
				// The button is down and no press has (yet) been reported, so report this one.
				this.uiButtons[name].pressWasReported = true;
				return true;
			}
			// Button is not down
			return false;
		}
		else {
			console.log('Flynn: Warning: isDown() was called for virtual button  "' + name +
				'" but no virtual button with that name exists.');
		}
	},

	armKeyCodeCapture: function() {
		this.keyCodeCaptureArmed = true;
		this.capturedKeyCode = null;
	},

	getCapturedKeyCode: function() {
		return (this.capturedKeyCode);
	},

	isKeyCodeAssigned: function(keyCode){
		// Returns true if the keyCode is assigned to any virtual button
		for(var name in this.virtualButtons){
			if(this.virtualButtons[name].boundKeyCode == keyCode){
				return true;
			}
		}
		return false;
	},

	// isKeyCodeUnavailable: function(keyCode){
	// 	// Returns true if the keyCode is assigned to any virtual button NOT INCLUDING
	// 	// a small number of UI keys which are avaialble to be bound user buttons simultaneously with 
	// 	// being bound to UI buttons.
	// 	for(var name in this.virtualButtons){
	// 		if(this.virtualButtons[name].boundKeyCode == keyCode){
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// },

});