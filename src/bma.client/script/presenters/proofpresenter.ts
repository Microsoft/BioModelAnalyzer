﻿module BMA {
    export module Presenters {
        export class ProofPresenter { 
            private appModel: BMA.Model.AppModel;
            private viewer: BMA.UIDrivers.IProofResultViewer;
            private ajax: BMA.UIDrivers.IServiceDriver;
            private messagebox: BMA.UIDrivers.IMessageServise;
            private expandedProofPropagation: JQuery;
            private expandedProofVariables: JQuery;
            private currentModel: BMA.Model.BioModel;
            private st;
            private colorData;

            constructor(
                appModel: BMA.Model.AppModel,
                proofResultViewer: BMA.UIDrivers.IProofResultViewer,
                popupViewer: BMA.UIDrivers.IPopup,
                ajax: BMA.UIDrivers.IServiceDriver,
                messagebox: BMA.UIDrivers.IMessageServise
                ) {

                this.appModel = appModel;
                this.ajax = ajax;
                this.messagebox = messagebox;
                //this.Snapshot();

                var that = this;

                window.Commands.On("ProofByFurtherTesting", function (param: { issucceeded; message; fixPoint}) {
                    
                    var st = that.st.variablesStability;
                    param.fixPoint.forEach((val, ind) => {
                        var i = that.getIndById(st, val.Id);
                        st[i].state = true;
                        st[i].range = val.Value;
                        that.st.containersStability[st[i].id] = true;
                    });
                    var variablesData = that.CreateTableView(that.st.variablesStability);
                    that.expandedProofVariables =  that.CreateExpandedProofVariables(variablesData);
                    that.AddPropagationColumn(st);

                    proofResultViewer.SetData({
                        issucceeded: param.issucceeded,
                        message: param.message,
                        data: { numericData: variablesData.numericData, colorVariables: variablesData.colorData, colorData: that.colorData }
                    });
                    
                    window.Commands.Execute("DrawingSurfaceSetProofResults", that.st);
                });

                window.Commands.On("ProofStarting", function () {
                    proofResultViewer.OnProofStarted();
                    var proofInput = appModel.BioModel.GetJSON();
                    var result = that.ajax.Invoke(proofInput)
                        .done(function (res) {
                            //console.log("Proof Result Status: " + res.Status);
                            var result = appModel.ProofResult = new BMA.Model.ProofResult(res.Status === "Stabilizing", res.Time, res.Ticks);
                            if (res.Ticks !== null) {
                                that.expandedProofPropagation = $('<div></div>');
                                
                                if (res.Status === "NotStabilizing")
                                    window.Commands.Execute("ProofFailed", { Model: proofInput, Res: res, Variables: that.appModel.BioModel.Variables });
                                else
                                    window.Commands.Execute("ProofFailed", undefined);
                                that.st = that.Stability(res.Ticks);
                                var variablesData = that.CreateTableView(that.st.variablesStability);
                                that.colorData = that.CreateColoredTable(res.Ticks);

                                var deferredProofPropagation = function () {
                                    var d = $.Deferred();
                                    var full = that.CreateExpandedProofPropagation(appModel.ProofResult.Ticks).addClass("proof-expanded");
                                    d.resolve(full);
                                    return d.promise();
                                }
                                $.when(deferredProofPropagation()).done(function (res) {
                                    that.expandedProofPropagation = res;
                                })

                                var deferredProofVariables = function () {
                                    var d = $.Deferred();
                                    var full = that.CreateExpandedProofVariables(variablesData);
                                    d.resolve(full);
                                    return d.promise();
                                }
                                $.when(deferredProofVariables()).done(function (res) {
                                    that.expandedProofVariables = res;
                                })

                                window.Commands.Execute("DrawingSurfaceSetProofResults", that.st);
                                proofResultViewer.SetData({ issucceeded: result.IsStable, message: that.CreateMessage(result.IsStable, result.Time), data: { numericData: variablesData.numericData, colorVariables: variablesData.colorData, colorData: that.colorData } });
                                proofResultViewer.ShowResult(appModel.ProofResult);
                            }
                            else {
                                proofResultViewer.SetData({
                                    issucceeded: res.Status === "Stabilizing",
                                    message: that.CreateMessage(result.IsStable, result.Time),
                                    data: undefined
                                })
                                proofResultViewer.ShowResult(appModel.ProofResult);
                            }
                            that.Snapshot();
                        })
                        .fail(function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log("Proof Service Failed: " + errorThrown);
                            that.messagebox.Show("Proof Service Failed: " + errorThrown);
                            proofResultViewer.OnProofFailed();
                        });
                })


                window.Commands.On("ProofRequested", function (args) {
                    if (that.CurrentModelChanged()) {
                        window.Commands.Execute("ProofStarting", {});
                    }
                    else {
                        proofResultViewer.ShowResult(appModel.ProofResult);
                    }
                });

                window.Commands.On("Expand", (param) => {
                    if (this.appModel.BioModel.Variables.length !== 0) {
                        //var full;
                        switch (param) {
                            case "ProofPropagation":
                                if (this.appModel.ProofResult.Ticks !== null) {
                                    popupViewer.Show({ tab: param, content: $('<div></div>') });

                                    //var f = function () {
                                    //    var d = $.Deferred();
                                    //    full = that.CreateExpandedResultTable(appModel.ProofResult.Ticks);
                                    //    d.resolve(full);
                                    //    return d.promise();
                                    //};

                                    //$.when(f()).done(function (res) {
                                         //res.addClass("proof-expanded");
                                         proofResultViewer.Hide({ tab: param });
                                    popupViewer.Show({ tab: param, content: that.expandedProofPropagation });
                                    //});

                                    
                                }
                                break;
                            case "ProofVariables":

                                
                                proofResultViewer.Hide({ tab: param });
                                popupViewer.Show({ tab: param, content: that.expandedProofVariables });
                                break;
                            default:
                                //full = undefined;
                                proofResultViewer.Show({ tab: undefined });
                                break;
                        }
                        //if (full !== undefined) {
                        //    full.addClass("proof-expanded");
                        //    proofResultViewer.Hide({ tab: param });
                        //    popupViewer.Show({ tab: param, content: full });
                        //}
                    }
                });

                window.Commands.On("Collapse", (param) => {
                    proofResultViewer.Show({ tab: param });
                    popupViewer.Hide();
                });
            }

            public CurrentModelChanged() {
                if (this.currentModel === undefined) {
                    this.Snapshot();
                    return true;
                }
                else
                    return JSON.stringify(this.currentModel.GetJSON()) !== JSON.stringify(this.appModel.BioModel.GetJSON());
            }

            public Snapshot() {
                this.currentModel = this.appModel.BioModel.Clone();
            }

            public CreateMessage(stable: boolean, time: number): string {
                if (stable) {
                    return 'BMA succeeded in checking every possible state of the model in ' + time + ' seconds. After stepping through separate interactions, the model eventually reached a single stable state.'
                }
                else return 'After stepping through separate interactions in the model, the analisys failed to determine a final stable state'
            }

            public Stability(ticks) {
                var containers = [];
                if (ticks === null) return undefined;
                var variables = this.appModel.BioModel.Variables;
                var stability = [];
                var l = ticks[0].Variables.length;
                for (var i = 0; i < l; i++) {
                    var ij = ticks[0].Variables[i];
                    var c = ij.Lo === ij.Hi;
                    var range = '';
                    if (c) {
                        range = ij.Lo;
                    }
                    else {
                        range = ij.Lo + ' - ' + ij.Hi;
                    }
                    var id = ij.Id;
                    stability[i] = { id: id, state: c, range: range };
                    var v = this.appModel.BioModel.GetVariableById(id);
                    if (v.ContainerId !== undefined &&  (!c || containers[v.ContainerId] === undefined)) 
                            containers[v.ContainerId] = c;
                }
                return {variablesStability: stability, containersStability: containers};
            }

            public getIndById(array, id) {
                for (var i = 0; i < array.length; i++) {
                    var q = array[i].id.toString();
                    var p = id.toString();
                    if (q === p)
                        return i;
                }
                return undefined;
            }

            public CreateTableView(stability) {
                var table = [];
                if (stability === undefined) return { numericData: undefined, colorData: undefined };
                var biomodel = this.appModel.BioModel;
                var color = [];
                for (var i = 0; i < stability.length; i++) {
                    var st = stability[stability.length - 1 - i];
                    var variable = biomodel.GetVariableById(st.id)
                    table[i] = [];
                    color[i] = [];
                    table[i][0] = variable.Name;
                    table[i][1] = variable.Formula;
                    var range = '';
                    //var ij = ticks[0].Variables[variables.length - 1 - i];
                    var c = st.state;
                    if (!c) {
                        for (var j = 0; j < 3; j++)
                            color[i][j] = c;
                    }
                    
                    table[i][2] = st.range;
                }
                return {numericData: table, colorData:color};
            }

            public CreateColoredTable(ticks): any {
                var that = this;
                if (ticks === null) return;
                var color = [];
                var t = ticks.length;
                var v = ticks[0].Variables.length;
                for (var i = 0; i < v; i++) {
                    color[i] = [];
                    for (var j = 0; j < t; j++) {
                        var ij = ticks[t-j-1].Variables[v - 1 - i];
                        color[i][j] = ij.Hi === ij.Lo;
                    }
                }
                return color;
            }

            public AddPropagationColumn(st) {
                var trs = this.expandedProofPropagation.find('tr');
                $('<td></td>').text('Fix Point').appendTo(trs.eq(0));
                //var trs2 = this.expandedProofVariables.find('tr').not(':first-child').children(':last-child');
                var colors = this.expandedProofPropagation.coloredtableviewer("option", "colorData");

                for (var i = 0; i < st.length; i++) {
                    colors[i][0] = st[i].state;
                    $('<td></td>').text(st[i].range).appendTo(trs.eq(i + 1));
                    this.colorData[i].push(st[i].state);
                    colors[i].push(st[i].state);
                }
                this.expandedProofPropagation.coloredtableviewer("option", "colorData", colors);
            }

            public CreateExpandedProofVariables(variablesData) {
                //var st = this.Stability(this.appModel.ProofResult.Ticks);
                //var variablesData = this.CreateTableView(st.variablesStability);
                //var variablesData = that.CreateTableView(appModel.ProofResult.Ticks);
                var full = $('<div></div>').coloredtableviewer({ numericData: variablesData.numericData, colorData: variablesData.colorData, header: ["Name", "Formula", "Range"] });
                full.find("td").eq(0).width(150);
                full.find("td").eq(2).width(150);
                full.addClass("proof-expanded");
                return full;
            }

            public CreateExpandedProofPropagation(ticks) {
                var container = $('<div></div>');
                if (ticks === null) return container;
                var that = this;
                var biomodel = this.appModel.BioModel;
                var variables = biomodel.Variables;
                var table = [];
                var color = [];
                var header = [];
                var l = ticks.length;
                header[0] = "Name";
                for (var i = 0; i < ticks.length; i++) {
                    header[i + 1] = "T = " + i;
                }
                for (var j = 0; j < variables.length; j++) {
                    table[j] = [];
                    color[j] = [];
                    table[j][0] = biomodel.GetVariableById(ticks[0].Variables[variables.length - 1 - j].Id).Name;
                    var v = ticks[0].Variables[variables.length - 1 - j];
                    color[j][0] = v.Lo === v.Hi;
                    for (var i = 1; i < l+1; i++) {
                        var ij = ticks[l-i].Variables[variables.length - 1 - j];
                        if (ij.Lo === ij.Hi) {
                            table[j][i] = ij.Lo;
                            color[j][i] = true;
                        }
                        else {
                            table[j][i] = ij.Lo + ' - ' + ij.Hi;
                            color[j][i] = false;
                        }
                    }
                }

                container.coloredtableviewer({ header: header, numericData: table, colorData: color });

                container.find("td").eq(0).width(150);
                return container;
            }
        }
    }
}
