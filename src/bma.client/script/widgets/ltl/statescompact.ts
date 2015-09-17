﻿/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.statescompact", {
        _stateButtons: null,
        _emptyStateAddButton: null,
        _emptyStatePlaceholder: null,
        _stateOptionsWindow: null,

        options: {
            states: [],
            commands: undefined,
        },

        _create: function () {
            var that = this;

            this.element.addClass("state-compact");
            this._emptyStateAddButton = $("<div>+</div>").addClass("state-button-empty").addClass("new").appendTo(this.element).click(function () {
                var newState = {
                    name: "A",
                    description: "",
                    formula: [
                        [
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined
                        ]
                    ]
                };

                that.options.states.push(newState);
                var stateButton = $("<div>" + newState.name + "</div>").attr("data-state-name", newState.name)
                    .addClass("state-button").appendTo(that._stateButtons);

                that._stateButtons.show();
                that._emptyStateAddButton.hide();
                that._emptyStatePlaceholder.hide();

                that.executeCommand("StatesChanged", { states: that.options.states, changeType: "stateAdded" });
            });

            this._emptyStatePlaceholder = $("<div>start by defining some model states</div>").addClass("state-placeholder").appendTo(this.element);

            this._stateButtons = $("<div></div>").addClass("state-buttons").appendTo(this.element);

            for (var i = 0; i < this.options.states.length; i++) {
                var stateButton = $("<div>" + this.options.states[i].name + "</div>").addClass("state-button").appendTo(this._stateButtons).hover(function () {
                    //that._stateOptionsWindow = $("<div></div>").addClass("state-options-window").appendTo(that.element);
                    //var windowPointer = $("<div></div>").addClass("pointer").appendTo(that._stateOptionsWindow);
                    //var stateOptions = $("<div></div>").addClass("state-options").appendTo(that._stateOptionsWindow);
                });
            }

            if (this.options.states.length == 0) {
                this._stateButtons.hide();
            } else {
                this._emptyStateAddButton.hide();
                this._emptyStatePlaceholder.hide();
            }
        },

        _setOption: function (key, value) {
            switch (key) {
                case "states": {
                    this.options.states = [];
                    this._stateButtons.children().remove();
                    for (var i = 0; i < value.length; i++) {
                        this.options.states.push(value[i]);
                        var stateButton = $("<div>" + value[i].name + "</div>").attr("data-state-name", value[i].name)
                            .addClass("state-button").appendTo(this._stateButtons);
                    }

                    this._stateButtons.show();
                    this._emptyStateAddButton.hide();
                    this._emptyStatePlaceholder.hide();

                    this.refresh();
                    break;
                }
                case "commands": {
                    this.options.commands = value;
                    break;
                }
                default: break;
            }
        },

        _setOptions: function (options) {
            this._super(options);
        }, 

        executeCommand: function (commandName, args) {
            if (this.options.commands !== undefined) {
                this.options.commands.Execute(commandName, args);
            }
        },

        refresh: function () {
        }, 

        addState: function (state) {

        }
    });
} (jQuery));

interface JQuery {
    statescompact(): JQuery;
    statescompact(settings: Object): JQuery;
    statescompact(optionLiteral: string, optionName: string): any;
    statescompact(optionLiteral: string, optionName: string, optionValue: any): JQuery;
    statescompact(methodName: string, methodValue: any): JQuery;
} 