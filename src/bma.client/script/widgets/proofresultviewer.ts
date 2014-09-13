﻿/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.proofresultviewer", {
        options: {
            issucceeded: true,
            time: 0,
            data: undefined
        },

        refreshSuccess: function () {
            var that = this;
            var options = this.options;
            this.resultDiv.empty();
            this.successTable = $('<table></table>').appendTo(this.resultDiv);

            if (options.issucceeded === undefined || options.time === undefined)
                return;
            
            var tr1 = $('<tr></tr>').appendTo(this.successTable); 
            var td1 = $('<td></td>').appendTo(tr1);
            var td2 = $('<td></td>').appendTo(tr1);
            if (options.issucceeded) {
                $('<img src="../../images/succeeded.png">').appendTo(td1);
                $('<h3 style="color: green; font-weight:bold"></h3>').text('Stabilizes').appendTo(td2);
                $('<p style="font-size:small"></p>').text('BMA succeeded in checking every possible state of the model in ' + options.time + ' seconds. After stepping through separate interactions, the model eventually reached a single stable state.').appendTo(that.resultDiv);
            }
            else {
                $('<img src="../../images/failed.png">').appendTo(td1);
                $('<h3 style="color: red; font-weight:bold"></h3>').text('Failed to Stabilize').appendTo(td2);
                $('<p style="font-size:small"></p>').text('After stepping through separate interactions in the model, the analisys failed to determine a final stable state').appendTo(that.resultDiv);
            }
        },

        refreshData: function () {
            var that = this;
            var options = this.options;
            if (options.data !== undefined && options.data.numericData !== undefined && options.data.numericData !== null && options.data.numericData.length !== 0) {
                var variables = $("<div></div>")
                    .addClass("scrollable-results")
                    .coloredtableviewer({ numericData: options.data.numericData, header: ["Name", "Formula", "Range"] });

                var tr = variables.find("tr").eq(0);
                tr.children().eq(0).width(120);
                tr.children().eq(2).width(120);
                this.compactvariables.resultswindowviewer({ header: "Variables", content: variables, icon: "max" });

                if (options.data.colorData !== undefined && options.data.colorData !== null && options.data.colorData.length !== 0) {
                    var proof = $("<div></div>").coloredtableviewer({ colorData: options.data.colorData, type: "color" });
                    this.proofPropagation.resultswindowviewer({ header: "Proof Propagation", content: proof, icon: "max" });
                }
                else 
                    this.proofPropagation.empty();
            }
            else {
                this.compactvariables.empty();
                this.proofPropagation.empty();
            }
        },

        show: function (tab) {
            if (tab === "Variables") {
                this.compactvariables.show();
            }
            if (tab === "Proof Propagation") {
                this.proofPropagation.show();
            }
        },

        hide: function (tab) {
            if (tab === "Variables") {
                this.compactvariables.hide();
                this.element.children().not(this.compactvariables).show();
            }
            if (tab === "Proof Propagation") {
                this.proofPropagation.hide();
                this.element.children().not(this.proofPropagation).show();
            }
        },

        _create: function () {
            var that = this;
            var options = this.options;
            this.resultDiv = $('<div></div>').appendTo(that.element);
            this.successTable = $('<table></table>').appendTo(this.resultDiv);
            this.compactvariables = $('<div id="ProofVariables"></div>')
                .appendTo(that.element);
                
            this.proofPropagation = $('<div id="ProofPropagation"></div>')
                .appendTo(that.element);
                

            this.refreshSuccess();
            this.refreshData();
        },

        _destroy: function () {
            this.element.empty();
        },

        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "issucceeded": this.options.issucceeded = value;
                    this.refreshSuccess();
                    break;
                case "time": this.options.time = value;
                    this.refreshSuccess();
                    break;
                case "data":
                    this.options.data = value;
                    this.refreshData();
            }

            this._super(key, value);
        }

    });
} (jQuery));

interface JQuery {
    proofresultviewer(): JQuery;
    proofresultviewer(settings: Object): JQuery;
    proofresultviewer(optionLiteral: string, optionName: string): any;
    proofresultviewer(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}