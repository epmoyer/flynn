// --------------------------------------------
// StateConfig class
//    Allow user to configure game options
// --------------------------------------------

(function () {
    'use strict';

    Flynn.StateConfig = Flynn.State.extend({

        init: function (
            mainTextColor,
            menuTextColor,
            selectionBoxColor,
            menuPromptColor,
            parentState,
            abortState,
            abortEnable
        ) {
            this._super();

            Flynn.sounds.ui_select.play();

            this.OPTION_SELECTION_MARGIN = 5;
            this.OPTION_SELECTION_MARGININ_SET = 2;
            this.OPTION_TEXT_SCALE = 2.0;
            this.OPTION_CENTER_GAP_WIDTH = Flynn.Font.Normal.CharacterWidth * 2 * this.OPTION_TEXT_SCALE;
            this.OPTION_KEY_PROMPT = 'PRESS NEW KEY';
            this.OPTION_INPUT_KEY_VALUE_WIDTH = (
                this.OPTION_TEXT_SCALE * Flynn.Font.Normal.CharacterSpacing *
            this.OPTION_KEY_PROMPT.length + 1 +
            this.OPTION_SELECTION_MARGIN * 2
            );

            if (typeof (parentState) === 'undefined' ||
           typeof (abortState) === 'undefined' ||
           typeof (abortEnable) === 'undefined') {
                throw ('API has changed. parentState, abortState & abortEnable are required parameters.');
            }

            this.parentState = parentState;
            this.abortState = abortState;
            this.mainTextColor = mainTextColor;
            this.menuTextColor = menuTextColor;
            this.selectionBoxColor = selectionBoxColor;
            this.menuPromptColor = menuPromptColor;

            Flynn.mcp.optionManager.removeOption('exitToMenu');
            Flynn.mcp.optionManager.removeOption('exitGame');
            if (abortEnable) {
                const self = this;
                Flynn.mcp.optionManager.addOption(
                    'exitToMenu', Flynn.OptionType.COMMAND, true, true,
                    'EXIT TO MENU', null,
                    function () {
                        Flynn.mcp.changeState(self.abortState);
                    });
            } else {
                if (Flynn.mcp.backEnabled) {
                    Flynn.mcp.optionManager.addOption(
                        'exitGame', Flynn.OptionType.COMMAND, true, true,
                        'EXIT GAME', null,
                        function () {
                            window.history.back();
                        });
                }
            }

            this.configurableVirtualButtonNames = Flynn.mcp.input.getConfigurableVirtualButtonNames();

            this.keyAssignmentInProgress = false;

            this.optionKeyNames = Flynn.mcp.optionManager.getOptionKeyNames();
            this.numOptions = this.optionKeyNames.length;
            this.selectedLineIndex = 0;
        },

        handleInputs: function (input, elapsed_ticks) {
            const optionKeyName = this.optionKeyNames[this.selectedLineIndex];
            let commandHandler;
            let currentlyAssignedKeyCode;

            if (this.keyAssignmentInProgress) {
                const capturedKeyCode = input.getCapturedKeyCode();
                if (capturedKeyCode) {
                    if (!input.isKeyCodeAssigned(capturedKeyCode)) {
                    // The chosen keyCode is available.  Assign it.
                        Flynn.mcp.optionManager.setOption(optionKeyName, capturedKeyCode);
                        this.keyAssignmentInProgress = false;
                        Flynn.sounds.ui_success.play();
                    } else {
                        currentlyAssignedKeyCode = Flynn.mcp.optionManager.getOption(optionKeyName);
                        if (currentlyAssignedKeyCode === capturedKeyCode) {
                        // User pressed the key which was already assigned.  Do nothing.
                            this.keyAssignmentInProgress = false;
                            Flynn.sounds.ui_cancel.play();
                        } else {
                        // The chosen keyCode is not availble. Keep waiting for a valid key.
                            input.armKeyCodeCapture();
                            // TODO: Prompt user that key is in use.
                            console.log('that key is in use');
                            Flynn.sounds.ui_error.play();
                        }
                    }
                }

                if (input.virtualButtonWasPressed('UI_escape')) {
                    this.keyAssignmentInProgress = false;
                    Flynn.sounds.ui_cancel.play();
                }
                return;
            }

            const optionDescriptor = Flynn.mcp.optionManager.optionDescriptors[this.optionKeyNames[this.selectedLineIndex]];

            if (Flynn.mcp.arcadeModeEnabled) {
                if (input.virtualButtonWasPressed('quarter')) {
                    Flynn.mcp.credits += 1;
                    this.insert_coin_sound.play();
                }
            }
            if (input.virtualButtonWasPressed('UI_escape')) {
            // Exit back to the parent state
                Flynn.mcp.changeState(this.parentState);
                Flynn.sounds.ui_cancel.play();
            }
            if (input.virtualButtonWasPressed('UI_down')) {
                ++this.selectedLineIndex;
                if (this.selectedLineIndex >= this.numOptions) {
                    this.selectedLineIndex = 0;
                }
                Flynn.sounds.ui_move.play();
            }
            if (input.virtualButtonWasPressed('UI_up')) {
                --this.selectedLineIndex;
                if (this.selectedLineIndex < 0) {
                    this.selectedLineIndex = this.numOptions - 1;
                }
                Flynn.sounds.ui_move.play();
            }
            if (input.virtualButtonWasPressed('UI_enter')) {
                switch (optionDescriptor.type) {
                case Flynn.OptionType.BOOLEAN:
                    // Toggle boolean
                    Flynn.mcp.optionManager.setOption(optionDescriptor.keyName, !optionDescriptor.currentValue);
                    commandHandler = optionDescriptor.commandHandler;
                    if (commandHandler !== null) {
                        commandHandler();
                    }
                    break;

                case Flynn.OptionType.INPUT_KEY:
                    input.armKeyCodeCapture();
                    this.keyAssignmentInProgress = true;
                    break;

                case Flynn.OptionType.COMMAND:
                    commandHandler = optionDescriptor.commandHandler;
                    if (commandHandler !== null) {
                        commandHandler();
                    }
                    break;
                }
                Flynn.sounds.ui_select.play();
            }
            let optionIndexDelta = 0;
            if (input.virtualButtonWasPressed('UI_left')) {
                optionIndexDelta = -1;
            }
            if (input.virtualButtonWasPressed('UI_right')) {
                optionIndexDelta = 1;
            }
            if (optionIndexDelta !== 0) {
                if (optionDescriptor.type === Flynn.OptionType.MULTI) {
                    let currentPromptIndex = optionDescriptor.currentPromptValueIndex();
                    const numOptions = optionDescriptor.promptValues.length;
                    currentPromptIndex += optionIndexDelta;
                    if (currentPromptIndex < 0) {
                        currentPromptIndex = numOptions - 1;
                    } else if (currentPromptIndex > numOptions - 1) {
                        currentPromptIndex = 0;
                    }
                    Flynn.mcp.optionManager.setOption(optionDescriptor.keyName, optionDescriptor.promptValues[currentPromptIndex][1]);
                    Flynn.sounds.ui_select.play();
                }
            }
        },

        update: function (elapsed_ticks) {

        },

        render: function (ctx) {
            ctx.vectorText2({
                text: 'CONFIGURATION OPTIONS',
                scale: 4,
                y: 100,
                color: this.mainTextColor
            });

            const line_spacing = 15;
            let line_y = 160;
            ctx.vectorText2({
                text: 'PRESS <UP>/<DOWN> TO SELECT A CONTROL',
                scale: 1.5,
                y: line_y,
                color: this.mainTextColor
            });
            line_y += line_spacing;
            ctx.vectorText2({
                text: 'PRESS <ENTER> TO EDIT THE SELECTED CONTROL',
                scale: 1.5,
                y: line_y,
                color: this.mainTextColor
            });
            line_y += line_spacing;
            ctx.vectorText2({
                text: 'PRESS <ESCAPE> TO EXIT/CANCEL',
                scale: 1.5,
                y: line_y,
                color: this.mainTextColor
            });

            const menu_top_y = 250;
            const menu_center_x = Flynn.mcp.canvasWidth / 2;
            const menu_line_height = 30;

            let lineSelectionBox = { x: 0, y: 0, width: 0, height: 0 };
            let selectionBox = null;
            let textWidth;
            for (let i = 0, len = this.optionKeyNames.length; i < len; i++) {
                const optionKeyName = this.optionKeyNames[i];
                const optionDescriptor = Flynn.mcp.optionManager.optionDescriptors[optionKeyName];

                // Render option prompt text
                switch (optionDescriptor.type) {
                case Flynn.OptionType.COMMAND:
                    ctx.vectorText2({
                        text: optionDescriptor.promptText.toUpperCase(),
                        scale: 2,
                        y: menu_top_y + menu_line_height * i,
                        color: this.menuTextColor
                    });

                    textWidth = (optionDescriptor.promptText.length * Flynn.Font.Normal.CharacterSpacing - Flynn.Font.Normal.CharacterGap) * this.OPTION_TEXT_SCALE;
                    lineSelectionBox = {
                        x: Flynn.mcp.canvasWidth / 2 - textWidth / 2 - this.OPTION_SELECTION_MARGIN,
                        y: menu_top_y + menu_line_height * i - this.OPTION_SELECTION_MARGIN,
                        width: textWidth + this.OPTION_SELECTION_MARGIN * 2,
                        height: Flynn.Font.Normal.CharacterHeight * this.OPTION_TEXT_SCALE + this.OPTION_SELECTION_MARGIN * 2
                    };

                    break;
                default:
                    ctx.vectorText2({
                        text: optionDescriptor.promptText.toUpperCase() + ':',
                        scale: 2,
                        x: menu_center_x - this.OPTION_CENTER_GAP_WIDTH / 2,
                        y: menu_top_y + menu_line_height * i,
                        justify: 'right',
                        color: this.menuTextColor
                    });
                    break;
                }

                // Render option value(s)
                let valueText = '';
                let valueColor = this.menuTextColor;
                switch (optionDescriptor.type) {
                case Flynn.OptionType.BOOLEAN:
                    if (optionDescriptor.currentValue === true) {
                        valueText = 'ON';
                    } else {
                        valueText = 'OFF';
                    }

                    textWidth = (3 * Flynn.Font.Normal.CharacterSpacing - Flynn.Font.Normal.CharacterGap) * this.OPTION_TEXT_SCALE;
                    lineSelectionBox = {
                        x: menu_center_x + this.OPTION_CENTER_GAP_WIDTH / 2 - this.OPTION_SELECTION_MARGIN,
                        y: menu_top_y + menu_line_height * i - this.OPTION_SELECTION_MARGIN,
                        width: textWidth + this.OPTION_SELECTION_MARGIN * 2,
                        height: Flynn.Font.Normal.CharacterHeight * this.OPTION_TEXT_SCALE + this.OPTION_SELECTION_MARGIN * 2
                    };
                    break;

                case Flynn.OptionType.MULTI:
                    var j, len2;
                    for (j = 0, len2 = optionDescriptor.promptValues.length; j < len2; j++) {
                        valueText += optionDescriptor.promptValues[j][0] + '  ';
                    }
                    var characterSkip = 0;
                    var currentPromptValueIndex = optionDescriptor.currentPromptValueIndex();
                    for (j = 0, len2 = optionDescriptor.promptValues.length; j < len2; j++) {
                        if (j < currentPromptValueIndex) {
                            characterSkip += optionDescriptor.promptValues[j][0].length + 2;
                        }
                    }
                    textWidth = (optionDescriptor.promptValues[currentPromptValueIndex][0].length * Flynn.Font.Normal.CharacterSpacing - Flynn.Font.Normal.CharacterGap) * this.OPTION_TEXT_SCALE;
                    lineSelectionBox = {
                        x: menu_center_x + this.OPTION_CENTER_GAP_WIDTH / 2 - this.OPTION_SELECTION_MARGIN + (characterSkip * Flynn.Font.Normal.CharacterSpacing * this.OPTION_TEXT_SCALE),
                        y: menu_top_y + menu_line_height * i - this.OPTION_SELECTION_MARGIN,
                        width: textWidth + this.OPTION_SELECTION_MARGIN * 2,
                        height: Flynn.Font.Normal.CharacterHeight * this.OPTION_TEXT_SCALE + this.OPTION_SELECTION_MARGIN * 2
                    };

                    ctx.vectorRect(
                        lineSelectionBox.x + this.OPTION_SELECTION_MARGININ_SET,
                        lineSelectionBox.y + this.OPTION_SELECTION_MARGININ_SET,
                        lineSelectionBox.width - this.OPTION_SELECTION_MARGININ_SET * 2,
                        lineSelectionBox.height - this.OPTION_SELECTION_MARGININ_SET * 2,
                        valueColor);
                    break;

                case Flynn.OptionType.INPUT_KEY:
                    var keyCode = optionDescriptor.currentValue;
                    if (this.keyAssignmentInProgress && i === this.selectedLineIndex) {
                        valueText = 'PRESS NEW KEY';
                        valueColor = this.menuPromptColor;
                    } else {
                        valueText = Flynn.mcp.input.keyCodeToKeyName(keyCode).toUpperCase();
                    }
                    lineSelectionBox = {
                        x: menu_center_x + this.OPTION_CENTER_GAP_WIDTH / 2 - this.OPTION_SELECTION_MARGIN,
                        y: menu_top_y + menu_line_height * i - this.OPTION_SELECTION_MARGIN,
                        width: this.OPTION_INPUT_KEY_VALUE_WIDTH,
                        height: Flynn.Font.Normal.CharacterHeight * this.OPTION_TEXT_SCALE + this.OPTION_SELECTION_MARGIN * 2
                    };
                    break;
                }
                ctx.vectorText2({
                    text: valueText,
                    scale: 2,
                    x: menu_center_x + this.OPTION_CENTER_GAP_WIDTH / 2,
                    y: menu_top_y + menu_line_height * i,
                    justify: 'left',
                    color: valueColor
                });
                if (i === this.selectedLineIndex) {
                    selectionBox = lineSelectionBox;
                }
            }

            // Draw box around currently selected option
            if (selectionBox !== null) {
                ctx.vectorRect(
                    selectionBox.x,
                    selectionBox.y,
                    selectionBox.width,
                    selectionBox.height,
                    this.selectionBoxColor);
            }
        }

    });
}()); // "use strict" wrapper
