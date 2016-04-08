﻿(function ($) {
    $.widget("BMA.temporalpropertiesviewer", {
        _svg: undefined,
        _pixelOffset: 10,
        _anims: [],
        _stripesImg: undefined,

        options: {
            operations: [],
            padding: { x: 3, y: 5 }
        },

        _create: function () {
            var that = this;
            var root = this.element;

            root.css("overflow-y", "auto").css("overflow-x", "hidden").css("position", "relative");

            this.attentionDiv = $("<div></div>").addClass("state-compact").appendTo(root);
            $("<div>+</div>").addClass("state-button-empty").addClass("new").appendTo(this.attentionDiv);
            $("<div>start by defining some temporal properties</div>").addClass("state-placeholder").appendTo(this.attentionDiv);

            that.canvasDiv = $("<div></div>").width(root.width()).appendTo(root);
            that._canvas = $("<canvas></canvas>").attr("width", root.width()).attr("height", root.height()).width(root.width()).appendTo(that.canvasDiv);

            that._stripesImg = new Image();
            that._stripesImg.src = "images/stripe-pattern.png";

            that._stripesImg.onload = () => {
                that.refresh();
            }

            that.refresh();
        },

        refresh: function () {
            var that = this;
            var canvas = <HTMLCanvasElement>(this._canvas[0]);
            var keyFrameSize = 26;
            var padding = { x: 5, y: 10 };
            var maxHeight = keyFrameSize * 4;
            var context = canvas.getContext("2d");

            var PIXEL_RATIO = (function () {
                var dpr = window.devicePixelRatio || 1;
                var bsr = (<any>context).webkitBackingStorePixelRatio ||
                    (<any>context).mozBackingStorePixelRatio ||
                    (<any>context).msBackingStorePixelRatio ||
                    (<any>context).oBackingStorePixelRatio ||
                    (<any>context).backingStorePixelRatio || 1;

                return dpr / bsr;
            })();

            canvas.height = canvas.height;


            var operations = this.options.operations;
            var currentPos = { x: 0, y: 0 };
            var height = this.options.padding.y;
            var width = that.canvasDiv.width() - this.options.padding.x;

            for (var i = 0; i < this._anims.length; i++) {
                this._anims[i].remove();
            }
            this._anims = [];

            var sizes: {
                size: {
                    width: number;
                    height: number
                };
                scale: {
                    x: number;
                    y: number
                };
                offset: number
            }[] = [];

            for (var i = 0; i < operations.length; i++) {
                var op = operations[i].operation;
                var opSize = BMA.LTLOperations.CalcOperationSizeOnCanvas(canvas, op, padding, keyFrameSize);
                var scale = { x: 1, y: 1 };

                var offset = 80;
                var w = opSize.width + offset;
                
                /*
                if (operations[i].status !== "nottested" && operations[i].status !== "processing" && operations[i].steps !== undefined) {
                    context.font = "14px Segoe-UI";
                    var text = operations[i].steps + " steps";
                    var textW = context.measureText(text);
                    offset = Math.max(textW.width + 10, offset);
                    w += offset;
                } else if (operations[i].status === "processing") {
                    w += offset;
                }
                */

                if (w > width) {
                    scale = {
                        x: (width - offset) / opSize.width,
                        y: (width - offset) / opSize.width
                    }
                    opSize.width = width - offset;
                    opSize.height = scale.y * opSize.height;
                }

                sizes.push({ size: opSize, offset: offset, scale: scale });
                height += opSize.height + this.options.padding.y;
            }
            if (PIXEL_RATIO !== 1) {
                canvas.height = height * PIXEL_RATIO;
                canvas.width = that._canvas.width() * PIXEL_RATIO;
                that._canvas.height(height);
                context.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
            } else {
                canvas.height = height;
            }

            //context.msImageSmoothingEnabled = true;
            context.translate(0.5, 0.5);


            height = this.options.padding.y;
            for (var i = 0; i < operations.length; i++) {
                var op = operations[i].operation;
                var opSize = sizes[i].size;
                var scale = sizes[i].scale;
                var opPosition = { x: opSize.width / 2 + this.options.padding.x, y: Math.floor(height + opSize.height / 2) };

                BMA.LTLOperations.RenderOperation(canvas, op, opPosition, scale, {
                    padding: padding,
                    keyFrameSize: keyFrameSize,
                    stroke: "black",
                    fill: that._getOperationColor(operations[i].status, opSize.width / scale.x, opSize.height / scale.y),
                    isRoot: true,
                    strokeWidth: 1,
                    borderThickness: 1
                });


                if (operations[i].status !== "nottested" && operations[i].status !== "processing" && operations[i].steps !== undefined) {
                    context.font = "14px Segoe-UI";
                    context.textBaseline = "middle";
                    context.fillStyle = operations[i].status === "fail" ? "rgb(254, 172, 158)" : "green"
                    var text = operations[i].steps + " steps";
                    context.fillText(text, opSize.width + 10, opPosition.y);
                } else if (operations[i].status === "processing") {
                    var anim = this._createWaitAnimation(opSize.width + 10, opPosition.y - 7);
                    this._anims.push(anim);
                }

                height += opSize.height + this.options.padding.y;
            }
        },

        _getOperationColor: function (status, width, height): any {
            switch (status) {
                case "nottested":
                    return "white";
                case "processing":
                    return "white";
                case "success":
                    return "rgb(217,255,182)";
                case "partialsuccess":
                    var canvas = <HTMLCanvasElement>(this._canvas[0]);
                    var context = canvas.getContext("2d");
                    return context.createPattern(this._stripesImg, "repeat");

                /*var gradient = context.createLinearGradient(-width / 2, 0, width, height);
                var n = 20;
                for (var i = 0; i < n; i++) {
                    gradient.addColorStop(i / n, "rgb(217,255,182)");
                    gradient.addColorStop((2 * i + 1) / (2 * n), "white");
                }
                return gradient;
                */
                //return "rgb(217,255,182)";
                case "fail":
                    return "rgb(254, 172, 158)";
                default:
                    throw "Invalid status!";
            }
        },


        _createWaitAnimation: function (x, y) {
            var snipperCnt = $('<div></div>').width(30).css("position", "absolute").css("top", y).css("left", x).appendTo(this.element);
            var snipper = $('<div></div>').css("display", "inline-block").addClass('spinner').appendTo(snipperCnt);
            for (var i = 1; i < 4; i++) {
                $('<div></div>').addClass('bounce' + i).appendTo(snipper);
            }
            return snipperCnt;
        },

        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "operations":
                    if (value !== undefined && value.length > 0) {
                        that.canvasDiv.show();
                        that.attentionDiv.hide();
                    } else {
                        that.canvasDiv.hide();
                        that.attentionDiv.show();
                    }
                    break;
                case "padding":
                    //this.refresh();
                    break;
                default:
                    break;
            }
            this._super(key, value);
            this.refresh();
        },

        destroy: function () {
            this.element.empty();
        },
    });
} (jQuery));

interface JQuery {
    temporalpropertiesviewer(): any;
    temporalpropertiesviewer(settings: Object): any;
    temporalpropertiesviewer(methodName: string, arg: any): any;
}