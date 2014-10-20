﻿module BMA {
    export module Presenters {
        export class FurtherTestingPresenter {

            private driver: BMA.UIDrivers.IFurtherTesting;
            private popupViewer: BMA.UIDrivers.IPopup;
            private num: number = 0;
            private data;
            private model;
            private result;
            private variables;

            constructor(driver: BMA.UIDrivers.IFurtherTesting, popupViewer: BMA.UIDrivers.IPopup) {
                var that = this;
                this.driver = driver;
                this.popupViewer = popupViewer;



                window.Commands.On("ProofFailed", function (param: { Model; Variables; Res }) {
                    that.driver.ShowStartToggler();
                    that.model = param.Model;
                    that.result = param.Res;
                    that.variables = param.Variables;
                })

                window.Commands.On("ProofRequested", function () {
                    that.driver.HideStartToggler();
                    that.driver.HideResults();
                })

                window.Commands.On("FurtherTestingRequested", function () {
                    if (that.result.length !== 0 && that.model !== undefined && that.result !== undefined && that.variables !== undefined) {
                        that.driver.StandbyMode();
                        $.ajax({
                            type: "POST",
                            url: "api/FurtherTesting",
                            //callbackParameter: 'callback',
                            //dataType: 'jsonp',
                            //timeout: 10000,
                            data: {
                                Model: that.model,
                                Analysis: that.result,
                            },
                            success: function (res2) {
                                that.driver.ActiveMode();
                                if (res2.CounterExamples !== null) {
                                    that.driver.HideStartToggler();

                                    //that.data = res2.CounterExamples;
                                    var bif = null, osc = null;
                                    for (var i = 0; i < res2.CounterExamples.length; i++) {
                                        switch (res2.CounterExamples[i].Status) {
                                            case 0:
                                                bif = res2.CounterExamples[i];
                                                break;
                                            case 1:
                                                osc = res2.CounterExamples[i];
                                                break;
                                        }
                                    }

                                    var data = [];
                                    var headers = [];
                                    var tabLabels = [];

                                    if (bif !== null) {
                                        var parseBifurcations = that.ParseBifurcations(bif.Variables);
                                        var bifurcationsView = that.CreateBifurcationsView(that.variables, parseBifurcations);
                                        data.push(bifurcationsView);
                                        headers.push(["Cell", "Name", "Calculated Bound", "Fix1", "Fix2"]);
                                        var label = $('<div></div>').addClass('bma-futhertesting-bifurcations-icon');
                                        tabLabels.push(label);
                                    }
                                    if (osc !== null) {
                                        var parseOscillations = that.ParseOscillations(osc.Variables);
                                        var oscillationsView = that.CreateOscillationsView(that.variables, parseOscillations);
                                        data.push(oscillationsView);
                                        headers.push(["Cell", "Name", "Calculated Bound", "Oscillation"]);
                                        var label = $('<div></div>').addClass('bma-futhertesting-oscillations-icon');
                                        tabLabels.push(label);
                                    }

                                    
                                    that.data = { tabLabels: tabLabels, tableHeaders: headers, data: data };
                                    that.driver.ShowResults(that.data);
                                }
                                else {
                                    alert(res2.Error);
                                    that.driver.ActiveMode();
                                }
                            },
                            error: function (XMLHttpRequest, textStatus, errorThrown) {
                                that.driver.ActiveMode();
                                alert(errorThrown);
                            }
                        });
                    }
                    else alert("No Variables");
                })

                window.Commands.On("Expand", (param) => {
                        switch (param) {
                            case "FurtherTesting":
                                that.driver.HideStartToggler();
                                that.driver.HideResults();
                                var content = $('<div></div>').furthertesting();
                                content.furthertesting("SetData", that.data);
                                content.find("*").removeClass("scrollable-results");
                                this.popupViewer.Show({ tab: param, content: content.children().eq(1).children().eq(1) });
                                break;
                            default:
                                that.driver.ShowResults(that.data);
                                break;
                        }
                })

                window.Commands.On("Collapse", (param) => {
                    switch (param) {
                        case "FurtherTesting":
                            that.driver.ShowResults(that.data);
                            this.popupViewer.Hide();
                            break;
                    }
                })
            }

            public CreateOscillationsView(variables, results) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    var resid = results[variables[i].Id];
                    table[i] = [];
                    table[i][0] = variables[i].ContainerId; 
                    table[i][1] = variables[i].Name;
                    table[i][2] = resid.min + '-' + resid.max;
                    table[i][3] = resid.oscillations;
                }
                return table;
            }

            private CreateBifurcationsView(variables, results) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    var resid = results[variables[i].Id];
                    table[i] = [];
                    table[i][0] = variables[i].ContainerId;
                    table[i][1] = variables[i].Name;
                    if (resid.min !== resid.max)
                        table[i][2] = resid.min + '-' + resid.max;
                    else
                        table[i][2] = resid.min;
                    table[i][3] = resid.Fix1;
                    table[i][4] = resid.Fix2;
                }
                return table;

            }

            private ParseBifurcations(variables) {
                var table = [];
                for (var j = 0; j < variables.length; j++) {
                    var parse = this.ParseId(variables[j].Id);
                    if (table[parseInt(parse[0])] === undefined)
                        table[parseInt(parse[0])] = [];
                    table[parseInt(parse[0])][0] = parseInt(variables[j].Fix1);
                    table[parseInt(parse[0])][1] = parseInt(variables[j].Fix2);
                }
                var result = [];
                for (var i = 0; i < table.length; i++) {
                    if (table[i] !== undefined) {
                        result[i] = {
                            min: Math.min(table[i][0], table[i][1]),
                            max: Math.max(table[i][0], table[i][1]),
                            Fix1: table[i][0],
                            Fix2: table[i][1]
                        };
                    }
                }
                return result;
            }

            private ParseOscillations(variables) {
                //var variables = ex[1].Variables;
                var table = [];
                for (var j = 0; j < variables.length; j++) {
                    //table[i][j] = ex[i].Variables[j].Id + " " + ex[i].Variables[j].Value;
                    var parse = this.ParseId(variables[j].Id);
                    if (table[parseInt(parse[0])] === undefined) 
                        table[parseInt(parse[0])] = [];

                    table[parseInt(parse[0])][parseInt(parse[1])] = variables[j].Value;
                }
                var result = [];
                for (var i = 0; i < table.length; i++) {
                    if (table[i] !== undefined) {
                        result[i] = { min: table[i][0], max: table[i][0],oscillations:""};
                        for (var j = 0; j < table[i].length - 1; j++) {
                            if (table[i][j] < result[i].min) result[i].min = table[i][j];
                            if (table[i][j] > result[i].max) result[i].max = table[i][j];
                            result[i].oscillations += table[i][j] + ",";
                        }
                        result[i].oscillations += table[i][table[i].length - 1];
                    }
                }
                return result;
            }

            private ParseId(id) {
                var parse = id.split('^');
                return parse;
            }
        }
    }
}