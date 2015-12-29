﻿/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

module BMA {
    export module UIDrivers {

        export class KeyframesExpandedViewer implements IKeyframesFull {
            private keyframe: JQuery;

            constructor(keyframe: JQuery) {
                this.keyframe = keyframe;
            }

            public AddState(items) {
                //this.keyframe.ltlstatesviewer('addState', items);
            }

            public GetContent() {
                return this.keyframe;
            }

            public RemovePart(p1, p2) {
                //this.keyframe.ltlstatesviewer('removePart', items);
            }
        }


        export class LTLViewer implements ILTLViewer, IKeyframesList {

            private ltlviewer: JQuery;
            private accordion: JQuery;

            constructor(accordion: JQuery, ltlviewer: JQuery) {
                this.ltlviewer = ltlviewer;
                this.accordion = accordion;

                this.ltlviewer.ltlviewer({
                    opentpeditor: function () {
                        window.Commands.Execute("Expand", "LTLTempProp");
                    },
                    openstateseditor: function () {
                        window.Commands.Execute("Expand", "LTLStates");
                    }
                });

                accordion.bmaaccordion({
                    onactivetabchanged: () => {
                        this.ltlviewer.ltlviewer("GetTPViewer").temporalpropertiesviewer("refresh");
                    }
                });
            }

            public AddState(items) {
                var resdiv = this.ltlviewer.ltlviewer('Get', 'LTLStates');
                var content = resdiv.resultswindowviewer('option', 'content');
                content.keyframecompact('add', items);
            }

            public Show(tab) {
                if (tab !== undefined) {
                    var content: JQuery = this.ltlviewer.ltlviewer('Get', tab);
                    content.show();
                }
                else {
                    this.ltlviewer.ltlviewer('Show', undefined);
                }
            }

            public Hide(tab) {
                if (tab !== undefined) {
                    var content: JQuery = this.ltlviewer.ltlviewer('Get', tab);
                    content.hide();
                }
            }

            public SetResult(res) {
                var resdiv = this.ltlviewer.ltlviewer('Get', 'LTLResults');
                var content: JQuery = resdiv.resultswindowviewer('option', 'content');
                content.coloredtableviewer({ "colorData": res, type: "color" });
                content.find(".proof-propagation-overview").addClass("ltl-result-table");
                content.find('td.propagation-cell-green').removeClass("propagation-cell-green");
                content.find('td.propagation-cell-red').removeClass("propagation-cell-red").addClass("change");
            }

            GetContent() {
                return this.ltlviewer;
            }

            GetTemporalPropertiesViewer() {
                return new BMA.UIDrivers.TemporalPropertiesViewer(this.ltlviewer.ltlviewer("GetTPViewer"));
            }

            GetStatesViewer() {
                return new BMA.UIDrivers.StatesViewerDriver(this.ltlviewer.ltlviewer("GetStatesViewer"));
            }
        }

        export class TemporalPropertiesEditorDriver implements ITemporalPropertiesEditor {
            private popupWindow: JQuery;
            private tpeditor: JQuery;
            private commands: ICommandRegistry;
            private svgDriver: SVGPlotDriver;
            private contextMenuDriver: IContextMenu;
            private statesToSet = [];
            private ftvcallback: Function = undefined;

            constructor(commands: ICommandRegistry, popupWindow: JQuery) {
                this.popupWindow = popupWindow;
                this.commands = commands;
            }

            public Show() {
                var that = this;

                var shouldInit = this.tpeditor === undefined;
                if (shouldInit) {
                    this.tpeditor = $("<div></div>").css("height", "100%");
                }

                this.popupWindow.removeClass('further-testing-popout')
                    .removeClass('proof-propagation-popout')
                    .removeClass('proof-variables-popout')
                    .removeClass('simulation-popout');

                this.popupWindow.resultswindowviewer({ header: "Temporal Properties", tabid: "", content: this.tpeditor, icon: "min", isResizable: true, onresize: () => { that.OnResize(); }, paddingOn: false });
                popup_position();
                this.popupWindow.show();

                if (shouldInit) {
                    this.tpeditor.temporalpropertieseditor({ commands: this.commands, states: this.statesToSet, onaddstaterequested: function () { window.Commands.Execute("Expand", "LTLStates"); } });
                    this.svgDriver = new BMA.UIDrivers.SVGPlotDriver(this.tpeditor.temporalpropertieseditor("getDrawingSurface"));
                    this.svgDriver.SetGridVisibility(false);

                    this.contextMenuDriver = new BMA.UIDrivers.ContextMenuDriver(this.tpeditor.temporalpropertieseditor("getContextMenuPanel"));
                }

                this.popupWindow.trigger("resize");
                this.tpeditor.temporalpropertieseditor("updateLayout");
            }

