Flynn.OptionType = {
	BOOLEAN: 0,
	MULTI: 1,
	COMMAND: 2,
	INPUT_KEY: 3,
};

Flynn.OptionDescriptor = Class.extend({

	init: function(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler){
		this.keyName = keyName;
		this.type = type;
		this.defaultValue = defaultValue;
		this.currentValue = currentValue;
		this.promptText = promptText;
		this.promptValues = promptValues;
		this.commandHandler = commandHandler;
	},

	currentPromptValueIndex: function(){
		for (var i=0, len=this.promptValues.length; i<len; i++){
			if(this.currentValue === this.promptValues[i][1]){
				return i;
			}
		}
		return null;
	}
});

Flynn.OptionManager = Class.extend({

	// The current value for all shadowed options will be maintained in mcp.options.<keyName> for convenience
	SHADOWED_OPTION_TYPES: [Flynn.OptionType.MULTI, Flynn.OptionType.BOOLEAN],

	init: function(mcp){
		this.mcp = mcp;
		this.optionDescriptors = {};
		this.cookiesFetched = false;

		var self = this;
		this.addOption('revertDefaults', Flynn.OptionType.COMMAND, true, true, 'REVERT TO DEFAULTS', null,
			function(){
				self.revertToDefaults();
				self.saveAllToCookies();
			});
	},

	addOption: function(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler){
		var descriptor = new Flynn.OptionDescriptor(keyName, type, defaultValue, currentValue, promptText, promptValues, commandHandler);
		if (type in this.SHADOWED_OPTION_TYPES){
			this.mcp.options[keyName] = currentValue;
		}
		this.optionDescriptors[keyName] = descriptor;
	},

	addOptionFromVirtualButton: function(virtualButtonName){
		var keyCode = this.mcp.input.getVirtualButtonBoundKeyCode(virtualButtonName);
		var keyName = virtualButtonName;
		var descriptor = new Flynn.OptionDescriptor(keyName, Flynn.OptionType.INPUT_KEY, keyCode, keyCode, keyName, null, null);
		this.optionDescriptors[keyName] = descriptor;
	},

	setOption: function(keyName, value){
		if(keyName in this.optionDescriptors){
			var optionDescriptor = this.optionDescriptors[keyName];
			optionDescriptor.currentValue = value;
			if(optionDescriptor.type in this.SHADOWED_OPTION_TYPES){
				this.mcp.options[keyName] = value;
			}
			if(optionDescriptor.type === Flynn.OptionType.INPUT_KEY){
				this.mcp.input.bindVirtualButtonToKey(keyName, value);
			}
		}
		else{
			console.print('DEV: Warnining: FlynnOptionManager.setOption() called for key "' +
				keyName + '", which does not match an existing option.  Doing nothing.');
		}

		if(this.cookiesFetched){
			// After cookies have been fetched, any option set will be written back to cookies.
			this.saveOptionToCookies(keyName);
		}
	},

	getOption: function(keyName){
		if(keyName in this.optionDescriptors){
			return(this.optionDescriptors[keyName].currentValue);
		}
		else{
			console.log('DEV: Warnining: FlynnOptionManager.getOption() called for key "' +
				keyName + '", which does not match an existing option.  Returning null.');
			return null;
		}
	},

	revertToDefaults: function(){
		for (var keyName in this.optionDescriptors){
			var descriptor = this.optionDescriptors[keyName];
			descriptor.currentValue = descriptor.defaultValue;
			if(descriptor.type in this.SHADOWED_OPTION_TYPES){
				this.mcp.options[keyName] = descriptor.defaultValue;
			}
		}
	},

	loadFromCookies: function(){
		// Revert to defaults
		this.revertToDefaults();

		// Retreive all existant options from stored cookies.  (Any options not
		// retrievable from cookies will remain at their default settings.)
		var optionKeyNames = this.getOptionKeyNames();
		for(var i=0, len=optionKeyNames.length; i<len; i++){
			var optionKey = optionKeyNames[i];
			var cookieKey = document.title + ':OPT_' + optionKey;
			var attributeValue = Cookies.get(cookieKey);
			if(attributeValue){
				// Option retrieved from cookies
				try{
					var parsedValue = JSON.parse(attributeValue);
					this.setOption(optionKey, parsedValue);
					if(this.mcp.developerModeEnabled){
						console.log('DEV: flynnOptionManager: Fetched "' + optionKey + '" = "' + parsedValue + '".');
					}
				}
				catch(err){
					console.log('DEV: Could not parse attribute value "' + attributeValue + '" for cookie "' + cookieKey + '".');
				}
			}
		}

		// Save all options back to cookies (so that they will all be fetchable next time)
		// (This will catch any options which were not already present as cookies)
		this.saveAllToCookies();

		this.cookiesFetched = true;
	},

	saveAllToCookies: function(){
		// Retreive all options to cookies.
		var optionKeyNames = this.getOptionKeyNames();
		for(var i=0, len=optionKeyNames.length; i<len; i++){
			var optionKey = optionKeyNames[i];
			this.saveOptionToCookies(optionKey);
		}
	},

	saveOptionToCookies: function(optionKey){
		// All option types except COMMAND (i.e. INPUT_KEY, MULTI, and BOOLEAN) will be saved to cookies.
		if(this.optionDescriptors[optionKey].type != Flynn.OptionType.COMMAND){
			var cookieKey = document.title + ':OPT_' + optionKey;
			var optionValue = this.getOption(optionKey);
			var cookieValue = JSON.stringify(optionValue);
			Cookies.set(cookieKey, cookieValue, { expires: Infinity });
			if(this.mcp.developerModeEnabled){
				console.log('DEV: flynnOptionManager: Saved "' + optionKey + '" = "' + optionValue + '".');
			}
		}
	},

	executeCommand: function(keyName){
		if(keyName in this.optionDescriptors && this.optionDescriptors[keyName].type === Flynn.OptionType.COMMAND){
			this.optionDescriptors[keyName].commandHandler();
		}
		else{
			console.print('DEV: Warnining: FlynnOptionManager.executeCommand() called for key "' +
				keyName + '", which does not exist or is not of type COMMAND.  Doing nothing.');
		}
	},

	getOptionKeyNames: function(){
		// Get all option key names and return them ordered by input keys, multi options, booleans, and commands.

		var keyNamesInputKey = [];
		var keyNamesCommand = [];
		var keyNamesMulti = [];
		var keyNamesBoolean = [];

		for (var keyName in this.optionDescriptors){
			switch(this.optionDescriptors[keyName].type){
				case Flynn.OptionType.INPUT_KEY:
					keyNamesInputKey.push(keyName);
					break;
				case Flynn.OptionType.COMMAND:
					keyNamesCommand.push(keyName);
					break;
				case Flynn.OptionType.MULTI:
					keyNamesMulti.push(keyName);
					break;
				case Flynn.OptionType.BOOLEAN:
					keyNamesBoolean.push(keyName);
					break;

			}
		}
		return keyNamesInputKey.concat(keyNamesMulti, keyNamesBoolean, keyNamesCommand);
	},

});