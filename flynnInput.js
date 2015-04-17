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

var FlynnInputHandler = Class.extend({
	init: function(keys) {
		this.keys = {};
		this.down = {};
		this.pressed = {};
		this.touchRegions = {};

		for (var key in keys){
			var code = keys[key];

			this.keys[code] = key;
			this.down[key] = false;
			this.pressed[key] = false;
		}

		var self = this;
		document.addEventListener("keydown", function(evt) {
			if (self.keys[evt.keyCode]){
				self.down[self.keys[evt.keyCode]] = true;
			}
		});
		document.addEventListener("keyup", function(evt) {
			if (self.keys[evt.keyCode]){
				self.down[self.keys[evt.keyCode]] = false;
				self.pressed[self.keys[evt.keyCode]] = false;
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
					for(var name in self.touchRegions){
						var region = self.touchRegions[name];
						if ((x>region.left) && (x<region.right) && (y>region.top) && (y<region.bottom)){
							self.down[name] = true;
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
							// Mark the virtual button as not down and not pressed
							self.down[name] = false;
							self.pressed[name] = false;
						}
					}
				},
				false
			);
		}
		catch(err){
		}
	},

	addTouchRegion: function(name, left, top, right, bottom){
		if (name in this.touchRegions){
			// Remove old region if it exists.  Regions can thus be 
			// redefined by calling addTouchRegion again with the 
			// same name
			delete this.touchRegions[name];
		}
		touchRegion = new FlynnTouchRegion(name, left, top, right, bottom);
		this.touchRegions[name] = touchRegion;
		this.down[name] = false;
		this.pressed[name] = false;
	},

	isDown: function(key) {
		return this.down[key];
	},

	isPressed: function(key) {
		if (this.pressed[key]) {
			return false;
		} else if (this.down[key]){
			this.pressed[key] = true;
			return true;
		}
		return false;
	}
});