            OnResize() {
                this.tpeditor.temporalpropertieseditor("updateLayout");
            }

            Hide() {
                this.popupWindow.hide();
            }

            GetSVGDriver(): ISVGPlot {
                return this.svgDriver;
            }

            GetNavigationDriver(): INavigationPanel {
                return this.svgDriver;
            }

            GetDragService(): IElementsPanel {
                return this.svgDriver;
            }

            GetContextMenuDriver(): IContextMenu {
                return this.contextMenuDriver;
            }

            HighlightCopyZone(ishighlighted: boolean) {
                this.tpeditor.temporalpropertieseditor("highlightcopyzone", ishighlighted);
            }

            HighlightDeleteZone(ishighlighted: boolean) {
                this.tpeditor.temporalpropertieseditor("highlightdeletezone", ishighlighted);
            }

            GetCopyZoneBBox() {
                return this.tpeditor.temporalpropertieseditor("getcopyzonebbox");
            }

            GetDeleteZoneBBox() {
                return this.tpeditor.temporalpropertieseditor("getdeletezonebbox");
            }

            SetCopyZoneVisibility(isVisible: boolean) {
                this.tpeditor.temporalpropertieseditor("setcopyzonevisibility", isVisible);
            }

            SetDeleteZoneVisibility(isVisible: boolean) {
                this.tpeditor.temporalpropertieseditor("setdeletezonevisibility", isVisible);
            }

            SetStates(states: BMA.LTLOperations.Keyframe[]) {
                if (this.tpeditor !== undefined) {
                    this.tpeditor.temporalpropertieseditor({ states: states });
                } else {
                    this.statesToSet = states;
                }
            }

            SetFitToViewCallback(callback: Function) {
                this.ftvcallback = callback;
                if (this.tpeditor !== undefined) {
                    this.tpeditor.temporalpropertieseditor({ onfittoview: callback });
                }
            }

            SetCopyZoneIcon(operation: BMA.LTLOperations.Operation) {
                if (this.tpeditor !== undefined) {
                    this.tpeditor.temporalpropertieseditor({ copyzoneoperation: operation });
                }
            }
        }

        export class StatesViewerDriver implements IStatesViewer {
            private statesViewer: JQuery;
            private commands: ICommandRegistry;

            constructor(statesViewer: JQuery) {
                this.statesViewer = statesViewer;
            }

            public SetCommands(commands: BMA.CommandRegistry) {
                this.commands = commands;
                this.statesViewer.statescompact({ commands: commands });
            }

            public SetStates(states: BMA.LTLOperations.Keyframe[]) {
                var that = this;
                var wstates = [];
                for (var i = 0; i < states.length; i++) {
                    var s = states[i];
                    var ws = {
                        name: s.Name,
                        description: s.Description,
                        formula: [],
                    };

                    for (var j = 0; j < s.Operands.length; j++) {
                        var opnd = s.Operands[j];
                        var formula = [];

                        formula.push({
                            type: (<any>opnd).LeftOperand.Name === undefined ? "const" : "variable",
                            value: (<any>opnd).LeftOperand.Name === undefined ? (<any>opnd).LeftOperand.Value : (<any>opnd).LeftOperand.Name
                        });

                        if ((<any>opnd).MiddleOperand !== undefined) {
                            var leftop = (<any>opnd).LeftOperator;
                            formula.push({
                                type: "operator",
                                value: leftop
                            });

                            var middle = (<any>opnd).MiddleOperand;
                            formula.push({
                                type: middle.Name === undefined ? "const" : "variable",
                                value: middle.Name === undefined ? middle.Value : middle.Name
                            });

                            var rightop = (<any>opnd).RightOperator;
                            formula.push({
                                type: "operator",
                                value: rightop
                            });

                        } else {
                            formula.push({
                                type: "operator",
                                value: (<any>opnd).Operator
                            });
                        }

                        formula.push({
                            type: (<any>opnd).RightOperand.Name === undefined ? "const" : "variable",
                            value: (<any>opnd).RightOperand.Name === undefined ? (<any>opnd).RightOperand.Value : (<any>opnd).RightOperand.Name
                        });
                        ws.formula.push(formula);
                    }

                    wstates.push(ws);
                }

                if (this.statesViewer !== undefined) {
                    this.statesViewer.statescompact({ states: wstates });
                }
            }
        }

