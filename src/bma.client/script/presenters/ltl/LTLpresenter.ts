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
                ajax: BMA.UIDrivers.IServiceDriver,
                popupViewer: BMA.UIDrivers.IPopup
                ) {

                var that = this;
                this.appModel = appModel;

                this.statespresenter = new BMA.LTL.StatesPresenter(commands, this.appModel, statesEditorDriver, ltlviewer.GetStatesViewer()); 

                temporlapropertieseditor.SetStates(appModel.States);
                commands.On("KeyframesChanged",(args) => {
                    temporlapropertieseditor.SetStates(args.states);
                })

                /*
                window.Commands.On("LTLRequested", function (param: { formula }) {

                    //var f = BMA.Model.MapVariableNames(param.formula, name => that.appModel.BioModel.GetIdByName(name));
                    
                    var model = BMA.Model.ExportBioModel(appModel.BioModel);
                    var proofInput = {
                        "Name": model.Name,
                        "Relationships": model.Relationships,
                        "Variables": model.Variables,
                        "Formula": param.formula,
                        "Number_of_steps": 10
                    }

                    var result = ajax.Invoke(proofInput)
                        .done(function (res) {
                        if (res.Ticks == null) {
                            alert(res.Error);
                        }
                        else {
                            if (res.Status == "True") {
                                var restbl = that.CreateColoredTable(res.Ticks);
                                ltlviewer.SetResult(restbl);

                                that.expandedResults = that.CreateExpanded(res.Ticks, restbl);
                            }
                            else {
                                ltlviewer.SetResult(undefined);
                                alert(res.Status);
                            }
                        }
                        })
                        .fail(function () {
                            alert("LTL failed");
                        })
                });
                */

                window.Commands.On("Expand", (param) => {
                    switch (param) {
                        case "LTLStates":
                            statesEditorDriver.Show();
                            break;

                        case "LTLTempProp":
                            temporlapropertieseditor.Show();

                            if (this.tppresenter === undefined) {
                                this.tppresenter = new BMA.LTL.TemporalPropertiesPresenter(
                                    commands,
                                    temporlapropertieseditor.GetSVGDriver(),
                                    temporlapropertieseditor.GetNavigationDriver(),
                                    temporlapropertieseditor.GetDragService(),
                                    temporlapropertieseditor.GetContextMenuDriver(),
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
                    popupViewer.Hide();
                });

                commands.On("TemporalPropertiesOperationsChanged", function (args) { ltlviewer.GetTemporalPropertiesViewer().SetOperations(args.operations); });
            }

            /*
            public CreateColoredTable(ticks): any {
                var that = this;
                if (ticks === null) return undefined;
                var color = [];
                var t = ticks.length;
                var v = ticks[0].Variables.length;
                for (var i = 0; i < v; i++) {
                    color[i] = [];
                    for (var j = 1; j < t; j++) {
                        var ij = ticks[j].Variables[i];
                        var pr = ticks[j-1].Variables[i];
                        color[i][j] = pr.Hi === ij.Hi;
                    }
                }
                return color;
            }

            public CreateExpanded(ticks, color) {
                var container = $('<div></div>');
                if (ticks === null) return container;
                var that = this;
                var biomodel = this.appModel.BioModel;
                var variables = biomodel.Variables;
                var table = [];
                var colortable  = [];
                var header = [];
                var l = ticks.length;
                header[0] = "Name";
                for (var i = 0; i < ticks.length; i++) {
                    header[i + 1] = "T = " + ticks[i].Time;
                }
                for (var j = 0, len = ticks[0].Variables.length; j < len; j++) {
                    table[j] = [];
                    colortable[j] = [];
                    table[j][0] = biomodel.GetVariableById(ticks[0].Variables[j].Id).Name;
                    var v = ticks[0].Variables[j];
                    colortable[j][0] = undefined;
                    for (var i = 1; i < l+1; i++) {
                        var ij = ticks[i - 1].Variables[j];
                        colortable[j][i] = color[j][i - 1];
                        if (ij.Lo === ij.Hi) {
                            table[j][i] = ij.Lo;
                        }
                        else {
                            table[j][i] = ij.Lo + ' - ' + ij.Hi;
                        }
                    }
                }
                container.coloredtableviewer({ header: header, numericData: table, colorData: colortable });
                container.addClass('scrollable-results');
                container.children('table').removeClass('variables-table').addClass('proof-propagation-table ltl-result-table');
                container.find('td.propagation-cell-green').removeClass("propagation-cell-green");
                container.find('td.propagation-cell-red').removeClass("propagation-cell-red").addClass("change");
                container.find("td").eq(0).width(150);
                return container;
            }
            */
        }
    }
} 