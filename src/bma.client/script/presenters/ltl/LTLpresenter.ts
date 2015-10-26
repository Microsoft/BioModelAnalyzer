﻿module BMA {
    export module Presenters {
        export class LTLPresenter {

            keyframescompact: BMA.UIDrivers.IKeyframesList;
            appModel: BMA.Model.AppModel;
            currentdraggableelem: any;
            expandedResults: JQuery;

            tppresenter: BMA.LTL.TemporalPropertiesPresenter;
            statespresenter: BMA.LTL.StatesPresenter;

            constructor(
                commands: BMA.CommandRegistry,
                appModel: BMA.Model.AppModel,
                statesEditorDriver: BMA.UIDrivers.IStatesEditor,
                temporlapropertieseditor: BMA.UIDrivers.ITemporalPropertiesEditor,
                ltlviewer: BMA.UIDrivers.ILTLViewer,
                ltlresultsviewer: BMA.UIDrivers.ILTLResultsViewer,
                ajax: BMA.UIDrivers.IServiceDriver,
                popupViewer: BMA.UIDrivers.IPopup,
                exportService: BMA.UIDrivers.IExportService,
                fileLoaderDriver: BMA.UIDrivers.IFileLoader
                ) {

                var that = this;
                this.appModel = appModel;

                this.statespresenter = new BMA.LTL.StatesPresenter(commands, this.appModel, statesEditorDriver, ltlviewer.GetStatesViewer());

                temporlapropertieseditor.SetStates(appModel.States);
                commands.On("KeyframesChanged",(args) => {
                    temporlapropertieseditor.SetStates(args.states);
                });

                statesEditorDriver.SetModel(appModel.BioModel, appModel.Layout);
                window.Commands.On("AppModelChanged",(args) => {
                    statesEditorDriver.SetModel(appModel.BioModel, appModel.Layout);
                });

                window.Commands.On("Expand",(param) => {
                    switch (param) {
                        case "LTLStates":
                            statesEditorDriver.Show();
                            break;

                        case "LTLTempProp":
                            temporlapropertieseditor.Show();

                            commands.Execute("TemporalPropertiesEditorExpanded", {});

                            if (this.tppresenter === undefined) {
                                this.tppresenter = new BMA.LTL.TemporalPropertiesPresenter(
                                    commands,
                                    appModel,
                                    ajax,
                                    temporlapropertieseditor,
                                    this.statespresenter);
                            }

                            break;
                        default:
                            ltlviewer.Show(undefined);
                            break;
                    }
                });

                window.Commands.On("Collapse",(param) => {
                    temporlapropertieseditor.Hide();
                    statesEditorDriver.Hide();
                    ltlresultsviewer.Hide();
                    popupViewer.Hide();
                });

                commands.On("TemporalPropertiesOperationsChanged",(args) => {
                    ltlviewer.GetTemporalPropertiesViewer().SetOperations(args);
                });

                var ltlDataToExport = undefined;
                commands.On("ShowLTLResults",(args) => {
                    ltlDataToExport = {
                        ticks: args.ticks,
                        model: appModel.BioModel.Clone(),
                        layout: appModel.Layout.Clone()
                    };
                    ltlresultsviewer.SetData(appModel.BioModel, appModel.Layout, args.ticks, appModel.States);
                    ltlresultsviewer.Show();
                });

                ltlresultsviewer.SetOnExportCSV(function () {
                    if (ltlDataToExport !== undefined) {
                        exportService.Export(that.CreateCSV(ltlDataToExport, ","), "ltl", "csv");
                    }
                });

                commands.On("ExportLTLFormula",(args) => {
                    if (args.operation !== undefined) {
                        exportService.Export(JSON.stringify(args.operation), "operation", "txt");
                    }
                });

                commands.On("ImportLTLFormula",(args) => {
                    fileLoaderDriver.OpenFileDialog().done(function (fileName) {
                        var fileReader: any = new FileReader();
                        fileReader.onload = function () {
                            var fileContent = fileReader.result;
                            var obj = JSON.parse(fileContent);
                            var operation = BMA.Model.ImportOperand(obj, undefined);

                            if (operation instanceof BMA.LTLOperations.Operation) {
                                var op = <BMA.LTLOperations.Operation>operation;
                                var states = that.GetStates(op);
                                var merged = that.MergeStates(that.appModel.States, states);
                                that.appModel.States = merged.states;
                                that.UpdateOperationStates(op, merged.map);
                                that.statespresenter.UpdateStatesFromModel();
                                that.tppresenter.AddOperation(op, args.position);
                            }

                        };
                        fileReader.readAsText(fileName);

                    });
                });
            }

            private UpdateOperationStates(operation: BMA.LTLOperations.Operation, map: any) {
                var that = this;
                for (var i = 0; i < operation.Operands.length; i++) {
                    var op = operation.Operands[i];
                    if (op instanceof BMA.LTLOperations.Keyframe) {
                        (<BMA.LTLOperations.Keyframe>op).Name = map[(<BMA.LTLOperations.Keyframe>op).Name];
                    } else if (op instanceof BMA.LTLOperations.Operation) {
                        that.UpdateOperationStates(<BMA.LTLOperations.Operation>op, map);
                    }
                }
            }

            private GetStates(operation: BMA.LTLOperations.Operation): BMA.LTLOperations.Keyframe[]{
                var that = this;
                var result = [];

                for (var i = 0; i < operation.Operands.length; i++) {
                    var op = operation.Operands[i];
                    if (op !== undefined && op !== null) {
                        if (op instanceof BMA.LTLOperations.Keyframe) {
                            result.push(<BMA.LTLOperations.Keyframe>op.Clone());
                        } else if (op instanceof BMA.LTLOperations.Operation) {
                            var states = that.GetStates(<BMA.LTLOperations.Operation>op);
                            for (var j = 0; j < states.length; j++) {
                                result.push(states[j]);
                            }
                        }
                    }
                }

                return result;
            }

            private MergeStates(currentStates: BMA.LTLOperations.Keyframe[], newStates: BMA.LTLOperations.Keyframe[]): { states: BMA.LTLOperations.Keyframe[]; map: any } {
                var result = {
                    states: [],
                    map: {}
                };

                result.states = currentStates;

                for (var i = 0; i < newStates.length; i++) {
                    var newState = newStates[i];
                    var exist = false;
                    for (var j = 0; j < currentStates.length; j++) {
                        var curState = currentStates[j];
                        if (curState.GetFormula() === newState.GetFormula()) {
                            exist = true;
                            result.map[newState.Name] = curState.Name;
                        }
                    }
                    if (!exist) {
                        var addedState = newState.Clone();
                        addedState.Name = String.fromCharCode(65 + result.states.length);
                        result.states.push(addedState); 
                        result.map[newState.Name] = addedState.Name;
                    }
                }

                return result;
            }

            public CreateCSV(ltlDataToExport, sep): string {
                var csv = '';
                var that = this;

                var variables = (<BMA.Model.BioModel>ltlDataToExport.model).Variables;
                var ticks = ltlDataToExport.ticks.sort((x, y) => {
                    return x.Time < y.Time ? -1 : 1;
                });


                for (var i = 0; i < variables.length; i++) {

                    var variable = variables[i];
                    var cont = that.appModel.Layout.GetContainerById(variable.ContainerId);

                    if (cont !== undefined) {
                        csv += cont.Name + sep;
                    } else {
                        csv += '' + sep;
                    }

                    csv += variable.Name + sep;

                    for (var j = 0; j < ticks.length; j++) {
                        var tick = ticks[j].Variables;
                        for (var k = 0; k < tick.length; k++) {
                            var ij = tick[k];
                            if (ij.Id === variable.Id) {
                                if (ij.Lo === ij.Hi) {
                                    csv += ij.Lo + sep;
                                }
                                else {
                                    csv += ij.Lo + ' - ' + ij.Hi + sep;
                                }

                                break;
                            }
                        }
                    }

                    csv += "\n";
                }

                return csv;
            }
            
        }
    }
} 