        export class StatesEditorDriver implements IStatesEditor {
            private popupWindow: JQuery;
            private commands: ICommandRegistry;
            private statesEditor: JQuery;
            private statesToSet: BMA.LTLOperations.Keyframe[];
            private variablesToSet;
            private model: BMA.Model.BioModel

            constructor(commands: ICommandRegistry, popupWindow: JQuery) {
                this.popupWindow = popupWindow;
                this.commands = commands;
            }

            public Convert(states: any) {
                var wstates: BMA.LTLOperations.Keyframe[] = [];
                for (var i = 0; i < states.length; i++) {
                    var ops = [];
                    var formulas = states[i].formula;
                    var op = undefined;
                    var isEmpty = false;
                    for (var j = 0; j < formulas.length; j++) {
                        var op = undefined;
                        var f = formulas[j];

                        if (f[0] && f[0].type == "variable" && f[0].value && f[0].value.variable && f[1] && f[1].value && f[2]) {
                            var operator = f[1].value;
                            var constant = parseFloat(f[2].value);
                            op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable),
                                operator, new BMA.LTLOperations.ConstOperand(constant));
                            ops.push(op);
                        }

                        if (op === undefined)
                            isEmpty = true;
                    }
                    if (formulas.length != 0 && ops.length != 0 && !isEmpty) {
                        var ws = new BMA.LTLOperations.Keyframe(states[i].name, states[i].description, ops);
                        wstates.push(ws);
                    }
                }
                return wstates;
            }

            public Show() {
                var shouldInit = this.statesEditor === undefined;
                if (shouldInit) {
                    this.statesEditor = $("<div></div>");
                }

                this.popupWindow.removeClass('further-testing-popout')
                    .removeClass('proof-propagation-popout')
                    .removeClass('proof-variables-popout')
                    .removeClass('simulation-popout');

                this.popupWindow.resultswindowviewer({ header: "LTL States", tabid: "", content: this.statesEditor, icon: "min", isResizable: false, paddingOn: false });
                popup_position();
                this.popupWindow.show();

                if (shouldInit) {
                    var that = this;
                    var onStatesUpdated = function (args) {
                        var wstates = that.Convert(args.states);
                        that.commands.Execute("KeyframesChanged", { states: wstates });
                    };

                    var onComboBoxOpen = function () {
                        that.commands.Execute("UpdateStatesEditorOptions", {});
                    };

                    this.statesEditor.stateseditor({ onStatesUpdated: onStatesUpdated, onComboBoxOpen: onComboBoxOpen });

                    window.Commands.On("HandlePopupDrop", (params) => {
                        var screenLocation = params.screenLocation;
                        var popupPosition = $(this.popupWindow).offset();
                        var w = $(this.popupWindow).width();
                        var h = $(this.popupWindow).height();
                        if ((screenLocation.x > popupPosition.left && screenLocation.x < popupPosition.left + w)
                            && (screenLocation.y > popupPosition.top && screenLocation.y < popupPosition.top + h)
                            && (params.dropObject.type == "variable")) {
                            var variable = that.model.GetVariableById(params.dropObject.id);
                            that.statesEditor.stateseditor("checkDroppedItem", {
                                screenLocation: params.screenLocation,
                                variable: { container: variable.ContainerId, variable: variable.Name }
                            });
                        }
                    });

                    if (this.variablesToSet !== undefined) {
                        this.statesEditor.stateseditor({ variables: this.variablesToSet });
                        this.variablesToSet = undefined;
                    }

                    if (this.statesToSet !== undefined) {
                        this.statesEditor.stateseditor({ states: this.statesToSet });
                        this.statesToSet = undefined;
                    }


                }
            }

            public Hide() {
                this.popupWindow.hide();
            }

            public SetModel(model: BMA.Model.BioModel, layout: BMA.Model.Layout) {
                var allGroup = {
                    name: "ALL",
                    id: 0,
                    vars: []
                };

                for (var i = 0; i < model.Variables.length; i++) {
                    if (allGroup.vars.indexOf(model.Variables[i].Name) < 0)
                        allGroup.vars.push(model.Variables[i].Name);
                }

                var variables = [allGroup];

                for (var i = 0; i < layout.Containers.length; i++) {
                    var vars = [];

                    if (!layout.Containers[i].Name)
                        continue;

                    for (var j = 0; j < model.Variables.length; j++) {
                        if (layout.Containers[i].Id == model.Variables[j].ContainerId)
                            vars.push(model.Variables[j].Name);
                    }

                    variables.push({
                        name: layout.Containers[i].Name,
                        id: layout.Containers[i].Id,
                        vars: vars
                    });
                }

                if (this.statesEditor !== undefined) {
                    this.statesEditor.stateseditor({ variables: variables });
                } else {
                    this.variablesToSet = variables;
                }
                this.model = model;
            }

