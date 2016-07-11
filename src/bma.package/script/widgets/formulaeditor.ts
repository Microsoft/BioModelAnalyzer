﻿/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.formulaeditor", {
        _tpViewer: undefined,
        _clipboardOps: [],

        _create: function () {
            var that = this;
            var root = this.element;

            root.css("display", "flex").css("flex-direcition", "row");

            var leftContainer = $("<div></div>").width("80%").appendTo(root);
            //var title = $("<div></div>").addClass("window-title").text("Temporal Properties").appendTo(root);
            var widthStr = "calc(100% - 20px)";
            var toolbar = $("<div></div>").addClass("temporal-toolbar").css("margin-top", 0).width(widthStr).appendTo(leftContainer);
            
            //Adding states
            var states = $("<div></div>").addClass("state-buttons").width("calc(100% - 570px)").html("Variables<br>").appendTo(toolbar);
            this.statesbtns = $("<div></div>").addClass("btns").appendTo(states);
            //this._refreshStates();
            
            //Adding operators
            var operators = $("<div></div>").addClass("temporal-operators").html("Operators<br>").appendTo(toolbar);
            operators.width(350);
            var operatorsDiv = $("<div></div>").addClass("operators").appendTo(operators);

            var operatorsArr = [
                { Name: "+", OperandsCount: Number.POSITIVE_INFINITY, isFunction: false },
                { Name: "-", OperandsCount: Number.POSITIVE_INFINITY, isFunction: false },
                { Name: "*", OperandsCount: Number.POSITIVE_INFINITY, isFunction: false },
                { Name: "/", OperandsCount: 2, isFunction: false },
                { Name: "AVG", OperandsCount: Number.POSITIVE_INFINITY, isFunction: true },
                { Name: "MIN", OperandsCount: Number.POSITIVE_INFINITY, isFunction: true },
                { Name: "MAX", OperandsCount: Number.POSITIVE_INFINITY, isFunction: true },
                { Name: "CEIL", OperandsCount: 1, isFunction: false },
                { Name: "FLOOR", OperandsCount: 1, isFunction: false },
            ];

            for (var i = 0; i < operatorsArr.length; i++) {
                var operator = operatorsArr[i];

                var opDiv = $("<div></div>")
                    .addClass("operator")
                    .addClass("ltl-tp-droppable")
                    .attr("data-operator", operator.Name)
                    .css("z-index", 6)
                    .css("cursor", "pointer")
                    .appendTo(operatorsDiv);

                var spaceStr = "&nbsp;&nbsp;";
                if (operator.OperandsCount > 1 && !operator.isFunction) {
                    $("<div></div>").addClass("hole").appendTo(opDiv);
                    spaceStr = "";
                }

                var opStr = operator.Name;
                if (opStr === "+" || opStr === "+" || opStr === "+" || opStr === "+") {
                    opStr = "&nbsp;" + opStr + "&nbsp;";
                }
                var label = $("<div></div>").addClass("label").html(spaceStr + opStr).appendTo(opDiv);
                $("<div></div>").addClass("hole").appendTo(opDiv);
                if (operator.OperandsCount > 1 && operator.isFunction) {
                    //$("<div>&nbsp;&nbsp;</div>").appendTo(opDiv);
                    $("<div></div>").addClass("hole").appendTo(opDiv);
                }

                opDiv.draggable({
                    helper: "clone",
                    cursorAt: { left: 0, top: 0 },
                    opacity: 0.4,
                    cursor: "pointer",
                    start: function (event, ui) {
                        //that._executeCommand("AddOperatorSelect", $(this).attr("data-operator"));
                    }
                });

            }

            //Adding operators toggle basic/advanced
            /*
            var toggle = $("<div></div>").addClass("toggle").width(60).attr("align", "right").text("Advanced").appendTo(toolbar);
            toggle.click((args) => {
                if (toggle.text() === "Advanced") {
                    toggle.text("Basic");
                    operatorsDiv.height(98);
                    this.statesbtns.height(98);
                    if (this.drawingSurfaceContainerRef !== undefined) {
                        this.drawingSurfaceContainerRef.height("calc(100% - 113px - 30px - 34px)");
                    }
                } else {
                    toggle.text("Advanced");
                    operatorsDiv.height(64);
                    this.statesbtns.height(64);
                    if (this.drawingSurfaceContainerRef !== undefined) {
                        this.drawingSurfaceContainerRef.height("calc(100% - 113px - 30px)");
                    }
                }
                //$('body,html').css("zoom", 1.0000001);
                //root.height(root.height() + 1);
                this.updateLayout();
            });
            */

            //Adding drawing surface
            var svgDiv = $("<div></div>").css("background-color", "white").height(200).width("100%").appendTo(leftContainer);
            that.svgDiv = svgDiv;

            var pixofs = 0;
            svgDiv.svg({
                onLoad: function (svg) {
                    that._svg = svg;

                    svg.configure({
                        width: svgDiv.width() - pixofs,
                        height: svgDiv.height() - pixofs,
                        viewBox: "0 0 " + (svgDiv.width() - pixofs) + " " + (svgDiv.height() - pixofs),
                        preserveAspectRatio: "none meet"
                    }, true);


                    that._refresh();
                }
            });

            //Adding clipboard panel
            var tpViewer = $("<div></div>").width("20%").height(301).css("background-color", "lightgray").appendTo(root);
            that._tpViewer = tpViewer.temporalpropertiesviewer({ "showDefaultIcon": false, rightOffset: 3 });

            svgDiv.mousemove(function (arg) {
                if (that.operationLayout !== undefined && that.operationLayout.IsVisible) {
                    var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                    var parentOffset = $(this).offset();
                    var relX = arg.pageX - parentOffset.left;
                    var relY = arg.pageY - parentOffset.top;
                    var svgCoords = that._getSVGCoords(relX, relY);
                    opL.HighlightAtPosition(svgCoords.x, svgCoords.y);
                }
            });

            svgDiv.droppable({
                drop: function (arg, ui) {

                    if (ui.draggable.attr("data-operator") !== undefined) {
                        var op = new BMA.LTLOperations.Operation();
                        var operator = undefined;
                        for (var i = 0; i < operatorsArr.length; i++) {
                            if (operatorsArr[i].Name === ui.draggable.attr("data-operator")) {
                                op.Operator = new BMA.LTLOperations.Operator(operatorsArr[i].Name, operatorsArr[i].OperandsCount, undefined, operatorsArr[i].isFunction);
                                break;
                            }
                        }
                        op.Operands = [];
                        if (op.Operator.OperandsCount > 1) {
                            op.Operands.push(undefined);
                            op.Operands.push(undefined);
                        } else {
                            op.Operands.push(undefined);
                        }
                        var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                        if (opL === undefined) {
                            that.options.operation = op;
                            that._refresh();
                        } else {
                            var parentOffset = $(this).offset();
                            var relX = arg.pageX - parentOffset.left;
                            var relY = arg.pageY - parentOffset.top;
                            var svgCoords = that._getSVGCoords(relX, relY);
                            var emptyCell = opL.GetEmptySlotAtPosition(svgCoords.x, svgCoords.y);
                            if (emptyCell !== undefined) {
                                emptyCell.operation.Operands[emptyCell.operandIndex] = op;
                                that._refresh();
                            }
                        }

                    } else if (draggableDiv.attr("data-dragsource") === "clipboard") {
                        var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                        if (opL === undefined) {
                            that.options.operation = opToDrag.Operation;
                            that._refresh();
                        } else {
                            var parentOffset = $(this).offset();
                            var relX = arg.pageX - parentOffset.left;
                            var relY = arg.pageY - parentOffset.top;
                            var svgCoords = that._getSVGCoords(relX, relY);
                            var emptyCell = opL.GetEmptySlotAtPosition(svgCoords.x, svgCoords.y);
                            if (emptyCell !== undefined) {
                                emptyCell.operation.Operands[emptyCell.operandIndex] = opToDrag.Operation;
                                that._refresh();
                            }
                        }

                        opToDrag = undefined;
                        draggableDiv.attr("data-dragsource", undefined);
                    }
                }
            });

            var draggableWidth = svgDiv.width();
            var draggableHeight = svgDiv.height();
            var draggableDiv = $("<div></div>").width(draggableWidth).height(draggableHeight).css("z-index", 100);
            var canvas = $("<canvas></canvas>").attr("width", draggableWidth).attr("height", draggableHeight).appendTo(draggableDiv)[0];
            var opToDrag = undefined;

            svgDiv.draggable({
                helper: function () {
                    return draggableDiv;
                },
                cursorAt: { left: 0, top: 0 },
                //opacity: 0.4,
                cursor: "pointer",
                start: function (arg, ui) {
                    draggableDiv.attr("data-dragsource", "editor");
                    canvas.height = canvas.height;

                    var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                    var parentOffset = $(this).offset();
                    var relX = arg.pageX - parentOffset.left;
                    var relY = arg.pageY - parentOffset.top;
                    var svgCoords = that._getSVGCoords(relX, relY);
                    opToDrag = opL.UnpinOperation(svgCoords.x, svgCoords.y);

                    if (opToDrag !== undefined) {

                        if (opToDrag.isRoot) {
                            that.options.operation = undefined;
                            that.operationLayout = undefined;
                        }

                        var keyFrameSize = 26;
                        var padding = { x: 5, y: 10 };
                        var opSize = BMA.LTLOperations.CalcOperationSizeOnCanvas(canvas, opToDrag.operation, padding, keyFrameSize);
                        var scale = { x: 1, y: 1 };
                        var offset = 0;
                        var w = opSize.width + offset;

                        if (w > draggableWidth) {
                            scale = {
                                x: draggableWidth / w,
                                y: draggableWidth / w
                            };
                        }

                        canvas.width = scale.x * opSize.width + 2 * padding.x;
                        canvas.height = scale.y * opSize.height + 2 * padding.y;

                        var opPosition = { x: scale.x * opSize.width / 2 + padding.x, y: padding.y + Math.floor(scale.y * opSize.height / 2) };

                        BMA.LTLOperations.RenderOperation(canvas, opToDrag.operation, opPosition, scale, {
                            padding: padding,
                            keyFrameSize: keyFrameSize,
                            stroke: "black",
                            fill: "white",
                            isRoot: true,
                            strokeWidth: 1,
                            borderThickness: 1
                        });

                        that._refresh();
                    }
                },
                drag: function (arg, ui) {
                    return opToDrag !== undefined;
                },
                stop: function (arg, ui) {
                    /*
                    if (opToDrag !== undefined) {
                        var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                        if (opL === undefined) {
                            that.options.operation = opToDrag.operation;
                            that._refresh();
                        } else {
                            var parentOffset = $(this).offset();
                            var relX = arg.pageX - parentOffset.left;
                            var relY = arg.pageY - parentOffset.top;
                            var svgCoords = that._getSVGCoords(relX, relY);
                            var emptyCell = opL.GetEmptySlotAtPosition(svgCoords.x, svgCoords.y);
                            if (emptyCell !== undefined) {
                                emptyCell.operation.Operands[emptyCell.operandIndex] = opToDrag.operation;
                                that._refresh();
                            } else {
                                opToDrag.parentoperation.Operands[opToDrag.parentoperationindex] = opToDrag.operation;
                            }
                        }

                        //opToDrag = undefined;
                        that._refresh();
                    }
                    draggableDiv.attr("data-dragsource", undefined);
                    */
                }
            });

            //Context menu
            var holdCords = {
                holdX: 0,
                holdY: 0
            };

            $(document).on('vmousedown', function (event) {
                holdCords.holdX = event.pageX;
                holdCords.holdY = event.pageY;
            });

            svgDiv.contextmenu({
                addClass: "temporal-properties-contextmenu",
                delegate: root,
                autoFocus: true,
                preventContextMenuForPopup: true,
                preventSelect: true,
                //taphold: true,
                menu: [
                    //{ title: "Cut", cmd: "Cut", uiIcon: "ui-icon-scissors" },
                    //{ title: "Copy", cmd: "Copy", uiIcon: "ui-icon-copy" },
                    //{ title: "Paste", cmd: "Paste", uiIcon: "ui-icon-clipboard" },
                    { title: "Delete", cmd: "Delete", uiIcon: "ui-icon-trash" },
                    //{ title: "Export as", cmd: "Export", uiIcon: "ui-icon-export", children: [{ title: "json", cmd: "ExportAsJson" }, { title: "text", cmd: "ExportAsText" }] },
                    //{ title: "Import", cmd: "Import", uiIcon: "ui-icon-import" }
                ],
                beforeOpen: function (event, ui) {
                    ui.menu.zIndex(50);
                    var x = event.pageX;
                    var y = event.pageY;
                    var left = x - svgDiv.offset().left;
                    var top = y - svgDiv.offset().top;
                    var svgCoords = that._getSVGCoords(left, top);
                    if (that.operationLayout !== undefined) {
                        that.contextElement = {
                            x: svgCoords.x,
                            y: svgCoords.y,
                        }
                    }

                },
                select: function (event, ui) {
                    var args: any = {};
                    var x = event.pageX;
                    var y = event.pageY;
                    args.left = x - svgDiv.offset().left;
                    args.top = y - svgDiv.offset().top;

                    that._processContextMenuOption(ui.cmd);
                }
            });

            tpViewer.droppable({
                tolerance: "pointer",
                drop: function (arg, ui) {
                    if (ui.draggable.attr("data-dragsource") === "clipboard")
                        return;

                    if (opToDrag !== undefined) {
                        that._clipboardOps.push({ operation: opToDrag.operation, status: "nottested" });
                        that._tpViewer.temporalpropertiesviewer({ "operations": that._clipboardOps });
                    }

                    opToDrag = undefined;
                    draggableDiv.attr("data-dragsource", undefined);
                }
            });

            tpViewer.draggable({
                helper: function () {
                    return draggableDiv;
                },
                cursorAt: { left: 0, top: 0 },
                //opacity: 0.4,
                cursor: "pointer",
                start: function (arg, ui) {
                    draggableDiv.attr("data-dragsource", "clipboard");
                    canvas.height = canvas.height;

                    var parentOffset = $(this).offset();
                    var relX = arg.pageX - parentOffset.left;
                    var relY = arg.pageY - parentOffset.top;

                    var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                    var parentOffset = $(this).offset();
                    var relX = arg.pageX - parentOffset.left;
                    var relY = arg.pageY - parentOffset.top;
                    var svgCoords = that._getSVGCoords(relX, relY);
                    var dragOperation = tpViewer.temporalpropertiesviewer("getOperationByY", relY);

                    if (dragOperation === undefined || dragOperation === null)
                        return;

                    opToDrag = new BMA.LTLOperations.OperationLayout(that._svg, dragOperation, { x: 0, y: 0 });
                    opToDrag.IsVisible = false;

                    if (opToDrag !== undefined) {

                        var keyFrameSize = 26;
                        var padding = { x: 5, y: 10 };
                        var opSize = BMA.LTLOperations.CalcOperationSizeOnCanvas(canvas, opToDrag.operation, padding, keyFrameSize);
                        var scale = { x: 1, y: 1 };
                        var offset = 0;
                        var w = opSize.width + offset;

                        if (w > draggableWidth) {
                            scale = {
                                x: draggableWidth / w,
                                y: draggableWidth / w
                            };
                        }

                        canvas.width = scale.x * opSize.width + 2 * padding.x;
                        canvas.height = scale.y * opSize.height + 2 * padding.y;

                        var opPosition = { x: scale.x * opSize.width / 2 + padding.x, y: padding.y + Math.floor(scale.y * opSize.height / 2) };

                        BMA.LTLOperations.RenderOperation(canvas, opToDrag.operation, opPosition, scale, {
                            padding: padding,
                            keyFrameSize: keyFrameSize,
                            stroke: "black",
                            fill: "white",
                            isRoot: true,
                            strokeWidth: 1,
                            borderThickness: 1
                        });

                        that._refresh();
                    }
                },
                drag: function (arg, ui) {
                    return opToDrag !== undefined;
                }
            });

        },

        _processContextMenuOption(option) {
            var that = this;
            switch (option) {
                case "Delete":
                    if (that.contextElement !== undefined) {
                        var opL = <BMA.LTLOperations.OperationLayout>that.operationLayout;
                        var op = opL.UnpinOperation(this.contextElement.x, this.contextElement.y);
                        if (op.isRoot) {
                            that.operationLayout.IsVisible = false;
                            that.operationLayout = undefined;
                            that.options.operation = undefined;
                        } else {
                            that.options.operation = opL.Operation;
                        }
                        that.contextElement = undefined;
                    }
                    break;
                default:
                    break;
            }

            this._refresh();
        },

        _getSVGCoords: function (x, y) {
            var bbox = this.operationLayout.BoundingBox;
            var aspect = this.svgDiv.width() / this.svgDiv.height();
            var width = bbox.width + 20;
            var height = width / aspect;
            if (height < bbox.height + 20) {
                height = bbox.height + 20;
                width = height * aspect;
            }
            var bboxx = -width / 2;
            var bboxy = -height / 2;
            var svgX = width * x / this.svgDiv.width() + bboxx;
            var svgY = height * y / this.svgDiv.height() + bboxy;
            return {
                x: svgX,
                y: svgY
            };
        },

        _refresh: function () {
            var that = this;

            if (that._svg === undefined)
                return;

            that._svg.clear();

            if (that.options.operation !== undefined) {
                this.operationLayout = new BMA.LTLOperations.OperationLayout(that._svg, that.options.operation, { x: 0, y: 0 });
                var bbox = this.operationLayout.BoundingBox;
                var aspect = that.svgDiv.width() / that.svgDiv.height();
                var width = bbox.width + 20;
                var height = width / aspect;
                if (height < bbox.height + 20) {
                    height = bbox.height + 20;
                    width = height * aspect;
                }
                var x = -width / 2;
                var y = -height / 2;
                that._svg.configure({
                    viewBox: x + " " + y + " " + width + " " + height,
                }, true);
            } else {
                if (that.operationLayout !== undefined) {
                    that.operationLayout.IsVisible = false;
                    that.operationLayout = undefined;
                }
            }


        },

        _setOption: function (key, value) {
            var that = this;
            var needRefreshStates = false;
            switch (key) {
                case "operation":
                    break;
                default:
                    break;
            }

            that._refresh();
        },

        destroy: function () {
            this.element.empty();
        }

    })
} (jQuery));

interface JQuery {
    formulaeditor(): any;
    formulaeditor(settings: Object): any;
    formulaeditor(methodName: string, arg: any): any;
}