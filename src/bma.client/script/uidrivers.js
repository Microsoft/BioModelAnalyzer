﻿/// <reference path="..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="widgets\drawingsurface.ts"/>
var BMA;
(function (BMA) {
    (function (UIDrivers) {
        var SVGPlotDriver = (function () {
            function SVGPlotDriver(svgPlotDiv) {
                this.svgPlotDiv = svgPlotDiv;
            }
            SVGPlotDriver.prototype.Draw = function (svg) {
                this.svgPlotDiv.drawingsurface({ svg: svg });
            };

            SVGPlotDriver.prototype.TurnNavigation = function (isOn) {
                this.svgPlotDiv.drawingsurface({ isNavigationEnabled: isOn });
            };

            SVGPlotDriver.prototype.SetGrid = function (x0, y0, xStep, yStep) {
                this.svgPlotDiv.drawingsurface({ grid: { x0: x0, y0: y0, xStep: xStep, yStep: yStep } });
            };

            SVGPlotDriver.prototype.GetDragSubject = function () {
                return this.svgPlotDiv.drawingsurface("getDragSubject");
            };

            SVGPlotDriver.prototype.SetZoom = function (zoom) {
                this.svgPlotDiv.drawingsurface({ zoom: zoom });
            };
            return SVGPlotDriver;
        })();
        UIDrivers.SVGPlotDriver = SVGPlotDriver;

        var TurnableButtonDriver = (function () {
            function TurnableButtonDriver(button) {
                this.button = button;
            }
            TurnableButtonDriver.prototype.Turn = function (isOn) {
                this.button.button("option", "disabled", !isOn);
            };
            return TurnableButtonDriver;
        })();
        UIDrivers.TurnableButtonDriver = TurnableButtonDriver;

        var VariableEditorDriver = (function () {
            function VariableEditorDriver(variableEditor) {
                this.variableEditor = variableEditor;
                this.variableEditor.bmaeditor();
                this.variableEditor.hide();

                this.variableEditor.click(function (e) {
                    e.stopPropagation();
                });
            }
            VariableEditorDriver.prototype.GetVariableProperties = function () {
                return {
                    name: this.variableEditor.bmaeditor('option', 'name'),
                    formula: this.variableEditor.bmaeditor('option', 'formula'),
                    rangeFrom: this.variableEditor.bmaeditor('option', 'rangeFrom'),
                    rangeTo: this.variableEditor.bmaeditor('option', 'rangeTo')
                };
            };

            VariableEditorDriver.prototype.Initialize = function (variable, model) {
                this.variableEditor.bmaeditor('option', 'name', variable.Name);
                this.variableEditor.bmaeditor('option', 'formula', variable.Formula);
                this.variableEditor.bmaeditor('option', 'rangeFrom', variable.RangeFrom);
                this.variableEditor.bmaeditor('option', 'rangeTo', variable.RangeTo);

                var options = [];
                var id = variable.Id;
                for (var i = 0; i < model.Relationships.length; i++) {
                    var rel = model.Relationships[i];
                    if (rel.ToVariableId === id) {
                        options.push(model.GetVariableById(rel.FromVariableId).Name);
                    }
                }
                this.variableEditor.bmaeditor('option', 'inputs', options);
            };

            VariableEditorDriver.prototype.Show = function (x, y) {
                this.variableEditor.show();
            };

            VariableEditorDriver.prototype.Hide = function () {
                this.variableEditor.hide();
            };
            return VariableEditorDriver;
        })();
        UIDrivers.VariableEditorDriver = VariableEditorDriver;

        var ProofViewer = (function () {
            function ProofViewer(proofAccordion, proofContentViewer) {
                this.proofAccordion = proofAccordion;
                this.proofContentViewer = proofContentViewer;
            }
            ProofViewer.prototype.SetData = function (params) {
                this.proofContentViewer.proofresultviewer({ issucceeded: params.issucceeded, time: params.time, data: params.data });
            };

            ProofViewer.prototype.ShowResult = function (result) {
                this.proofAccordion.bmaaccordion({ contentLoaded: { ind: "#icon1", val: true } });
            };

            ProofViewer.prototype.OnProofStarted = function () {
                this.proofAccordion.bmaaccordion({ contentLoaded: { ind: "#icon1", val: false } });
            };

            ProofViewer.prototype.OnProofFailed = function () {
                $("#icon1").click();
            };

            ProofViewer.prototype.Show = function (params) {
                this.proofContentViewer.proofresultviewer("show", params.tab);
            };

            ProofViewer.prototype.Hide = function (params) {
                this.proofContentViewer.proofresultviewer("hide", params.tab);
            };

            ProofViewer.prototype.DataToCompactMode = function (data) {
            };
            ProofViewer.prototype.DataToFullMode = function (data) {
            };
            return ProofViewer;
        })();
        UIDrivers.ProofViewer = ProofViewer;

        var PopupDriver = (function () {
            function PopupDriver(popupWindow) {
                this.popupWindow = popupWindow;
            }
            PopupDriver.prototype.Show = function (params) {
                var that = this;

                //this.createResultView(params);
                var header = "";
                switch (params.tab) {
                    case "ProofVariables":
                        header = "Variables";
                        break;
                    case "ProofPropagation":
                        header = "Proof Progression";
                        break;
                    case "SimulationVariables":
                        header = "Simulation Progression";
                        break;
                }
                this.popupWindow.resultswindowviewer({ header: header, tabid: params.tab, content: params.content, icon: "min" });
                this.popupWindow.show();
            };

            PopupDriver.prototype.Hide = function () {
                this.popupWindow.hide();
            };
            return PopupDriver;
        })();
        UIDrivers.PopupDriver = PopupDriver;

        var SimulationFullDriver = (function () {
            function SimulationFullDriver(view) {
                this.viewer = view;
            }
            SimulationFullDriver.prototype.Set = function (data) {
                var table = this.CreateFullTable(data.variables, data.colors);
                var interval = this.CreateInterval(data.variables);
                var add = this.CreatePlotView(data.colors);
                this.viewer.simulationfull({ data: { variables: table, init: data.init, interval: interval, data: add } });
            };

            SimulationFullDriver.prototype.GetViewer = function () {
                return this.viewer;
            };

            SimulationFullDriver.prototype.AddResult = function (res) {
                var result = this.ConvertResult(res);
                this.viewer.simulationfull("AddResult", result);
            };

            SimulationFullDriver.prototype.CreatePlotView = function (colors) {
                var data = [];
                for (var i = 0; i < colors[0].Plot.length; i++) {
                    data[i] = []; //= colors[i].Plot;
                    for (var j = 0; j < colors.length; j++) {
                        data[i][j] = colors[j].Plot[i];
                    }
                }
                return data;
            };

            SimulationFullDriver.prototype.CreateInterval = function (variables) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = variables[i].RangeFrom;
                    table[i][1] = variables[i].RangeTo;
                }
                return table;
            };

            SimulationFullDriver.prototype.ConvertResult = function (res) {
                var data = [];
                if (res.Variables !== undefined && res.Variables !== null)
                    data = [];
                for (var i = 0; i < res.Variables.length; i++)
                    data[i] = res.Variables[i].Value;
                return data;
            };

            SimulationFullDriver.prototype.findColorById = function (colors, id) {
                for (var i = 0; i < colors.length; i++)
                    if (id === colors[i].Id)
                        return colors[i];
                return undefined;
            };

            SimulationFullDriver.prototype.CreateFullTable = function (variables, colors) {
                var table = [];

                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = this.findColorById(colors, variables[i].Id).Color;
                    table[i][1] = this.findColorById(colors, variables[i].Id).Seen;
                    table[i][2] = variables[i].Name;
                    table[i][3] = variables[i].RangeFrom;
                    table[i][4] = variables[i].RangeTo;
                }
                return table;
            };
            return SimulationFullDriver;
        })();
        UIDrivers.SimulationFullDriver = SimulationFullDriver;

        var SimulationViewerDriver = (function () {
            function SimulationViewerDriver(viewer) {
                this.viewer = viewer;
            }
            SimulationViewerDriver.prototype.ChangeVisibility = function (param) {
                this.viewer.simulationviewer("ChangeVisibility", param.ind, param.check);
            };

            SimulationViewerDriver.prototype.SetData = function (params) {
                this.viewer.simulationviewer(params); //{ data: params.data, plot: params.plot });
            };

            SimulationViewerDriver.prototype.Show = function (params) {
                this.viewer.simulationviewer("show", params.tab);
            };

            SimulationViewerDriver.prototype.Hide = function (params) {
                this.viewer.simulationviewer("hide", params.tab);
            };
            return SimulationViewerDriver;
        })();
        UIDrivers.SimulationViewerDriver = SimulationViewerDriver;

        var ModelFileLoader = (function () {
            function ModelFileLoader(fileInput) {
                this.currentPromise = undefined;
                var that = this;
                this.fileInput = fileInput;

                fileInput.change(function (arg) {
                    var e = arg;
                    if (e.target.files !== undefined && e.target.files.length == 1 && that.currentPromise !== undefined) {
                        that.currentPromise.resolve(e.target.files[0]);
                        that.currentPromise = undefined;
                        fileInput.val("");
                    }
                });
            }
            ModelFileLoader.prototype.OpenFileDialog = function () {
                var deferred = $.Deferred();
                this.currentPromise = deferred;
                this.fileInput.click();
                return deferred.promise();
            };

            ModelFileLoader.prototype.OnCheckFileSelected = function () {
                return false;
            };
            return ModelFileLoader;
        })();
        UIDrivers.ModelFileLoader = ModelFileLoader;
    })(BMA.UIDrivers || (BMA.UIDrivers = {}));
    var UIDrivers = BMA.UIDrivers;
})(BMA || (BMA = {}));
//# sourceMappingURL=uidrivers.js.map
