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

		this.virtualButtons = {};
		this.touchRegions = {};
		this.keyCodeToVirtualButtonName = {};

		// Key Code capture support for user configuration of key assignments
		this.keyCodeCaptureArmed = false;
		this.capturedKeyCode = null;

		var self = this;
		document.addEventListener("keydown", function(evt) {
			//console.log("Key Code:" + evt.keyCode); 
			if (self.keyCodeToVirtualButtonName[evt.keyCode]){
				var name = self.keyCodeToVirtualButtonName[evt.keyCode];
				self.virtualButtons[name].isDown = true;
			}

			// Capture key codes (for user configuration of virualButtons)
			if(self.keyCodeCaptureArmed){
				self.capturedKeyCode = evt.keyCode;
				self.keyCodeCaptureArmed = false;
			}
		});
		document.addEventListener("keyup", function(evt) {
			if (self.keyCodeToVirtualButtonName[evt.keyCode]){
				var name = self.keyCodeToVirtualButtonName[evt.keyCode];
				self.virtualButtons[name].isDown = false;
				self.virtualButtons[name].pressWasReported = false;
			}
		});

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
							} else {
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
		if (!(name in this.virtualButtons)){
			console.log('Flynn: Warning: touch region name "' + name +
						'" does not match an existing virtual button name.  Touches to this region will be unreported' +
						' unless (until) a virtual button with the same name is created.');
		}
	},

	virtualButtonIsDown: function(name) {
		if(this.virtualButtons[name]){
			return this.virtualButtons[name].isDown;
		} else {
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
		} else {
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
		for(var name in this.virtualButtons){
			if(this.virtualButtons[name].boundKeyCode == keyCode){
				return true;
			}
		}
		return false;
	},

});