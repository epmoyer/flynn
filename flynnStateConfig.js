//--------------------------------------------
// StateConfig class
//    Allow user to configure game options
//--------------------------------------------

var FlynnOptionSelectionMargin = 5;
var FlynnOptionSelectionMarginInset = 2;
var FlynnOptionTextScale = 2.0;
var FlynnOptionTextHeight = FlynnCharacterHeight * FlynnOptionTextScale;
var FlynnOptionFuncitonWidth = 190;
var FlynnOptionCenterGapWidth = FlynnCharacterWidth * 2 * FlynnOptionTextScale;
var FlynnOptionKeyPrompt = "PRESS NEW KEY";
var FlynnOptionInputKeyValueWidth = FlynnOptionTextScale * FlynnCharacterSpacing * FlynnOptionKeyPrompt.length+1 + FlynnOptionSelectionMargin * 2;

var FlynnStateConfig = FlynnState.extend({

	init: function(mcp, mainTextColor, menuTextColor, selectionBoxColor, menuPromptColor){
		this._super(mcp);
		this.mainTextColor = mainTextColor;
		this.menuTextColor = menuTextColor;
		this.selectionBoxColor = selectionBoxColor;
		this.menuPromptColor = menuPromptColor;

		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;

		this.configurableVirtualButtonNames = this.mcp.input.getConfigurableVirtualButtonNames();

		this.keyAssignmentInProgress = false;

		this.optionKeyNames = mcp.optionManager.getOptionKeyNames();
		this.numOptions = this.optionKeyNames.length;
		this.selectedLineIndex = 0;
	},

	handleInputs: function(input, paceFactor) {
		var optionKeyName = this.optionKeyNames[this.selectedLineIndex];

		if(this.keyAssignmentInProgress){
			var capturedKeyCode = input.getCapturedKeyCode();
			if (capturedKeyCode){
				if(!input.isKeyCodeAssigned(capturedKeyCode)){
					// The chosen keyCode is available.  Assign it.
					this.mcp.optionManager.setOption(optionKeyName, capturedKeyCode);
					this.keyAssignmentInProgress = false;
				} else{
					currentlyAssignedKeyCode = this.mcp.optionManager.getOption(optionKeyName);
					if (currentlyAssignedKeyCode === capturedKeyCode){
						// User pressed the key which was already assigned.  Do nothing.
						this.keyAssignmentInProgress = false;
					} else{
						// The chosen keyCode is not availble. Keep waiting for a valid key.
						input.armKeyCodeCapture();
						// TODO: Prompt user that key is in use.
						console.log("that key is in use");
					}
				}
			}

			if (input.virtualButtonIsPressed("UI_escape")) {
				this.keyAssignmentInProgress = false;
			}
			return;
		}
		
		var optionDescriptor = this.mcp.optionManager.optionDescriptors[this.optionKeyNames[this.selectedLineIndex]];

        if(this.mcp.arcadeModeEnabled) {
            if (input.virtualButtonIsPressed("quarter")) {
                this.mcp.credits += 1;
                this.insert_coin_sound.play();
            }
        }
		if (input.virtualButtonIsPressed("UI_escape")) {
			this.mcp.nextState = States.MENU;
		}
		if (input.virtualButtonIsPressed("UI_down")) {
			++this.selectedLineIndex;
			if(this.selectedLineIndex >= this.numOptions){
				this.selectedLineIndex = 0;
			}
		}
		if (input.virtualButtonIsPressed("UI_up")) {
			--this.selectedLineIndex;
			if(this.selectedLineIndex < 0){
				this.selectedLineIndex = this.numOptions-1;
			}
		}
		if (input.virtualButtonIsPressed("UI_enter")) {
			switch(optionDescriptor.type){
				case FlynnOptionType.BOOLEAN:
					// Toggle boolean
					this.mcp.optionManager.setOption(optionDescriptor.keyName, !optionDescriptor.currentValue);
					break;

				case FlynnOptionType.INPUT_KEY:
					input.armKeyCodeCapture();
					this.keyAssignmentInProgress = true;
					break;

				case FlynnOptionType.COMMAND:
					commandHandler = optionDescriptor.commandHandler;
					if (commandHandler !== null){
						commandHandler();
					}
					break;
			}
		}
		var optionIndexDelta = 0;
		if (input.virtualButtonIsPressed("UI_left")) {
			optionIndexDelta = -1;
		}
		if (input.virtualButtonIsPressed("UI_right")) {
			optionIndexDelta = 1;
		}
		if(optionIndexDelta !== 0){
			if(optionDescriptor.type === FlynnOptionType.MULTI){
				var currentPromptIndex = optionDescriptor.currentPromptValueIndex();
				var numOptions = optionDescriptor.promptValues.length;
				currentPromptIndex += optionIndexDelta;
				if(currentPromptIndex < 0){
					currentPromptIndex = numOptions-1;
				} else if (currentPromptIndex > numOptions-1){
					currentPromptIndex = 0;
				}
				this.mcp.optionManager.setOption(optionDescriptor.keyName, optionDescriptor.promptValues[currentPromptIndex][1]);
			}
		}

	},

	update: function(paceFactor) {

	},

	render: function(ctx) {
        ctx.clearAll();

        ctx.vectorText("CONFIGURATION OPTIONS", 4, null, 100, null, this.mainTextColor);

        var line_spacing = 15;
        var line_y = 160;
        ctx.vectorText("PRESS <UP>/<DOWN> TO SELECT A CONTROL", 1.5, null, line_y, null, this.mainTextColor);
        line_y += line_spacing;
        ctx.vectorText("PRESS <ENTER> TO EDIT THE SELECTED CONTROL", 1.5, null, line_y, null, this.mainTextColor);
        line_y += line_spacing;
        ctx.vectorText("PRESS <ESCAPE> TO EXIT/CANCEL", 1.5, null, line_y, null, this.mainTextColor);

        var names = this.configurableVirtualButtonNames;
        
        var menu_top_y = 250;
        var menu_center_x = this.canvasWidth/2;
        var menu_line_height = 30;

        var lineSelectionBox = {x:0, y:0, width:0, height:0};
        var selectionBox = null;
        var textWidth;
        for (var i=0, len=this.optionKeyNames.length; i<len; i++){
			var optionKeyName = this.optionKeyNames[i];
			var optionDescriptor = this.mcp.optionManager.optionDescriptors[optionKeyName];

			// Render option prompt text
			switch(optionDescriptor.type){
				case FlynnOptionType.COMMAND:
					ctx.vectorText(
						optionDescriptor.promptText,
						2, null,
						menu_top_y + menu_line_height * i,
						null, this.menuTextColor);

					textWidth = (optionDescriptor.promptText.length * FlynnCharacterSpacing - FlynnCharacterGap) * FlynnOptionTextScale;
					lineSelectionBox = {
						x: this.canvasWidth/2 - textWidth/2 - FlynnOptionSelectionMargin,
						y: menu_top_y + menu_line_height * i - FlynnOptionSelectionMargin,
						width: textWidth + FlynnOptionSelectionMargin * 2,
						height: FlynnCharacterHeight * FlynnOptionTextScale + FlynnOptionSelectionMargin * 2};

					break;
				default:
					ctx.vectorText(
						optionDescriptor.promptText + ':',
						2, menu_center_x - FlynnOptionCenterGapWidth/2,
						menu_top_y + menu_line_height * i,
						0, this.menuTextColor);
					break;
			}

			// Render option value(s)
			var valueText = '';
			var valueColor = this.menuTextColor;
			switch(optionDescriptor.type){
				case FlynnOptionType.BOOLEAN:
					if (optionDescriptor.currentValue === true){
						valueText = "ON";
					}
					else{
						valueText = "OFF";
					}

					textWidth = (3 * FlynnCharacterSpacing - FlynnCharacterGap) * FlynnOptionTextScale;
					lineSelectionBox = {
						x: menu_center_x + FlynnOptionCenterGapWidth/2 - FlynnOptionSelectionMargin,
						y: menu_top_y + menu_line_height * i - FlynnOptionSelectionMargin,
						width: textWidth + FlynnOptionSelectionMargin * 2,
						height: FlynnCharacterHeight * FlynnOptionTextScale + FlynnOptionSelectionMargin * 2};
					break;

				case FlynnOptionType.MULTI:
					var j, len2;
					for (j=0, len2=optionDescriptor.promptValues.length; j<len2; j++){
						valueText += optionDescriptor.promptValues[j][0] + '  ';
					}
					var characterSkip = 0;
					var currentPromptValueIndex = optionDescriptor.currentPromptValueIndex();
					for (j=0, len2=optionDescriptor.promptValues.length; j<len2; j++){
						if(j < currentPromptValueIndex){
							characterSkip += optionDescriptor.promptValues[j][0].length + 2;
						}
					}
					textWidth = (optionDescriptor.promptValues[currentPromptValueIndex][0].length * FlynnCharacterSpacing - FlynnCharacterGap) * FlynnOptionTextScale;
					lineSelectionBox = {
						x: menu_center_x + FlynnOptionCenterGapWidth/2 - FlynnOptionSelectionMargin + (characterSkip * FlynnCharacterSpacing * FlynnOptionTextScale) ,
						y: menu_top_y + menu_line_height * i - FlynnOptionSelectionMargin,
						width: textWidth + FlynnOptionSelectionMargin * 2,
						height: FlynnCharacterHeight * FlynnOptionTextScale + FlynnOptionSelectionMargin * 2};

					ctx.vectorRect(
						lineSelectionBox.x+FlynnOptionSelectionMarginInset,
						lineSelectionBox.y+FlynnOptionSelectionMarginInset,
						lineSelectionBox.width-FlynnOptionSelectionMarginInset*2,
						lineSelectionBox.height-FlynnOptionSelectionMarginInset*2,
						valueColor);
					break;

				case FlynnOptionType.INPUT_KEY:
					var keyCode = optionDescriptor.currentValue;
					if(this.keyAssignmentInProgress && i===this.selectedLineIndex){
						valueText = "PRESS NEW KEY";
						valueColor = this.menuPromptColor;
					}
					else{
						valueText = this.mcp.input.keyCodeToKeyName(keyCode);
					}
					lineSelectionBox = {
						x: menu_center_x + FlynnOptionCenterGapWidth/2 - FlynnOptionSelectionMargin,
						y: menu_top_y + menu_line_height * i - FlynnOptionSelectionMargin,
						width: FlynnOptionInputKeyValueWidth,
						height: FlynnCharacterHeight * FlynnOptionTextScale + FlynnOptionSelectionMargin * 2};
					break;

			}
			ctx.vectorText(
				valueText,
				2, menu_center_x + FlynnOptionCenterGapWidth/2,
				menu_top_y + menu_line_height * i,
				null, valueColor);
			if(i === this.selectedLineIndex){
				selectionBox = lineSelectionBox;
			}
        }

        // Draw box around currently selected option
        if(selectionBox !== null){
			ctx.vectorRect(
				selectionBox.x,
				selectionBox.y,
				selectionBox.width,
				selectionBox.height,
				this.selectionBoxColor);
		}
	}

});