            public SetStates(states: BMA.LTLOperations.Keyframe[]) {
                var wstates = [];
                for (var i = 0; i < states.length; i++) {
                    var s = states[i];
                    var ws = {
                        name: s.Name,
                        description: s.Description,
                        formula: []
                    };
                    for (var j = 0; j < s.Operands.length; j++) {
                        var opnd = s.Operands[j];
                        var formulaPart = [];

                        var op = {
                            type: (<any>opnd).LeftOperand.Name === undefined ? "const" : "variable",
                            value: (<any>opnd).LeftOperand.Name === undefined ? (<any>opnd).LeftOperand.Value : { variable: (<any>opnd).LeftOperand.Name }
                        }

                        formulaPart.push(op);

                        if ((<any>opnd).MiddleOperand !== undefined) {
                            var leftop = (<any>opnd).LeftOperator;
                            formulaPart.push({
                                type: "operator",
                                value: leftop
                            });

                            var middle = (<any>opnd).MiddleOperand;
                            formulaPart.push({
                                type: middle.Name === undefined ? "const" : "variable",
                                value: middle.Name === undefined ? middle.Value : { variable: middle.Name }
                            });

                            var rightop = (<any>opnd).RightOperator;
                            formulaPart.push({
                                type: "operator",
                                value: rightop
                            });

                        } else {
                            formulaPart.push({
                                type: "operator",
                                value: (<any>opnd).Operator
                            });
                        }

                        formulaPart.push({
                            type: (<any>opnd).RightOperand.Name === undefined ? "const" : "variable",
                            value: (<any>opnd).RightOperand.Name === undefined ? (<any>opnd).RightOperand.Value : { variable: (<any>opnd).RightOperand.Name }
                        });

                        ws.formula.push(formulaPart);
                    }

                    wstates.push(ws);
                }

                if (this.statesEditor !== undefined) {
                    this.statesEditor.stateseditor({ states: wstates });
                } else {
                    this.statesToSet = wstates;
                }
            }
        }

        export class TemporalPropertiesViewer implements ITemporalPropertiesViewer {
            private tpviewer: JQuery;
            constructor(tpviewer: JQuery) {
                this.tpviewer = tpviewer;
            }

            public SetOperations(operations: { operation: BMA.LTLOperations.IOperand; status: string }[]) {
                this.tpviewer.temporalpropertiesviewer({ operations: operations });
            }

            public Refresh() {
                this.tpviewer.temporalpropertiesviewer("refresh");
            }
        }

        export class LTLResultsViewerFactory implements ILTLResultsViewerFactory {
            constructor() {
            }

            CreateCompactLTLViewer(div: JQuery) {
                return new LTLResultsCompactViewer(div);
            }
        }

        export class LTLResultsCompactViewer implements ICompactLTLResultsViewer {
            private compactltlresult: JQuery = undefined;
            private steps: number = 10;
            private ltlrequested;
            private expandedcallback;
            private showresultcallback;

            constructor(compactltlresult: JQuery) {
                var that = this;

                this.compactltlresult = compactltlresult;
                this.compactltlresult.compactltlresult({
                    status: "nottested",
                    isexpanded: false,
                    steps: that.steps,
                    ontestrequested: function () {
                        if (that.ltlrequested !== undefined)
                            that.ltlrequested();
                    },
                    onstepschanged: function (steps) {
                        that.steps = steps;
                    },
                    onexpanded: function () {
                        if (that.expandedcallback !== undefined) {
                            that.expandedcallback();
                        }
                    },
                    onshowresultsrequested: function (showpositive) {
                        if (that.showresultcallback !== undefined) {
                            that.showresultcallback(showpositive);
                        }
                    }
                });
            }

            public Collapse() {
                this.compactltlresult.compactltlresult({ isexpanded: false });
            }

            public Expand() {
                this.compactltlresult.compactltlresult({ isexpanded: true });
            }

            public SetStatus(status: string) {
                var options: any = {
                    status: status
                };
                if (status !== "processing") {
                    options.isexpanded = false;
                }

                this.compactltlresult.compactltlresult(options);
            }

            public SetSteps(steps: number) {
                if (steps && steps > 0)
                    this.compactltlresult.compactltlresult({
                        steps: steps
                    });
            }

            public GetSteps(): number {
                return this.steps;
            }

            public SetLTLRequestedCallback(callback) {
                this.ltlrequested = callback;
            }

            public SetOnExpandedCallback(callback) {
                this.expandedcallback = callback;
            }

            public SetShowResultsCallback(callback) {
                this.showresultcallback = callback;
            }
        }

        export class LTLResultsViewer implements ILTLResultsViewer {
            private popupWindow: JQuery;
            private commands: ICommandRegistry;
            private ltlResultsViewer: JQuery;

            private exportCSVcallback = undefined;

            private dataToSet = undefined;

            constructor(commands: ICommandRegistry, popupWindow: JQuery) {
                this.popupWindow = popupWindow;
                this.commands = commands;
            }

            public Show() {
                var that = this;

                var shouldInit = this.ltlResultsViewer === undefined;
                if (shouldInit) {
                    this.ltlResultsViewer = $("<div></div>");
                }

                this.popupWindow.resultswindowviewer({ header: "LTL Simulation", tabid: "", content: this.ltlResultsViewer, icon: "min", isResizable: false, paddingOn: true });
                popup_position();
                this.popupWindow.show();

                if (shouldInit) {
                    if (this.dataToSet !== undefined) {
                        this.ltlResultsViewer.ltlresultsviewer(this.dataToSet);
                        this.dataToSet = undefined;
                    } else {
                        this.ltlResultsViewer.ltlresultsviewer();
                    }

                    if (this.exportCSVcallback !== undefined) {
                        this.ltlResultsViewer.ltlresultsviewer({ onExportCSV: that.exportCSVcallback });
                        this.exportCSVcallback = undefined;
                    }
                }
            }

            public Hide() {
                this.popupWindow.hide();
            }

            private Compare(value1: number, value2: number, operator: string): boolean {
                switch (operator) {
                    case "<":
                        return value1 < value2;
                    case "<=":
                        return value1 <= value2;
                    case ">":
                        return value1 > value2;
                    case ">=":
                        return value1 >= value2;
                    case "=":
                        return value1 == value2;
                    case "!=":
                        return value1 !== value2;
                    default:
                        throw "Unknown operator";
                }
            }

            public CheckEquation(op: LTLOperations.KeyframeEquation | LTLOperations.DoubleKeyframeEquation,
                value: any[], variables: Model.Variable[]): boolean {

                var that = this;
                if (op instanceof BMA.LTLOperations.KeyframeEquation) {
                    if (op.LeftOperand instanceof BMA.LTLOperations.NameOperand) {
                        var varName = (<BMA.LTLOperations.NameOperand>op.LeftOperand).Name;
                        var ind;
                        for (var n = 0; n < variables.length; n++)
                            if (variables[n].Name == varName) {
                                ind = n;
                                break;
                            }
                        var curVal = value[ind];
                        var rightOp = (op.RightOperand instanceof BMA.LTLOperations.ConstOperand) ? (<BMA.LTLOperations.ConstOperand>op.RightOperand).Value :
                            undefined;
                        return that.Compare(curVal, rightOp, op.Operator);
                    } else {
                        throw "Variable must be first in equation";
                    }
                } else {
                    throw "Unknown equation type";
                }
            }

            public PrepareTableData(variables: Model.Variable[], ticks: any): { init: any[], data: any[][] } {
                var that = this;

                var init = [];
                var data = [];
                for (var i = 0; i < ticks.length; i++) {
                    var tick = ticks[i].Variables;
                    data.push([]);
                    for (var k = 0; k < variables.length; k++) {
                        for (var j = 0; j < tick.length; j++) {
                            if (tick[j].Id == variables[k].Id) {
                                var ij = tick[j];
                                if (ij.Lo === ij.Hi) {
                                    if (i == 0) init.push(ij.Lo);
                                    data[i].push(ij.Lo);
                                }
                                else {
                                    if (i == 0) init.push(ij.Lo + ' - ' + ij.Hi);
                                    data[i].push(ij.Lo + ' - ' + ij.Hi);
                                }
                            }
                        }
                    }
                }
                return { init: init, data: data };
            }

            public PrepareTableTags(data: any[], states: BMA.LTLOperations.Keyframe[], variables: Model.Variable[]) {
                var that = this;

                var tags = [];
                for (var i = 0; i < data.length; i++)
                    tags.push([]);

                for (var i = 0; i < states.length; i++) {
                    var state = states[i];
                    for (var k = 0; k < data.length; k++) {
                        var result = true;
                        for (var j = 0; j < state.Operands.length; j++) {
                            var op = state.Operands[j];
                            result = result && that.CheckEquation(op, data[k], variables);
                        }
                        if (state.Operands.length !== 0 && result)
                            tags[k].push(state.Name);
                    }
                }
                return tags;
            }

            public PreparePlotLabels(tags: any[], labelsHeight: number) {
                
                var labels = [];
                var count = (tags.length > 0) ? 1 : 0;
                var firstTime = 0;
                var currState = [];

                var compareTags = function (prev, curr) {
                    if (prev === undefined || curr === undefined)
                        return false;
                    if (prev.length === curr.length) {
                        for (var j = 0; j < prev.length; j++) {
                            if (prev[j] !== curr[j])
                                return false;
                        }
                        return true;
                    }
                    return false;
                }


                for (var i = 0; i < tags.length - 1; i++) {
                    currState.push([]);
                    for (var j = 0; j < tags[i].length; j++) {
                        for (var k = 0; k < tags[i + 1].length; k++)
                            if (tags[i][j] == tags[i + 1][k]) {
                                currState[i].push(tags[i][j]);
                                break;
                            }
                    }
                }

                var prevState = currState[0];

                for (var i = 1; i < currState.length; i++) {
                    if (!compareTags(prevState, currState[i])) {
                        if (prevState && prevState.length !== 0)
                            labels.push({
                                text: prevState,
                                width: count,
                                height: labelsHeight,
                                x: firstTime,
                                y: 0,
                            });
                        prevState = currState[i];
                        firstTime = i;
                        count = 1;
                    } else {
                        count++;
                    }
                }

                if (i == currState.length && prevState.length !== 0)
                    labels.push({
                        text: prevState,
                        width: count,
                        height: labelsHeight,
                        x: firstTime,
                        y: 0,
                    });
                return labels;
            }

            public SetData(model: BMA.Model.BioModel, layout: BMA.Model.Layout, ticks: any, states: BMA.LTLOperations.Keyframe[]) {
                var that = this;

                var vars = model.Variables.sort((x, y) => {
                    return x.Id < y.Id ? -1 : 1;
                });

                var id = [];
                
                var pData = [];
                var ranges = [];
                var variables = [];

                for (var i = 0; i < vars.length; i++) {
                    id.push(vars[i].Id);
                    ranges.push({
                        min: vars[i].RangeFrom,
                        max: vars[i].RangeTo
                    });

                    var color = this.getRandomColor();
                    variables.push([color, true, vars[i].Name, vars[i].RangeFrom, vars[i].RangeTo]);
                }

                ticks = ticks.sort((x, y) => {
                    return x.Time < y.Time ? -1 : 1;
                });

                var tableData = that.PrepareTableData(vars, ticks);
                var init = tableData.init;
                var data = tableData.data;
                var tags = that.PrepareTableTags(data, states, vars);

                var labelsHeight = Math.max.apply(Math, ranges.map(function (s) { return s.max; }))
                    - Math.min.apply(Math, ranges.map(function (s) { return s.min; }));
                var labels = that.PreparePlotLabels(tags, labelsHeight);
                
                var interval = this.CreateInterval(vars);

                var options = {
                    id: id,
                    interval: interval,
                    tags: tags,
                    data: data,
                    init: init,
                    variables: variables,
                    labels: labels
                };

                if (this.ltlResultsViewer !== undefined) {
                    this.ltlResultsViewer.ltlresultsviewer(options);
                } else {
                    that.dataToSet = options;
                }
            }

            public CreateInterval(variables) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = variables[i].RangeFrom;
                    table[i][1] = variables[i].RangeTo;
                }
                return table;
            }

            public getRandomColor() {
                var r = this.GetRandomInt(0, 255);
                var g = this.GetRandomInt(0, 255);
                var b = this.GetRandomInt(0, 255);
                return "rgb(" + r + ", " + g + ", " + b + ")";
            }

            public GetRandomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            }

            public SetOnExportCSV(callback) {
                if (this.ltlResultsViewer !== undefined) {
                    this.ltlResultsViewer.ltlresultsviewer({ onExportCSV: callback });
                } else {
                    this.exportCSVcallback = callback;
                }
            }

        }
    }
}