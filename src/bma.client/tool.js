(function (BMAExt, InteractiveDataDisplay, $, undefined) {

    BMAExt.SVGPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.Plot;
        this.base(jqDiv, master);
        var that = this;

        var _svgCnt = undefined;
        var _svg = undefined;

        Object.defineProperty(this, "svg", {
            get: function () {
                return _svg;
            },
        });

        var svgLoaded = function (svg) {
            _svg = svg;

            svg.configure({
                width: _svgCnt.width(),
                height: _svgCnt.height(),
                viewBox: "0 0 1 1",
                preserveAspectRatio: "none meet"
            }, true);

            that.host.trigger("svgLoaded");
        };

        var plotToSvg = function (y, plotRect) {
            return (y - (plotRect.y + plotRect.height / 2)) * (-1) + plotRect.y + plotRect.height / 2;
        }

        this.arrange = function (finalRect) {
            InteractiveDataDisplay.CanvasPlot.prototype.arrange.call(this, finalRect);

            if (_svgCnt === undefined) {
                _svgCnt = $("<div></div>").css("overflow", "hidden").appendTo(that.host);
                _svgCnt.svg({ onLoad: svgLoaded });
            }

            _svgCnt.width(finalRect.width).height(finalRect.height);

            if (_svg !== undefined) {
                var plotRect = that.visibleRect;
                _svg.configure({
                    width: _svgCnt.width(),
                    height: _svgCnt.height()
                }, false);

                if (!isNaN(plotRect.y) && !isNaN(plotRect.height)) {
                    _svg.configure({
                        viewBox: plotRect.x + " " + (-plotRect.y - plotRect.height) + " " + plotRect.width + " " + plotRect.height,
                    }, false);
                }
            }
        };

        // Gets the transform functions from data to screen coordinates.
        // Returns { dataToScreenX, dataToScreenY }
        this.getTransform = function () {
            var ct = this.coordinateTransform;
            var plotToScreenX = ct.plotToScreenX;
            var plotToScreenY = ct.plotToScreenY;
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;
            var dataToScreenX = dataToPlotX ? function (x) { return plotToScreenX(dataToPlotX(x)); } : plotToScreenX;
            var dataToScreenY = dataToPlotY ? function (y) { return plotToScreenY(dataToPlotY(y)); } : plotToScreenY;

            return { dataToScreenX: dataToScreenX, dataToScreenY: dataToScreenY };
        };

        // Gets the transform functions from screen to data coordinates.
        // Returns { screenToDataX, screenToDataY }
        this.getScreenToDataTransform = function () {
            var ct = this.coordinateTransform;
            var screenToPlotX = ct.screenToPlotX;
            var screenToPlotY = ct.screenToPlotY;
            var plotToDataX = this.xDataTransform && this.xDataTransform.plotToData;
            var plotToDataY = this.yDataTransform && this.yDataTransform.plotToData;
            var screenToDataX = plotToDataX ? function (x) { return plotToDataX(screenToPlotX(x)); } : screenToPlotX;
            var screenToDataY = plotToDataY ? function (y) { return plotToDataY(screenToPlotY(y)); } : screenToPlotY;

            return { screenToDataX: screenToDataX, screenToDataY: screenToDataY };
        };
    };
    BMAExt.SVGPlot.prototype = new InteractiveDataDisplay.Plot;
    InteractiveDataDisplay.register('svgPlot', function (jqDiv, master) { return new BMAExt.SVGPlot(jqDiv, master); });

    BMAExt.RectsPlot = function (div, master) {

        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(div, master);

        var _rects;

        this.draw = function (data) {
            _rects = data.rects;
            if (!_rects) _rects = [];

            this.invalidateLocalBounds();

            this.requestNextFrameOrUpdate();
            this.fireAppearanceChanged();
        };

        // Returns a rectangle in the plot plane.
        this.computeLocalBounds = function (step, computedBounds) {
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;

            if (_rects === undefined || _rects.length < 1)
                return undefined;

            var bbox = { x: _rects[0].x, y: _rects[0].y, width: _rects[0].width, height: _rects[0].height };
            for (var i = 1; i < _rects.length; i++) {
                bbox = InteractiveDataDisplay.Utils.unionRects(bbox, { x: _rects[i].x, y: _rects[i].y, width: _rects[i].width, height: _rects[i].height })
            }

            return bbox;
        };

        // Returns 4 margins in the screen coordinate system
        this.getLocalPadding = function () {
            return { left: 0, right: 0, top: 0, bottom: 0 };
        };

        this.renderCore = function (plotRect, screenSize) {
            InteractiveDataDisplay.Polyline.prototype.renderCore.call(this, plotRect, screenSize);

            if (_rects === undefined || _rects.length < 1)
                return;

            var t = this.getTransform();
            var dataToScreenX = t.dataToScreenX;
            var dataToScreenY = t.dataToScreenY;

            // size of the canvas
            var w_s = screenSize.width;
            var h_s = screenSize.height;
            var xmin = 0, xmax = w_s;
            var ymin = 0, ymax = h_s;

            var context = this.getContext(true);

            for (var i = 0; i < _rects.length; i++) {
                var rect = _rects[i];
                context.fillStyle = rect.fill;

                var x = dataToScreenX(rect.x);
                var y = dataToScreenY(rect.y + rect.height);
                var width = dataToScreenX(rect.x + rect.width) - dataToScreenX(rect.x);
                var height = dataToScreenY(rect.y) - dataToScreenY(rect.y + rect.height);

                context.fillRect(x, y, width, height);
            }
        };

        // Others
        this.onDataTransformChanged = function (arg) {
            this.invalidateLocalBounds();
            InteractiveDataDisplay.RectsPlot.prototype.onDataTransformChanged.call(this, arg);
        };


    }

    BMAExt.RectsPlot.prototype = new InteractiveDataDisplay.CanvasPlot;
    InteractiveDataDisplay.register('rectsPlot', function (jqDiv, master) { return new BMAExt.RectsPlot(jqDiv, master); });


})(window.BMAExt = window.BMAExt || {}, InteractiveDataDisplay || {}, jQuery);
(function (BMAExt, InteractiveDataDisplay, $, undefined) {

    BMAExt.GridLinesPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(jqDiv, master);

        var _x0 = 0, _xstep = 1, _y0 = 0, _ystep = 1;
        var _thickness = "1px";
        var _stroke = "LightGray";

        var style = {};
        InteractiveDataDisplay.Utils.readStyle(this.host, style);
        if (style) {
            _stroke = typeof style.stroke != "undefined" ? style.stroke : _stroke;
            _thickness = typeof style.thickness != "undefined" ? style.thickness : _thickness;
        }

        Object.defineProperty(this, "x0", {
            get: function () { return _x0; },
            set: function (value) {
                if (value == _x0) return;
                _x0 = value;
                this.requestUpdateLayout();
            },
            configurable: false
        });

        Object.defineProperty(this, "xStep", {
            get: function () { return _xstep; },
            set: function (value) {
                if (value == _xstep) return;

                if (_xstep <= 0) throw "xStep show be positive";

                _xstep = value;
                this.requestUpdateLayout();
            },
            configurable: false
        });

        Object.defineProperty(this, "y0", {
            get: function () { return _y0; },
            set: function (value) {
                if (value == _y0) return;
                _y0 = value;
                this.requestUpdateLayout();
            },
            configurable: false
        });

        Object.defineProperty(this, "yStep", {
            get: function () { return _ystep; },
            set: function (value) {
                if (value == _ystep) return;

                if (_ystep <= 0) throw "yStep show be positive";

                _ystep = value;
                this.requestUpdateLayout();
            },
            configurable: false
        });

        Object.defineProperty(this, "thickness", {
            get: function () { return _thickness; },
            set: function (value) {
                if (value == _thickness) return;
                if (value <= 0) throw "GridLines thickness must be positive";
                _thickness = value;

                this.requestNextFrameOrUpdate();
            },
            configurable: false
        });

        Object.defineProperty(this, "stroke", {
            get: function () { return _stroke; },
            set: function (value) {
                if (value == _stroke) return;
                _stroke = value;

                this.requestNextFrameOrUpdate();
            },
            configurable: false
        });

        this.renderCore = function (plotRect, screenSize) {
            InteractiveDataDisplay.GridlinesPlot.prototype.renderCore.call(this, plotRect, screenSize);

            var transform = this.getTransform();
            var ctx = this.getContext(true);
            ctx.strokeStyle = _stroke;
            ctx.fillStyle = _stroke;
            ctx.lineWidth = 1;

            var strokeThickness = parseInt(_thickness.slice(0, -2));

            var ticks = [];
            var xmin = Math.ceil((plotRect.x - _x0) / _xstep) * _xstep + _x0;
            var xmax = (Math.ceil((plotRect.x + plotRect.width - _x0) / _xstep) - 1) * _xstep + _x0;
            var index = xmin;
            while (index <= xmax) {
                ticks.push(index);
                index += _xstep;
            }

            var v;
            for (var i = 0, len = ticks.length; i < len; i++) {
                v = transform.dataToScreenX(ticks[i]);
                ctx.fillRect(v, 0, strokeThickness, screenSize.height);
            }

            ticks = [];
            var ymin = Math.ceil((plotRect.y - _y0) / _ystep) * _ystep + _y0;
            var ymax = (Math.ceil((plotRect.y + plotRect.height - _y0) / _ystep) - 1) * _ystep + _y0;
            index = ymin;
            while (index <= ymax) {
                ticks.push(index);
                index += _ystep;
            }

            v;
            for (var i = 0, len = ticks.length; i < len; i++) {
                v = transform.dataToScreenY(ticks[i]);
                ctx.fillRect(0, v, screenSize.width, strokeThickness);
            }
        };

        // Gets the transform functions from data to screen coordinates.
        // Returns { dataToScreenX, dataToScreenY }
        this.getTransform = function () {
            var ct = this.coordinateTransform;
            var plotToScreenX = ct.plotToScreenX;
            var plotToScreenY = ct.plotToScreenY;
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;
            var dataToScreenX = dataToPlotX ? function (x) { return plotToScreenX(dataToPlotX(x)); } : plotToScreenX;
            var dataToScreenY = dataToPlotY ? function (y) { return plotToScreenY(dataToPlotY(y)); } : plotToScreenY;

            return { dataToScreenX: dataToScreenX, dataToScreenY: dataToScreenY };
        };
    }
    BMAExt.GridLinesPlot.prototype = new InteractiveDataDisplay.CanvasPlot;
    InteractiveDataDisplay.register('scalableGridLines', function (jqDiv, master) { return new BMAExt.GridLinesPlot(jqDiv, master); });

})(window.BMAExt = window.BMAExt || {}, InteractiveDataDisplay || {}, jQuery);
var BMA;
(function (BMA) {
    function ParseXmlModel(xml, grid) {
        var $xml = $(xml);
        var $variables = $xml.children("Model").children("Variables").children("Variable");
        var modelVars = ($variables.map(function (idx, elt) {
            var $elt = $(elt);
            var containerId = $elt.children("ContainerId").text();
            containerId = containerId === "" ? "-1" : containerId;
            return new BMA.Model.Variable(parseInt($elt.attr("Id")), parseInt(containerId), $elt.children("Type").text(), $elt.attr("Name"), parseInt($elt.children("RangeFrom").text()), parseInt($elt.children("RangeTo").text()), $elt.children("Formula").text());
        }).get());
        var $relations = $xml.children("Model").children("Relationships").children("Relationship");
        var modelRels = ($relations.map(function (idx, elt) {
            var $elt = $(elt);
            return new BMA.Model.Relationship(parseInt($elt.attr("Id")), parseInt($elt.children("FromVariableId").text()), parseInt($elt.children("ToVariableId").text()), $elt.children("Type").text());
        }).get());
        var $containers = $xml.children("Model").children("Containers").children("Container");
        var containers = ($containers.map(function (idx, elt) {
            var $elt = $(elt);
            var size = $elt.children("Size").text();
            size = size === "" ? "1" : size;
            return new BMA.Model.ContainerLayout(parseInt($elt.attr("Id")), $elt.attr("Name"), parseInt(size), parseInt($elt.children("PositionX").text()), parseInt($elt.children("PositionY").text()));
        }).get());
        var varLayouts = $variables.map(function (idx, elt) {
            var $elt = $(elt);
            var id = parseInt($elt.attr("Id"));
            var cellX = $elt.children("CellX").text();
            var cellY = $elt.children("CellY").text();
            if (cellX === "" || cellY === "") {
                var cntID = $elt.children("ContainerId").text();
                if (cntID !== "") {
                    var containerId = parseInt(cntID);
                    for (var i = 0; i < containers.length; i++) {
                        if (containers[i].Id === containerId) {
                            cellX = containers[i].PositionX.toString();
                            cellY = containers[i].PositionY.toString();
                            break;
                        }
                    }
                }
                else {
                    cellX = "0";
                    cellY = "0";
                }
            }
            var positionX = $elt.children("PositionX").text();
            positionX = positionX === "" ? "0" : positionX;
            var positionY = $elt.children("PositionY").text();
            positionY = positionY === "" ? "0" : positionY;
            var x = parseInt(cellX) * grid.xStep + grid.xOrigin + parseFloat(positionX) * (grid.xStep - 60) / 300 + 30;
            var y = parseInt(cellY) * grid.yStep + grid.yOrigin + parseFloat(positionY) * (grid.yStep - 50) / 350 + 25;
            if (modelVars[idx].Type === "MembraneReceptor") {
                var cID = parseInt($elt.children("ContainerId").text());
                var cnt = undefined;
                for (var i = 0; i < containers.length; i++) {
                    if (containers[i].Id === cID) {
                        cnt = containers[i];
                        break;
                    }
                }
                var p = BMA.SVGHelper.GeEllipsePoint((cnt.PositionX + 0.5) * grid.xStep + grid.xOrigin + (cnt.Size - 1) * grid.xStep / 2 + 2.5 * cnt.Size, (cnt.PositionY + 0.5) * grid.yStep + grid.yOrigin + (cnt.Size - 1) * grid.yStep / 2, 107 * cnt.Size, 127 * cnt.Size, x, y);
                x = p.x;
                y = p.y;
            }
            var angle = $elt.children("Angle").text();
            angle = angle === "" ? "0" : angle;
            return new BMA.Model.VariableLayout(id, x, y, Number.NaN, Number.NaN, parseFloat(angle));
        }).get();
        return {
            Model: new BMA.Model.BioModel($xml.children("Model").attr("Name"), modelVars, modelRels),
            Layout: new BMA.Model.Layout(containers, varLayouts)
        };
    }
    BMA.ParseXmlModel = ParseXmlModel;
})(BMA || (BMA = {}));
//# sourceMappingURL=XmlModelParser.js.map
var BMA;
(function (BMA) {
    var SVGHelper;
    (function (SVGHelper) {
        function AddClass(elem, c) {
            var s = elem.className.baseVal;
            if (!s)
                elem.className.baseVal = c;
            else if (!BMA.SVGHelper.StringInString(s, c))
                elem.className.baseVal = s + " " + c;
        }
        SVGHelper.AddClass = AddClass;
        function RemoveClass(elem, c) {
            var s = elem.className.baseVal.replace(new RegExp("(\\s|^)" + c + "(\\s|$)"), " ");
            // TODO - coalesce spaces
            if (s == " ")
                s = null;
            elem.className.baseVal = s;
        }
        SVGHelper.RemoveClass = RemoveClass;
        function StringInString(s, find) {
            return s.match(new RegExp("(\\s|^)" + find + "(\\s|$)"));
        }
        SVGHelper.StringInString = StringInString;
        function DoNothing() {
            return null;
        }
        SVGHelper.DoNothing = DoNothing;
        function GeEllipsePoint(ellipseX, ellipseY, ellipseWidth, ellipseHeight, pointX, pointY) {
            if (pointX === ellipseX)
                return { x: ellipseX, y: ellipseY + ellipseHeight };
            var a = (ellipseY - pointY) / (ellipseX - pointX);
            var b = (ellipseX * pointY - pointX * ellipseY) / (ellipseX - pointX);
            var a1 = ellipseHeight * ellipseHeight + ellipseWidth * ellipseWidth * a * a;
            var b1 = 2 * (a * (b - ellipseY) * ellipseWidth * ellipseWidth - ellipseHeight * ellipseHeight * ellipseX);
            var c1 = ellipseX * ellipseX * ellipseHeight * ellipseHeight + ellipseWidth * ellipseWidth * (b - ellipseY) * (b - ellipseY) -
                ellipseHeight * ellipseHeight * ellipseWidth * ellipseWidth;
            var sign = (pointX - ellipseX) / Math.abs(pointX - ellipseX);
            var x = (-b1 + sign * Math.sqrt(b1 * b1 - 4 * a1 * c1)) / (2 * a1);
            var y = a * x + b;
            return { x: x, y: y };
        }
        SVGHelper.GeEllipsePoint = GeEllipsePoint;
        function GeEllipsePoints(ellipseX, ellipseY, ellipseWidth, ellipseHeight, pointX, pointY) {
            if (pointX === ellipseX)
                return [{ x: ellipseX, y: ellipseY + ellipseHeight }, { x: ellipseX, y: ellipseY - ellipseHeight }];
            var a = (ellipseY - pointY) / (ellipseX - pointX);
            var b = (ellipseX * pointY - pointX * ellipseY) / (ellipseX - pointX);
            var a1 = ellipseHeight * ellipseHeight + ellipseWidth * ellipseWidth * a * a;
            var b1 = 2 * (a * (b - ellipseY) * ellipseWidth * ellipseWidth - ellipseHeight * ellipseHeight * ellipseX);
            var c1 = ellipseX * ellipseX * ellipseHeight * ellipseHeight + ellipseWidth * ellipseWidth * (b - ellipseY) * (b - ellipseY) -
                ellipseHeight * ellipseHeight * ellipseWidth * ellipseWidth;
            var sign = (pointX - ellipseX) / Math.abs(pointX - ellipseX);
            var x1 = (-b1 + sign * Math.sqrt(b1 * b1 - 4 * a1 * c1)) / (2 * a1);
            var y1 = a * x1 + b;
            var x2 = (-b1 - sign * Math.sqrt(b1 * b1 - 4 * a1 * c1)) / (2 * a1);
            var y2 = a * x2 + b;
            return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        }
        SVGHelper.GeEllipsePoints = GeEllipsePoints;
        function CreateOperandLayout(op) {
        }
        SVGHelper.CreateOperandLayout = CreateOperandLayout;
        function CalcAndAssignOperandWidthAndDepth(op, paddingX) {
            var operator = op.Operator;
            if (operator !== undefined) {
                var operands = op.Operands;
                var layer = 0;
                var width = GetOperatorWidth(operator, paddingX);
                for (var i = 0; i < operands.length; i++) {
                    var calcLW = CalcAndAssignOperandWidthAndDepth(operands[i], paddingX);
                    layer = Math.max(layer, calcLW.layer);
                    width += (calcLW.width + paddingX * 2);
                }
                op.layer = layer + 1;
                op.width = width;
                return {
                    layer: layer + 1,
                    width: width
                };
            }
            else {
                var w = GetKeyframeWidth(op, paddingX);
                op.layer = 1;
                op.width = w;
                return {
                    layer: 1,
                    width: w
                };
            }
        }
        SVGHelper.CalcAndAssignOperandWidthAndDepth = CalcAndAssignOperandWidthAndDepth;
        function GetOperatorWidth(op, paddingX) {
            return op.Name.length * 4 + paddingX;
        }
        SVGHelper.GetOperatorWidth = GetOperatorWidth;
        function GetKeyframeWidth(op, paddingX) {
            return 25 + paddingX;
        }
        SVGHelper.GetKeyframeWidth = GetKeyframeWidth;
        function bboxText(svgDocument, text) {
            var data = svgDocument.createTextNode(text);
            var svgns = "";
            var svgElement = svgDocument.createElementNS(svgns, "text");
            svgElement.appendChild(data);
            svgDocument.documentElement.appendChild(svgElement);
            var bbox = svgElement.getBBox();
            svgElement.parentNode.removeChild(svgElement);
            return bbox;
        }
        SVGHelper.bboxText = bboxText;
    })(SVGHelper = BMA.SVGHelper || (BMA.SVGHelper = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=SVGHelper.js.map
var BMA;
(function (BMA) {
    var ModelHelper;
    (function (ModelHelper) {
        function CreateClipboardContent(model, layout, contextElement) {
            var result = undefined;
            if (contextElement.type === "variable") {
                var v = model.GetVariableById(contextElement.id);
                var l = layout.GetVariableById(contextElement.id);
                if (v !== undefined && l !== undefined) {
                    result = {
                        Container: undefined,
                        Realtionships: undefined,
                        Variables: [{ m: v, l: l }]
                    };
                }
            }
            else if (contextElement.type === "container") {
                var id = contextElement.id;
                var cnt = layout.GetContainerById(id);
                if (cnt !== undefined) {
                    var clipboardVariables = [];
                    var variables = model.Variables;
                    var variableLayouts = layout.Variables;
                    for (var i = 0; i < variables.length; i++) {
                        var variable = variables[i];
                        if (variable.ContainerId === id) {
                            clipboardVariables.push({ m: variable, l: variableLayouts[i] });
                        }
                    }
                    var clipboardRelationships = [];
                    var relationships = model.Relationships;
                    for (var i = 0; i < relationships.length; i++) {
                        var rel = relationships[i];
                        var index = 0;
                        for (var j = 0; j < clipboardVariables.length; j++) {
                            var cv = clipboardVariables[j];
                            if (rel.FromVariableId === cv.m.Id) {
                                index++;
                            }
                            if (rel.ToVariableId === cv.m.Id) {
                                index++;
                            }
                            if (index == 2)
                                break;
                        }
                        if (index === 2) {
                            clipboardRelationships.push(rel);
                        }
                    }
                    result = {
                        Container: cnt,
                        Realtionships: clipboardRelationships,
                        Variables: clipboardVariables
                    };
                }
            }
            return result;
        }
        ModelHelper.CreateClipboardContent = CreateClipboardContent;
        function ResizeContainer(model, layout, containerId, containerSize, grid) {
            var container = layout.GetContainerById(containerId);
            if (container !== undefined) {
                var sizeDiff = containerSize - container.Size;
                var containerLayouts = layout.Containers;
                var variables = model.Variables;
                var variableLayouts = layout.Variables;
                var newCnt = [];
                for (var i = 0; i < containerLayouts.length; i++) {
                    var cnt = containerLayouts[i];
                    if (cnt.Id === container.Id) {
                        newCnt.push(new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, containerSize, cnt.PositionX, cnt.PositionY));
                    }
                    else if (cnt.PositionX > container.PositionX || cnt.PositionY > container.PositionY) {
                        newCnt.push(new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, cnt.Size, cnt.PositionX > container.PositionX ? cnt.PositionX + sizeDiff : cnt.PositionX, cnt.PositionY > container.PositionY ? cnt.PositionY + sizeDiff : cnt.PositionY));
                    }
                    else
                        newCnt.push(cnt);
                }
                var cntX = container.PositionX * grid.xStep + grid.xOrigin;
                var cntY = container.PositionY * grid.yStep + grid.yOrigin;
                var newVL = [];
                for (var i = 0; i < variableLayouts.length; i++) {
                    var v = variables[i];
                    var vl = variableLayouts[i];
                    if (variables[i].ContainerId === container.Id) {
                        newVL.push(new BMA.Model.VariableLayout(vl.Id, cntX + (vl.PositionX - cntX) * containerSize / container.Size, cntY + (vl.PositionY - cntY) * containerSize / container.Size, 0, 0, vl.Angle));
                    }
                    else {
                        if (v.Type === "Constant") {
                            newVL.push(new BMA.Model.VariableLayout(vl.Id, vl.PositionX > cntX + grid.xStep ? vl.PositionX + sizeDiff * grid.xStep : vl.PositionX, vl.PositionY > cntY + grid.yStep ? vl.PositionY + sizeDiff * grid.yStep : vl.PositionY, 0, 0, vl.Angle));
                        }
                        else {
                            var vCnt = layout.GetContainerById(v.ContainerId);
                            var vCntX = vCnt.PositionX * grid.xStep + grid.xOrigin;
                            var vCntY = vCnt.PositionY * grid.yStep + grid.yOrigin;
                            var unsizedVposX = (vl.PositionX - vCntX) / vCnt.Size + vCntX;
                            var unsizedVposY = (vl.PositionY - vCntY) / vCnt.Size + vCntY;
                            newVL.push(new BMA.Model.VariableLayout(vl.Id, unsizedVposX > cntX + grid.xStep ? vl.PositionX + sizeDiff * grid.xStep : vl.PositionX, unsizedVposY > cntY + grid.yStep ? vl.PositionY + sizeDiff * grid.yStep : vl.PositionY, 0, 0, vl.Angle));
                        }
                    }
                }
                var newlayout = new BMA.Model.Layout(newCnt, newVL);
                var newModel = new BMA.Model.BioModel(model.Name, model.Variables, model.Relationships);
                return { model: newModel, layout: newlayout };
            }
        }
        ModelHelper.ResizeContainer = ResizeContainer;
        function GetModelBoundingBox(model, grid) {
            var bottomLeftCell = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
            var topRightCell = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };
            var cells = model.Containers;
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                if (cell.PositionX < bottomLeftCell.x) {
                    bottomLeftCell.x = cell.PositionX;
                }
                if (cell.PositionY < bottomLeftCell.y) {
                    bottomLeftCell.y = cell.PositionY;
                }
                if (cell.PositionX + cell.Size - 1 > topRightCell.x) {
                    topRightCell.x = cell.PositionX + cell.Size - 1;
                }
                if (cell.PositionY + cell.Size - 1 > topRightCell.y) {
                    topRightCell.y = cell.PositionY + cell.Size - 1;
                }
            }
            var variables = model.Variables;
            var getGridCell = function (x, y) {
                var cellX = Math.ceil((x - grid.xOrigin) / grid.xStep) - 1;
                var cellY = Math.ceil((y - grid.yOrigin) / grid.yStep) - 1;
                return { x: cellX, y: cellY };
            };
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var gridCell = getGridCell(variable.PositionX, variable.PositionY);
                if (gridCell.x < bottomLeftCell.x) {
                    bottomLeftCell.x = gridCell.x;
                }
                if (gridCell.y < bottomLeftCell.y) {
                    bottomLeftCell.y = gridCell.y;
                }
                if (gridCell.x > topRightCell.x) {
                    topRightCell.x = gridCell.x;
                }
                if (gridCell.y > topRightCell.y) {
                    topRightCell.y = gridCell.y;
                }
            }
            if (cells.length === 0 && variables.length === 0) {
                return {
                    x: 0,
                    y: 0,
                    width: 5 * grid.xStep,
                    height: 4 * grid.yStep
                };
            }
            else {
                return {
                    x: bottomLeftCell.x * grid.xStep + grid.xOrigin,
                    y: bottomLeftCell.y * grid.yStep + grid.yOrigin,
                    width: (topRightCell.x - bottomLeftCell.x + 1) * grid.xStep,
                    height: (topRightCell.y - bottomLeftCell.y + 1) * grid.yStep
                };
            }
        }
        ModelHelper.GetModelBoundingBox = GetModelBoundingBox;
    })(ModelHelper = BMA.ModelHelper || (BMA.ModelHelper = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=ModelHelper.js.map
var BMA;
(function (BMA) {
    var CommandRegistry = (function () {
        function CommandRegistry() {
            this.registeredCommands = [];
        }
        CommandRegistry.prototype.Execute = function (commandName, params) {
            for (var i = 0; i < this.registeredCommands.length; i++) {
                if (this.registeredCommands[i].Name == commandName) {
                    this.registeredCommands[i].Execute(params);
                    return;
                }
            }
        };
        CommandRegistry.prototype.On = function (commandName, onExecutedCallback) {
            for (var i = 0; i < this.registeredCommands.length; i++) {
                if (this.registeredCommands[i].Name == commandName) {
                    this.registeredCommands[i].RegisterCallback(onExecutedCallback);
                    return;
                }
            }
            var newCommand = new ApplicationCommand(commandName);
            newCommand.RegisterCallback(onExecutedCallback);
            this.registeredCommands.push(newCommand);
        };
        CommandRegistry.prototype.Off = function (commandName, onExecutedCallback) {
            for (var i = 0; i < this.registeredCommands.length; i++) {
                if (this.registeredCommands[i].Name == commandName) {
                    this.registeredCommands[i].UnregisterCallback(onExecutedCallback);
                    return;
                }
            }
        };
        return CommandRegistry;
    })();
    BMA.CommandRegistry = CommandRegistry;
    var ApplicationCommand = (function () {
        function ApplicationCommand(name) {
            this.name = name;
            this.callbacks = [];
        }
        Object.defineProperty(ApplicationCommand.prototype, "Name", {
            get: function () {
                return this.name;
            },
            enumerable: true,
            configurable: true
        });
        ApplicationCommand.prototype.RegisterCallback = function (callback) {
            this.callbacks.push(callback);
        };
        ApplicationCommand.prototype.UnregisterCallback = function (callback) {
            var index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
        ApplicationCommand.prototype.Execute = function (params) {
            for (var i = 0; i < this.callbacks.length; i++) {
                this.callbacks[i](params);
            }
        };
        return ApplicationCommand;
    })();
    BMA.ApplicationCommand = ApplicationCommand;
})(BMA || (BMA = {}));
//# sourceMappingURL=commands.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BMA;
(function (BMA) {
    var Elements;
    (function (Elements) {
        var Element = (function () {
            function Element(type, renderToSvg, contains, description, iconClass) {
                this.type = type;
                this.renderToSvg = renderToSvg;
                this.contains = contains;
                this.description = description;
                this.iconClass = iconClass;
            }
            Object.defineProperty(Element.prototype, "Type", {
                get: function () {
                    return this.type;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Element.prototype, "RenderToSvg", {
                get: function () {
                    return this.renderToSvg;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Element.prototype, "Description", {
                get: function () {
                    return this.description;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Element.prototype, "IconClass", {
                get: function () {
                    return this.iconClass;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Element.prototype, "Contains", {
                get: function () {
                    return this.contains;
                },
                enumerable: true,
                configurable: true
            });
            return Element;
        })();
        Elements.Element = Element;
        var BboxElement = (function (_super) {
            __extends(BboxElement, _super);
            function BboxElement(type, renderToSvg, contains, getBbox, description, iconClass) {
                _super.call(this, type, renderToSvg, contains, description, iconClass);
                this.getBbox = getBbox;
            }
            Object.defineProperty(BboxElement.prototype, "GetBoundingBox", {
                get: function () {
                    return this.getBbox;
                },
                enumerable: true,
                configurable: true
            });
            return BboxElement;
        })(Element);
        Elements.BboxElement = BboxElement;
        var BorderContainerElement = (function (_super) {
            __extends(BorderContainerElement, _super);
            function BorderContainerElement(type, renderToSvg, contains, intersectsBorder, containsBBox, description, iconClass) {
                _super.call(this, type, renderToSvg, contains, description, iconClass);
                this.intersectsBorder = intersectsBorder;
                this.containsBBox = containsBBox;
            }
            Object.defineProperty(BorderContainerElement.prototype, "IntersectsBorder", {
                get: function () {
                    return this.intersectsBorder;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BorderContainerElement.prototype, "ContainsBBox", {
                get: function () {
                    return this.containsBBox;
                },
                enumerable: true,
                configurable: true
            });
            return BorderContainerElement;
        })(Element);
        Elements.BorderContainerElement = BorderContainerElement;
        var ElementsRegistry = (function () {
            function ElementsRegistry() {
                var _this = this;
                this.variableWidthConstant = 35;
                this.variableHeightConstant = 30;
                this.variableSizeConstant = 30;
                this.relationshipBboxOffset = 20;
                this.containerRadius = 100;
                this.lineWidth = 1;
                this.labelSize = 10;
                this.labelVisibility = true;
                var that = this;
                this.elements = [];
                var svgCnt = $("<div></div>");
                svgCnt.svg({
                    onLoad: function (svg) {
                        _this.svg = svg;
                    }
                });
                var containerInnerEllipseWidth = 102;
                var containerInnerEllipseHeight = 124;
                var containerOuterEllipseWidth = 112;
                var containerOuterEllipseHeight = 130;
                var containerInnerCenterOffset = 5;
                var containerOuterCenterOffset = 0;
                var containerPaddingCoef = 100;
                this.elements.push(new BorderContainerElement("Container", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var x = (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2;
                    var y = (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2;
                    if (renderParams.translate !== undefined) {
                        x += renderParams.translate.x;
                        y += renderParams.translate.y;
                    }
                    var g = jqSvg.group({
                        transform: "translate(" + x + ", " + y + ")"
                    });
                    jqSvg.rect(g, -renderParams.grid.xStep * renderParams.layout.Size / 2 + renderParams.grid.xStep / containerPaddingCoef + (renderParams.translate === undefined ? 0 : renderParams.translate.x), -renderParams.grid.yStep * renderParams.layout.Size / 2 + renderParams.grid.yStep / containerPaddingCoef + (renderParams.translate === undefined ? 0 : renderParams.translate.y), renderParams.grid.xStep * renderParams.layout.Size - 2 * renderParams.grid.xStep / containerPaddingCoef, renderParams.grid.yStep * renderParams.layout.Size - 2 * renderParams.grid.yStep / containerPaddingCoef, 0, 0, {
                        stroke: "none",
                        fill: renderParams.background !== undefined ? renderParams.background : "white",
                    });
                    var scale = 0.45 * renderParams.layout.Size;
                    var cellData = "M249,577 C386.518903,577 498,447.83415 498,288.5 C498,129.16585 386.518903,0 249,0 C111.481097,0 0,129.16585 0,288.5 C0,447.83415 111.481097,577 249,577 Z M262,563 C387.368638,563 489,440.102164 489,288.5 C489,136.897836 387.368638,14 262,14 C136.631362,14 35,136.897836 35,288.5 C35,440.102164 136.631362,563 262,563 Z";
                    var cellPath = jqSvg.createPath();
                    var op = jqSvg.path(g, cellPath, {
                        stroke: 'transparent',
                        fill: "#FAAF40",
                        "fill-rule": "evenodd",
                        d: cellData,
                        transform: "scale(" + scale + ") translate(-250, -290)"
                    });
                    if (renderParams.translate === undefined) {
                        jqSvg.ellipse(g, containerInnerCenterOffset * renderParams.layout.Size, 0, containerInnerEllipseWidth * renderParams.layout.Size, containerInnerEllipseHeight * renderParams.layout.Size, { stroke: "none", fill: "white" });
                        if (that.labelVisibility === true) {
                            if (renderParams.layout.Name !== undefined && renderParams.layout.Name !== "") {
                                var textLabel = jqSvg.text(g, 0, 0, renderParams.layout.Name, {
                                    transform: "translate(" + -(renderParams.layout.Size * renderParams.grid.xStep / 2 - 10 * renderParams.layout.Size) + ", " + -(renderParams.layout.Size * renderParams.grid.yStep / 2 - that.labelSize - 10 * renderParams.layout.Size) + ")",
                                    "font-size": that.labelSize * renderParams.layout.Size,
                                    "fill": "black"
                                });
                            }
                        }
                    }
                    $(op).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-element-hover')");
                    $(op).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-element-hover')");
                    /*
                    //Helper bounding ellipses
                    jqSvg.ellipse(
                        (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + containerOuterCenterOffset * renderParams.layout.Size + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2,
                        (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2,
                        containerOuterEllipseWidth * renderParams.layout.Size, containerOuterEllipseHeight * renderParams.layout.Size, { stroke: "red", fill: "none" });
                    
                    jqSvg.ellipse(
                        (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + containerInnerCenterOffset * renderParams.layout.Size + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2,
                        (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2,
                        containerInnerEllipseWidth * renderParams.layout.Size, containerInnerEllipseHeight * renderParams.layout.Size, { stroke: "red", fill: "none" });

                    jqSvg.ellipse(
                        x + containerOuterCenterOffset * renderParams.layout.Size / 2,
                        y,
                        (containerInnerEllipseWidth + containerOuterEllipseWidth) * renderParams.layout.Size / 2,
                        (containerInnerEllipseHeight + containerOuterEllipseHeight) * renderParams.layout.Size / 2,
                        { stroke: "red", fill: "none" });
                    */
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    return false;
                }, function (pointerX, pointerY, elementX, elementY, elementParams) {
                    var innerCenterX = elementX + containerInnerCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1);
                    var dstXInner = Math.abs(pointerX - innerCenterX);
                    var outerCenterX = elementX + containerOuterCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1);
                    var dstXOuter = Math.abs(pointerX - outerCenterX);
                    var centerY = elementY + elementParams.yStep * (elementParams.Size - 1);
                    var dstY = Math.abs(pointerY - centerY);
                    var outerCheck = Math.pow(dstXOuter / (containerOuterEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (containerOuterEllipseHeight * elementParams.Size), 2) < 1;
                    var innerCheck = Math.pow(dstXInner / (containerInnerEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (containerInnerEllipseHeight * elementParams.Size), 2) > 1;
                    return outerCheck && innerCheck;
                }, function (bbox, elementX, elementY, elementParams) {
                    var iscontaining = function (x, y) {
                        var dstX = Math.abs(x - (elementX + containerInnerCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1)));
                        var dstY = Math.abs(y - elementY - elementParams.yStep * (elementParams.Size - 1));
                        return Math.pow(dstX / (containerInnerEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (containerInnerEllipseHeight * elementParams.Size), 2) < 1;
                    };
                    var leftTop = iscontaining(bbox.x, bbox.y);
                    var leftBottom = iscontaining(bbox.x, bbox.y + bbox.height);
                    var rightTop = iscontaining(bbox.x + bbox.width, bbox.y);
                    var rightBottom = iscontaining(bbox.x + bbox.width, bbox.y + bbox.height);
                    return leftTop && leftBottom && rightTop && rightBottom;
                }, "Cell", "cell-icon"));
                this.elements.push(new BboxElement("Constant", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var g = jqSvg.group({
                        transform: "translate(" + renderParams.layout.PositionX + ", " + renderParams.layout.PositionY + ")",
                    });
                    var data = "M27.3,43.4l-2.2-0.8c-12-4.4-19.3-11.5-20-19.7c0-0.5-0.1-0.9-0.1-1.4c-5.4-2.6-9-7.3-10.5-12.3c-0.6-2-0.9-4.1-0.8-6.3c-4.7-1.7-8.2-4.7-10.3-8.2c-2.1-3.4-3.2-8.1-2.1-13.4c-6.7-1.8-12.5-4.3-15.9-5.8l-7.4,19.9l26.7,7.9L-17,9.1l-32.8-9.7l11.9-32l3,1.5c3.9,1.9,10.8,4.9,18.1,6.9c1.9-4,5.1-8.1,10-12.1c10.8-8.9,19.7-8.1,23.8-3.4c3.5,4,3.6,11.6-4.2,18.7c-6.3,5.7-16.2,5.7-25.7,3.8c-0.6,3.2-0.2,6.2,1.4,8.9c1.3,2.2,3.4,4,6.3,5.3C-3.4-8.3,0.7-13.2,8-16c15.9-6.1,19.9,0.2,20.7,2.2c2.1,5.2-2.4,11.8-10.1,15C11.5,4.2,5.1,5-0.3,4.4C-0.2,5.5,0,6.5,0.3,7.5c0.9,3.2,3,6.1,6.2,8C8,12.1,11,9,15,6.7C25,1,32.2,1.6,35.7,4.2c2.3,1.7,3.3,4.3,2.7,7.1c-1.1,5.3-7.6,9.7-17.5,11.8c-3.6,0.8-6.8,0.8-9.7,0.4c1,4.9,6,9.5,13.9,12.8l7.4-10.7l17.4,10.1l-3,5.1l-12.6-7.4L27.3,43.4L27.3,43.4z M12.1,17.5c2.2,0.3,4.8,0.3,7.6-0.3c9.4-2,12.6-5.6,12.9-7.2c0.1-0.4,0-0.7-0.4-1c-1.4-1-6.2-1.7-14.1,2.9C15.2,13.4,13.2,15.4,12.1,17.5L12.1,17.5z M0.6-1.5C5-1,10.3-1.7,16.3-4.2c5.4-2.3,7.4-6,6.9-7.3c-0.4-1-4.3-2.2-13,1.1C5-8.5,2-5.1,0.6-1.5L0.6-1.5z M-10.8-22.8c7.8,1.4,15.2,1.3,19.5-2.6c4.7-4.2,5.4-8.4,3.7-10.4c-2.1-2.5-8.3-1.9-15.5,4.1C-6.5-28.9-9.1-25.9-10.8-22.8L-10.8-22.8z";
                    var path = jqSvg.createPath();
                    var variable = jqSvg.path(g, path, {
                        stroke: 'transparent',
                        fill: "#BBBDBF",
                        "stroke-width": 8,
                        d: data,
                        transform: "scale(0.36)"
                    });
                    if (that.labelVisibility === true) {
                        var offset = 0;
                        if (renderParams.model.Name !== "") {
                            var textLabel = jqSvg.text(g, 0, 0, renderParams.model.Name, {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                            offset += that.labelSize;
                        }
                        if (renderParams.valueText !== undefined) {
                            jqSvg.text(g, 0, 0, renderParams.valueText + "", {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize + offset) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                        }
                    }
                    /*
                    //Helper bounding box
                    jqSvg.rect(
                        renderParams.layout.PositionX - that.variableWidthConstant / 2,
                        renderParams.layout.PositionY - that.variableHeightConstant / 2,
                        that.variableWidthConstant,
                        that.variableHeightConstant,
                        0,
                        0,
                        { stroke: "red", fill: "none" });
                    */
                    $(variable).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-element-hover')");
                    $(variable).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-element-hover')");
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    return pointerX > elementX - that.variableWidthConstant / 2 && pointerX < elementX + that.variableWidthConstant / 2 &&
                        pointerY > elementY - that.variableHeightConstant / 2 && pointerY < elementY + that.variableHeightConstant / 2;
                }, function (elementX, elementY) {
                    return { x: elementX - that.variableWidthConstant / 2, y: elementY - that.variableHeightConstant / 2, width: that.variableWidthConstant, height: that.variableHeightConstant };
                }, "Extracellular Protein", "constant-icon"));
                this.elements.push(new BboxElement("Default", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var g = jqSvg.group({
                        transform: "translate(" + renderParams.layout.PositionX + ", " + renderParams.layout.PositionY + ")",
                    });
                    var data = "M27.3,43.4l-2.2-0.8c-12-4.4-19.3-11.5-20-19.7c0-0.5-0.1-0.9-0.1-1.4c-5.4-2.6-9-7.3-10.5-12.3c-0.6-2-0.9-4.1-0.8-6.3c-4.7-1.7-8.2-4.7-10.3-8.2c-2.1-3.4-3.2-8.1-2.1-13.4c-6.7-1.8-12.5-4.3-15.9-5.8l-7.4,19.9l26.7,7.9L-17,9.1l-32.8-9.7l11.9-32l3,1.5c3.9,1.9,10.8,4.9,18.1,6.9c1.9-4,5.1-8.1,10-12.1c10.8-8.9,19.7-8.1,23.8-3.4c3.5,4,3.6,11.6-4.2,18.7c-6.3,5.7-16.2,5.7-25.7,3.8c-0.6,3.2-0.2,6.2,1.4,8.9c1.3,2.2,3.4,4,6.3,5.3C-3.4-8.3,0.7-13.2,8-16c15.9-6.1,19.9,0.2,20.7,2.2c2.1,5.2-2.4,11.8-10.1,15C11.5,4.2,5.1,5-0.3,4.4C-0.2,5.5,0,6.5,0.3,7.5c0.9,3.2,3,6.1,6.2,8C8,12.1,11,9,15,6.7C25,1,32.2,1.6,35.7,4.2c2.3,1.7,3.3,4.3,2.7,7.1c-1.1,5.3-7.6,9.7-17.5,11.8c-3.6,0.8-6.8,0.8-9.7,0.4c1,4.9,6,9.5,13.9,12.8l7.4-10.7l17.4,10.1l-3,5.1l-12.6-7.4L27.3,43.4L27.3,43.4z M12.1,17.5c2.2,0.3,4.8,0.3,7.6-0.3c9.4-2,12.6-5.6,12.9-7.2c0.1-0.4,0-0.7-0.4-1c-1.4-1-6.2-1.7-14.1,2.9C15.2,13.4,13.2,15.4,12.1,17.5L12.1,17.5z M0.6-1.5C5-1,10.3-1.7,16.3-4.2c5.4-2.3,7.4-6,6.9-7.3c-0.4-1-4.3-2.2-13,1.1C5-8.5,2-5.1,0.6-1.5L0.6-1.5z M-10.8-22.8c7.8,1.4,15.2,1.3,19.5-2.6c4.7-4.2,5.4-8.4,3.7-10.4c-2.1-2.5-8.3-1.9-15.5,4.1C-6.5-28.9-9.1-25.9-10.8-22.8L-10.8-22.8z";
                    var path = jqSvg.createPath();
                    var variable = jqSvg.path(g, path, {
                        stroke: 'transparent',
                        fill: "#EF4137",
                        strokeWidth: 8,
                        d: data,
                        transform: "scale(0.25)"
                    });
                    if (that.labelVisibility === true) {
                        var offset = 0;
                        if (renderParams.model.Name !== "") {
                            var textLabel = jqSvg.text(g, 0, 0, renderParams.model.Name, {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                            offset += that.labelSize;
                        }
                        if (renderParams.valueText !== undefined) {
                            jqSvg.text(g, 0, 0, renderParams.valueText + "", {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize + offset) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                        }
                    }
                    $(variable).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-element-hover')");
                    $(variable).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-element-hover')");
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    return pointerX > elementX - that.variableWidthConstant / 2 && pointerX < elementX + that.variableWidthConstant / 2 &&
                        pointerY > elementY - that.variableHeightConstant / 2 && pointerY < elementY + that.variableHeightConstant / 2;
                }, function (elementX, elementY) {
                    return { x: elementX - that.variableWidthConstant / 2, y: elementY - that.variableHeightConstant / 2, width: that.variableWidthConstant, height: that.variableHeightConstant };
                }, "Intracellular Protein", "variable-icon"));
                this.elements.push(new BboxElement("MembraneReceptor", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var g = jqSvg.group({
                        transform: "translate(" + renderParams.layout.PositionX + ", " + renderParams.layout.PositionY + ")",
                    });
                    var containerX = (renderParams.gridCell.x + 0.5) * renderParams.grid.xStep + renderParams.grid.x0 + (renderParams.sizeCoef - 1) * renderParams.grid.xStep / 2;
                    var containerY = (renderParams.gridCell.y + 0.5) * renderParams.grid.yStep + renderParams.grid.y0 + (renderParams.sizeCoef - 1) * renderParams.grid.yStep / 2;
                    var v = {
                        x: renderParams.layout.PositionX - containerX,
                        y: renderParams.layout.PositionY - containerY
                    };
                    var len = Math.sqrt(v.x * v.x + v.y * v.y);
                    v.x = v.x / len;
                    v.y = v.y / len;
                    var acos = Math.acos(-v.y);
                    var angle = acos * v.x / Math.abs(v.x);
                    angle = angle * 180 / Math.PI;
                    if (angle < 0)
                        angle += 360;
                    var data = "M9.9-10.5c-1.4-1.9-2.3,0.1-5.1,0.8C2.6-9.2,2.4-13.2,0-13.2c-2.4,0-2.4,3.5-4.8,3.5c-2.4,0-3.8-2.7-5.2-0.8l8.2,11.8v12.1c0,1,0.8,1.7,1.7,1.7c1,0,1.7-0.8,1.7-1.7V1.3L9.9-10.5z";
                    var path = jqSvg.createPath();
                    var variable = jqSvg.path(g, path, {
                        stroke: 'transparent',
                        fill: "#3BB34A",
                        strokeWidth: 8,
                        d: data,
                        transform: "scale(1.2) rotate(" + angle + ")"
                    });
                    if (that.labelVisibility === true) {
                        var offset = 0;
                        if (renderParams.model.Name !== "") {
                            var textLabel = jqSvg.text(g, 0, 0, renderParams.model.Name, {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                            offset += that.labelSize;
                        }
                        if (renderParams.valueText !== undefined) {
                            jqSvg.text(g, 0, 0, renderParams.valueText + "", {
                                transform: "translate(" + -that.variableWidthConstant / 2 + ", " + (that.variableHeightConstant / 2 + that.labelSize + offset) + ")",
                                "font-size": that.labelSize,
                                "fill": renderParams.labelColor !== undefined ? renderParams.labelColor : "black"
                            });
                        }
                    }
                    /*
                    //Helper bounding box
                    jqSvg.rect(
                        renderParams.layout.PositionX - that.variableWidthConstant / 2,
                        renderParams.layout.PositionY - that.variableHeightConstant / 2,
                        that.variableWidthConstant,
                        that.variableHeightConstant,
                        0,
                        0,
                        { stroke: "red", fill: "none" });
                    */
                    $(variable).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-element-hover')");
                    $(variable).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-element-hover')");
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    return pointerX > elementX - that.variableWidthConstant / 2 && pointerX < elementX + that.variableWidthConstant / 2 &&
                        pointerY > elementY - that.variableHeightConstant / 2 && pointerY < elementY + that.variableHeightConstant / 2;
                }, function (elementX, elementY) {
                    return { x: elementX - that.variableWidthConstant / 2, y: elementY - that.variableHeightConstant / 2, width: that.variableWidthConstant, height: that.variableHeightConstant };
                }, "Membrane Receptor", "receptor-icon"));
                this.elements.push(new Element("Activator", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var lineRef = undefined;
                    var lw = that.lineWidth === 0 ? 1 : that.lineWidth > 0 ? that.lineWidth : 1 / Math.abs(that.lineWidth);
                    if (renderParams.layout.start.Id === renderParams.layout.end.Id) {
                        var x0 = renderParams.layout.start.PositionX;
                        var y0 = renderParams.layout.start.PositionY;
                        var w = that.variableWidthConstant * 0.7;
                        var h = that.variableHeightConstant * 0.7;
                        var ew = w * 0.6;
                        var eh = h * 1.6;
                        var x1 = ew * (1 - Math.sqrt(1 - h * h / (eh * eh))) + x0;
                        var path = jqSvg.createPath();
                        lineRef = jqSvg.path(path.move(x1, y0 - h)
                            .arc(ew, eh, 0, true, true, x1, y0 + h), { fill: 'none', stroke: '#808080', strokeWidth: lw + 1, "marker-end": "url(#Activator)" });
                    }
                    else {
                        var dir = {
                            x: renderParams.layout.end.PositionX - renderParams.layout.start.PositionX,
                            y: renderParams.layout.end.PositionY - renderParams.layout.start.PositionY
                        };
                        var dirLen = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                        dir.x /= dirLen;
                        dir.y /= dirLen;
                        var isRevers = dirLen / 2 < Math.sqrt(dir.x * dir.x * that.relationshipBboxOffset * that.relationshipBboxOffset + dir.y * dir.y * that.relationshipBboxOffset * that.relationshipBboxOffset);
                        var start = {
                            x: renderParams.layout.start.PositionX + dir.x * that.relationshipBboxOffset,
                            y: renderParams.layout.start.PositionY + dir.y * that.relationshipBboxOffset
                        };
                        var end = {
                            x: renderParams.layout.end.PositionX - dir.x * that.relationshipBboxOffset,
                            y: renderParams.layout.end.PositionY - dir.y * that.relationshipBboxOffset
                        };
                        if (!isRevers) {
                            lineRef = jqSvg.line(start.x, start.y, end.x, end.y, { stroke: "#808080", strokeWidth: lw + 1, "marker-end": "url(#Activator)" });
                        }
                        else {
                            lineRef = jqSvg.line(end.x, end.y, start.x, start.y, { stroke: "#808080", strokeWidth: lw + 1, "marker-end": "url(#Activator)" });
                        }
                    }
                    if (lineRef !== undefined) {
                        $(lineRef).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-line-hover')");
                        $(lineRef).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-line-hover')");
                    }
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    if (elementX.x !== elementY.x || elementX.y !== elementY.y) {
                        var dot1 = (pointerX - elementX.x) * (elementY.x - elementX.x) + (pointerY - elementX.y) * (elementY.y - elementX.y);
                        if (dot1 < 0) {
                            return Math.sqrt(Math.pow(elementX.y - pointerY, 2) + Math.pow(elementX.x - pointerX, 2)) < elementX.pixelWidth;
                        }
                        var dot2 = Math.pow(elementY.y - elementX.y, 2) + Math.pow(elementY.x - elementX.x, 2);
                        if (dot2 <= dot1) {
                            return Math.sqrt(Math.pow(elementY.y - pointerY, 2) + Math.pow(elementY.x - pointerX, 2)) < elementX.pixelWidth;
                        }
                        var d = Math.abs((elementY.y - elementX.y) * pointerX - (elementY.x - elementX.x) * pointerY + elementY.x * elementX.y - elementX.x * elementY.y);
                        d /= Math.sqrt(Math.pow(elementY.y - elementX.y, 2) + Math.pow(elementY.x - elementX.x, 2));
                        return d < elementX.pixelWidth;
                    }
                    else {
                        var x0 = elementX.x;
                        var y0 = elementX.y;
                        var w = that.variableWidthConstant * 0.7 * 0.6;
                        var h = that.variableHeightConstant * 0.7 * 1.6;
                        var ellipseX = x0 + w;
                        var ellipseY = y0;
                        var points = BMA.SVGHelper.GeEllipsePoints(ellipseX, ellipseY, w, h, pointerX, pointerY);
                        var len1 = Math.sqrt(Math.pow(points[0].x - pointerX, 2) + Math.pow(points[0].y - pointerY, 2));
                        var len2 = Math.sqrt(Math.pow(points[1].x - pointerX, 2) + Math.pow(points[1].y - pointerY, 2));
                        //console.log(len1 + ", " + len2);
                        return len1 < elementX.pixelWidth || len2 < elementX.pixelWidth;
                    }
                }, "Activating Relationship", "activate-icon"));
                this.elements.push(new Element("Inhibitor", function (renderParams) {
                    var jqSvg = that.svg;
                    if (jqSvg === undefined)
                        return undefined;
                    jqSvg.clear();
                    var lineRef = undefined;
                    var lw = that.lineWidth === 0 ? 1 : that.lineWidth > 0 ? that.lineWidth : 1 / Math.abs(that.lineWidth);
                    if (renderParams.layout.start.Id === renderParams.layout.end.Id) {
                        var x0 = renderParams.layout.start.PositionX;
                        var y0 = renderParams.layout.start.PositionY;
                        var w = that.variableWidthConstant * 0.7;
                        var h = that.variableHeightConstant * 0.7;
                        var ew = w * 0.6;
                        var eh = h * 1.6;
                        var x1 = ew * (1 - Math.sqrt(1 - h * h / (eh * eh))) + x0;
                        var path = jqSvg.createPath();
                        lineRef = jqSvg.path(path.move(x1, y0 - h)
                            .arc(ew, eh, 0, true, true, x1, y0 + h), { fill: 'none', stroke: '#808080', strokeWidth: lw + 1, "marker-end": "url(#Inhibitor)" });
                    }
                    else {
                        var dir = {
                            x: renderParams.layout.end.PositionX - renderParams.layout.start.PositionX,
                            y: renderParams.layout.end.PositionY - renderParams.layout.start.PositionY
                        };
                        var dirLen = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                        dir.x /= dirLen;
                        dir.y /= dirLen;
                        var isRevers = dirLen / 2 < Math.sqrt(dir.x * dir.x * that.relationshipBboxOffset * that.relationshipBboxOffset + dir.y * dir.y * that.relationshipBboxOffset * that.relationshipBboxOffset);
                        var start = {
                            x: renderParams.layout.start.PositionX + dir.x * that.relationshipBboxOffset,
                            y: renderParams.layout.start.PositionY + dir.y * that.relationshipBboxOffset
                        };
                        var end = {
                            x: renderParams.layout.end.PositionX - dir.x * that.relationshipBboxOffset,
                            y: renderParams.layout.end.PositionY - dir.y * that.relationshipBboxOffset
                        };
                        if (!isRevers) {
                            lineRef = jqSvg.line(start.x, start.y, end.x, end.y, { stroke: "#808080", strokeWidth: lw + 1, "marker-end": "url(#Inhibitor)" });
                        }
                        else {
                            lineRef = jqSvg.line(end.x, end.y, start.x, start.y, { stroke: "#808080", strokeWidth: lw + 1, "marker-end": "url(#Inhibitor)" });
                        }
                    }
                    if (lineRef !== undefined) {
                        $(lineRef).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-line-hover')");
                        $(lineRef).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-line-hover')");
                    }
                    var svgElem = $(jqSvg.toSVG()).children();
                    return svgElem;
                }, function (pointerX, pointerY, elementX, elementY) {
                    if (elementX.x !== elementY.x || elementX.y !== elementY.y) {
                        var dot1 = (pointerX - elementX.x) * (elementY.x - elementX.x) + (pointerY - elementX.y) * (elementY.y - elementX.y);
                        if (dot1 < 0) {
                            return Math.sqrt(Math.pow(elementX.y - pointerY, 2) + Math.pow(elementX.x - pointerX, 2)) < elementX.pixelWidth;
                        }
                        var dot2 = Math.pow(elementY.y - elementX.y, 2) + Math.pow(elementY.x - elementX.x, 2);
                        if (dot2 <= dot1) {
                            return Math.sqrt(Math.pow(elementY.y - pointerY, 2) + Math.pow(elementY.x - pointerX, 2)) < elementX.pixelWidth;
                        }
                        var d = Math.abs((elementY.y - elementX.y) * pointerX - (elementY.x - elementX.x) * pointerY + elementY.x * elementX.y - elementX.x * elementY.y);
                        d /= Math.sqrt(Math.pow(elementY.y - elementX.y, 2) + Math.pow(elementY.x - elementX.x, 2));
                        return d < elementX.pixelWidth;
                    }
                    else {
                        var x0 = elementX.x;
                        var y0 = elementX.y;
                        var w = that.variableWidthConstant * 0.7 * 0.6;
                        var h = that.variableHeightConstant * 0.7 * 1.6;
                        var ellipseX = x0 + w;
                        var ellipseY = y0;
                        var points = BMA.SVGHelper.GeEllipsePoints(ellipseX, ellipseY, w, h, pointerX, pointerY);
                        var len1 = Math.sqrt(Math.pow(points[0].x - pointerX, 2) + Math.pow(points[0].y - pointerY, 2));
                        var len2 = Math.sqrt(Math.pow(points[1].x - pointerX, 2) + Math.pow(points[1].y - pointerY, 2));
                        //console.log(len1 + ", " + len2);
                        return len1 < elementX.pixelWidth || len2 < elementX.pixelWidth;
                    }
                }, "Inhibiting Relationship", "inhibit-icon"));
            }
            Object.defineProperty(ElementsRegistry.prototype, "LineWidth", {
                get: function () {
                    return this.lineWidth;
                },
                set: function (value) {
                    this.lineWidth = value;
                    //console.log(this.lineWidth);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ElementsRegistry.prototype, "LabelSize", {
                get: function () {
                    return this.labelSize;
                },
                set: function (value) {
                    this.labelSize = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ElementsRegistry.prototype, "LabelVisibility", {
                get: function () {
                    return this.labelVisibility;
                },
                set: function (value) {
                    this.labelVisibility = value;
                },
                enumerable: true,
                configurable: true
            });
            ElementsRegistry.prototype.CreateSvgElement = function (type, renderParams) {
                var elem = document.createElementNS("http://www.w3.org/2000/svg", type);
                var transform = "";
                if (renderParams.x != 0 || renderParams.y != 0)
                    transform += "translate(" + renderParams.x + "," + renderParams.y + ")";
                if (renderParams.scale !== undefined && renderParams.scale != 1.0)
                    transform += "scale(" + renderParams.scale + "," + renderParams.scale + ")";
                if (transform.length > 0)
                    elem.setAttribute("transform", transform);
                return elem;
            };
            ElementsRegistry.prototype.CreateSvgPath = function (data, color, x, y, scale) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                if (scale === void 0) { scale = 1.0; }
                var elem = this.CreateSvgElement("path", { x: x, y: y, scale: scale });
                elem.setAttribute("d", data);
                elem.setAttribute("fill", color);
                return elem;
            };
            Object.defineProperty(ElementsRegistry.prototype, "Elements", {
                get: function () {
                    return this.elements;
                },
                enumerable: true,
                configurable: true
            });
            ElementsRegistry.prototype.GetElementByType = function (type) {
                for (var i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].Type === type)
                        return this.elements[i];
                }
                throw "the is no element for specified type";
            };
            return ElementsRegistry;
        })();
        Elements.ElementsRegistry = ElementsRegistry;
    })(Elements = BMA.Elements || (BMA.Elements = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=elementsregistry.js.map
var BMA;
(function (BMA) {
    var Functions;
    (function (Functions) {
        var BMAFunction = (function () {
            function BMAFunction(name, head, about, inserttext, offset) {
                this.name = name;
                this.head = head;
                this.about = about;
                this.inserttext = inserttext;
                this.offset = offset;
            }
            Object.defineProperty(BMAFunction.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAFunction.prototype, "Head", {
                get: function () {
                    return this.head;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAFunction.prototype, "About", {
                get: function () {
                    return this.about;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAFunction.prototype, "InsertText", {
                get: function () {
                    return this.inserttext;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAFunction.prototype, "Offset", {
                get: function () {
                    return this.offset;
                },
                enumerable: true,
                configurable: true
            });
            return BMAFunction;
        })();
        Functions.BMAFunction = BMAFunction;
        var FunctionsRegistry = (function () {
            function FunctionsRegistry() {
                var that = this;
                this.functions = [];
                this.functions.push(new BMAFunction("VAR", "var(name)", "A variable, where name is the name of the variable", "var()", 4));
                this.functions.push(new BMAFunction("POS", "pos(name)", "", "pos()", 4));
                this.functions.push(new BMAFunction("NEG", "neg(name)", "", "neg()", 4));
                this.functions.push(new BMAFunction("AVG", "avg(x,y,z)", "The average of a list of expressions. E.g., avg( var(X); var(Y); 22; var(Z)*2 )", "avg(,)", 4));
                this.functions.push(new BMAFunction("MIN", "min(x,y)", "The minimum of a two expressions. E.g., min( var(X), var(Y)), or min(var(X), 0)", "min(,)", 4));
                this.functions.push(new BMAFunction("MAX", "max(x,y)", "The maximum of a two expressions. E.g., max( var(X), var(Y))", "max(,)", 4));
                this.functions.push(new BMAFunction("CONST", "22 or const(22)", "An integer number. E.g., 1234, 42, -9", "const()", 6));
                this.functions.push(new BMAFunction("+", "x + y", "Usual addition operator. E.g., 2+3, 44 + var(X)", " + ", 3));
                this.functions.push(new BMAFunction("-", "x - y", "Usual addition operator. E.g., 2-3, 44 - var(X)", " - ", 3));
                this.functions.push(new BMAFunction("*", "x * y", "Usual addition operator. E.g., 2*3, 44 * var(X)", " * ", 3));
                this.functions.push(new BMAFunction("/", "x / y", "Usual addition operator. E.g., 2/3, 44 / var(X)", " / ", 3));
                this.functions.push(new BMAFunction("CEIL", "ceil(x)", "The ceiling of an expression. E.g., ceil (var(X))", "ceil()", 5));
                this.functions.push(new BMAFunction("FLOOR", "floor(x)", "The floor of an expression. E.g., floor(var(X))", "floor()", 6));
            }
            Object.defineProperty(FunctionsRegistry.prototype, "Functions", {
                get: function () {
                    return this.functions;
                },
                enumerable: true,
                configurable: true
            });
            FunctionsRegistry.prototype.GetFunctionByName = function (name) {
                for (var i = 0; i < this.functions.length; i++) {
                    if (this.functions[i].Name === name)
                        return this.functions[i];
                }
                throw "There is no function as you want";
            };
            return FunctionsRegistry;
        })();
        Functions.FunctionsRegistry = FunctionsRegistry;
    })(Functions = BMA.Functions || (BMA.Functions = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=functionsregistry.js.map
var BMA;
(function (BMA) {
    var Keyframes;
    (function (Keyframes) {
        var BMAKeyframe = (function () {
            function BMAKeyframe(name, icon, toolType) {
                this.name = name;
                this.icon = icon;
                this.toolType = toolType;
            }
            Object.defineProperty(BMAKeyframe.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAKeyframe.prototype, "Icon", {
                get: function () {
                    return this.icon;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BMAKeyframe.prototype, "ToolType", {
                get: function () {
                    return this.toolType;
                },
                enumerable: true,
                configurable: true
            });
            return BMAKeyframe;
        })();
        Keyframes.BMAKeyframe = BMAKeyframe;
        var KeyframesRegistry = (function () {
            function KeyframesRegistry(imagePath) {
                if (imagePath === void 0) { imagePath = "images"; }
                this.imagePath = "images";
                var that = this;
                this.keyframes = [];
                this.imagePath = imagePath;
                this.keyframes.push(new BMAKeyframe("var", this.imagePath + "/LTL-state-tool-var.svg", "variable"));
                this.keyframes.push(new BMAKeyframe("equal", this.imagePath + "/LTL-state-tool-equ.svg", "operator"));
                this.keyframes.push(new BMAKeyframe("more", this.imagePath + "/LTL-state-tool-gre.svg", "operator"));
                this.keyframes.push(new BMAKeyframe("less", this.imagePath + "/LTL-state-tool-les.svg", "operator"));
                this.keyframes.push(new BMAKeyframe("moeq", this.imagePath + "/LTL-state-tool-greq.svg", "operator"));
                this.keyframes.push(new BMAKeyframe("leeq", this.imagePath + "/LTL-state-tool-lesq.svg", "operator"));
                this.keyframes.push(new BMAKeyframe("num", this.imagePath + "/LTL-state-tool-num.svg", "const"));
            }
            Object.defineProperty(KeyframesRegistry.prototype, "Keyframes", {
                get: function () {
                    return this.keyframes;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(KeyframesRegistry.prototype, "ImagePath", {
                get: function () {
                    return this.imagePath;
                },
                set: function (value) {
                    this.imagePath = value;
                },
                enumerable: true,
                configurable: true
            });
            KeyframesRegistry.prototype.GetFunctionByName = function (name) {
                for (var i = 0; i < this.keyframes.length; i++) {
                    if (this.keyframes[i].Name === name)
                        return this.keyframes[i];
                }
                throw "There is no keyframe as you want";
            };
            return KeyframesRegistry;
        })();
        Keyframes.KeyframesRegistry = KeyframesRegistry;
    })(Keyframes = BMA.Keyframes || (BMA.Keyframes = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=keyframesregistry.js.map
var BMA;
(function (BMA) {
    var LocalRepositoryTool = (function () {
        function LocalRepositoryTool(messagebox) {
            this.messagebox = messagebox;
        }
        LocalRepositoryTool.prototype.IsInRepo = function (id) {
            return window.localStorage.getItem(id) !== null;
        };
        LocalRepositoryTool.prototype.Save = function (key, appModel) {
            try {
                window.localStorage.setItem(key, appModel);
                window.Commands.Execute("LocalStorageChanged", {});
            }
            catch (e) {
                if (e === 'QUOTA_EXCEEDED_ERR') {
                    this.messagebox.Show("Error: Local repository is full");
                }
            }
        };
        LocalRepositoryTool.prototype.ParseItem = function (item) {
            try {
                var ml = JSON.parse(item);
                BMA.Model.ImportModelAndLayout(ml);
                return true;
            }
            catch (e) {
                return false;
            }
        };
        LocalRepositoryTool.prototype.SaveModel = function (id, model) {
            if (window.localStorage.getItem(id) !== null) {
                if (confirm("Overwrite the file?"))
                    this.Save("user." + id, JSON.stringify(model));
            }
            else
                this.Save("user." + id, JSON.stringify(model));
        };
        LocalRepositoryTool.prototype.RemoveModel = function (id) {
            window.localStorage.removeItem(id);
            window.Commands.Execute("LocalStorageChanged", {});
        };
        LocalRepositoryTool.prototype.LoadModel = function (id) {
            var model = window.localStorage.getItem(id);
            if (model !== null) {
                try {
                    var app = new BMA.Model.AppModel();
                    app.Deserialize(model);
                    return JSON.parse(app.Serialize());
                }
                catch (ex) {
                    alert(ex);
                }
            }
            else
                return null;
        };
        LocalRepositoryTool.prototype.GetModelList = function () {
            var keys = [];
            for (var i = 0; i < window.localStorage.length; i++) {
                var key = window.localStorage.key(i);
                var usrkey = this.IsUserKey(key);
                if (usrkey !== undefined) {
                    var item = window.localStorage.getItem(key);
                    if (this.ParseItem(item)) {
                        keys.push(usrkey);
                    }
                }
            }
            return keys;
        };
        LocalRepositoryTool.prototype.IsUserKey = function (key) {
            var sp = key.split('.');
            if (sp[0] === "user") {
                var q = sp[1];
                for (var i = 2; i < sp.length; i++) {
                    q = q.concat('.');
                    q = q.concat(sp[i]);
                }
                return q;
            }
            else
                return undefined;
        };
        return LocalRepositoryTool;
    })();
    BMA.LocalRepositoryTool = LocalRepositoryTool;
})(BMA || (BMA = {}));
//# sourceMappingURL=localRepository.js.map
var BMA;
(function (BMA) {
    var ChangesChecker = (function () {
        function ChangesChecker() {
            this.currentModel = new BMA.Model.AppModel();
        }
        ChangesChecker.prototype.Snapshot = function (model) {
            this.currentModel.Deserialize(model.Serialize());
        };
        ChangesChecker.prototype.IsChanged = function (model) {
            return this.currentModel.Serialize() !== model.Serialize();
        };
        return ChangesChecker;
    })();
    BMA.ChangesChecker = ChangesChecker;
})(BMA || (BMA = {}));
//# sourceMappingURL=changeschecker.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
var BMA;
(function (BMA) {
    var Model;
    (function (Model) {
        var BioModel = (function () {
            function BioModel(name, variables, relationships) {
                this.name = name;
                this.variables = variables;
                this.relationships = relationships;
            }
            Object.defineProperty(BioModel.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                set: function (value) {
                    this.name = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BioModel.prototype, "Variables", {
                get: function () {
                    return this.variables.slice(0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BioModel.prototype, "Relationships", {
                get: function () {
                    return this.relationships.slice(0);
                },
                enumerable: true,
                configurable: true
            });
            BioModel.prototype.Clone = function () {
                return new BioModel(this.Name, this.variables.slice(0), this.relationships.slice(0));
            };
            BioModel.prototype.SetVariableProperties = function (id, name, rangeFrom, rangeTo, formula) {
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Id === id) {
                        this.variables[i] = new BMA.Model.Variable(this.variables[i].Id, this.variables[i].ContainerId, this.variables[i].Type, name === undefined ? this.variables[i].Name : name, isNaN(rangeFrom) ? this.variables[i].RangeFrom : rangeFrom, isNaN(rangeTo) ? this.variables[i].RangeTo : rangeTo, formula === undefined ? this.variables[i].Formula : formula);
                        return;
                    }
                }
            };
            BioModel.prototype.GetVariableById = function (id) {
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Id === id) {
                        return this.variables[i];
                    }
                }
                return undefined;
            };
            BioModel.prototype.GetIdByName = function (name) {
                var res = [];
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Name === name) {
                        res.push(this.variables[i].Id.toString());
                    }
                }
                return res;
            };
            BioModel.prototype.GetJSON = function () {
                var vars = [];
                for (var i = 0; i < this.variables.length; i++) {
                    vars.push(this.variables[i].GetJSON());
                }
                var rels = [];
                for (var i = 0; i < this.relationships.length; i++) {
                    rels.push(this.relationships[i].GetJSON());
                }
                return {
                    ModelName: this.name,
                    Engine: "VMCAI",
                    Variables: vars,
                    Relationships: rels
                };
            };
            return BioModel;
        })();
        Model.BioModel = BioModel;
        var VariableTypes = (function () {
            function VariableTypes() {
            }
            Object.defineProperty(VariableTypes, "Default", {
                get: function () { return "Default"; } // Intracellular
                ,
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableTypes, "Constant", {
                get: function () { return "Constant"; } // Extracellular
                ,
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableTypes, "MembraneReceptor", {
                get: function () { return "MembraneReceptor"; },
                enumerable: true,
                configurable: true
            });
            return VariableTypes;
        })();
        Model.VariableTypes = VariableTypes;
        var Variable = (function () {
            function Variable(id, containerId, type, name, rangeFrom, rangeTo, formula) {
                this.id = id;
                this.containerId = containerId;
                this.type = type;
                this.rangeFrom = rangeFrom;
                this.rangeTo = rangeTo;
                this.formula = formula;
                this.name = name;
            }
            Object.defineProperty(Variable.prototype, "Id", {
                get: function () {
                    return this.id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "ContainerId", {
                get: function () {
                    return this.containerId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "Type", {
                get: function () {
                    return this.type;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "RangeFrom", {
                get: function () {
                    return this.rangeFrom;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "RangeTo", {
                get: function () {
                    return this.rangeTo;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "Formula", {
                get: function () {
                    return this.formula;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Variable.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                enumerable: true,
                configurable: true
            });
            Variable.prototype.GetJSON = function () {
                return {
                    Id: this.id,
                    Name: this.name,
                    RangeFrom: this.rangeFrom,
                    RangeTo: this.rangeTo,
                    formula: this.formula
                };
            };
            return Variable;
        })();
        Model.Variable = Variable;
        var RelationshipTypes = (function () {
            function RelationshipTypes() {
            }
            Object.defineProperty(RelationshipTypes, "Activator", {
                get: function () { return "Activator"; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RelationshipTypes, "Inhibitor", {
                get: function () { return "Inhibitor"; },
                enumerable: true,
                configurable: true
            });
            return RelationshipTypes;
        })();
        Model.RelationshipTypes = RelationshipTypes;
        var Relationship = (function () {
            function Relationship(id, fromVariableId, toVariableId, type) {
                this.id = id;
                this.fromVariableId = fromVariableId;
                this.toVariableId = toVariableId;
                this.type = type;
            }
            Object.defineProperty(Relationship.prototype, "Id", {
                get: function () {
                    return this.id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Relationship.prototype, "FromVariableId", {
                get: function () {
                    return this.fromVariableId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Relationship.prototype, "ToVariableId", {
                get: function () {
                    return this.toVariableId;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Relationship.prototype, "Type", {
                get: function () {
                    return this.type;
                },
                enumerable: true,
                configurable: true
            });
            Relationship.prototype.GetJSON = function () {
                return {
                    Id: this.id,
                    FromVariableId: this.fromVariableId,
                    ToVariableId: this.toVariableId,
                    Type: this.type
                };
            };
            return Relationship;
        })();
        Model.Relationship = Relationship;
        var Layout = (function () {
            function Layout(containers, varialbes) {
                this.containers = containers;
                this.variables = varialbes;
            }
            Object.defineProperty(Layout.prototype, "Containers", {
                get: function () {
                    return this.containers.slice(0);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Layout.prototype, "Variables", {
                get: function () {
                    return this.variables.slice(0);
                },
                enumerable: true,
                configurable: true
            });
            Layout.prototype.Clone = function () {
                return new Layout(this.containers.slice(0), this.variables.slice(0));
            };
            Layout.prototype.GetVariableById = function (id) {
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Id === id) {
                        return this.variables[i];
                    }
                }
                return undefined;
            };
            Layout.prototype.GetContainerById = function (id) {
                for (var i = 0; i < this.containers.length; i++) {
                    if (this.containers[i].Id === id) {
                        return this.containers[i];
                    }
                }
                return undefined;
            };
            return Layout;
        })();
        Model.Layout = Layout;
        var ContainerLayout = (function () {
            function ContainerLayout(id, name, size, positionX, positionY) {
                this.id = id;
                this.name = name;
                this.size = size;
                this.positionX = positionX;
                this.positionY = positionY;
            }
            Object.defineProperty(ContainerLayout.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                set: function (value) {
                    this.name = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ContainerLayout.prototype, "Id", {
                get: function () {
                    return this.id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ContainerLayout.prototype, "Size", {
                get: function () {
                    return this.size;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ContainerLayout.prototype, "PositionX", {
                get: function () {
                    return this.positionX;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ContainerLayout.prototype, "PositionY", {
                get: function () {
                    return this.positionY;
                },
                enumerable: true,
                configurable: true
            });
            return ContainerLayout;
        })();
        Model.ContainerLayout = ContainerLayout;
        var VariableLayout = (function () {
            function VariableLayout(id, positionX, positionY, cellX, cellY, angle) {
                this.id = id;
                this.positionX = positionX;
                this.positionY = positionY;
                this.cellX = cellX;
                this.cellY = cellY;
                this.angle = angle;
            }
            Object.defineProperty(VariableLayout.prototype, "Id", {
                get: function () {
                    return this.id;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableLayout.prototype, "PositionX", {
                get: function () {
                    return this.positionX;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableLayout.prototype, "PositionY", {
                get: function () {
                    return this.positionY;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableLayout.prototype, "CellX", {
                get: function () {
                    return this.cellX;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableLayout.prototype, "CellY", {
                get: function () {
                    return this.cellY;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VariableLayout.prototype, "Angle", {
                get: function () {
                    return this.angle;
                },
                enumerable: true,
                configurable: true
            });
            return VariableLayout;
        })();
        Model.VariableLayout = VariableLayout;
    })(Model = BMA.Model || (BMA.Model = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=biomodel.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
var BMA;
(function (BMA) {
    var Model;
    (function (Model) {
        var AppModel = (function () {
            function AppModel() {
                this.proofResult = undefined;
                this.states = [];
                this.operations = [];
                this.model = new BMA.Model.BioModel("model 1", [], []);
                this.layout = new BMA.Model.Layout([], []);
                this.states = [];
            }
            Object.defineProperty(AppModel.prototype, "BioModel", {
                get: function () {
                    return this.model;
                },
                set: function (value) {
                    this.model = value;
                    window.Commands.Execute("AppModelChanged", {});
                    //TODO: update inner components (analytics)
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppModel.prototype, "Layout", {
                get: function () {
                    return this.layout;
                },
                set: function (value) {
                    this.layout = value;
                    //TODO: update inner components (analytics)
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppModel.prototype, "States", {
                get: function () {
                    return this.states;
                },
                set: function (value) {
                    this.states = value;
                    //TODO: update inner components (ltl)
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppModel.prototype, "Operations", {
                get: function () {
                    return this.operations;
                },
                set: function (value) {
                    this.operations = value;
                    //TODO: update inner components (ltl)
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppModel.prototype, "ProofResult", {
                get: function () {
                    return this.proofResult;
                },
                set: function (value) {
                    this.proofResult = value;
                },
                enumerable: true,
                configurable: true
            });
            AppModel.prototype.DeserializeLegacyJSON = function (serializedModel) {
                if (serializedModel !== undefined && serializedModel !== null) {
                    var ml = JSON.parse(serializedModel);
                    //TODO: verify model
                    if (ml === undefined || ml.model === undefined || ml.layout === undefined ||
                        ml.model.variables === undefined ||
                        ml.layout.variables === undefined ||
                        ml.model.variables.length !== ml.layout.variables.length ||
                        ml.layout.containers === undefined ||
                        ml.model.relationships === undefined) {
                        console.log("Invalid model");
                        return;
                    }
                    var variables = [];
                    for (var i = 0; i < ml.model.variables.length; i++) {
                        variables.push(new BMA.Model.Variable(ml.model.variables[i].id, ml.model.variables[i].containerId, ml.model.variables[i].type, ml.model.variables[i].name, ml.model.variables[i].rangeFrom, ml.model.variables[i].rangeTo, ml.model.variables[i].formula));
                    }
                    var variableLayouts = [];
                    for (var i = 0; i < ml.layout.variables.length; i++) {
                        variableLayouts.push(new BMA.Model.VariableLayout(ml.layout.variables[i].id, ml.layout.variables[i].positionX, ml.layout.variables[i].positionY, ml.layout.variables[i].cellX, ml.layout.variables[i].cellY, ml.layout.variables[i].angle));
                    }
                    var relationships = [];
                    for (var i = 0; i < ml.model.relationships.length; i++) {
                        relationships.push(new BMA.Model.Relationship(ml.model.relationships[i].id, ml.model.relationships[i].fromVariableId, ml.model.relationships[i].toVariableId, ml.model.relationships[i].type));
                    }
                    var containers = [];
                    for (var i = 0; i < ml.layout.containers.length; i++) {
                        containers.push(new BMA.Model.ContainerLayout(ml.layout.containers[i].id, ml.layout.containers[i].name, ml.layout.containers[i].size, ml.layout.containers[i].positionX, ml.layout.containers[i].positionY));
                    }
                    this.model = new BMA.Model.BioModel(ml.model.name, variables, relationships);
                    this.layout = new BMA.Model.Layout(containers, variableLayouts);
                }
                else {
                    this.model = new BMA.Model.BioModel("model 1", [], []);
                    this.layout = new BMA.Model.Layout([], []);
                }
                this.states = [];
                this.operations = [];
                this.proofResult = undefined;
                window.Commands.Execute("ModelReset", undefined);
            };
            AppModel.prototype.Deserialize = function (serializedModel) {
                if (serializedModel !== undefined && serializedModel !== null) {
                    var parsed = JSON.parse(serializedModel);
                    var imported = BMA.Model.ImportModelAndLayout(parsed);
                    this.model = imported.Model;
                    this.layout = imported.Layout;
                    if (parsed.ltl !== undefined) {
                        var ltl = BMA.Model.ImportLTLContents(parsed.ltl);
                        if (ltl.states !== undefined) {
                            this.states = ltl.states;
                        }
                        else {
                            this.states = [];
                        }
                        if (ltl.operations !== undefined) {
                            this.operations = ltl.operations;
                        }
                        else {
                            this.operations = [];
                        }
                    }
                    else {
                        this.states = [];
                        this.operations = [];
                    }
                }
                else {
                    this.model = new BMA.Model.BioModel("model 1", [], []);
                    this.layout = new BMA.Model.Layout([], []);
                    this.states = [];
                    this.operations = [];
                }
                this.proofResult = undefined;
                window.Commands.Execute("ModelReset", undefined);
            };
            AppModel.prototype.Reset = function (model, layout) {
                this.model = model;
                this.layout = layout;
                window.Commands.Execute("ModelReset", undefined);
            };
            AppModel.prototype.Serialize = function () {
                var exported = BMA.Model.ExportModelAndLayout(this.model, this.layout);
                var ltl = BMA.Model.ExportLTLContents(this.states, this.operations);
                exported.ltl = ltl;
                return JSON.stringify(exported);
            };
            return AppModel;
        })();
        Model.AppModel = AppModel;
    })(Model = BMA.Model || (BMA.Model = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=model.js.map
var BMA;
(function (BMA) {
    var Model;
    (function (Model) {
        var ProofResult = (function () {
            function ProofResult(isStable, time, ticks) {
                this.isStable = isStable;
                this.time = time;
                this.ticks = ticks;
            }
            Object.defineProperty(ProofResult.prototype, "IsStable", {
                get: function () {
                    return this.isStable;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ProofResult.prototype, "Time", {
                get: function () {
                    return this.time;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ProofResult.prototype, "Ticks", {
                get: function () {
                    return this.ticks;
                },
                enumerable: true,
                configurable: true
            });
            return ProofResult;
        })();
        Model.ProofResult = ProofResult;
    })(Model = BMA.Model || (BMA.Model = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=analytics.js.map
var BMA;
(function (BMA) {
    var Model;
    (function (Model) {
        var AppVisualSettings = (function () {
            function AppVisualSettings() {
                this.lineWidth = 10;
                this.textLabelSize = 10;
                this.gridVisibility = true;
                this.textLabelVisibility = true;
                this.iconsVisibility = true;
                this.iconsSize = 10;
            }
            Object.defineProperty(AppVisualSettings.prototype, "LineWidth", {
                get: function () {
                    return this.lineWidth;
                },
                set: function (lineWidth) {
                    this.lineWidth = lineWidth;
                    window.Commands.Execute("AppCommands.ChangeLineWidth", this.lineWidth);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppVisualSettings.prototype, "TextLabelSize", {
                get: function () {
                    return this.textLabelSize;
                },
                set: function (textLabelSize) {
                    this.textLabelSize = textLabelSize;
                    window.Commands.Execute("AppCommands.ChangeTextLabelSize", this.textLabelSize);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppVisualSettings.prototype, "GridVisibility", {
                get: function () {
                    return this.gridVisibility;
                },
                set: function (gridVisibility) {
                    this.gridVisibility = gridVisibility;
                    window.Commands.Execute("AppCommands.ToggleGridVisibility", this.gridVisibility);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppVisualSettings.prototype, "TextLabelVisibility", {
                get: function () {
                    return this.textLabelVisibility;
                },
                set: function (textLabelVisibility) {
                    this.textLabelVisibility = textLabelVisibility;
                    window.Commands.Execute("AppCommands.ToggleTextLabelVisibility", this.textLabelVisibility);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppVisualSettings.prototype, "IconsVisibility", {
                get: function () {
                    return this.iconsVisibility;
                },
                set: function (iconsVisibility) {
                    this.iconsVisibility = iconsVisibility;
                    window.Commands.Execute("AppCommands.ToggleIconsVisibility", this.iconsVisibility);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AppVisualSettings.prototype, "IconsSize", {
                get: function () {
                    return this.iconsSize;
                },
                set: function (iconsSize) {
                    this.iconsSize = iconsSize;
                    window.Commands.Execute("AppCommands.ChangeIconsSize", this.iconsSize);
                },
                enumerable: true,
                configurable: true
            });
            return AppVisualSettings;
        })();
        Model.AppVisualSettings = AppVisualSettings;
    })(Model = BMA.Model || (BMA.Model = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=visualsettings.js.map
var BMA;
(function (BMA) {
    var Model;
    (function (Model) {
        function MapVariableNames(f, mapper) {
            var namestory = {};
            if (f !== undefined && f != null) {
                f = f.trim();
                // Convert default function to null
                if (f.toLowerCase() == "avg(pos)-avg(neg)")
                    return null;
                // Replace variable names with IDs
                var varPrefix = "var(";
                var startPos = 0;
                var index;
                while ((index = f.indexOf(varPrefix, startPos)) >= 0) {
                    var endIndex = f.indexOf(")", index);
                    if (endIndex < 0)
                        break;
                    var varName = f.substring(index + varPrefix.length, endIndex);
                    namestory[varName] = (namestory[varName] === undefined) ? 0 : namestory[varName] + 1;
                    var map = mapper(varName);
                    var m = undefined;
                    if (map instanceof Array) {
                        var ind = namestory[varName];
                        if (ind > map.length - 1)
                            ind = map.length - 1;
                        m = map[ind];
                    }
                    else {
                        m = map;
                    }
                    f = f.substring(0, index + varPrefix.length) + m + f.substr(endIndex);
                    startPos = index + 1;
                }
            }
            return f;
        }
        Model.MapVariableNames = MapVariableNames;
        // Returns object whose JSON representation matches external format:
        // 1) Variables in formulas are identified by IDs
        // 2) Default function avg(pos)-avg(neg) is replaced with null formula
        function ExportBioModel(model) {
            function GetIdByName(id, name) {
                var results = model.Variables.filter(function (v2) {
                    return v2.Name == name &&
                        model.Relationships.some(function (r) {
                            return r.ToVariableId == id && r.FromVariableId == v2.Id;
                            // || r.FromVariableId == id && r.ToVariableId == v2.Id
                        });
                });
                if (results.length == 0) {
                    var varName = "unnamed";
                    for (var ind = 0; ind < model.Variables.length; ind++) {
                        var vi = model.Variables[ind];
                        if (vi.Id === id) {
                            varName = vi.Name;
                            break;
                        }
                    }
                    if (varName === "")
                        varName = "''";
                    throw "Unknown variable " + name + " in formula for variable " + varName;
                }
                var res = [];
                res = res.concat(results.map(function (x) { return x.Id.toString(); }));
                return res;
            }
            return {
                Name: model.Name,
                Variables: model.Variables.map(function (v) {
                    return {
                        Name: v.Name,
                        Id: v.Id,
                        RangeFrom: v.RangeFrom,
                        RangeTo: v.RangeTo,
                        Formula: MapVariableNames(v.Formula, function (name) { return GetIdByName(v.Id, name); })
                    };
                }),
                Relationships: model.Relationships.map(function (r) {
                    return {
                        Id: r.Id,
                        FromVariable: r.FromVariableId,
                        ToVariable: r.ToVariableId,
                        Type: r.Type
                    };
                })
            };
        }
        Model.ExportBioModel = ExportBioModel;
        function ExportModelAndLayout(model, layout) {
            return {
                Model: ExportBioModel(model),
                Layout: {
                    Variables: layout.Variables.map(function (v) {
                        var mv = model.GetVariableById(v.Id);
                        return {
                            Id: v.Id,
                            Name: mv.Name,
                            Type: mv.Type,
                            ContainerId: mv.ContainerId,
                            PositionX: v.PositionX,
                            PositionY: v.PositionY,
                            CellX: v.CellX,
                            CellY: v.CellY,
                            Angle: v.Angle,
                        };
                    }),
                    Containers: layout.Containers.map(function (c) {
                        return {
                            Id: c.Id,
                            Name: c.Name,
                            Size: c.Size,
                            PositionX: c.PositionX,
                            PositionY: c.PositionY
                        };
                    })
                }
            };
        }
        Model.ExportModelAndLayout = ExportModelAndLayout;
        function ImportModelAndLayout(json) {
            var id = {};
            json.Layout.Variables.forEach(function (v) {
                id[v.Id] = v;
            });
            return {
                Model: new Model.BioModel(json.Model.Name, json.Model.Variables.map(function (v) { return new Model.Variable(v.Id, id[v.Id].ContainerId, id[v.Id].Type, id[v.Id].Name, v.RangeFrom, v.RangeTo, MapVariableNames(v.Formula, function (s) { return id[parseInt(s)].Name; })); }), json.Model.Relationships.map(function (r) { return new Model.Relationship(r.Id, r.FromVariable, r.ToVariable, r.Type); })),
                Layout: new Model.Layout(json.Layout.Containers.map(function (c) { return new Model.ContainerLayout(c.Id, c.Name, c.Size, c.PositionX, c.PositionY); }), json.Layout.Variables.map(function (v) { return new Model.VariableLayout(v.Id, v.PositionX, v.PositionY, v.CellX, v.CellY, v.Angle); }))
            };
        }
        Model.ImportModelAndLayout = ImportModelAndLayout;
        function ExportState(state) {
            if (state instanceof BMA.LTLOperations.NameOperand) {
                var nameOp = state;
                var result = {
                    _type: "NameOperand",
                    name: nameOp.Name
                };
                return result;
            }
            else if (state instanceof BMA.LTLOperations.ConstOperand) {
                var constOp = state;
                var result = {
                    _type: "ConstOperand",
                    "const": constOp.Value
                };
                return result;
            }
            else if (state instanceof BMA.LTLOperations.KeyframeEquation) {
                var ke = state;
                var result = {
                    _type: "KeyframeEquation",
                    leftOperand: ExportState(ke.LeftOperand),
                    operator: ke.Operator,
                    rightOperand: ExportState(ke.RightOperand)
                };
                return result;
            }
            else if (state instanceof BMA.LTLOperations.DoubleKeyframeEquation) {
                var dke = state;
                var result = {
                    _type: "DoubleKeyframeEquation",
                    leftOperand: ExportState(dke.LeftOperand),
                    leftOperator: dke.LeftOperator,
                    middleOperand: ExportState(dke.MiddleOperand),
                    rightOperator: dke.RightOperator,
                    rightOperand: ExportState(dke.RightOperand)
                };
                return result;
            }
            else if (state instanceof BMA.LTLOperations.Keyframe) {
                var kf = state;
                var result = {
                    _type: "Keyframe",
                    description: kf.Description,
                    name: kf.Name,
                    operands: []
                };
                for (var i = 0; i < kf.Operands.length; i++) {
                    result.operands.push(ExportState(kf.Operands[i]));
                }
                return result;
            }
            throw "Unsupported State Type";
        }
        Model.ExportState = ExportState;
        function ExportOperation(operation, withStates) {
            var result = {};
            result["_type"] = "Operation";
            result.operator = {
                name: operation.Operator.Name,
                operandsCount: operation.Operator.OperandsCount
            };
            result.operands = [];
            for (var i = 0; i < operation.Operands.length; i++) {
                var op = operation.Operands[i];
                if (op === undefined || op === null) {
                    result.operands.push(undefined);
                }
                else if (op instanceof BMA.LTLOperations.Operation) {
                    result.operands.push(ExportOperation(op, withStates));
                }
                else if (op instanceof BMA.LTLOperations.Keyframe) {
                    if (withStates) {
                        result.operands.push(ExportState(op));
                    }
                    else {
                        result.operands.push({
                            _type: "Keyframe",
                            name: op.Name
                        });
                    }
                }
                else if (op instanceof BMA.LTLOperations.TrueKeyframe) {
                    result.operands.push({
                        _type: "TrueKeyframe",
                    });
                }
                else if (op instanceof BMA.LTLOperations.OscillationKeyframe) {
                    result.operands.push({
                        _type: "OscillationKeyframe",
                    });
                }
                else if (op instanceof BMA.LTLOperations.SelfLoopKeyframe) {
                    result.operands.push({
                        _type: "SelfLoopKeyframe",
                    });
                }
                else {
                    //Unknown operand type
                    result.operands.push(undefined);
                }
            }
            return result;
        }
        Model.ExportOperation = ExportOperation;
        function ExportLTLContents(states, operations) {
            var result = {
                states: [],
                operations: []
            };
            for (var i = 0; i < states.length; i++) {
                result.states.push(ExportState(states[i]));
            }
            for (var i = 0; i < operations.length; i++) {
                result.operations.push(ExportOperation(operations[i], false));
            }
            return result;
        }
        Model.ExportLTLContents = ExportLTLContents;
        function ImportLTLContents(infoset) {
            var result = {
                states: undefined,
                operations: undefined
            };
            if (infoset.states !== undefined && infoset.states.length > 0) {
                result.states = [];
                for (var i = 0; i < infoset.states.length; i++) {
                    result.states.push(ImportOperand(infoset.states[i], undefined));
                }
            }
            if (infoset.operations !== undefined && infoset.operations.length > 0) {
                result.operations = [];
                for (var i = 0; i < infoset.operations.length; i++) {
                    result.operations.push(ImportOperand(infoset.operations[i], result.states));
                }
            }
            return result;
        }
        Model.ImportLTLContents = ImportLTLContents;
        function ImportOperand(obj, states) {
            if (obj === undefined)
                throw "Invalid LTL Operand";
            switch (obj._type) {
                case "NameOperand":
                    return new BMA.LTLOperations.NameOperand(obj.name);
                    break;
                case "ConstOperand":
                    return new BMA.LTLOperations.ConstOperand(obj.const);
                    break;
                case "KeyframeEquation":
                    var leftOperand = ImportOperand(obj.leftOperand, states);
                    var rightOperand = ImportOperand(obj.rightOperand, states);
                    var operator = obj.operator;
                    return new BMA.LTLOperations.KeyframeEquation(leftOperand, operator, rightOperand);
                    break;
                case "DoubleKeyframeEquation":
                    var leftOperand = ImportOperand(obj.leftOperand, states);
                    var middleOperand = ImportOperand(obj.middleOperand, states);
                    var rightOperand = ImportOperand(obj.rightOperand, states);
                    var leftOperator = obj.leftOperator;
                    var rightOperator = obj.rightOperator;
                    return new BMA.LTLOperations.DoubleKeyframeEquation(leftOperand, leftOperator, middleOperand, rightOperator, rightOperand);
                    break;
                case "Keyframe":
                    if (states !== undefined) {
                        for (var i = 0; i < states.length; i++) {
                            var state = states[i];
                            if (state.Name === obj.name)
                                return state.Clone();
                        }
                        throw "No suitable states found";
                    }
                    else {
                        var operands = [];
                        for (var i = 0; i < obj.operands.length; i++) {
                            operands.push(ImportOperand(obj.operands[i], states));
                        }
                        return new BMA.LTLOperations.Keyframe(obj.name, obj.description, operands);
                    }
                    break;
                case "Operation":
                    var operands = [];
                    for (var i = 0; i < obj.operands.length; i++) {
                        var operand = obj.operands[i];
                        if (operand === undefined || operand === null) {
                            operands.push(undefined);
                        }
                        else {
                            operands.push(ImportOperand(operand, states));
                        }
                    }
                    var op = new BMA.LTLOperations.Operation();
                    op.Operands = operands;
                    //TODO: improve operator restoring
                    op.Operator = window.OperatorsRegistry.GetOperatorByName(obj.operator.name);
                    return op;
                    break;
                case "TrueKeyframe":
                    return new BMA.LTLOperations.TrueKeyframe();
                case "OscillationKeyframe":
                    return new BMA.LTLOperations.OscillationKeyframe();
                case "SelfLoopKeyframe":
                    return new BMA.LTLOperations.SelfLoopKeyframe();
                default:
                    break;
            }
            return undefined;
        }
        Model.ImportOperand = ImportOperand;
    })(Model = BMA.Model || (BMA.Model = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=exportimport.js.map
var BMA;
(function (BMA) {
    var LTLOperations;
    (function (LTLOperations) {
        var NameOperand = (function () {
            function NameOperand(name) {
                this.name = name;
            }
            Object.defineProperty(NameOperand.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                enumerable: true,
                configurable: true
            });
            NameOperand.prototype.GetFormula = function () {
                return this.name;
            };
            NameOperand.prototype.Clone = function () {
                return new NameOperand(this.name);
            };
            return NameOperand;
        })();
        LTLOperations.NameOperand = NameOperand;
        var ConstOperand = (function () {
            function ConstOperand(value) {
                this.const = value;
            }
            Object.defineProperty(ConstOperand.prototype, "Value", {
                get: function () {
                    return this.const;
                },
                enumerable: true,
                configurable: true
            });
            ConstOperand.prototype.GetFormula = function () {
                return this.const.toString();
            };
            ConstOperand.prototype.Clone = function () {
                return new ConstOperand(this.const);
            };
            return ConstOperand;
        })();
        LTLOperations.ConstOperand = ConstOperand;
        var KeyframeEquation = (function () {
            function KeyframeEquation(leftOperand, operator, rightOperand) {
                this.leftOperand = leftOperand;
                this.rightOperand = rightOperand;
                this.operator = operator;
            }
            Object.defineProperty(KeyframeEquation.prototype, "LeftOperand", {
                get: function () {
                    return this.leftOperand;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(KeyframeEquation.prototype, "RightOperand", {
                get: function () {
                    return this.rightOperand;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(KeyframeEquation.prototype, "Operator", {
                get: function () {
                    return this.operator;
                },
                enumerable: true,
                configurable: true
            });
            KeyframeEquation.prototype.GetFormula = function () {
                return "(" + this.operator + " " + this.leftOperand.GetFormula() + " " + this.rightOperand.GetFormula() + ")";
            };
            KeyframeEquation.prototype.Clone = function () {
                return new KeyframeEquation(this.leftOperand.Clone(), this.operator, this.rightOperand.Clone());
            };
            return KeyframeEquation;
        })();
        LTLOperations.KeyframeEquation = KeyframeEquation;
        var DoubleKeyframeEquation = (function () {
            function DoubleKeyframeEquation(leftOperand, leftOperator, middleOperand, rightOperator, rightOperand) {
                this.leftOperand = leftOperand;
                this.rightOperand = rightOperand;
                this.middleOperand = middleOperand;
                this.leftOperator = leftOperator;
                this.rightOperator = rightOperator;
            }
            Object.defineProperty(DoubleKeyframeEquation.prototype, "LeftOperand", {
                get: function () {
                    return this.leftOperand;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DoubleKeyframeEquation.prototype, "RightOperand", {
                get: function () {
                    return this.rightOperand;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DoubleKeyframeEquation.prototype, "MiddleOperand", {
                get: function () {
                    return this.middleOperand;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DoubleKeyframeEquation.prototype, "LeftOperator", {
                get: function () {
                    return this.leftOperator;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DoubleKeyframeEquation.prototype, "RightOperator", {
                get: function () {
                    return this.rightOperator;
                },
                enumerable: true,
                configurable: true
            });
            DoubleKeyframeEquation.prototype.GetFormula = function () {
                return "(And " + "(" + this.Invert(this.leftOperator) + " " + this.middleOperand.GetFormula() + " " + this.leftOperand.GetFormula() + ") (" + this.rightOperator + " " + this.middleOperand.GetFormula() + " " + this.rightOperand.GetFormula() + "))";
            };
            DoubleKeyframeEquation.prototype.Clone = function () {
                return new DoubleKeyframeEquation(this.leftOperand.Clone(), this.leftOperator, this.middleOperand.Clone(), this.rightOperator, this.rightOperand.Clone());
            };
            DoubleKeyframeEquation.prototype.Invert = function (operator) {
                switch (operator) {
                    case ">":
                        return "<";
                    case "<":
                        return ">";
                    case ">=":
                        return "<=";
                    case "<=":
                        return ">=";
                    default:
                        return operator;
                }
            };
            return DoubleKeyframeEquation;
        })();
        LTLOperations.DoubleKeyframeEquation = DoubleKeyframeEquation;
        var TrueKeyframe = (function () {
            function TrueKeyframe() {
            }
            TrueKeyframe.prototype.GetFormula = function () {
                return "True";
            };
            TrueKeyframe.prototype.Clone = function () {
                return new TrueKeyframe();
            };
            return TrueKeyframe;
        })();
        LTLOperations.TrueKeyframe = TrueKeyframe;
        var SelfLoopKeyframe = (function () {
            function SelfLoopKeyframe() {
            }
            SelfLoopKeyframe.prototype.GetFormula = function () {
                return "SelfLoop";
            };
            SelfLoopKeyframe.prototype.Clone = function () {
                return new SelfLoopKeyframe();
            };
            return SelfLoopKeyframe;
        })();
        LTLOperations.SelfLoopKeyframe = SelfLoopKeyframe;
        var OscillationKeyframe = (function () {
            function OscillationKeyframe() {
            }
            OscillationKeyframe.prototype.GetFormula = function () {
                return "Oscillation";
            };
            OscillationKeyframe.prototype.Clone = function () {
                return new OscillationKeyframe();
            };
            return OscillationKeyframe;
        })();
        LTLOperations.OscillationKeyframe = OscillationKeyframe;
        var Keyframe = (function () {
            function Keyframe(name, description, operands) {
                this.name = name;
                this.description = description;
                this.operands = operands;
            }
            Object.defineProperty(Keyframe.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                set: function (name) {
                    this.name = name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Keyframe.prototype, "Description", {
                get: function () {
                    return this.description;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Keyframe.prototype, "Operands", {
                get: function () {
                    return this.operands;
                },
                enumerable: true,
                configurable: true
            });
            Keyframe.prototype.GetFormula = function () {
                if (this.operands === undefined || this.operands.length < 1) {
                    return "";
                }
                else {
                    if (this.operands.length === 1)
                        return this.operands[0].GetFormula();
                    var formula = this.operands[this.operands.length - 1].GetFormula();
                    for (var i = this.operands.length - 2; i >= 0; i--) {
                        formula = "(And " + this.operands[i].GetFormula() + " " + formula + ")";
                    }
                    return formula;
                }
            };
            Keyframe.prototype.Clone = function () {
                return new BMA.LTLOperations.Keyframe(this.name, this.description, this.operands.slice(0));
            };
            return Keyframe;
        })();
        LTLOperations.Keyframe = Keyframe;
        var Operator = (function () {
            function Operator(name, operandsCount, fun) {
                this.name = name;
                this.fun = fun;
                this.operandsNumber = operandsCount;
            }
            Object.defineProperty(Operator.prototype, "Name", {
                get: function () {
                    return this.name;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Operator.prototype, "OperandsCount", {
                get: function () {
                    return this.operandsNumber;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Operator.prototype, "Function", {
                get: function () {
                    return this.fun;
                },
                enumerable: true,
                configurable: true
            });
            Operator.prototype.GetFormula = function (op) {
                if (op !== undefined && op.length !== this.operandsNumber) {
                    throw "Operator " + name + ": invalid operands count";
                }
                return this.fun(op);
            };
            return Operator;
        })();
        LTLOperations.Operator = Operator;
        var Operation = (function () {
            function Operation() {
            }
            Object.defineProperty(Operation.prototype, "Operator", {
                get: function () {
                    return this.operator;
                },
                set: function (op) {
                    this.operator = op;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Operation.prototype, "Operands", {
                get: function () {
                    return this.operands;
                },
                set: function (op) {
                    this.operands = op;
                },
                enumerable: true,
                configurable: true
            });
            Operation.prototype.GetFormula = function () {
                return this.operator.GetFormula(this.operands);
            };
            Operation.prototype.Clone = function () {
                var operands = [];
                for (var i = 0; i < this.operands.length; i++) {
                    operands.push(this.operands[i] === undefined ? undefined : this.operands[i].Clone());
                }
                var result = new Operation();
                result.Operator = new Operator(this.operator.Name, this.operator.OperandsCount, this.operator.Function);
                result.Operands = operands;
                return result;
            };
            return Operation;
        })();
        LTLOperations.Operation = Operation;
    })(LTLOperations = BMA.LTLOperations || (BMA.LTLOperations = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=Operation.js.map
var BMA;
(function (BMA) {
    var LTLOperations;
    (function (LTLOperations) {
        var OperationLayout = (function () {
            function OperationLayout(svg, operation, position) {
                this.keyFrameSize = 25;
                this.bbox = undefined;
                this.position = { x: 0, y: 0 };
                this.isVisible = true;
                this.scale = { x: 1, y: 1 };
                this.borderThickness = 1;
                this.fill = undefined;
                this.status = "nottested";
                this.tag = undefined;
                this.renderGroup = undefined;
                this.svg = svg;
                this.operation = operation;
                this.padding = { x: 5, y: 10 };
                this.position = position;
                this.Render();
            }
            Object.defineProperty(OperationLayout.prototype, "IsCompleted", {
                get: function () {
                    return this.checkIsCompleted(this.operation);
                },
                enumerable: true,
                configurable: true
            });
            OperationLayout.prototype.checkIsCompleted = function (operation) {
                if (operation.Operator !== undefined) {
                    var operands = operation.Operands;
                    for (var i = 0; i < operands.length; i++) {
                        if (operands[i] === undefined)
                            return false;
                        else if (!this.checkIsCompleted(operands[i]))
                            return false;
                    }
                }
                return true;
            };
            Object.defineProperty(OperationLayout.prototype, "AnalysisStatus", {
                get: function () {
                    return this.status;
                },
                set: function (value) {
                    switch (value) {
                        case "nottested":
                            this.status = value;
                            this.Fill = "white";
                            break;
                        case "success":
                            this.status = value;
                            this.Fill = "rgb(217,255,182)";
                            break;
                        case "fail":
                            this.status = value;
                            this.Fill = "rgb(254, 172, 158)";
                            break;
                        default:
                            throw "Invalid status!";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Tag", {
                get: function () {
                    return this.tag;
                },
                set: function (value) {
                    this.tag = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "IsOperation", {
                get: function () {
                    return this.operation.Operator !== undefined;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "KeyFrameSize", {
                get: function () {
                    return this.keyFrameSize;
                },
                set: function (value) {
                    if (value > 0) {
                        if (value !== this.keyFrameSize) {
                            this.keyFrameSize = value;
                            this.Refresh();
                        }
                    }
                    else
                        throw "KeyFrame Size must be positive";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "IsVisible", {
                get: function () {
                    return this.isVisible;
                },
                set: function (value) {
                    if (value !== this.isVisible) {
                        this.isVisible = value;
                        if (value) {
                            this.Render();
                        }
                        else {
                            this.Clear();
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Fill", {
                get: function () {
                    return this.fill;
                },
                set: function (value) {
                    if (value !== this.fill) {
                        this.fill = value;
                        if (this.renderGroup !== undefined) {
                            this.svg.change(this.renderGroup, {
                                fill: this.fill
                            });
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "BorderThickness", {
                get: function () {
                    return this.borderThickness;
                },
                set: function (value) {
                    if (value !== this.borderThickness) {
                        this.borderThickness = value;
                        this.Refresh();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Scale", {
                get: function () {
                    return this.scale;
                },
                set: function (value) {
                    if (value !== undefined) {
                        if (value.x !== this.scale.x || value.y !== this.scale.y) {
                            this.scale = value;
                            this.Refresh();
                        }
                    }
                    else {
                        throw "scale is undefined";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Operation", {
                get: function () {
                    return this.operation;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Position", {
                get: function () {
                    return this.position;
                },
                set: function (value) {
                    if (value !== undefined) {
                        if (value.x !== this.position.x || value.y !== this.position.y) {
                            var oldPosition = this.position;
                            this.position = value;
                            this.svg.change(this.renderGroup, {
                                transform: "translate(" + this.position.x + ", " + this.position.y + ") scale(" + this.scale.x + ", " + this.scale.y + ")"
                            });
                            this.bbox.x = this.bbox.x - oldPosition.x + value.x;
                            this.bbox.y = this.bbox.y - oldPosition.y + value.y;
                        }
                    }
                    else {
                        throw "position is undefined";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "Padding", {
                get: function () {
                    return this.padding;
                },
                set: function (value) {
                    if (value !== undefined) {
                        if (value.x !== this.padding.x || value.y !== this.padding.y) {
                            this.padding = value;
                            this.Refresh();
                        }
                    }
                    else {
                        throw "padding is undefined";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(OperationLayout.prototype, "BoundingBox", {
                get: function () {
                    return this.bbox;
                },
                enumerable: true,
                configurable: true
            });
            OperationLayout.prototype.GetEmptySlotAtPosition = function (x, y) {
                return this.FindEmptySlotAtPosition(this.layout, x, y);
            };
            OperationLayout.prototype.FindEmptySlotAtPosition = function (layout, x, y) {
                if (layout.isEmpty && Math.sqrt(Math.pow((x - layout.position.x), 2) + Math.pow((y - layout.position.y), 2)) < this.keyFrameSize / 2) {
                    return {
                        operation: layout.operationRef,
                        operandIndex: layout.indexRef
                    };
                }
                else {
                    if (layout.operands !== undefined) {
                        var result = undefined;
                        for (var i = 0; i < layout.operands.length; i++) {
                            result = this.FindEmptySlotAtPosition(layout.operands[i], x, y);
                            if (result !== undefined)
                                return result;
                        }
                        return result;
                    }
                    else {
                        return undefined;
                    }
                }
            };
            OperationLayout.prototype.CreateLayout = function (svg, operation) {
                var that = this;
                var layout = {};
                layout.operation = operation;
                var paddingX = this.padding.x;
                var op = operation;
                var operator = op.Operator;
                if (operator !== undefined) {
                    layout.operands = [];
                    layout.operator = operator.Name;
                    var operands = op.Operands;
                    var layer = 0;
                    var width = (this.GetOperatorWidth(svg, operator.Name, 10)).width;
                    layout.operatorWidth = width;
                    if (operands.length === 1) {
                        width += paddingX;
                    }
                    for (var i = 0; i < operands.length; i++) {
                        var operand = operands[i];
                        if (operand !== undefined) {
                            var calcLW = that.CreateLayout(svg, operand);
                            calcLW.parentoperationindex = i;
                            calcLW.parentoperation = operation;
                            layer = Math.max(layer, calcLW.layer);
                            layout.operands.push(calcLW);
                            width += (calcLW.width + paddingX * 2);
                        }
                        else {
                            layout.operands.push({ isEmpty: true, width: this.keyFrameSize, operationRef: op, indexRef: i });
                            width += (this.keyFrameSize + 2 * paddingX);
                        }
                    }
                    layout.layer = layer + 1;
                    layout.width = width;
                    return layout;
                }
                else {
                    var w = this.keyFrameSize;
                    layout.layer = 0;
                    layout.width = w;
                    if (operation instanceof LTLOperations.TrueKeyframe) {
                        layout.type = "truekeyframe";
                    }
                    else if (operation instanceof LTLOperations.OscillationKeyframe) {
                        layout.type = "oscillationkeyframe";
                    }
                    else if (operation instanceof LTLOperations.SelfLoopKeyframe) {
                        layout.type = "selfloopkeyframe";
                    }
                    else if (operation instanceof LTLOperations.Keyframe) {
                        layout.type = "keyframe";
                        layout.name = operation.name;
                    }
                    else
                        throw "Unknown Keyframe type";
                    return layout;
                }
            };
            OperationLayout.prototype.SetPositionOffsets = function (layout, position) {
                var padding = this.padding;
                layout.position = position;
                if (layout.operands !== undefined) {
                    var w = layout.operatorWidth;
                    switch (layout.operands.length) {
                        case 1:
                            var x = position.x + layout.width / 2 - layout.operands[0].width / 2 - padding.x;
                            this.SetPositionOffsets(layout.operands[0], { x: x, y: position.y });
                            break;
                        case 2:
                            var x1 = position.x + layout.width / 2 - layout.operands[1].width / 2 - padding.x;
                            this.SetPositionOffsets(layout.operands[1], { x: x1, y: position.y });
                            var x2 = position.x - layout.width / 2 + layout.operands[0].width / 2 + padding.x;
                            this.SetPositionOffsets(layout.operands[0], { x: x2, y: position.y });
                            break;
                        default:
                            break;
                    }
                }
            };
            /*
            private UpdateFill() {
                if (this.layout !== undefined) {

                    var updateFillOfPart = function (layoutPart) {
                        if (layoutPart !== undefined) {
                            this.svg.change(layoutPart.svgref, {
                                fill: this.fill
                            });

                            if (layoutPart.operands !== undefined) {
                                for (var i = 0; i < layoutPart.operands.length; i++) {
                                    updateFillOfPart(layoutPart.operands[i]);
                                }
                            }
                        }
                    }

                    updateFillOfPart(this.layout);
                }
            }
            */
            OperationLayout.prototype.GetOperatorWidth = function (svg, operator, fontSize) {
                var t = svg.text(0, 0, operator, {
                    "font-size": fontSize,
                    "fill": "rgb(96,96,96)"
                });
                var bbox = t.getBBox();
                var result = { width: bbox.width, height: bbox.height };
                //console.log(operator + ": " + bbox.width);
                svg.remove(t);
                return result;
            };
            OperationLayout.prototype.RenderLayoutPart = function (svg, position, layoutPart, options) {
                var paddingX = this.padding.x;
                var paddingY = this.padding.y;
                if (layoutPart.isEmpty) {
                    layoutPart.svgref = svg.circle(this.renderGroup, position.x, position.y, this.keyFrameSize / 2, { stroke: "rgb(96,96,96)", fill: "rgb(96,96,96)" });
                }
                else {
                    var operator = layoutPart.operator;
                    if (operator !== undefined) {
                        var operation = layoutPart;
                        var halfWidth = layoutPart.width / 2;
                        var height = this.keyFrameSize + paddingY * layoutPart.layer;
                        var fill = options && options.fill ? options.fill : "transparent";
                        var stroke = options && options.stroke ? options.stroke : "rgb(96,96,96)";
                        var strokeWidth = 1;
                        if (options !== undefined) {
                            if (options.isRoot) {
                                strokeWidth = this.borderThickness;
                            }
                            else if (options.strokeWidth) {
                                strokeWidth = options.strokeWidth;
                            }
                        }
                        var opSVG = svg.rect(this.renderGroup, position.x - halfWidth, position.y - height / 2, halfWidth * 2, height, height / 2, height / 2, {
                            stroke: stroke,
                            //fill: fill,
                            strokeWidth: strokeWidth
                        });
                        layoutPart.svgref = opSVG;
                        var operands = operation.operands;
                        switch (operands.length) {
                            case 1:
                                svg.text(this.renderGroup, position.x - halfWidth + paddingX, position.y + 3, operation.operator, {
                                    "font-size": 10,
                                    "fill": "rgb(96,96,96)"
                                });
                                this.RenderLayoutPart(svg, {
                                    x: position.x + halfWidth - operands[0].width / 2 - paddingX,
                                    y: position.y
                                }, operands[0], undefined);
                                break;
                            case 2:
                                this.RenderLayoutPart(svg, {
                                    x: position.x - halfWidth + operands[0].width / 2 + paddingX,
                                    y: position.y
                                }, operands[0], undefined);
                                this.RenderLayoutPart(svg, {
                                    x: position.x + halfWidth - operands[1].width / 2 - paddingX,
                                    y: position.y
                                }, operands[1], undefined);
                                svg.text(this.renderGroup, position.x - halfWidth + operands[0].width + 2 * paddingX, position.y + 3, operation.operator, {
                                    "font-size": 10,
                                    "fill": "rgb(96,96,96)"
                                });
                                break;
                            default:
                                break;
                        }
                    }
                    else {
                        var stateGroup = svg.group(this.renderGroup, {
                            transform: "translate(" + position.x + ", " + position.y + ")"
                        });
                        var uniquename = this.GenerateUUID();
                        var path = svg.circle(stateGroup, 0, 0, this.keyFrameSize / 2, { stroke: "rgb(96,96,96)", fill: "rgb(238,238,238)", id: uniquename });
                        if (layoutPart.type === "keyframe") {
                            var textGroup = svg.group(stateGroup, {});
                            var label = svg.text(textGroup, 0, 0, layoutPart.name, {
                                "font-size": 16,
                                "fill": "rgb(96,96,96)",
                            });
                            var bbox = label.getBBox();
                            var scale = 1;
                            if (bbox.width > this.keyFrameSize / 2) {
                                scale = this.keyFrameSize / (2 * bbox.width);
                            }
                            this.svg.change(textGroup, {
                                transform: "scale(" + scale + ", " + scale + ") translate(" + -bbox.width / 2 + ", " + bbox.height / 4 + ")"
                            });
                        }
                        else {
                            var img = svg.image(stateGroup, -this.keyFrameSize / 2, -this.keyFrameSize / 2, this.keyFrameSize, this.keyFrameSize, this.GetKeyframeImagePath(layoutPart.type));
                        }
                        layoutPart.svgref = stateGroup;
                    }
                }
            };
            OperationLayout.prototype.GetKeyframeImagePath = function (keyframetype) {
                switch (keyframetype) {
                    case "oscillationkeyframe":
                        return "../images/oscillation-state.svg";
                    case "truekeyframe":
                        return "../images/true-state.svg";
                    case "selfloopkeyframe":
                        return "../images/selfloop-state.svg";
                    default:
                        throw "Unknown keyframe type";
                }
            };
            OperationLayout.prototype.Render = function () {
                var position = this.position;
                var svg = this.svg;
                if (this.renderGroup !== undefined) {
                    svg.remove(this.renderGroup);
                }
                this.layout = this.CreateLayout(svg, this.operation);
                this.position = position;
                this.SetPositionOffsets(this.layout, position);
                this.renderGroup = svg.group({
                    transform: "translate(" + this.position.x + ", " + this.position.y + ") scale(" + this.scale.x + ", " + this.scale.y + ")",
                    fill: this.fill === undefined ? "white" : this.fill,
                });
                var halfWidth = this.layout.width / 2;
                var height = this.keyFrameSize + this.padding.y * this.layout.layer;
                this.bbox = {
                    x: position.x - halfWidth,
                    y: position.y - height / 2,
                    width: halfWidth * 2,
                    height: height
                };
                this.RenderLayoutPart(svg, { x: 0, y: 0 }, this.layout, {
                    stroke: "rgb(96,96,96)",
                    strokeWidth: 1,
                    isRoot: true,
                });
            };
            OperationLayout.prototype.Clear = function () {
                if (this.renderGroup !== undefined) {
                    this.svg.remove(this.renderGroup);
                    this.renderGroup = undefined;
                }
            };
            OperationLayout.prototype.Refresh = function () {
                if (this.isVisible)
                    this.Render();
            };
            OperationLayout.prototype.CopyOperandFromCursor = function (x, y, withCut) {
                if (x < this.bbox.x || x > this.bbox.x + this.bbox.width || y < this.bbox.y || y > this.bbox.y + this.bbox.height) {
                    return undefined;
                }
                return undefined;
            };
            OperationLayout.prototype.GetIntersectedChild = function (x, y, position, layoutPart, accountEmpty) {
                var width = layoutPart.width;
                var halfWidth = width / 2;
                var paddingY = this.padding.y;
                var paddingX = this.padding.x;
                var height = this.keyFrameSize + paddingY * layoutPart.layer;
                if (x < position.x - halfWidth || x > position.x + halfWidth || y < position.y - height / 2 || y > position.y + height / 2) {
                    return undefined;
                }
                var operands = layoutPart.operands;
                if (operands === undefined)
                    return layoutPart;
                switch (operands.length) {
                    case 1:
                        if (operands[0].isEmpty) {
                            if (accountEmpty) {
                                var pos = {
                                    x: position.x + halfWidth - operands[0].width / 2 - paddingX,
                                    y: position.y
                                };
                                if (Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2)) <= this.keyFrameSize / 2)
                                    return operands[0];
                            }
                            return layoutPart;
                        }
                        var highlighted = this.GetIntersectedChild(x, y, {
                            x: position.x + halfWidth - operands[0].width / 2 - paddingX,
                            y: position.y
                        }, operands[0], accountEmpty);
                        return highlighted !== undefined ? highlighted : layoutPart;
                        break;
                    case 2:
                        if (!operands[0].isEmpty) {
                            var highlighted1 = this.GetIntersectedChild(x, y, {
                                x: position.x - halfWidth + operands[0].width / 2 + paddingX,
                                y: position.y
                            }, operands[0], accountEmpty);
                            if (highlighted1 !== undefined) {
                                return highlighted1;
                            }
                        }
                        else {
                            if (accountEmpty) {
                                var pos = {
                                    x: position.x - halfWidth + operands[0].width / 2 + paddingX,
                                    y: position.y
                                };
                                if (Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2)) <= this.keyFrameSize / 2)
                                    return operands[0];
                            }
                        }
                        if (!operands[1].isEmpty) {
                            var highlighted2 = this.GetIntersectedChild(x, y, {
                                x: position.x + halfWidth - operands[1].width / 2 - paddingX,
                                y: position.y
                            }, operands[1], accountEmpty);
                            if (highlighted2 !== undefined) {
                                return highlighted2;
                            }
                        }
                        else {
                            if (accountEmpty) {
                                var pos = {
                                    x: position.x + halfWidth - operands[1].width / 2 - paddingX,
                                    y: position.y
                                };
                                if (Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2)) <= this.keyFrameSize / 2)
                                    return operands[1];
                            }
                        }
                        return layoutPart;
                        break;
                    default:
                        throw "Highlighting of operators with " + operands.length + " operands is not supported";
                }
                return layoutPart;
            };
            OperationLayout.prototype.HighlightAtPosition = function (x, y) {
                if (this.layout !== undefined) {
                    this.Refresh();
                    var layoutPart = this.GetIntersectedChild(x, y, this.position, this.layout, true);
                    if (layoutPart !== undefined) {
                        if (layoutPart.isEmpty) {
                            this.svg.change(layoutPart.svgref, {
                                fill: "lightgray"
                            });
                        }
                        else {
                            this.svg.change(layoutPart.svgref, {
                                strokeWidth: 4
                            });
                        }
                    }
                }
            };
            OperationLayout.prototype.PickOperation = function (x, y) {
                if (this.layout !== undefined) {
                    var layoutPart = this.GetIntersectedChild(x, y, this.position, this.layout, false);
                    if (layoutPart !== undefined)
                        return layoutPart.operation;
                }
                return undefined;
            };
            OperationLayout.prototype.UnpinOperation = function (x, y) {
                if (this.layout !== undefined) {
                    var layoutPart = this.GetIntersectedChild(x, y, this.position, this.layout, false);
                    if (layoutPart !== undefined) {
                        if (layoutPart.parentoperation !== undefined) {
                            layoutPart.parentoperation.operands[layoutPart.parentoperationindex] = undefined;
                            this.Refresh();
                        }
                        else {
                            this.IsVisible = false;
                        }
                    }
                    return {
                        operation: layoutPart.operation,
                        isRoot: layoutPart.parentoperation === undefined,
                        parentoperation: layoutPart.parentoperation,
                        parentoperationindex: layoutPart.parentoperationindex
                    };
                }
                return undefined;
            };
            OperationLayout.prototype.HiglightEmptySlotsInternal = function (color, layoutPart) {
                if (layoutPart !== undefined) {
                    if (layoutPart.isEmpty) {
                        this.svg.change(layoutPart.svgref, {
                            fill: color
                        });
                    }
                    else {
                        if (layoutPart.operands !== undefined) {
                            for (var i = 0; i < layoutPart.operands.length; i++) {
                                this.HiglightEmptySlotsInternal(color, layoutPart.operands[i]);
                            }
                        }
                    }
                }
            };
            OperationLayout.prototype.HighlightEmptySlots = function (color) {
                if (this.layout !== undefined) {
                    this.HiglightEmptySlotsInternal(color, this.layout);
                }
            };
            OperationLayout.prototype.RefreshStatesInOperation = function (operation, states) {
                if (operation === undefined)
                    return false;
                if (operation.Operator !== undefined) {
                    var wasUpdated = false;
                    var operands = operation.Operands;
                    for (var i = 0; i < operands.length; i++) {
                        var op = operands[i];
                        if (op === undefined)
                            continue;
                        if (op.Operator !== undefined) {
                            wasUpdated = wasUpdated || this.RefreshStatesInOperation(operands[i], states);
                        }
                        else {
                            var name = op.Name;
                            if (name !== undefined) {
                                var updated = false;
                                for (var j = 0; j < states.length; j++) {
                                    if (states[j].Name === name) {
                                        operands[i] = states[j];
                                        wasUpdated = wasUpdated || operands[i].GetFormula() !== states[j].GetFormula();
                                        updated = true;
                                        break;
                                    }
                                }
                                if (!updated) {
                                    operands[i] = undefined;
                                    wasUpdated = true;
                                }
                            }
                        }
                    }
                    return wasUpdated;
                }
                return false;
            };
            OperationLayout.prototype.RefreshStates = function (states) {
                var wasUpdated = this.RefreshStatesInOperation(this.operation, states);
                if (wasUpdated)
                    this.status = "nottested";
                //this.Refresh();
            };
            OperationLayout.prototype.GenerateUUID = function () {
                var d = new Date().getTime();
                if (window.performance && typeof window.performance.now === "function") {
                    d += performance.now();
                    ; //use high-precision timer if available
                }
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                return uuid;
            };
            return OperationLayout;
        })();
        LTLOperations.OperationLayout = OperationLayout;
    })(LTLOperations = BMA.LTLOperations || (BMA.LTLOperations = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=operationlayout.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\widgets\drawingsurface.ts"/>
var BMA;
(function (BMA) {
    var UIDrivers;
    (function (UIDrivers) {
        var SVGPlotDriver = (function () {
            function SVGPlotDriver(svgPlotDiv) {
                this.svgPlotDiv = svgPlotDiv;
            }
            SVGPlotDriver.prototype.Draw = function (svg) {
                this.svgPlotDiv.drawingsurface({ svg: svg });
            };
            SVGPlotDriver.prototype.DrawLayer2 = function (svg) {
                this.svgPlotDiv.drawingsurface({ lightSvg: svg });
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
            SVGPlotDriver.prototype.GetMouseMoves = function () {
                return this.svgPlotDiv.drawingsurface("getMouseMoves");
            };
            //public GetZoomSubject() {
            //    return this.svgPlotDiv.drawingsurface("getZoomSubject");
            //}
            SVGPlotDriver.prototype.SetZoom = function (zoom) {
                this.svgPlotDiv.drawingsurface({ zoom: zoom });
            };
            SVGPlotDriver.prototype.GetPlotX = function (left) {
                return this.svgPlotDiv.drawingsurface("getPlotX", left);
            };
            SVGPlotDriver.prototype.GetPlotY = function (top) {
                return this.svgPlotDiv.drawingsurface("getPlotY", top);
            };
            SVGPlotDriver.prototype.GetLeft = function (x) {
                return this.svgPlotDiv.drawingsurface("getLeft", x);
            };
            SVGPlotDriver.prototype.GetTop = function (y) {
                return this.svgPlotDiv.drawingsurface("getTop", y);
            };
            SVGPlotDriver.prototype.GetPixelWidth = function () {
                return this.svgPlotDiv.drawingsurface("getPixelWidth");
            };
            SVGPlotDriver.prototype.SetGridVisibility = function (isOn) {
                this.svgPlotDiv.drawingsurface({ gridVisibility: isOn });
            };
            SVGPlotDriver.prototype.HighlightAreas = function (areas) {
                this.svgPlotDiv.drawingsurface({ rects: areas });
            };
            SVGPlotDriver.prototype.SetCenter = function (x, y) {
                this.svgPlotDiv.drawingsurface("setCenter", { x: x, y: y });
            };
            SVGPlotDriver.prototype.GetSVG = function () {
                return this.svgPlotDiv.drawingsurface("getSVG").toSVG();
            };
            SVGPlotDriver.prototype.GetSVGRef = function () {
                return this.svgPlotDiv.drawingsurface("getSVG");
            };
            SVGPlotDriver.prototype.GetLightSVGRef = function () {
                return this.svgPlotDiv.drawingsurface("getSecondarySVG");
            };
            SVGPlotDriver.prototype.SetVisibleRect = function (rect) {
                this.svgPlotDiv.drawingsurface({ "visibleRect": rect });
            };
            SVGPlotDriver.prototype.GetNavigationSurface = function () {
                return this.svgPlotDiv.drawingsurface("getCentralPart");
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
                this.variableEditor.click(function (e) { e.stopPropagation(); });
            }
            VariableEditorDriver.prototype.GetVariableProperties = function () {
                return {
                    name: this.variableEditor.bmaeditor('option', 'name'),
                    formula: this.variableEditor.bmaeditor('option', 'formula'),
                    rangeFrom: this.variableEditor.bmaeditor('option', 'rangeFrom'),
                    rangeTo: this.variableEditor.bmaeditor('option', 'rangeTo')
                };
            };
            VariableEditorDriver.prototype.SetValidation = function (val, message) {
                this.variableEditor.bmaeditor("SetValidation", val, message);
            };
            VariableEditorDriver.prototype.Initialize = function (variable, model) {
                this.variableEditor.bmaeditor('option', 'name', variable.Name);
                var options = [];
                var id = variable.Id;
                for (var i = 0; i < model.Relationships.length; i++) {
                    var rel = model.Relationships[i];
                    if (rel.ToVariableId === id) {
                        options.push(model.GetVariableById(rel.FromVariableId).Name);
                    }
                }
                this.variableEditor.bmaeditor('option', 'inputs', options);
                this.variableEditor.bmaeditor('option', 'formula', variable.Formula);
                this.variableEditor.bmaeditor('option', 'rangeFrom', variable.RangeFrom);
                this.variableEditor.bmaeditor('option', 'rangeTo', variable.RangeTo);
            };
            VariableEditorDriver.prototype.Show = function (x, y) {
                this.variableEditor.show();
                this.variableEditor.css("left", x).css("top", y);
            };
            VariableEditorDriver.prototype.Hide = function () {
                this.variableEditor.hide();
            };
            return VariableEditorDriver;
        })();
        UIDrivers.VariableEditorDriver = VariableEditorDriver;
        var ContainerEditorDriver = (function () {
            function ContainerEditorDriver(containerEditor) {
                this.containerEditor = containerEditor;
                this.containerEditor.containernameeditor();
                this.containerEditor.hide();
                this.containerEditor.click(function (e) { e.stopPropagation(); });
            }
            ContainerEditorDriver.prototype.GetContainerName = function () {
                return this.containerEditor.containernameeditor('option', 'name');
            };
            ContainerEditorDriver.prototype.Initialize = function (containerLayout) {
                this.containerEditor.containernameeditor('option', 'name', containerLayout.Name);
            };
            ContainerEditorDriver.prototype.Show = function (x, y) {
                this.containerEditor.show();
                this.containerEditor.css("left", x).css("top", y);
            };
            ContainerEditorDriver.prototype.Hide = function () {
                this.containerEditor.hide();
            };
            return ContainerEditorDriver;
        })();
        UIDrivers.ContainerEditorDriver = ContainerEditorDriver;
        var ProofViewer = (function () {
            function ProofViewer(proofAccordion, proofContentViewer) {
                this.proofAccordion = proofAccordion;
                this.proofContentViewer = proofContentViewer;
            }
            ProofViewer.prototype.SetData = function (params) {
                if (params !== undefined)
                    this.proofContentViewer.proofresultviewer(params);
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
            return ProofViewer;
        })();
        UIDrivers.ProofViewer = ProofViewer;
        var FurtherTestingDriver = (function () {
            function FurtherTestingDriver(viewer, toggler) {
                this.viewer = viewer;
            }
            FurtherTestingDriver.prototype.GetViewer = function () {
                return this.viewer;
            };
            FurtherTestingDriver.prototype.ShowStartFurtherTestingToggler = function () {
                this.viewer.furthertesting("ShowStartToggler");
            };
            FurtherTestingDriver.prototype.HideStartFurtherTestingToggler = function () {
                this.viewer.furthertesting("HideStartToggler");
            };
            FurtherTestingDriver.prototype.ShowResults = function (data) {
                if (data !== undefined)
                    this.viewer.furthertesting("SetData", { tabLabels: data.tabLabels, tableHeaders: data.tableHeaders, data: data.data });
                else {
                    this.viewer.furthertesting("SetData", undefined);
                }
            };
            FurtherTestingDriver.prototype.HideResults = function () {
                this.viewer.furthertesting({ data: null });
            };
            FurtherTestingDriver.prototype.StandbyMode = function () {
                this.viewer.furthertesting({ buttonMode: "StandbyMode" });
            };
            FurtherTestingDriver.prototype.ActiveMode = function () {
                this.viewer.furthertesting({ buttonMode: "ActiveMode" });
            };
            return FurtherTestingDriver;
        })();
        UIDrivers.FurtherTestingDriver = FurtherTestingDriver;
        var PopupDriver = (function () {
            function PopupDriver(popupWindow) {
                this.popupWindow = popupWindow;
            }
            PopupDriver.prototype.Seen = function () {
                return !this.popupWindow.is(":hidden");
            };
            PopupDriver.prototype.Show = function (params) {
                var that = this;
                //this.createResultView(params);
                var header = "";
                this.popupWindow
                    .removeClass('further-testing-popout')
                    .removeClass('proof-propagation-popout')
                    .removeClass('proof-variables-popout')
                    .removeClass('simulation-popout');
                //.removeClass('analysis-popout');
                switch (params.tab) {
                    case "ProofVariables":
                        header = "Variables";
                        this.popupWindow.addClass('proof-variables-popout');
                        break;
                    case "ProofPropagation":
                        header = "Proof Progression";
                        this.popupWindow.addClass('proof-propagation-popout');
                        break;
                    case "SimulationVariables":
                        header = "Simulation Progression";
                        this.popupWindow.addClass('simulation-popout');
                        break;
                    case "FurtherTesting":
                        header = "Further Testing";
                        this.popupWindow.addClass('further-testing-popout');
                        break;
                    case "SimulationPlot":
                        header = "Simulation Graph";
                        //this.popupWindow.addClass('analysis-popout');
                        break;
                }
                this.popupWindow.resultswindowviewer({ header: header, tabid: params.tab, content: params.content, icon: "min", isResizable: false });
                popup_position();
                this.popupWindow.show();
            };
            PopupDriver.prototype.Hide = function () {
                this.popupWindow.hide();
            };
            PopupDriver.prototype.Collapse = function () {
                window.Commands.Execute("Collapse", this.popupWindow.resultswindowviewer("option", "tabid"));
            };
            return PopupDriver;
        })();
        UIDrivers.PopupDriver = PopupDriver;
        var SimulationExpandedDriver = (function () {
            function SimulationExpandedDriver(view) {
                this.viewer = view;
            }
            SimulationExpandedDriver.prototype.SetOnPlotVariablesSelectionChanged = function (callback) {
                this.onplotvariablesselectionchanged = callback;
                this.viewer.simulationexpanded({ onChangePlotVariables: callback });
            };
            SimulationExpandedDriver.prototype.Set = function (data) {
                var table = this.CreateExpandedTable(data.variables, data.colors);
                var interval = this.CreateInterval(data.variables);
                this.viewer.simulationexpanded({ variables: table, init: data.init, interval: interval, data: undefined });
            };
            SimulationExpandedDriver.prototype.SetData = function (data) {
                var toAdd = this.CreatePlotView(data);
                this.viewer.simulationexpanded("option", "data", toAdd);
            };
            SimulationExpandedDriver.prototype.GetViewer = function () {
                return this.viewer;
            };
            SimulationExpandedDriver.prototype.StandbyMode = function () {
                this.viewer.simulationexpanded({ buttonMode: "StandbyMode" });
            };
            SimulationExpandedDriver.prototype.ActiveMode = function () {
                this.viewer.simulationexpanded({ buttonMode: "ActiveMode" });
            };
            SimulationExpandedDriver.prototype.AddResult = function (res) {
                var result = this.ConvertResult(res);
                this.viewer.simulationexpanded("AddResult", result);
            };
            SimulationExpandedDriver.prototype.CreatePlotView = function (colors) {
                var data = [];
                for (var i = 1; i < colors[0].Plot.length; i++) {
                    data[i - 1] = [];
                    for (var j = 0; j < colors.length; j++) {
                        data[i - 1][j] = colors[j].Plot[i];
                    }
                }
                return data;
            };
            SimulationExpandedDriver.prototype.CreateInterval = function (variables) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = variables[i].RangeFrom;
                    table[i][1] = variables[i].RangeTo;
                }
                return table;
            };
            SimulationExpandedDriver.prototype.ConvertResult = function (res) {
                var data = [];
                if (res.Variables !== undefined && res.Variables !== null)
                    data = [];
                for (var i = 0; i < res.Variables.length; i++)
                    data[i] = res.Variables[i].Value;
                return data;
            };
            SimulationExpandedDriver.prototype.findColorById = function (colors, id) {
                for (var i = 0; i < colors.length; i++)
                    if (id === colors[i].Id)
                        return colors[i];
                return undefined;
            };
            SimulationExpandedDriver.prototype.CreateExpandedTable = function (variables, colors) {
                var table = [];
                //var variables = this.appModel.BioModel.Variables;
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
            return SimulationExpandedDriver;
        })();
        UIDrivers.SimulationExpandedDriver = SimulationExpandedDriver;
        var SimulationViewerDriver = (function () {
            function SimulationViewerDriver(viewer) {
                this.viewer = viewer;
            }
            SimulationViewerDriver.prototype.ChangeVisibility = function (param) {
                this.viewer.simulationviewer("ChangeVisibility", param.ind, param.check);
            };
            SimulationViewerDriver.prototype.SetData = function (params) {
                this.viewer.simulationviewer(params);
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
        var LocalStorageDriver = (function () {
            function LocalStorageDriver(widget) {
                this.widget = widget;
            }
            LocalStorageDriver.prototype.AddItem = function (key, item) {
                this.widget.localstoragewidget("AddItem", key);
            };
            LocalStorageDriver.prototype.Show = function () {
                this.widget.show();
            };
            LocalStorageDriver.prototype.Hide = function () {
                this.widget.hide();
            };
            LocalStorageDriver.prototype.SetItems = function (keys) {
                this.widget.localstoragewidget({ items: keys });
            };
            LocalStorageDriver.prototype.Message = function (msg) {
                this.widget.localstoragewidget("Message", msg);
            };
            return LocalStorageDriver;
        })();
        UIDrivers.LocalStorageDriver = LocalStorageDriver;
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
        var ContextMenuDriver = (function () {
            function ContextMenuDriver(contextMenu) {
                this.contextMenu = contextMenu;
            }
            ContextMenuDriver.prototype.EnableMenuItems = function (optionVisibilities) {
                for (var i = 0; i < optionVisibilities.length; i++) {
                    this.contextMenu.contextmenu("enableEntry", optionVisibilities[i].name, optionVisibilities[i].isEnabled);
                }
            };
            ContextMenuDriver.prototype.ShowMenuItems = function (optionVisibilities) {
                for (var i = 0; i < optionVisibilities.length; i++) {
                    this.contextMenu.contextmenu("showEntry", optionVisibilities[i].name, optionVisibilities[i].isVisible);
                }
            };
            ContextMenuDriver.prototype.GetMenuItems = function () {
                return [];
            };
            return ContextMenuDriver;
        })();
        UIDrivers.ContextMenuDriver = ContextMenuDriver;
        var AccordionHider = (function () {
            function AccordionHider(acc) {
                this.acc = acc;
            }
            AccordionHider.prototype.Hide = function () {
                var coll = this.acc.children().filter('[aria-selected="true"]').trigger("click");
            };
            return AccordionHider;
        })();
        UIDrivers.AccordionHider = AccordionHider;
        var FormulaValidationService = (function () {
            function FormulaValidationService() {
            }
            FormulaValidationService.prototype.Invoke = function (data) {
                return $.ajax({
                    type: "POST",
                    url: "api/Validate",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json"
                });
            };
            return FormulaValidationService;
        })();
        UIDrivers.FormulaValidationService = FormulaValidationService;
        var FurtherTestingService = (function () {
            function FurtherTestingService() {
            }
            FurtherTestingService.prototype.Invoke = function (data) {
                return $.ajax({
                    type: "POST",
                    url: "api/FurtherTesting",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json"
                });
            };
            return FurtherTestingService;
        })();
        UIDrivers.FurtherTestingService = FurtherTestingService;
        var ProofAnalyzeService = (function () {
            function ProofAnalyzeService() {
            }
            ProofAnalyzeService.prototype.Invoke = function (data) {
                return $.ajax({
                    type: "POST",
                    url: "api/Analyze",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json"
                });
            };
            return ProofAnalyzeService;
        })();
        UIDrivers.ProofAnalyzeService = ProofAnalyzeService;
        var LTLAnalyzeService = (function () {
            function LTLAnalyzeService() {
            }
            LTLAnalyzeService.prototype.Invoke = function (data) {
                return $.ajax({
                    type: "POST",
                    url: "api/AnalyzeLTL",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json"
                });
            };
            return LTLAnalyzeService;
        })();
        UIDrivers.LTLAnalyzeService = LTLAnalyzeService;
        var SimulationService = (function () {
            function SimulationService() {
            }
            SimulationService.prototype.Invoke = function (data) {
                return $.ajax({
                    type: "POST",
                    url: "api/Simulate",
                    data: JSON.stringify(data),
                    contentType: "application/json",
                    dataType: "json"
                });
            };
            return SimulationService;
        })();
        UIDrivers.SimulationService = SimulationService;
        var MessageBoxDriver = (function () {
            function MessageBoxDriver() {
            }
            MessageBoxDriver.prototype.Show = function (message) {
                alert(message);
            };
            MessageBoxDriver.prototype.Log = function (message) {
                console.log(message);
            };
            return MessageBoxDriver;
        })();
        UIDrivers.MessageBoxDriver = MessageBoxDriver;
        var ExportService = (function () {
            function ExportService() {
            }
            ExportService.prototype.Export = function (content, name, extension) {
                var ret = saveTextAs(content, name + '.' + extension);
            };
            return ExportService;
        })();
        UIDrivers.ExportService = ExportService;
    })(UIDrivers = BMA.UIDrivers || (BMA.UIDrivers = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=commondrivers.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
var BMA;
(function (BMA) {
    var UIDrivers;
    (function (UIDrivers) {
        var KeyframesExpandedViewer = (function () {
            function KeyframesExpandedViewer(keyframe) {
                this.keyframe = keyframe;
            }
            KeyframesExpandedViewer.prototype.AddState = function (items) {
                //this.keyframe.ltlstatesviewer('addState', items);
            };
            KeyframesExpandedViewer.prototype.GetContent = function () {
                return this.keyframe;
            };
            KeyframesExpandedViewer.prototype.RemovePart = function (p1, p2) {
                //this.keyframe.ltlstatesviewer('removePart', items);
            };
            return KeyframesExpandedViewer;
        })();
        UIDrivers.KeyframesExpandedViewer = KeyframesExpandedViewer;
        var LTLViewer = (function () {
            function LTLViewer(accordion, ltlviewer) {
                var _this = this;
                this.ltlviewer = ltlviewer;
                this.accordion = accordion;
                accordion.bmaaccordion({
                    onactivetabchanged: function () {
                        _this.ltlviewer.ltlviewer("GetTPViewer").temporalpropertiesviewer("refresh");
                    }
                });
            }
            LTLViewer.prototype.AddState = function (items) {
                var resdiv = this.ltlviewer.ltlviewer('Get', 'LTLStates');
                var content = resdiv.resultswindowviewer('option', 'content');
                content.keyframecompact('add', items);
            };
            LTLViewer.prototype.Show = function (tab) {
                if (tab !== undefined) {
                    var content = this.ltlviewer.ltlviewer('Get', tab);
                    content.show();
                }
                else {
                    this.ltlviewer.ltlviewer('Show', undefined);
                }
            };
            LTLViewer.prototype.Hide = function (tab) {
                if (tab !== undefined) {
                    var content = this.ltlviewer.ltlviewer('Get', tab);
                    content.hide();
                }
            };
            LTLViewer.prototype.SetResult = function (res) {
                var resdiv = this.ltlviewer.ltlviewer('Get', 'LTLResults');
                var content = resdiv.resultswindowviewer('option', 'content');
                content.coloredtableviewer({ "colorData": res, type: "color" });
                content.find(".proof-propagation-overview").addClass("ltl-result-table");
                content.find('td.propagation-cell-green').removeClass("propagation-cell-green");
                content.find('td.propagation-cell-red').removeClass("propagation-cell-red").addClass("change");
            };
            LTLViewer.prototype.GetContent = function () {
                return this.ltlviewer;
            };
            LTLViewer.prototype.GetTemporalPropertiesViewer = function () {
                return new BMA.UIDrivers.TemporalPropertiesViewer(this.ltlviewer.ltlviewer("GetTPViewer"));
            };
            LTLViewer.prototype.GetStatesViewer = function () {
                return new BMA.UIDrivers.StatesViewerDriver(this.ltlviewer.ltlviewer("GetStatesViewer"));
            };
            return LTLViewer;
        })();
        UIDrivers.LTLViewer = LTLViewer;
        var TemporalPropertiesEditorDriver = (function () {
            function TemporalPropertiesEditorDriver(commands, popupWindow) {
                this.statesToSet = [];
                this.ftvcallback = undefined;
                this.popupWindow = popupWindow;
                this.commands = commands;
            }
            TemporalPropertiesEditorDriver.prototype.Show = function () {
                var that = this;
                var shouldInit = this.tpeditor === undefined;
                if (shouldInit) {
                    this.tpeditor = $("<div></div>").css("height", "100%");
                }
                this.popupWindow.resultswindowviewer({ header: "", tabid: "", content: this.tpeditor, icon: "min", isResizable: true, onresize: function () { that.OnResize(); } });
                popup_position();
                this.popupWindow.show();
                if (shouldInit) {
                    this.tpeditor.temporalpropertieseditor({ commands: this.commands, states: this.statesToSet });
                    this.svgDriver = new BMA.UIDrivers.SVGPlotDriver(this.tpeditor.temporalpropertieseditor("getDrawingSurface"));
                    this.svgDriver.SetGridVisibility(false);
                    this.contextMenuDriver = new BMA.UIDrivers.ContextMenuDriver(this.tpeditor.temporalpropertieseditor("getContextMenuPanel"));
                }
                this.popupWindow.trigger("resize");
            };
            TemporalPropertiesEditorDriver.prototype.OnResize = function () {
                this.tpeditor.temporalpropertieseditor("updateLayout");
            };
            TemporalPropertiesEditorDriver.prototype.Hide = function () {
                this.popupWindow.hide();
            };
            TemporalPropertiesEditorDriver.prototype.GetSVGDriver = function () {
                return this.svgDriver;
            };
            TemporalPropertiesEditorDriver.prototype.GetNavigationDriver = function () {
                return this.svgDriver;
            };
            TemporalPropertiesEditorDriver.prototype.GetDragService = function () {
                return this.svgDriver;
            };
            TemporalPropertiesEditorDriver.prototype.GetContextMenuDriver = function () {
                return this.contextMenuDriver;
            };
            TemporalPropertiesEditorDriver.prototype.HighlightCopyZone = function (ishighlighted) {
                this.tpeditor.temporalpropertieseditor("highlightcopyzone", ishighlighted);
            };
            TemporalPropertiesEditorDriver.prototype.HighlightDeleteZone = function (ishighlighted) {
                this.tpeditor.temporalpropertieseditor("highlightdeletezone", ishighlighted);
            };
            TemporalPropertiesEditorDriver.prototype.GetCopyZoneBBox = function () {
                return this.tpeditor.temporalpropertieseditor("getcopyzonebbox");
            };
            TemporalPropertiesEditorDriver.prototype.GetDeleteZoneBBox = function () {
                return this.tpeditor.temporalpropertieseditor("getdeletezonebbox");
            };
            TemporalPropertiesEditorDriver.prototype.SetCopyZoneVisibility = function (isVisible) {
                this.tpeditor.temporalpropertieseditor("setcopyzonevisibility", isVisible);
            };
            TemporalPropertiesEditorDriver.prototype.SetDeleteZoneVisibility = function (isVisible) {
                this.tpeditor.temporalpropertieseditor("setdeletezonevisibility", isVisible);
            };
            TemporalPropertiesEditorDriver.prototype.SetStates = function (states) {
                if (this.tpeditor !== undefined) {
                    this.tpeditor.temporalpropertieseditor({ states: states });
                }
                else {
                    this.statesToSet = states;
                }
            };
            TemporalPropertiesEditorDriver.prototype.SetFitToViewCallback = function (callback) {
                this.ftvcallback = callback;
                if (this.tpeditor !== undefined) {
                    this.tpeditor.temporalpropertieseditor({ onfittoview: callback });
                }
            };
            return TemporalPropertiesEditorDriver;
        })();
        UIDrivers.TemporalPropertiesEditorDriver = TemporalPropertiesEditorDriver;
        var StatesViewerDriver = (function () {
            function StatesViewerDriver(statesViewer) {
                this.statesViewer = statesViewer;
            }
            StatesViewerDriver.prototype.SetCommands = function (commands) {
                this.commands = commands;
                this.statesViewer.statescompact({ commands: commands });
            };
            StatesViewerDriver.prototype.SetStates = function (states) {
                var that = this;
                var wstates = [];
                for (var i = 0; i < states.length; i++) {
                    var s = states[i];
                    var ws = {
                        name: s.Name,
                        description: s.Description,
                        formula: [],
                        tooltip: s.GetFormula()
                    };
                    for (var j = 0; j < s.Operands.length; j++) {
                        var opnd = s.Operands[j];
                        var formula = [];
                        formula.push({
                            type: opnd.LeftOperand.Name === undefined ? "const" : "variable",
                            value: opnd.LeftOperand.Name === undefined ? opnd.LeftOperand.Value : opnd.LeftOperand.Name
                        });
                        if (opnd.MiddleOperand !== undefined) {
                            var leftop = opnd.LeftOperator;
                            formula.push({
                                type: "operator",
                                value: leftop
                            });
                            var middle = opnd.MiddleOperand;
                            formula.push({
                                type: middle.Name === undefined ? "const" : "variable",
                                value: middle.Name === undefined ? middle.Value : middle.Name
                            });
                            var rightop = opnd.RightOperator;
                            formula.push({
                                type: "operator",
                                value: rightop
                            });
                        }
                        else {
                            formula.push({
                                type: "operator",
                                value: opnd.Operator
                            });
                        }
                        formula.push({
                            type: opnd.RightOperand.Name === undefined ? "const" : "variable",
                            value: opnd.RightOperand.Name === undefined ? opnd.RightOperand.Value : opnd.RightOperand.Name
                        });
                        ws.formula.push(formula);
                    }
                    wstates.push(ws);
                }
                var statesEditorExpand = function () {
                    window.Commands.Execute("Expand", "LTLStates");
                };
                if (this.statesViewer !== undefined) {
                    this.statesViewer.statescompact({ states: wstates, statesEditorExpand: statesEditorExpand });
                }
            };
            return StatesViewerDriver;
        })();
        UIDrivers.StatesViewerDriver = StatesViewerDriver;
        var StatesEditorDriver = (function () {
            function StatesEditorDriver(commands, popupWindow) {
                this.popupWindow = popupWindow;
                this.commands = commands;
            }
            StatesEditorDriver.prototype.Convert = function (states) {
                var wstates = [];
                for (var i = 0; i < states.length; i++) {
                    var ops = [];
                    var formulas = states[i].formula;
                    var op = undefined;
                    var isEmpty = false;
                    for (var j = 0; j < formulas.length; j++) {
                        var op = undefined;
                        var f = formulas[j];
                        ///
                        //if (f[0] && f[0].type == "variable" && f[0].value && f[0].value.variable && f[1] && f[1].value && f[2]) {
                        //    var operator = f[1].value;
                        //    var constant = parseFloat(f[2].value);
                        //    var operator2;
                        //    var constant2;
                        //    switch (f[1].value) {
                        //        case ">=":
                        //            operator = ">";
                        //            constant--;
                        //            break;
                        //        case "<=":
                        //            operator = "<";
                        //            constant++;
                        //            break;
                        //        case "=":
                        //            operator = "<";
                        //            constant++;
                        //            operator2 = ">"
                        //            constant2 = constant - 2;
                        //            break;
                        //        default: break;
                        //    }
                        //    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable),
                        //        operator, new BMA.LTLOperations.ConstOperand(constant));
                        //    ops.push(op);
                        //    if (operator2 && constant2 !== undefined) {
                        //        op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable),
                        //            operator2, new BMA.LTLOperations.ConstOperand(constant2));
                        //        ops.push(op);
                        //    }
                        //}
                        ///
                        if (f[0] !== undefined && f[0].type == "variable" && f[0].value != 0 && f[0].value.variable) {
                            if (f[1] !== undefined && f[2] !== undefined) {
                                if (f[1].value == ">=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable), ">", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) - 1));
                                else if (f[1].value == "<=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) + 1));
                                else if (f[1].value == "=")
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) - 1), "<", new BMA.LTLOperations.NameOperand(f[0].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) + 1));
                                else
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[0].value.variable), f[1].value, new BMA.LTLOperations.ConstOperand(f[2].value));
                                ops.push(op);
                            }
                        }
                        else if (f[2] !== undefined && f[2].type == "variable" && f[2].value != 0) {
                            if (f[0] !== undefined && f[1] !== undefined && f[3] !== undefined && f[4] !== undefined) {
                                var leftConst = parseFloat(f[0].value);
                                var leftOperand = f[1].value;
                                var rightConst = parseFloat(f[4].value);
                                var rightOperand = f[3].value;
                                var leftEqual = false;
                                var rightEqual = false;
                                if (leftOperand == "<=") {
                                    leftConst--;
                                    leftOperand = "<";
                                }
                                else if (leftOperand == ">=") {
                                    leftConst++;
                                    leftOperand = ">";
                                }
                                else if (leftOperand == "=") {
                                    leftEqual = true;
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(leftConst - 1), "<", new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(leftConst + 1));
                                    ops.push(op);
                                }
                                if (rightOperand == "<=") {
                                    rightConst++;
                                    rightOperand = "<";
                                }
                                else if (rightOperand == ">=") {
                                    rightConst--;
                                    rightOperand = ">";
                                }
                                else if (rightOperand == "=") {
                                    rightEqual = true;
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(rightConst - 1), "<", new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(rightConst + 1));
                                    ops.push(op);
                                }
                                if (!leftEqual && !rightEqual) {
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(leftConst), leftOperand, new BMA.LTLOperations.NameOperand(f[2].value.variable), rightOperand, new BMA.LTLOperations.ConstOperand(rightConst));
                                    ops.push(op);
                                }
                                else if (leftEqual && !rightEqual) {
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), rightOperand, new BMA.LTLOperations.ConstOperand(rightConst));
                                    ops.push(op);
                                }
                                else if (rightEqual && !leftEqual) {
                                    if (leftOperand == ">")
                                        leftOperand = "<";
                                    else
                                        leftOperand = ">";
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), leftOperand, new BMA.LTLOperations.ConstOperand(leftConst));
                                    ops.push(op);
                                }
                            }
                            else if (f[0] !== undefined && f[1] !== undefined && f[3] === undefined && f[4] === undefined) {
                                if (f[1].value == ">=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[0].value) + 1));
                                else if (f[1].value == "<=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), ">", new BMA.LTLOperations.ConstOperand(parseFloat(f[0].value) - 1));
                                else if (f[1].value == "=")
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(parseFloat(f[0].value) - 1), "<", new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[0].value) + 1));
                                else if (f[1].value == "<")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), ">", new BMA.LTLOperations.ConstOperand(f[0].value));
                                else if (f[1].value == ">")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(f[0].value));
                                ops.push(op);
                            }
                            else if (f[0] === undefined && f[1] === undefined && f[3] !== undefined && f[4] !== undefined) {
                                if (f[3].value == ">=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), ">", new BMA.LTLOperations.ConstOperand(parseFloat(f[4].value) - 1));
                                else if (f[3].value == "<=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[4].value) + 1));
                                else if (f[3].value == "=")
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(parseFloat(f[4].value) - 1), "<", new BMA.LTLOperations.NameOperand(f[2].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[4].value) + 1));
                                else
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[2].value.variable), f[3].value, new BMA.LTLOperations.ConstOperand(f[4].value));
                                ops.push(op);
                            }
                        }
                        else if (f[4] !== undefined && f[4].type == "variable" && f[4].value != 0) {
                            if (f[2] !== undefined && f[3] !== undefined) {
                                if (f[3].value == ">=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[4].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) + 1));
                                else if (f[3].value == "<=")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[4].value.variable), ">", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) - 1));
                                else if (f[3].value == "=")
                                    op = new BMA.LTLOperations.DoubleKeyframeEquation(new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) - 1), "<", new BMA.LTLOperations.NameOperand(f[4].value.variable), "<", new BMA.LTLOperations.ConstOperand(parseFloat(f[2].value) + 1));
                                else if (f[3].value == ">")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[4].value.variable), "<", new BMA.LTLOperations.ConstOperand(f[2].value));
                                else if (f[3].value == "<")
                                    op = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(f[4].value.variable), ">", new BMA.LTLOperations.ConstOperand(f[2].value));
                                ops.push(op);
                            }
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
            };
            StatesEditorDriver.prototype.Show = function () {
                var shouldInit = this.statesEditor === undefined;
                if (shouldInit) {
                    this.statesEditor = $("<div></div>");
                }
                this.popupWindow.resultswindowviewer({ header: "States", tabid: "", content: this.statesEditor, icon: "min", isResizable: false });
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
                    if (this.variablesToSet !== undefined) {
                        this.statesEditor.stateseditor({ variables: this.variablesToSet });
                        this.variablesToSet = undefined;
                    }
                    if (this.statesToSet !== undefined) {
                        this.statesEditor.stateseditor({ states: this.statesToSet });
                        this.statesToSet = undefined;
                    }
                }
            };
            StatesEditorDriver.prototype.Hide = function () {
                this.popupWindow.hide();
            };
            StatesEditorDriver.prototype.SetModel = function (model, layout) {
                var allGroup = {
                    name: "ALL",
                    id: 0,
                    vars: []
                };
                for (var i = 0; i < model.Variables.length; i++) {
                    allGroup.vars.push(model.Variables[i].Name);
                }
                var variables = [allGroup];
                for (var i = 0; i < layout.Containers.length; i++) {
                    var vars = [];
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
                }
                else {
                    this.variablesToSet = variables;
                }
            };
            StatesEditorDriver.prototype.SetStates = function (states) {
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
                            type: opnd.LeftOperand.Name === undefined ? "const" : "variable",
                            value: opnd.LeftOperand.Name === undefined ? opnd.LeftOperand.Value : { variable: opnd.LeftOperand.Name }
                        };
                        formulaPart.push(op);
                        if (opnd.MiddleOperand !== undefined) {
                            var leftop = opnd.LeftOperator;
                            formulaPart.push({
                                type: "operator",
                                value: leftop
                            });
                            var middle = opnd.MiddleOperand;
                            formulaPart.push({
                                type: middle.Name === undefined ? "const" : "variable",
                                value: middle.Name === undefined ? middle.Value : { variable: middle.Name }
                            });
                            var rightop = opnd.RightOperator;
                            formulaPart.push({
                                type: "operator",
                                value: rightop
                            });
                        }
                        else {
                            formulaPart.push({
                                type: "operator",
                                value: opnd.Operator
                            });
                        }
                        formulaPart.push({
                            type: opnd.RightOperand.Name === undefined ? "const" : "variable",
                            value: opnd.RightOperand.Name === undefined ? opnd.RightOperand.Value : { variable: opnd.RightOperand.Name }
                        });
                        ws.formula.push(formulaPart);
                    }
                    wstates.push(ws);
                }
                if (this.statesEditor !== undefined) {
                    this.statesEditor.stateseditor({ states: wstates });
                }
                else {
                    this.statesToSet = wstates;
                }
            };
            return StatesEditorDriver;
        })();
        UIDrivers.StatesEditorDriver = StatesEditorDriver;
        var TemporalPropertiesViewer = (function () {
            function TemporalPropertiesViewer(tpviewer) {
                this.tpviewer = tpviewer;
            }
            TemporalPropertiesViewer.prototype.SetOperations = function (operations) {
                this.tpviewer.temporalpropertiesviewer({ operations: operations });
            };
            TemporalPropertiesViewer.prototype.Refresh = function () {
                this.tpviewer.temporalpropertiesviewer("refresh");
            };
            return TemporalPropertiesViewer;
        })();
        UIDrivers.TemporalPropertiesViewer = TemporalPropertiesViewer;
        var LTLResultsViewerFactory = (function () {
            function LTLResultsViewerFactory() {
            }
            LTLResultsViewerFactory.prototype.CreateCompactLTLViewer = function (div) {
                return new LTLResultsCompactViewer(div);
            };
            return LTLResultsViewerFactory;
        })();
        UIDrivers.LTLResultsViewerFactory = LTLResultsViewerFactory;
        var LTLResultsCompactViewer = (function () {
            function LTLResultsCompactViewer(compactltlresult) {
                this.compactltlresult = undefined;
                this.steps = 10;
                var that = this;
                this.compactltlresult = compactltlresult;
                this.compactltlresult.compactltlresult({
                    status: "nottested",
                    isexpanded: false,
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
                    onshowresultsrequested: function () {
                        if (that.showresultcallback !== undefined) {
                            that.showresultcallback();
                        }
                    }
                });
            }
            LTLResultsCompactViewer.prototype.SetStatus = function (status) {
                this.compactltlresult.compactltlresult({ status: status, isexpanded: false });
            };
            LTLResultsCompactViewer.prototype.GetSteps = function () {
                return this.steps;
            };
            LTLResultsCompactViewer.prototype.SetLTLRequestedCallback = function (callback) {
                this.ltlrequested = callback;
            };
            LTLResultsCompactViewer.prototype.SetOnExpandedCallback = function (callback) {
                this.expandedcallback = callback;
            };
            LTLResultsCompactViewer.prototype.SetShowResultsCallback = function (callback) {
                this.showresultcallback = callback;
            };
            return LTLResultsCompactViewer;
        })();
        UIDrivers.LTLResultsCompactViewer = LTLResultsCompactViewer;
        var LTLResultsViewer = (function () {
            function LTLResultsViewer(commands, popupWindow) {
                this.exportCSVcallback = undefined;
                this.dataToSet = undefined;
                this.popupWindow = popupWindow;
                this.commands = commands;
            }
            LTLResultsViewer.prototype.Show = function () {
                var that = this;
                var shouldInit = this.ltlResultsViewer === undefined;
                if (shouldInit) {
                    this.ltlResultsViewer = $("<div></div>");
                }
                this.popupWindow.resultswindowviewer({ header: "LTL Simulation", tabid: "", content: this.ltlResultsViewer, icon: "min", isResizable: false });
                popup_position();
                this.popupWindow.show();
                if (shouldInit) {
                    if (this.dataToSet !== undefined) {
                        this.ltlResultsViewer.ltlresultsviewer(this.dataToSet);
                        this.dataToSet = undefined;
                    }
                    else {
                        this.ltlResultsViewer.ltlresultsviewer();
                    }
                    if (this.exportCSVcallback !== undefined) {
                        this.ltlResultsViewer.ltlresultsviewer({ onExportCSV: that.exportCSVcallback });
                        this.exportCSVcallback = undefined;
                    }
                }
            };
            LTLResultsViewer.prototype.Hide = function () {
                this.popupWindow.hide();
            };
            LTLResultsViewer.prototype.Compare = function (value1, value2, operator) {
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
                    default:
                        throw "Unknown operator";
                }
            };
            LTLResultsViewer.prototype.SetData = function (model, layout, ticks, states) {
                var that = this;
                var vars = model.Variables.sort(function (x, y) {
                    return x.Id < y.Id ? -1 : 1;
                });
                var id = [];
                var init = [];
                var data = [];
                var pData = [];
                var ranges = [];
                var variables = [];
                var tags = [];
                for (var i = 0; i < vars.length; i++) {
                    id.push(vars[i].Id);
                    ranges.push({
                        min: vars[i].RangeFrom,
                        max: vars[i].RangeTo
                    });
                    var color = this.getRandomColor();
                    variables.push([color, true, vars[i].Name, vars[i].RangeFrom, vars[i].RangeTo]);
                }
                ticks = ticks.sort(function (x, y) {
                    return x.Time < y.Time ? -1 : 1;
                });
                for (var i = 0; i < ticks.length; i++) {
                    var tick = ticks[i].Variables;
                    if (i != 0) {
                        data.push([]);
                        tags.push([]);
                    }
                    for (var k = 0; k < vars.length; k++) {
                        for (var j = 0; j < tick.length; j++) {
                            if (tick[j].Id == vars[k].Id) {
                                var ij = tick[j];
                                if (ij.Lo === ij.Hi) {
                                    (i == 0) ? init.push(ij.Lo) : data[i - 1].push(ij.Lo);
                                }
                                else {
                                    (i == 0) ? init.push(ij.Lo + ' - ' + ij.Hi) : data[i - 1].push(ij.Lo + ' - ' + ij.Hi);
                                }
                            }
                        }
                    }
                }
                for (var i = 0; i < states.length; i++) {
                    var state = states[i];
                    for (var k = 0; k < data.length; k++) {
                        var result = true;
                        for (var j = 0; j < state.Operands.length; j++) {
                            var op = state.Operands[j];
                            if (op instanceof BMA.LTLOperations.KeyframeEquation) {
                                if (op.LeftOperand instanceof BMA.LTLOperations.NameOperand) {
                                    var varName = op.LeftOperand.Name;
                                    var ind;
                                    for (var n = 0; n < vars.length; n++)
                                        if (vars[n].Name == varName) {
                                            ind = n;
                                            break;
                                        }
                                    var curValue = data[k][ind];
                                    var rightOp = (op.RightOperand instanceof BMA.LTLOperations.ConstOperand) ? op.RightOperand.Value :
                                        undefined;
                                    result = result && this.Compare(curValue, rightOp, op.Operator);
                                }
                                else {
                                    var varName = op.RightOperand.Name;
                                    var ind;
                                    for (var n = 0; n < vars.length; n++)
                                        if (vars[n].Name == varName) {
                                            ind = n;
                                            break;
                                        }
                                    var curValue = data[k][ind];
                                    var leftOp = (op.LeftOperand instanceof BMA.LTLOperations.ConstOperand) ? op.LeftOperand.Value :
                                        undefined;
                                    result = result && this.Compare(leftOp, curValue, op.Operator);
                                }
                            }
                            else if (op instanceof BMA.LTLOperations.DoubleKeyframeEquation) {
                                var varName = op.MiddleOperand.Name;
                                var ind;
                                for (var n = 0; n < vars.length; n++)
                                    if (vars[n].Name == varName) {
                                        ind = n;
                                        break;
                                    }
                                var curValue = data[k][ind];
                                var rightOp = (op.RightOperand instanceof BMA.LTLOperations.ConstOperand) ? op.RightOperand.Value :
                                    undefined;
                                var leftOp = (op.LeftOperand instanceof BMA.LTLOperations.ConstOperand) ? op.LeftOperand.Value :
                                    undefined;
                                result = result && this.Compare(leftOp, curValue, op.LeftOperator) && this.Compare(curValue, rightOp, op.RightOperator);
                            }
                        }
                        if (state.Operands.length !== 0 && result)
                            tags[k].push(state.Name);
                    }
                }
                var labels_height = Math.max.apply(Math, ranges.map(function (s) { return s.max; }))
                    - Math.min.apply(Math, ranges.map(function (s) { return s.min; }));
                var labels = [];
                var count = (tags.length > 0) ? 1 : 0;
                var firstTime = 0;
                var prevState = undefined;
                var compareTags = function (prev, curr) {
                    if (prev === undefined)
                        return false;
                    if (prev.length === curr.length) {
                        for (var j = 0; j < prev.length; j++) {
                            if (prev[j] !== curr[j])
                                return false;
                        }
                        return true;
                    }
                    return false;
                };
                for (var i = 0; i < tags.length; i++) {
                    if (!compareTags(prevState, tags[i])) {
                        if (prevState !== undefined && prevState.length !== 0 && count > 1)
                            labels.push({
                                text: prevState,
                                width: count,
                                height: labels_height,
                                x: firstTime,
                                y: 0,
                            });
                        prevState = tags[i];
                        firstTime = i + 1;
                        count = 1;
                    }
                    else {
                        count++;
                        if (i == tags.length - 1 && prevState.length !== 0 && count > 2)
                            labels.push({
                                text: prevState,
                                width: count - 1,
                                height: labels_height,
                                x: firstTime,
                                y: 0,
                            });
                    }
                }
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
                }
                else {
                    that.dataToSet = options;
                }
            };
            LTLResultsViewer.prototype.CreateInterval = function (variables) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = variables[i].RangeFrom;
                    table[i][1] = variables[i].RangeTo;
                }
                return table;
            };
            LTLResultsViewer.prototype.getRandomColor = function () {
                var r = this.GetRandomInt(0, 255);
                var g = this.GetRandomInt(0, 255);
                var b = this.GetRandomInt(0, 255);
                return "rgb(" + r + ", " + g + ", " + b + ")";
            };
            LTLResultsViewer.prototype.GetRandomInt = function (min, max) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            };
            LTLResultsViewer.prototype.SetOnExportCSV = function (callback) {
                if (this.ltlResultsViewer !== undefined) {
                    this.ltlResultsViewer.ltlresultsviewer({ onExportCSV: callback });
                }
                else {
                    this.exportCSVcallback = callback;
                }
            };
            return LTLResultsViewer;
        })();
        UIDrivers.LTLResultsViewer = LTLResultsViewer;
    })(UIDrivers = BMA.UIDrivers || (BMA.UIDrivers = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=ltldrivers.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var UndoRedoPresenter = (function () {
            function UndoRedoPresenter(appModel, undoButton, redoButton) {
                var _this = this;
                this.currentModelIndex = -1;
                var that = this;
                this.appModel = appModel;
                this.undoButton = undoButton;
                this.redoButton = redoButton;
                window.Commands.On("Undo", function () {
                    _this.Undo();
                });
                window.Commands.On("Redo", function () {
                    _this.Redo();
                });
                window.Commands.On("ModelReset", function () {
                    _this.Set(_this.appModel.BioModel, _this.appModel.Layout);
                });
                this.Set(this.appModel.BioModel, this.appModel.Layout);
            }
            UndoRedoPresenter.prototype.OnModelUpdated = function (status) {
                this.undoButton.Turn(this.CanUndo);
                this.redoButton.Turn(this.CanRedo);
                this.appModel.BioModel = this.Current.model;
                this.appModel.Layout = this.Current.layout;
                window.Commands.Execute("DrawingSurfaceRefreshOutput", { status: status });
            };
            UndoRedoPresenter.prototype.Undo = function () {
                if (this.CanUndo) {
                    --this.currentModelIndex;
                    this.OnModelUpdated("Undo");
                }
            };
            UndoRedoPresenter.prototype.Redo = function () {
                if (this.CanRedo) {
                    ++this.currentModelIndex;
                    this.OnModelUpdated("Redo");
                }
            };
            UndoRedoPresenter.prototype.Truncate = function () {
                this.models.length = this.currentModelIndex + 1;
            };
            UndoRedoPresenter.prototype.Dup = function (m, l) {
                this.Truncate();
                var current = this.Current;
                this.models[this.currentModelIndex] = { model: current.model.Clone(), layout: current.layout.Clone() };
                this.models.push({ model: m, layout: l });
                ++this.currentModelIndex;
                this.OnModelUpdated("Dup");
            };
            Object.defineProperty(UndoRedoPresenter.prototype, "CanUndo", {
                get: function () {
                    return this.currentModelIndex > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(UndoRedoPresenter.prototype, "CanRedo", {
                get: function () {
                    return this.currentModelIndex < this.models.length - 1;
                },
                enumerable: true,
                configurable: true
            });
            UndoRedoPresenter.prototype.Set = function (m, l) {
                this.models = [{ model: m, layout: l }];
                this.currentModelIndex = 0;
                this.OnModelUpdated("Set");
            };
            Object.defineProperty(UndoRedoPresenter.prototype, "Current", {
                get: function () {
                    return this.models[this.currentModelIndex];
                },
                enumerable: true,
                configurable: true
            });
            return UndoRedoPresenter;
        })();
        Presenters.UndoRedoPresenter = UndoRedoPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=undoredopresenter.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\model\biomodel.ts"/>
/// <reference path="..\model\model.ts"/>
/// <reference path="..\uidrivers\commondrivers.ts"/>
/// <reference path="..\commands.ts"/>
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var DesignSurfacePresenter = (function () {
            function DesignSurfacePresenter(appModel, undoRedoPresenter, svgPlotDriver, navigationDriver, dragService, variableEditorDriver, containerEditorDriver, contextMenu, exportservice) {
                var _this = this;
                this.xOrigin = 0;
                this.yOrigin = 0;
                this.xStep = 250;
                this.yStep = 280;
                this.variableIndex = 1;
                this.stagingLine = undefined;
                this.stagingGroup = undefined;
                this.stagingVariable = undefined;
                this.stagingContainer = undefined;
                this.editingId = undefined;
                var that = this;
                this.appModel = appModel;
                this.undoRedoPresenter = undoRedoPresenter;
                this.driver = svgPlotDriver;
                this.navigationDriver = navigationDriver;
                this.variableEditor = variableEditorDriver;
                this.containerEditor = containerEditorDriver;
                this.contextMenu = contextMenu;
                this.exportservice = exportservice;
                svgPlotDriver.SetGrid(this.xOrigin, this.yOrigin, this.xStep, this.yStep);
                window.Commands.On('SaveSVG', function () {
                    that.exportservice.Export(that.driver.GetSVG(), appModel.BioModel.Name, 'svg');
                });
                window.Commands.On("AddElementSelect", function (type) {
                    that.selectedType = type;
                    that.navigationDriver.TurnNavigation(type === undefined);
                    that.stagingLine = undefined;
                    //this.selectedType = this.selectedType === type ? undefined : type;
                    //this.driver.TurnNavigation(this.selectedType === undefined);
                });
                window.Commands.On("DrawingSurfaceClick", function (args) {
                    if (that.selectedType !== undefined) {
                        if ((that.selectedType === "Activator" || that.selectedType === "Inhibitor")) {
                            var id = that.GetVariableAtPosition(args.x, args.y);
                            if (id !== undefined) {
                                if (_this.stagingLine === undefined) {
                                    _this.stagingLine = {};
                                    _this.stagingLine.id = id;
                                    _this.stagingLine.x0 = args.x;
                                    _this.stagingLine.y0 = args.y;
                                    return;
                                }
                                else {
                                    _this.stagingLine.x1 = args.x;
                                    _this.stagingLine.y1 = args.y;
                                    that.TryAddStagingLineAsLink();
                                    _this.stagingLine = undefined;
                                    that.RefreshOutput();
                                    return;
                                }
                            }
                            else {
                                _this.stagingLine = undefined;
                            }
                        }
                        else {
                            that.TryAddVariable(args.x, args.y, that.selectedType, undefined);
                        }
                    }
                    else {
                        var id = that.GetVariableAtPosition(args.x, args.y);
                        if (id !== undefined) {
                            that.editingId = id;
                            that.variableEditor.Initialize(that.GetVariableById(that.undoRedoPresenter.Current.layout, that.undoRedoPresenter.Current.model, id).model, that.undoRedoPresenter.Current.model);
                            that.variableEditor.Show(args.screenX, args.screenY);
                            window.Commands.Execute("DrawingSurfaceVariableEditorOpened", undefined);
                        }
                        else {
                            var cid = that.GetContainerAtPosition(args.x, args.y);
                            if (cid !== undefined) {
                                that.editingId = cid;
                                that.containerEditor.Initialize(that.undoRedoPresenter.Current.layout.GetContainerById(cid));
                                that.containerEditor.Show(args.screenX, args.screenY);
                                window.Commands.Execute("DrawingSurfaceContainerEditorOpened", undefined);
                            }
                        }
                    }
                });
                window.Commands.On("VariableEdited", function () {
                    var that = _this;
                    if (that.editingId !== undefined) {
                        var model = _this.undoRedoPresenter.Current.model;
                        var variables = model.Variables;
                        var editingVariableIndex = -1;
                        for (var i = 0; i < variables.length; i++) {
                            if (variables[i].Id === that.editingId) {
                                editingVariableIndex = i;
                                break;
                            }
                        }
                        if (editingVariableIndex !== -1) {
                            var params = that.variableEditor.GetVariableProperties();
                            model.SetVariableProperties(variables[i].Id, params.name, params.rangeFrom, params.rangeTo, params.formula);
                            that.RefreshOutput();
                        }
                    }
                });
                window.Commands.On("ContainerNameEdited", function () {
                    var that = _this;
                    if (that.editingId !== undefined) {
                        var layout = _this.undoRedoPresenter.Current.layout;
                        var cnt = layout.GetContainerById(that.editingId);
                        if (cnt !== undefined) {
                            cnt.Name = that.containerEditor.GetContainerName();
                            that.RefreshOutput();
                        }
                    }
                });
                window.Commands.On("DrawingSurfaceContextMenuOpening", function (args) {
                    var x = that.driver.GetPlotX(args.left);
                    var y = that.driver.GetPlotY(args.top);
                    var id = that.GetVariableAtPosition(x, y);
                    var containerId = that.GetContainerAtPosition(x, y);
                    var relationshipId = that.GetRelationshipAtPosition(x, y, 3 * that.driver.GetPixelWidth());
                    var cntSize = containerId !== undefined ? that.undoRedoPresenter.Current.layout.GetContainerById(containerId).Size : undefined;
                    var showPaste = that.clipboard !== undefined;
                    if (showPaste === true) {
                        if (that.clipboard.Container !== undefined) {
                            showPaste = that.CanAddContainer(x, y, that.clipboard.Container.Size);
                        }
                        else {
                            var variable = that.clipboard.Variables[0];
                            showPaste = that.CanAddVariable(x, y, variable.m.Type, undefined);
                        }
                    }
                    var canPaste = true;
                    if (showPaste !== true && id === undefined && containerId === undefined && relationshipId === undefined) {
                        showPaste = true;
                        canPaste = false;
                    }
                    that.contextMenu.ShowMenuItems([
                        { name: "Cut", isVisible: id !== undefined || containerId !== undefined },
                        { name: "Copy", isVisible: id !== undefined || containerId !== undefined },
                        { name: "Paste", isVisible: showPaste },
                        { name: "Delete", isVisible: id !== undefined || containerId !== undefined || relationshipId !== undefined },
                        { name: "Size", isVisible: containerId !== undefined },
                        { name: "ResizeCellTo1x1", isVisible: true },
                        { name: "ResizeCellTo2x2", isVisible: true },
                        { name: "ResizeCellTo3x3", isVisible: true },
                        { name: "Edit", isVisible: id !== undefined || containerId !== undefined }
                    ]);
                    that.contextMenu.EnableMenuItems([
                        { name: "Paste", isEnabled: canPaste }
                    ]);
                    that.contextElement = { x: x, y: y, screenX: args.left, screenY: args.top };
                    if (id !== undefined) {
                        that.contextElement.id = id;
                        that.contextElement.type = "variable";
                    }
                    else if (containerId !== undefined) {
                        that.contextElement.id = containerId;
                        that.contextElement.type = "container";
                    }
                    else if (relationshipId !== undefined) {
                        that.contextElement.id = relationshipId;
                        that.contextElement.type = "relationship";
                    }
                });
                window.Commands.On("DrawingSurfaceDelete", function (args) {
                    if (that.contextElement !== undefined) {
                        if (that.contextElement.type === "variable") {
                            that.RemoveVariable(that.contextElement.id);
                        }
                        else if (that.contextElement.type === "relationship") {
                            that.RemoveRelationship(that.contextElement.id);
                        }
                        else if (that.contextElement.type === "container") {
                            that.RemoveContainer(that.contextElement.id);
                        }
                        that.contextElement = undefined;
                    }
                });
                window.Commands.On("DrawingSurfaceCopy", function (args) {
                    that.CopyToClipboard(false);
                });
                window.Commands.On("DrawingSurfaceCut", function (args) {
                    that.CopyToClipboard(true);
                });
                window.Commands.On("DrawingSurfacePaste", function (args) {
                    if (that.clipboard !== undefined) {
                        if (that.clipboard.Container !== undefined) {
                            var model = that.undoRedoPresenter.Current.model;
                            var layout = that.undoRedoPresenter.Current.layout;
                            var idDic = {};
                            var clipboardContainer = that.clipboard.Container;
                            var variables = model.Variables.slice(0);
                            var variableLayouts = layout.Variables.slice(0);
                            var containerLayouts = layout.Containers.slice(0);
                            var relationships = model.Relationships.slice(0);
                            var newContainerId = that.variableIndex++;
                            var gridCell = that.GetGridCell(that.contextElement.x, that.contextElement.y);
                            containerLayouts.push(new BMA.Model.ContainerLayout(newContainerId, clipboardContainer.Name, clipboardContainer.Size, gridCell.x, gridCell.y));
                            var oldContainerOffset = {
                                x: clipboardContainer.PositionX * that.Grid.xStep + that.Grid.x0,
                                y: clipboardContainer.PositionY * that.Grid.yStep + that.Grid.y0,
                            };
                            var newContainerOffset = {
                                x: gridCell.x * that.Grid.xStep + that.Grid.x0,
                                y: gridCell.y * that.Grid.yStep + that.Grid.y0,
                            };
                            for (var i = 0; i < that.clipboard.Variables.length; i++) {
                                var variable = that.clipboard.Variables[i].m;
                                var variableLayout = that.clipboard.Variables[i].l;
                                idDic[variable.Id] = that.variableIndex;
                                var offsetX = variableLayout.PositionX - oldContainerOffset.x;
                                var offsetY = variableLayout.PositionY - oldContainerOffset.y;
                                variables.push(new BMA.Model.Variable(that.variableIndex, newContainerId, variable.Type, variable.Name, variable.RangeFrom, variable.RangeTo, variable.Formula));
                                variableLayouts.push(new BMA.Model.VariableLayout(that.variableIndex++, newContainerOffset.x + offsetX, newContainerOffset.y + offsetY, 0, 0, variableLayout.Angle));
                            }
                            for (var i = 0; i < that.clipboard.Realtionships.length; i++) {
                                var relationship = that.clipboard.Realtionships[i];
                                relationships.push(new BMA.Model.Relationship(that.variableIndex++, idDic[relationship.FromVariableId], idDic[relationship.ToVariableId], relationship.Type));
                            }
                            var newmodel = new BMA.Model.BioModel(model.Name, variables, relationships);
                            var newlayout = new BMA.Model.Layout(containerLayouts, variableLayouts);
                            that.undoRedoPresenter.Dup(newmodel, newlayout);
                        }
                        else {
                            var variable = that.clipboard.Variables[0].m;
                            var variableLayout = that.clipboard.Variables[0].l;
                            var model = that.undoRedoPresenter.Current.model;
                            var layout = that.undoRedoPresenter.Current.layout;
                            var variables = model.Variables.slice(0);
                            var variableLayouts = layout.Variables.slice(0);
                            variables.push(new BMA.Model.Variable(that.variableIndex, variable.ContainerId, variable.Type, variable.Name, variable.RangeFrom, variable.RangeTo, variable.Formula));
                            variableLayouts.push(new BMA.Model.VariableLayout(that.variableIndex++, that.contextElement.x, that.contextElement.y, 0, 0, variableLayout.Angle));
                            var newmodel = new BMA.Model.BioModel(model.Name, variables, model.Relationships);
                            var newlayout = new BMA.Model.Layout(layout.Containers, variableLayouts);
                            that.undoRedoPresenter.Dup(newmodel, newlayout);
                        }
                    }
                    //that.clipboard = undefined;
                });
                window.Commands.On("DrawingSurfaceResizeCell", function (args) {
                    if (that.contextElement !== undefined && that.contextElement.type === "container") {
                        var resized = BMA.ModelHelper.ResizeContainer(undoRedoPresenter.Current.model, undoRedoPresenter.Current.layout, that.contextElement.id, args.size, { xOrigin: that.xOrigin, yOrigin: that.yOrigin, xStep: that.xStep, yStep: that.yStep });
                        _this.undoRedoPresenter.Dup(resized.model, resized.layout);
                    }
                });
                window.Commands.On("DrawingSurfaceEdit", function () {
                    if (that.contextElement !== undefined && that.contextElement.type === "variable") {
                        var id = that.contextElement.id;
                        that.editingId = id;
                        that.variableEditor.Initialize(that.GetVariableById(that.undoRedoPresenter.Current.layout, that.undoRedoPresenter.Current.model, id).model, that.undoRedoPresenter.Current.model);
                        that.variableEditor.Show(that.contextElement.screenX, that.contextElement.screenY);
                        window.Commands.Execute("DrawingSurfaceVariableEditorOpened", undefined);
                    }
                    else if (that.contextElement !== undefined && that.contextElement.type === "container") {
                        var id = that.contextElement.id;
                        that.editingId = id;
                        that.containerEditor.Initialize(that.undoRedoPresenter.Current.layout.GetContainerById(id));
                        that.containerEditor.Show(that.contextElement.screenX, that.contextElement.screenY);
                        window.Commands.Execute("DrawingSurfaceContainerEditorOpened", undefined);
                    }
                    that.contextElement = undefined;
                });
                window.Commands.On("DrawingSurfaceRefreshOutput", function (args) {
                    if (_this.undoRedoPresenter.Current !== undefined) {
                        if (args !== undefined) {
                            if (args.status === "Undo" || args.status === "Redo" || args.status === "Set") {
                                _this.variableEditor.Hide();
                                _this.editingId = undefined;
                            }
                            if (args.status === "Set") {
                                _this.ResetVariableIdIndex();
                                var center = _this.GetLayoutCentralPoint();
                                var bbox = BMA.ModelHelper.GetModelBoundingBox(_this.undoRedoPresenter.Current.layout, { xOrigin: _this.Grid.x0, yOrigin: _this.Grid.y0, xStep: _this.Grid.xStep, yStep: _this.Grid.yStep });
                                _this.driver.SetVisibleRect(bbox);
                            }
                        }
                        if (that.editingId !== undefined) {
                            var v = that.undoRedoPresenter.Current.model.GetVariableById(that.editingId);
                            if (v !== undefined) {
                                that.variableEditor.Initialize(that.GetVariableById(that.undoRedoPresenter.Current.layout, that.undoRedoPresenter.Current.model, that.editingId).model, that.undoRedoPresenter.Current.model);
                            }
                            else {
                                that.containerEditor.Initialize(that.undoRedoPresenter.Current.layout.GetContainerById(that.editingId));
                            }
                        }
                        that.RefreshOutput();
                    }
                });
                window.Commands.On("ModelFitToView", function (args) {
                    if (_this.undoRedoPresenter.Current !== undefined) {
                        var bbox = BMA.ModelHelper.GetModelBoundingBox(_this.undoRedoPresenter.Current.layout, { xOrigin: _this.Grid.x0, yOrigin: _this.Grid.y0, xStep: _this.Grid.xStep, yStep: _this.Grid.yStep });
                        if (bbox.width > window.PlotSettings.MaxWidth) {
                            //window.PlotSettings.MaxWidth = bbox.width;
                            window.Commands.Execute('SetPlotSettings', { MaxWidth: bbox.width });
                        }
                        _this.driver.SetVisibleRect(bbox);
                    }
                });
                window.Commands.On("DrawingSurfaceSetProofResults", function (args) {
                    if (_this.svg !== undefined && _this.undoRedoPresenter.Current !== undefined) {
                        var drawingSvg = _this.CreateSvg(args);
                        _this.driver.Draw(drawingSvg);
                    }
                });
                window.Commands.On("DrawingSurfaceVariableEditorOpened", function (args) {
                    _this.containerEditor.Hide();
                });
                window.Commands.On("DrawingSurfaceContainerEditorOpened", function (args) {
                    _this.variableEditor.Hide();
                });
                var svgCnt = $("<div></div>");
                svgCnt.svg({
                    onLoad: function (svg) {
                        _this.svg = svg;
                        that.RefreshOutput();
                    }
                });
                var dragSubject = dragService.GetDragSubject();
                window.Commands.On("ZoomSliderChanged", function (args) {
                    if (args.isExternal !== true) {
                        var value = args.value * 24 + 800;
                        navigationDriver.SetZoom(value);
                    }
                });
                window.Commands.On("VisibleRectChanged", function (param) {
                    if (param < window.PlotSettings.MinWidth) {
                        param = window.PlotSettings.MinWidth;
                        navigationDriver.SetZoom(param);
                    }
                    if (param > window.PlotSettings.MaxWidth) {
                        param = window.PlotSettings.MaxWidth;
                        navigationDriver.SetZoom(param);
                    }
                    var zoom = (param - window.PlotSettings.MinWidth) / 24;
                    window.Commands.Execute("ZoomSliderBind", zoom);
                });
                dragSubject.dragStart.subscribe(function (gesture) {
                    if ((that.selectedType === "Activator" || that.selectedType === "Inhibitor")) {
                        var id = that.GetVariableAtPosition(gesture.x, gesture.y);
                        if (id !== undefined) {
                            _this.stagingLine = {};
                            _this.stagingLine.id = id;
                            _this.stagingLine.x0 = gesture.x;
                            _this.stagingLine.y0 = gesture.y;
                            return;
                        }
                    }
                    else if (that.selectedType === undefined) {
                        var id = _this.GetVariableAtPosition(gesture.x, gesture.y);
                        var containerId = _this.GetContainerAtPosition(gesture.x, gesture.y);
                        if (id !== undefined) {
                            that.navigationDriver.TurnNavigation(false);
                            var vl = that.GetVariableById(that.undoRedoPresenter.Current.layout, that.undoRedoPresenter.Current.model, id);
                            that.stagingVariable = { model: vl.model, layout: vl.layout };
                        }
                        else if (containerId !== undefined) {
                            that.navigationDriver.TurnNavigation(false);
                            var cl = that.undoRedoPresenter.Current.layout.GetContainerById(containerId);
                            that.stagingContainer = { container: cl };
                        }
                        else {
                            that.navigationDriver.TurnNavigation(true);
                        }
                    }
                    _this.stagingLine = undefined;
                });
                dragSubject.drag.subscribe(function (gesture) {
                    if ((that.selectedType === "Activator" || that.selectedType === "Inhibitor") && that.stagingLine !== undefined) {
                        _this.stagingLine.x1 = gesture.x1;
                        _this.stagingLine.y1 = gesture.y1;
                        //Redraw only svg for better performance
                        if (that.svg !== undefined) {
                            that.driver.DrawLayer2(that.CreateStagingSvg());
                        }
                        return;
                    }
                    else if (that.stagingVariable !== undefined) {
                        that.stagingVariable.layout = new BMA.Model.VariableLayout(that.stagingVariable.layout.Id, gesture.x1, gesture.y1, 0, 0, 0);
                        if (that.svg !== undefined) {
                            that.driver.DrawLayer2(that.CreateStagingSvg());
                        }
                    }
                    else if (_this.stagingContainer !== undefined) {
                        that.stagingContainer.position = { x: gesture.x1, y: gesture.y1 };
                        if (that.svg !== undefined) {
                            that.driver.DrawLayer2(that.CreateStagingSvg());
                        }
                    }
                });
                dragSubject.dragEnd.subscribe(function (gesture) {
                    that.driver.DrawLayer2(undefined);
                    if ((that.selectedType === "Activator" || that.selectedType === "Inhibitor") && that.stagingLine !== undefined && that.stagingLine.x1 !== undefined) {
                        that.TryAddStagingLineAsLink();
                        that.stagingLine = undefined;
                        that.RefreshOutput();
                    }
                    if (that.stagingVariable !== undefined) {
                        var x = that.stagingVariable.layout.PositionX;
                        var y = that.stagingVariable.layout.PositionY;
                        var type = that.stagingVariable.model.Type;
                        var id = that.stagingVariable.model.Id;
                        that.stagingVariable = undefined;
                        if (!that.TryAddVariable(x, y, type, id)) {
                            that.RefreshOutput();
                        }
                    }
                    if (that.stagingContainer !== undefined) {
                        var cx = that.stagingContainer.position.x;
                        var cy = that.stagingContainer.position.y;
                        var cid = that.stagingContainer.container.Id;
                        that.stagingContainer = undefined;
                        if (!that.TryAddVariable(cx, cy, "Container", cid)) {
                            that.RefreshOutput();
                        }
                    }
                });
            }
            DesignSurfacePresenter.prototype.RefreshOutput = function () {
                if (this.svg !== undefined && this.undoRedoPresenter.Current !== undefined) {
                    var drawingSvg = this.CreateSvg(undefined);
                    this.driver.Draw(drawingSvg);
                }
            };
            DesignSurfacePresenter.prototype.CopyToClipboard = function (remove) {
                var that = this;
                if (that.contextElement !== undefined) {
                    that.clipboard = BMA.ModelHelper.CreateClipboardContent(that.undoRedoPresenter.Current.model, that.undoRedoPresenter.Current.layout, that.contextElement);
                    if (remove) {
                        if (that.contextElement.type === "variable") {
                            that.RemoveVariable(that.contextElement.id);
                        }
                        else if (that.contextElement.type === "container") {
                            that.RemoveContainer(that.contextElement.id);
                        }
                    }
                    that.contextElement = undefined;
                }
            };
            DesignSurfacePresenter.prototype.GetLayoutCentralPoint = function () {
                var layout = this.undoRedoPresenter.Current.layout;
                var model = this.undoRedoPresenter.Current.model;
                var result = { x: 0, y: 0 };
                var count = 0;
                var containers = layout.Containers;
                for (var i = 0; i < containers.length; i++) {
                    result.x += containers[i].PositionX;
                    result.y += containers[i].PositionY;
                    count++;
                }
                var variables = layout.Variables;
                var gridCells = [];
                var existGS = function (gridCell) {
                    for (var i = 0; i < gridCells.length; i++) {
                        if (gridCell.x === gridCells[i].x && gridCell.y === gridCells[i].y) {
                            return true;
                        }
                    }
                    return false;
                };
                for (var i = 0; i < variables.length; i++) {
                    if (model.Variables[i].Type === "Constant") {
                        var gridCell = this.GetGridCell(variables[i].PositionX, variables[i].PositionY);
                        if (!existGS(gridCell)) {
                            gridCells.push(gridCell);
                            result.x += gridCell.x;
                            result.y += gridCell.y;
                            count++;
                        }
                    }
                }
                if (count > 0) {
                    result.x = (result.x / count + 0.5) * this.xStep + this.xOrigin;
                    result.y = -(result.y / count + 0.5) * this.yStep + this.yOrigin;
                }
                return result;
            };
            DesignSurfacePresenter.prototype.GetCurrentSVG = function (svg) {
                return $(svg.toSVG()).children();
            };
            DesignSurfacePresenter.prototype.RemoveVariable = function (id) {
                if (this.editingId === id) {
                    this.editingId = undefined;
                }
                var wasRemoved = false;
                var model = this.undoRedoPresenter.Current.model;
                var layout = this.undoRedoPresenter.Current.layout;
                var variables = this.undoRedoPresenter.Current.model.Variables;
                var variableLayouts = this.undoRedoPresenter.Current.layout.Variables;
                var newVars = [];
                var newVarLs = [];
                for (var i = 0; i < variables.length; i++) {
                    if (variables[i].Id !== id) {
                        newVars.push(variables[i]);
                        newVarLs.push(variableLayouts[i]);
                    }
                    else {
                        wasRemoved = true;
                    }
                }
                var relationships = this.undoRedoPresenter.Current.model.Relationships;
                var newRels = [];
                for (var i = 0; i < relationships.length; i++) {
                    if (relationships[i].FromVariableId !== id &&
                        relationships[i].ToVariableId !== id) {
                        newRels.push(relationships[i]);
                    }
                }
                if (wasRemoved === true) {
                    var newmodel = new BMA.Model.BioModel(model.Name, newVars, newRels);
                    var newlayout = new BMA.Model.Layout(layout.Containers, newVarLs);
                    this.undoRedoPresenter.Dup(newmodel, newlayout);
                }
            };
            DesignSurfacePresenter.prototype.RemoveContainer = function (id) {
                if (this.editingId === id) {
                    this.editingId = undefined;
                }
                var wasRemoved = false;
                var model = this.undoRedoPresenter.Current.model;
                var layout = this.undoRedoPresenter.Current.layout;
                var containers = layout.Containers;
                var newCnt = [];
                for (var i = 0; i < containers.length; i++) {
                    var container = containers[i];
                    if (container.Id !== id) {
                        newCnt.push(container);
                    }
                    else {
                        wasRemoved = true;
                    }
                }
                if (wasRemoved === true) {
                    var variables = model.Variables;
                    var variableLayouts = layout.Variables;
                    var newV = [];
                    var newVL = [];
                    var removed = [];
                    for (var i = 0; i < variables.length; i++) {
                        if (variables[i].Type === "Constant" || variables[i].ContainerId !== id) {
                            newV.push(variables[i]);
                            newVL.push(variableLayouts[i]);
                        }
                        else {
                            removed.push(variables[i].Id);
                            if (this.editingId === variables[i].Id) {
                                this.editingId = undefined;
                            }
                        }
                    }
                    var relationships = model.Relationships;
                    var newRels = [];
                    for (var i = 0; i < relationships.length; i++) {
                        var r = relationships[i];
                        var shouldBeRemoved = false;
                        for (var j = 0; j < removed.length; j++) {
                            if (r.FromVariableId === removed[j] || r.ToVariableId === removed[j]) {
                                shouldBeRemoved = true;
                                break;
                            }
                        }
                        if (shouldBeRemoved === false) {
                            newRels.push(r);
                        }
                    }
                    var newmodel = new BMA.Model.BioModel(model.Name, newV, newRels);
                    var newlayout = new BMA.Model.Layout(newCnt, newVL);
                    this.undoRedoPresenter.Dup(newmodel, newlayout);
                }
            };
            DesignSurfacePresenter.prototype.RemoveRelationship = function (id) {
                var wasRemoved = false;
                var model = this.undoRedoPresenter.Current.model;
                var layout = this.undoRedoPresenter.Current.layout;
                var relationships = this.undoRedoPresenter.Current.model.Relationships;
                var newRels = [];
                for (var i = 0; i < relationships.length; i++) {
                    if (relationships[i].Id !== id) {
                        newRels.push(relationships[i]);
                    }
                    else {
                        wasRemoved = true;
                    }
                }
                if (wasRemoved === true) {
                    var newmodel = new BMA.Model.BioModel(model.Name, model.Variables, newRels);
                    var newlayout = new BMA.Model.Layout(layout.Containers, layout.Variables);
                    this.undoRedoPresenter.Dup(newmodel, newlayout);
                }
            };
            DesignSurfacePresenter.prototype.GetVariableAtPosition = function (x, y) {
                var variables = this.undoRedoPresenter.Current.model.Variables;
                var variableLayouts = this.undoRedoPresenter.Current.layout.Variables;
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    var variableLayout = variableLayouts[i];
                    var element = window.ElementRegistry.GetElementByType(variable.Type);
                    if (element.Contains(x, y, variableLayout.PositionX, variableLayout.PositionY)) {
                        return variable.Id;
                    }
                }
                return undefined;
            };
            DesignSurfacePresenter.prototype.GetContainerAtPosition = function (x, y) {
                var containers = this.undoRedoPresenter.Current.layout.Containers;
                var element = window.ElementRegistry.GetElementByType("Container");
                var grid = this.Grid;
                for (var i = 0; i < containers.length; i++) {
                    var containerLayout = containers[i];
                    if (element.IntersectsBorder(x, y, (containerLayout.PositionX + 0.5) * grid.xStep + grid.x0, (containerLayout.PositionY + 0.5) * grid.yStep + grid.y0, { Size: containerLayout.Size, xStep: grid.xStep / 2, yStep: grid.yStep / 2 })) {
                        return containerLayout.Id;
                    }
                }
                return undefined;
            };
            DesignSurfacePresenter.prototype.GetRelationshipAtPosition = function (x, y, pixelWidth) {
                var relationships = this.undoRedoPresenter.Current.model.Relationships;
                var layout = this.undoRedoPresenter.Current.layout;
                for (var i = 0; i < relationships.length; i++) {
                    var relationship = relationships[i];
                    var var1 = layout.GetVariableById(relationship.FromVariableId);
                    var var2 = layout.GetVariableById(relationship.ToVariableId);
                    var elx = { x: var1.PositionX, y: var1.PositionY, pixelWidth: pixelWidth };
                    var ely = { x: var2.PositionX, y: var2.PositionY };
                    var elem = window.ElementRegistry.GetElementByType(relationship.Type);
                    if (elem.Contains(x, y, elx, ely)) {
                        return relationship.Id;
                    }
                }
                return undefined;
            };
            DesignSurfacePresenter.prototype.Intersects = function (a, b) {
                return (Math.abs(a.x - b.x) * 2 <= (a.width + b.width)) && (Math.abs(a.y - b.y) * 2 <= (a.height + b.height));
            };
            DesignSurfacePresenter.prototype.Contains = function (gridCell, bbox) {
                return bbox.width < this.xStep && bbox.height < this.yStep &&
                    bbox.x > gridCell.x * this.xStep + this.xOrigin &&
                    bbox.x + bbox.width < (gridCell.x + 1) * this.xStep + this.xOrigin &&
                    bbox.y > gridCell.y * this.yStep + this.yOrigin &&
                    bbox.y + bbox.height < (gridCell.y + 1) * this.yStep + this.yOrigin;
            };
            DesignSurfacePresenter.prototype.TryAddStagingLineAsLink = function () {
                var variables = this.undoRedoPresenter.Current.model.Variables;
                var variableLayouts = this.undoRedoPresenter.Current.layout.Variables;
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    var variableLayout = variableLayouts[i];
                    var element = window.ElementRegistry.GetElementByType(variable.Type);
                    if (element.Contains(this.stagingLine.x1, this.stagingLine.y1, variableLayout.PositionX, variableLayout.PositionY)) {
                        var current = this.undoRedoPresenter.Current;
                        var model = current.model;
                        var layout = current.layout;
                        var relationships = model.Relationships.slice(0);
                        relationships.push(new BMA.Model.Relationship(this.variableIndex++, this.stagingLine.id, variable.Id, this.selectedType));
                        var newmodel = new BMA.Model.BioModel(model.Name, model.Variables, relationships);
                        this.undoRedoPresenter.Dup(newmodel, layout);
                        return;
                    }
                }
            };
            DesignSurfacePresenter.prototype.CanAddContainer = function (x, y, size) {
                var that = this;
                var gridCell = that.GetGridCell(x, y);
                for (var i = 0; i < size; i++) {
                    for (var j = 0; j < size; j++) {
                        var cellForCheck = { x: gridCell.x + i, y: gridCell.y + j };
                        var checkCell = that.GetContainerFromGridCell(cellForCheck) === undefined && that.GetConstantsFromGridCell(cellForCheck).length === 0;
                        if (checkCell !== true)
                            return false;
                    }
                }
                return true;
            };
            DesignSurfacePresenter.prototype.CanAddVariable = function (x, y, type, id) {
                var that = this;
                var gridCell = that.GetGridCell(x, y);
                var variables = that.undoRedoPresenter.Current.model.Variables.slice(0);
                var variableLayouts = that.undoRedoPresenter.Current.layout.Variables.slice(0);
                switch (type) {
                    case "Constant":
                        var bbox = window.ElementRegistry.GetElementByType("Constant").GetBoundingBox(x, y);
                        var canAdd = that.GetContainerFromGridCell(gridCell) === undefined && that.Contains(gridCell, bbox);
                        if (canAdd === true) {
                            for (var i = 0; i < variableLayouts.length; i++) {
                                var variable = variables[i];
                                if (id !== undefined && id === variable.Id)
                                    continue;
                                var variableLayout = variableLayouts[i];
                                var elementBBox = window.ElementRegistry.GetElementByType(variable.Type).GetBoundingBox(variableLayout.PositionX, variableLayout.PositionY);
                                if (this.Intersects(bbox, elementBBox))
                                    return false;
                            }
                        }
                        return canAdd;
                    case "Default":
                        var bbox = window.ElementRegistry.GetElementByType("Default").GetBoundingBox(x, y);
                        var gridCell = that.GetGridCell(x, y);
                        var container = that.GetContainerFromGridCell(gridCell);
                        if (container === undefined ||
                            !window.ElementRegistry.GetElementByType("Container")
                                .ContainsBBox(bbox, (container.PositionX + 0.5) * that.xStep, (container.PositionY + 0.5) * that.yStep, { Size: container.Size, xStep: that.Grid.xStep / 2, yStep: that.Grid.yStep / 2 })) {
                            return false;
                        }
                        for (var i = 0; i < variableLayouts.length; i++) {
                            var variable = variables[i];
                            if (id !== undefined && id === variable.Id)
                                continue;
                            var variableLayout = variableLayouts[i];
                            var elementBBox = window.ElementRegistry.GetElementByType(variable.Type).GetBoundingBox(variableLayout.PositionX, variableLayout.PositionY);
                            if (that.Intersects(bbox, elementBBox))
                                return false;
                        }
                        return true;
                    case "MembraneReceptor":
                        var bbox = window.ElementRegistry.GetElementByType("MembraneReceptor").GetBoundingBox(x, y);
                        var gridCell = that.GetGridCell(x, y);
                        var container = that.GetContainerFromGridCell(gridCell);
                        if (container === undefined ||
                            !window.ElementRegistry.GetElementByType("Container")
                                .IntersectsBorder(x, y, (container.PositionX + 0.5) * that.xStep, (container.PositionY + 0.5) * that.yStep, { Size: container.Size, xStep: that.Grid.xStep / 2, yStep: that.Grid.yStep / 2 })) {
                            return false;
                        }
                        for (var i = 0; i < variableLayouts.length; i++) {
                            var variable = variables[i];
                            if (id !== undefined && id === variable.Id)
                                continue;
                            var variableLayout = variableLayouts[i];
                            var elementBBox = window.ElementRegistry.GetElementByType(variable.Type).GetBoundingBox(variableLayout.PositionX, variableLayout.PositionY);
                            if (that.Intersects(bbox, elementBBox))
                                return false;
                        }
                        return true;
                }
                throw "Unknown Variable type";
            };
            DesignSurfacePresenter.prototype.TryAddVariable = function (x, y, type, id) {
                var that = this;
                var current = that.undoRedoPresenter.Current;
                var model = current.model;
                var layout = current.layout;
                switch (type) {
                    case "Container":
                        var containerLayouts = layout.Containers.slice(0);
                        var variables = model.Variables.slice(0);
                        var variableLayouts = layout.Variables.slice(0);
                        var gridCell = that.GetGridCell(x, y);
                        var container = layout.GetContainerById(id);
                        if (that.CanAddContainer(x, y, container === undefined ? 1 : container.Size) === true) {
                            if (id !== undefined) {
                                for (var i = 0; i < containerLayouts.length; i++) {
                                    if (containerLayouts[i].Id === id) {
                                        var oldContainerOffset = {
                                            x: containerLayouts[i].PositionX * that.Grid.xStep + that.Grid.x0,
                                            y: containerLayouts[i].PositionY * that.Grid.yStep + that.Grid.y0,
                                        };
                                        containerLayouts[i] = new BMA.Model.ContainerLayout(id, containerLayouts[i].Name, containerLayouts[i].Size, gridCell.x, gridCell.y);
                                        var newContainerOffset = {
                                            x: gridCell.x * that.Grid.xStep + that.Grid.x0,
                                            y: gridCell.y * that.Grid.yStep + that.Grid.y0,
                                        };
                                        for (var j = 0; j < variableLayouts.length; j++) {
                                            if (variables[j].ContainerId === id) {
                                                var vlX = variableLayouts[j].PositionX;
                                                var vlY = variableLayouts[j].PositionY;
                                                variableLayouts[j] = new BMA.Model.VariableLayout(variableLayouts[j].Id, vlX - oldContainerOffset.x + newContainerOffset.x, vlY - oldContainerOffset.y + newContainerOffset.y, 0, 0, variableLayouts[j].Angle);
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                containerLayouts.push(new BMA.Model.ContainerLayout(that.variableIndex++, "", 1, gridCell.x, gridCell.y));
                            }
                            var newmodel = new BMA.Model.BioModel(model.Name, model.Variables, model.Relationships);
                            var newlayout = new BMA.Model.Layout(containerLayouts, variableLayouts);
                            that.undoRedoPresenter.Dup(newmodel, newlayout);
                            return true;
                        }
                        break;
                    case "Constant":
                        var variables = model.Variables.slice(0);
                        var variableLayouts = layout.Variables.slice(0);
                        if (that.CanAddVariable(x, y, "Constant", id) !== true)
                            return false;
                        if (id !== undefined) {
                            for (var i = 0; i < variables.length; i++) {
                                if (variables[i].Id === id) {
                                    variableLayouts[i] = new BMA.Model.VariableLayout(id, x, y, 0, 0, 0);
                                }
                            }
                        }
                        else {
                            variables.push(new BMA.Model.Variable(this.variableIndex, 0, type, "", 0, 1, ""));
                            variableLayouts.push(new BMA.Model.VariableLayout(this.variableIndex++, x, y, 0, 0, 0));
                        }
                        var newmodel = new BMA.Model.BioModel(model.Name, variables, model.Relationships);
                        var newlayout = new BMA.Model.Layout(layout.Containers, variableLayouts);
                        that.undoRedoPresenter.Dup(newmodel, newlayout);
                        return true;
                        break;
                    case "Default":
                        var variables = model.Variables.slice(0);
                        var variableLayouts = layout.Variables.slice(0);
                        if (that.CanAddVariable(x, y, "Default", id) !== true)
                            return false;
                        var gridCell = that.GetGridCell(x, y);
                        var container = that.GetContainerFromGridCell(gridCell);
                        if (id !== undefined) {
                            for (var i = 0; i < variables.length; i++) {
                                if (variables[i].Id === id) {
                                    var vrbl = variables[i];
                                    if (vrbl.ContainerId !== container.Id) {
                                        variables[i] = new BMA.Model.Variable(vrbl.Id, container.Id, vrbl.Type, vrbl.Name, vrbl.RangeFrom, vrbl.RangeTo, vrbl.Formula);
                                    }
                                    variableLayouts[i] = new BMA.Model.VariableLayout(id, x, y, 0, 0, 0);
                                }
                            }
                        }
                        else {
                            variables.push(new BMA.Model.Variable(this.variableIndex, container.Id, type, "", 0, 1, ""));
                            variableLayouts.push(new BMA.Model.VariableLayout(this.variableIndex++, x, y, 0, 0, 0));
                        }
                        var newmodel = new BMA.Model.BioModel(model.Name, variables, model.Relationships);
                        var newlayout = new BMA.Model.Layout(layout.Containers, variableLayouts);
                        that.undoRedoPresenter.Dup(newmodel, newlayout);
                        return true;
                        break;
                    case "MembraneReceptor":
                        var variables = model.Variables.slice(0);
                        var variableLayouts = layout.Variables.slice(0);
                        if (that.CanAddVariable(x, y, "MembraneReceptor", id) !== true)
                            return false;
                        var gridCell = that.GetGridCell(x, y);
                        var container = that.GetContainerFromGridCell(gridCell);
                        var containerX = (container.PositionX + 0.5) * this.xStep + this.xOrigin + (container.Size - 1) * this.xStep / 2;
                        var containerY = (container.PositionY + 0.5) * this.yStep + this.yOrigin + (container.Size - 1) * this.yStep / 2;
                        var v = {
                            x: x - containerX,
                            y: y - containerY
                        };
                        var len = Math.sqrt(v.x * v.x + v.y * v.y);
                        v.x = v.x / len;
                        v.y = v.y / len;
                        var acos = Math.acos(-v.y);
                        var angle = acos * v.x / Math.abs(v.x);
                        angle = angle * 180 / Math.PI;
                        if (angle < 0)
                            angle += 360;
                        if (id !== undefined) {
                            for (var i = 0; i < variables.length; i++) {
                                if (variables[i].Id === id) {
                                    var vrbl = variables[i];
                                    if (vrbl.ContainerId !== container.Id) {
                                        variables[i] = new BMA.Model.Variable(vrbl.Id, container.Id, vrbl.Type, vrbl.Name, vrbl.RangeFrom, vrbl.RangeTo, vrbl.Formula);
                                    }
                                    variableLayouts[i] = new BMA.Model.VariableLayout(id, x, y, 0, 0, angle);
                                }
                            }
                        }
                        else {
                            var pos = BMA.SVGHelper.GeEllipsePoint(containerX + 2.5 * container.Size, containerY, 107 * container.Size, 127 * container.Size, x, y);
                            variables.push(new BMA.Model.Variable(this.variableIndex, container.Id, type, "", 0, 1, ""));
                            variableLayouts.push(new BMA.Model.VariableLayout(this.variableIndex++, pos.x, pos.y, 0, 0, angle));
                        }
                        var newmodel = new BMA.Model.BioModel(model.Name, variables, model.Relationships);
                        var newlayout = new BMA.Model.Layout(layout.Containers, variableLayouts);
                        that.undoRedoPresenter.Dup(newmodel, newlayout);
                        return true;
                        break;
                }
                return false;
            };
            DesignSurfacePresenter.prototype.GetGridCell = function (x, y) {
                var cellX = Math.ceil((x - this.xOrigin) / this.xStep) - 1;
                var cellY = Math.ceil((y - this.yOrigin) / this.yStep) - 1;
                return { x: cellX, y: cellY };
            };
            DesignSurfacePresenter.prototype.GetContainerFromGridCell = function (gridCell) {
                var current = this.undoRedoPresenter.Current;
                var layouts = current.layout.Containers;
                for (var i = 0; i < layouts.length; i++) {
                    if (layouts[i].PositionX <= gridCell.x && layouts[i].PositionX + layouts[i].Size > gridCell.x &&
                        layouts[i].PositionY <= gridCell.y && layouts[i].PositionY + layouts[i].Size > gridCell.y) {
                        return layouts[i];
                    }
                }
                return undefined;
            };
            //private GetContainerGridCells(containerLayout: BMA.Model.ContainerLayout): { x: number; y: number }[] {
            //    var result = [];
            //    var size = containerLayout.Size;
            //    for (var i = 0; i < size; i++) {
            //        for (var j = 0; j < size; j++) {
            //            result.push({ x: i + containerLayout.PositionX, y: j + containerLayout.PositionY });
            //        }
            //    }
            //    return result;
            //}
            DesignSurfacePresenter.prototype.GetConstantsFromGridCell = function (gridCell) {
                var result = [];
                var variables = this.undoRedoPresenter.Current.model.Variables;
                var variableLayouts = this.undoRedoPresenter.Current.layout.Variables;
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    var variableLayout = variableLayouts[i];
                    var vGridCell = this.GetGridCell(variableLayout.PositionX, variableLayout.PositionY);
                    if (gridCell.x === vGridCell.x && gridCell.y === vGridCell.y) {
                        result.push({ variable: variable, variableLayout: variableLayout });
                    }
                }
                return result;
            };
            DesignSurfacePresenter.prototype.ResetVariableIdIndex = function () {
                this.variableIndex = 1;
                var m = this.undoRedoPresenter.Current.model;
                var l = this.undoRedoPresenter.Current.layout;
                for (var i = 0; i < m.Variables.length; i++) {
                    if (m.Variables[i].Id >= this.variableIndex)
                        this.variableIndex = m.Variables[i].Id + 1;
                }
                for (var i = 0; i < l.Containers.length; i++) {
                    if (l.Containers[i].Id >= this.variableIndex) {
                        this.variableIndex = l.Containers[i].Id + 1;
                    }
                }
                for (var i = 0; i < m.Relationships.length; i++) {
                    if (m.Relationships[i].Id >= this.variableIndex) {
                        this.variableIndex = m.Relationships[i].Id + 1;
                    }
                }
            };
            Object.defineProperty(DesignSurfacePresenter.prototype, "Grid", {
                get: function () {
                    return { x0: this.xOrigin, y0: this.yOrigin, xStep: this.xStep, yStep: this.yStep };
                },
                enumerable: true,
                configurable: true
            });
            DesignSurfacePresenter.prototype.GetVariableById = function (layout, model, id) {
                var variableLayouts = layout.Variables;
                var variables = model.Variables;
                for (var i = 0; i < variableLayouts.length; i++) {
                    var variableLayout = variableLayouts[i];
                    if (variableLayout.Id === id) {
                        return { model: variables[i], layout: variableLayout };
                    }
                }
                throw "No such variable in model";
            };
            DesignSurfacePresenter.prototype.GetVariableColorByStatus = function (status) {
                if (status)
                    return "green"; //"#D9FFB3";
                else
                    return "red";
            };
            DesignSurfacePresenter.prototype.GetContainerColorByStatus = function (status) {
                if (status)
                    return "#E9FFCC";
                else
                    return "#FFDDDB";
            };
            DesignSurfacePresenter.prototype.GetItemById = function (arr, id) {
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].id === id)
                        return arr[i];
                }
                return undefined;
            };
            DesignSurfacePresenter.prototype.CreateSvg = function (args) {
                if (this.svg === undefined)
                    return undefined;
                //Generating svg elements from model and layout
                var svgElements = [];
                var containerLayouts = this.undoRedoPresenter.Current.layout.Containers;
                for (var i = 0; i < containerLayouts.length; i++) {
                    var containerLayout = containerLayouts[i];
                    var element = window.ElementRegistry.GetElementByType("Container");
                    svgElements.push(element.RenderToSvg({
                        layout: containerLayout,
                        grid: this.Grid,
                        background: args === undefined || args.containersStability === undefined ? undefined : this.GetContainerColorByStatus(args.containersStability[containerLayout.Id])
                    }));
                }
                var variables = this.undoRedoPresenter.Current.model.Variables;
                var variableLayouts = this.undoRedoPresenter.Current.layout.Variables;
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    var variableLayout = variableLayouts[i];
                    var element = window.ElementRegistry.GetElementByType(variable.Type);
                    var additionalInfo = args === undefined ? undefined : this.GetItemById(args.variablesStability, variable.Id);
                    var container = variable.Type === "MembraneReceptor" ? this.undoRedoPresenter.Current.layout.GetContainerById(variable.ContainerId) : undefined;
                    var sizeCoef = undefined;
                    var gridCell = undefined;
                    if (container !== undefined) {
                        sizeCoef = container.Size;
                        gridCell = { x: container.PositionX, y: container.PositionY };
                    }
                    svgElements.push(element.RenderToSvg({
                        model: variable,
                        layout: variableLayout,
                        grid: this.Grid,
                        gridCell: gridCell,
                        sizeCoef: sizeCoef,
                        valueText: additionalInfo === undefined ? undefined : additionalInfo.range,
                        labelColor: additionalInfo === undefined ? undefined : this.GetVariableColorByStatus(additionalInfo.state)
                    }));
                }
                var relationships = this.undoRedoPresenter.Current.model.Relationships;
                for (var i = 0; i < relationships.length; i++) {
                    var relationship = relationships[i];
                    var element = window.ElementRegistry.GetElementByType(relationship.Type);
                    var start = this.GetVariableById(this.undoRedoPresenter.Current.layout, this.undoRedoPresenter.Current.model, relationship.FromVariableId).layout;
                    var end = this.GetVariableById(this.undoRedoPresenter.Current.layout, this.undoRedoPresenter.Current.model, relationship.ToVariableId).layout;
                    svgElements.push(element.RenderToSvg({
                        layout: { start: start, end: end },
                        grid: this.Grid
                    }));
                }
                //constructing final svg image
                this.svg.clear();
                var defs = this.svg.defs("bmaDefs");
                var activatorMarker = this.svg.marker(defs, "Activator", 4, 0, 8, 4, "auto", { viewBox: "0 -2 4 4" });
                this.svg.polyline(activatorMarker, [[0, 2], [4, 0], [0, -2]], { fill: "none", stroke: "#808080", strokeWidth: "1px" });
                var inhibitorMarker = this.svg.marker(defs, "Inhibitor", 0, 0, 2, 6, "auto", { viewBox: "0 -3 2 6" });
                this.svg.line(inhibitorMarker, 0, 3, 0, -3, { fill: "none", stroke: "#808080", strokeWidth: "2px" });
                for (var i = 0; i < svgElements.length; i++) {
                    this.svg.add(svgElements[i]);
                }
                return $(this.svg.toSVG()).children();
            };
            DesignSurfacePresenter.prototype.CreateStagingSvg = function () {
                if (this.svg === undefined)
                    return undefined;
                this.svg.clear();
                var defs = this.svg.defs("bmaDefs");
                var activatorMarker = this.svg.marker(defs, "Activator", 4, 0, 8, 4, "auto", { viewBox: "0 -2 4 4" });
                this.svg.polyline(activatorMarker, [[0, 2], [4, 0], [0, -2]], { fill: "none", stroke: "#808080", strokeWidth: "1px" });
                var inhibitorMarker = this.svg.marker(defs, "Inhibitor", 0, 0, 2, 6, "auto", { viewBox: "0 -3 2 6" });
                this.svg.line(inhibitorMarker, 0, 3, 0, -3, { fill: "none", stroke: "#808080", strokeWidth: "2px" });
                if (this.stagingLine !== undefined) {
                    this.svg.line(this.stagingLine.x0, this.stagingLine.y0, this.stagingLine.x1, this.stagingLine.y1, {
                        stroke: "#808080",
                        strokeWidth: 2,
                        fill: "#808080",
                        "marker-end": "url(#" + this.selectedType + ")",
                        id: "stagingLine"
                    });
                }
                if (this.stagingVariable !== undefined) {
                    var element = window.ElementRegistry.GetElementByType(this.stagingVariable.model.Type);
                    this.svg.add(element.RenderToSvg({ model: this.stagingVariable.model, layout: this.stagingVariable.layout, grid: this.Grid }));
                }
                if (this.stagingContainer !== undefined) {
                    var element = window.ElementRegistry.GetElementByType("Container");
                    var x = (this.stagingContainer.container.PositionX + 0.5) * this.Grid.xStep + (this.stagingContainer.container.Size - 1) * this.Grid.xStep / 2;
                    var y = (this.stagingContainer.container.PositionY + 0.5) * this.Grid.yStep + (this.stagingContainer.container.Size - 1) * this.Grid.yStep / 2;
                    this.svg.add(element.RenderToSvg({
                        layout: this.stagingContainer.container,
                        grid: this.Grid,
                        background: "none",
                        translate: {
                            x: this.stagingContainer.position.x - x,
                            y: this.stagingContainer.position.y - y
                        }
                    }));
                }
                return $(this.svg.toSVG()).children();
            };
            return DesignSurfacePresenter;
        })();
        Presenters.DesignSurfacePresenter = DesignSurfacePresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=presenters.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var ProofPresenter = (function () {
            function ProofPresenter(appModel, proofResultViewer, popupViewer, ajax, messagebox, logService) {
                var _this = this;
                this.appModel = appModel;
                this.ajax = ajax;
                this.messagebox = messagebox;
                this.logService = logService;
                var that = this;
                window.Commands.On("ProofByFurtherTesting", function (param) {
                    try {
                        param.fixPoint.forEach(function (val, ind) {
                            var i = that.getIndById(that.stability.variablesStability, val.Id);
                            var id = that.stability.variablesStability[i].id;
                        });
                    }
                    catch (ex) {
                        throw "Event Exception";
                    }
                    ;
                    param.fixPoint.forEach(function (val, ind) {
                        var i = that.getIndById(that.stability.variablesStability, val.Id);
                        that.stability.variablesStability[i].state = true;
                        that.stability.variablesStability[i].range = val.Value;
                        var id = that.stability.variablesStability[i].id;
                        var cont = that.appModel.BioModel.GetVariableById(id).ContainerId;
                        if (cont !== undefined) {
                            that.stability.containersStability[cont] = true;
                        }
                    });
                    var variablesData = that.CreateTableView(that.stability.variablesStability);
                    that.expandedProofVariables = that.CreateExpandedProofVariables(variablesData);
                    that.AddPropagationColumn(that.stability.variablesStability);
                    proofResultViewer.SetData({
                        issucceeded: param.issucceeded,
                        message: param.message,
                        data: { numericData: variablesData.numericData, colorVariables: variablesData.colorData, colorData: that.colorData }
                    });
                    window.Commands.Execute("DrawingSurfaceSetProofResults", that.stability);
                });
                window.Commands.On("ProofStarting", function () {
                    try {
                        var proofInput = BMA.Model.ExportBioModel(appModel.BioModel);
                    }
                    catch (ex) {
                        //that.messagebox.Show(ex);
                        proofResultViewer.SetData({
                            issucceeded: "Invalid Model",
                            message: ex,
                            data: undefined
                        });
                        return;
                    }
                    proofResultViewer.OnProofStarted();
                    that.logService.LogProofRun();
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
                            that.stability = that.Stability(res.Ticks);
                            var variablesData = that.CreateTableView(that.stability.variablesStability);
                            that.colorData = that.CreateColoredTable(res.Ticks);
                            var deferredProofPropagation = function () {
                                var d = $.Deferred();
                                var full = that.CreateExpandedProofPropagation(appModel.ProofResult.Ticks); //.addClass("proof-expanded");
                                d.resolve(full);
                                return d.promise();
                            };
                            $.when(deferredProofPropagation()).done(function (res) {
                                that.expandedProofPropagation = res;
                            });
                            var deferredProofVariables = function () {
                                var d = $.Deferred();
                                var full = that.CreateExpandedProofVariables(variablesData);
                                d.resolve(full);
                                return d.promise();
                            };
                            $.when(deferredProofVariables()).done(function (res) {
                                that.expandedProofVariables = res;
                            });
                            window.Commands.Execute("DrawingSurfaceSetProofResults", that.stability);
                            proofResultViewer.SetData({ issucceeded: result.IsStable, message: that.CreateMessage(result.IsStable, result.Time), data: { numericData: variablesData.numericData, colorVariables: variablesData.colorData, colorData: that.colorData } });
                            proofResultViewer.ShowResult(appModel.ProofResult);
                        }
                        else {
                            logService.LogProofError();
                            if (res.Status == "Error") {
                                proofResultViewer.SetData({
                                    issucceeded: undefined,
                                    message: res.Error,
                                    data: undefined
                                });
                            }
                            else
                                proofResultViewer.SetData({
                                    issucceeded: res.Status === "Stabilizing",
                                    message: that.CreateMessage(result.IsStable, result.Time),
                                    data: undefined
                                });
                            proofResultViewer.ShowResult(appModel.ProofResult);
                        }
                        that.Snapshot();
                    })
                        .fail(function (XMLHttpRequest, textStatus, errorThrown) {
                        console.log("Proof Service Failed: " + errorThrown);
                        that.messagebox.Show("Proof Service Failed: " + errorThrown);
                        proofResultViewer.OnProofFailed();
                    });
                });
                window.Commands.On("ProofRequested", function (args) {
                    if (that.CurrentModelChanged()) {
                        window.Commands.Execute("ProofStarting", {});
                    }
                    else {
                        proofResultViewer.ShowResult(appModel.ProofResult);
                        window.Commands.Execute("DrawingSurfaceSetProofResults", that.stability);
                    }
                });
                window.Commands.On("Expand", function (param) {
                    if (_this.appModel.BioModel.Variables.length !== 0) {
                        switch (param) {
                            case "ProofPropagation":
                                if (_this.appModel.ProofResult.Ticks !== null) {
                                    popupViewer.Show({ tab: param, content: $('<div></div>') });
                                    proofResultViewer.Hide({ tab: param });
                                    popupViewer.Show({ tab: param, content: that.expandedProofPropagation });
                                }
                                break;
                            case "ProofVariables":
                                proofResultViewer.Hide({ tab: param });
                                popupViewer.Show({ tab: param, content: that.expandedProofVariables });
                                break;
                            default:
                                proofResultViewer.Show({ tab: undefined });
                                break;
                        }
                    }
                });
                window.Commands.On("Collapse", function (param) {
                    proofResultViewer.Show({ tab: param });
                    popupViewer.Hide();
                });
            }
            ProofPresenter.prototype.CurrentModelChanged = function () {
                if (this.currentBioModel === undefined || this.currentLayout === undefined) {
                    this.Snapshot();
                    return true;
                }
                else {
                    try {
                        return (JSON.stringify(this.currentBioModel) !== JSON.stringify(this.appModel.BioModel) ||
                            JSON.stringify(this.currentLayout) !== JSON.stringify(this.appModel.Layout));
                    }
                    catch (ex) {
                        console.log(ex);
                        return true;
                    }
                }
            };
            ProofPresenter.prototype.Snapshot = function () {
                this.currentBioModel = this.appModel.BioModel.Clone();
                this.currentLayout = this.appModel.Layout.Clone();
            };
            ProofPresenter.prototype.CreateMessage = function (stable, time) {
                if (stable) {
                    return 'BMA succeeded in checking every possible state of the model in ' + time + ' seconds. After stepping through separate interactions, the model eventually reached a single stable state.';
                }
                else
                    return 'After stepping through separate interactions in the model, the analysis failed to determine a final stable state';
            };
            ProofPresenter.prototype.Stability = function (ticks) {
                var containers = [];
                if (ticks === null)
                    return undefined;
                var variables = this.appModel.BioModel.Variables.sort(function (x, y) {
                    return x.Id < y.Id ? -1 : 1;
                });
                var allconts = this.appModel.Layout.Containers;
                var stability = [];
                for (var i = 0, l = variables.length; i < l; i++) {
                    var ij = ticks[0].Variables[i];
                    var c = ij.Lo === ij.Hi;
                    stability[i] = { id: ij.Id, state: c, range: c ? ij.Lo : ij.Lo + ' - ' + ij.Hi };
                    var v = this.appModel.BioModel.GetVariableById(ij.Id);
                    if (v.ContainerId !== undefined && (!c || containers[v.ContainerId] === undefined))
                        containers[v.ContainerId] = c;
                }
                for (var i = 0; i < allconts.length; i++) {
                    if (containers[allconts[i].Id] === undefined)
                        containers[allconts[i].Id] = true;
                }
                return { variablesStability: stability, containersStability: containers };
            };
            ProofPresenter.prototype.getIndById = function (array, id) {
                for (var i = 0; i < array.length; i++) {
                    var q = array[i].id.toString();
                    var p = id.toString();
                    if (q === p)
                        return i;
                }
                return undefined;
            };
            ProofPresenter.prototype.CreateTableView = function (stability) {
                if (stability === undefined)
                    return { numericData: undefined, colorData: undefined };
                var biomodel = this.appModel.BioModel;
                var table = [];
                var color = [];
                for (var i = 0; i < stability.length; i++) {
                    var st = stability[i];
                    var variable = biomodel.GetVariableById(st.id);
                    table[i] = [];
                    table[i][0] = variable.Name;
                    table[i][1] = variable.Formula;
                    table[i][2] = st.range;
                    color[i] = [];
                    var c = st.state;
                    if (!c) {
                        for (var j = 0; j < table[i].length; j++)
                            color[i][j] = c;
                    }
                }
                return { numericData: table, colorData: color };
            };
            ProofPresenter.prototype.CreateColoredTable = function (ticks) {
                var that = this;
                if (ticks === null)
                    return;
                var color = [];
                var t = ticks.length;
                var v = ticks[0].Variables.length;
                for (var i = 0; i < v; i++) {
                    color[i] = [];
                    for (var j = 0; j < t; j++) {
                        var ij = ticks[t - j - 1].Variables[i];
                        color[i][j] = ij.Hi === ij.Lo;
                    }
                }
                return color;
            };
            ProofPresenter.prototype.AddPropagationColumn = function (st) {
                var trs = this.expandedProofPropagation.find('tr');
                $('<td></td>').text('Fix Point').appendTo(trs.eq(0));
                var colors = this.expandedProofPropagation.coloredtableviewer("option", "colorData");
                for (var i = 0; i < st.length; i++) {
                    colors[i][0] = st[i].state;
                    $('<td></td>').text(st[i].range).appendTo(trs.eq(i + 1));
                    this.colorData[i].push(st[i].state);
                    colors[i].push(st[i].state);
                }
                this.expandedProofPropagation.coloredtableviewer("option", "colorData", colors);
            };
            ProofPresenter.prototype.CreateExpandedProofVariables = function (variablesData) {
                var full = $('<div></div>').coloredtableviewer({
                    numericData: variablesData.numericData,
                    colorData: variablesData.colorData,
                    header: ["Name", "Formula", "Range"]
                });
                full.addClass('scrollable-results');
                return full;
            };
            ProofPresenter.prototype.CreateExpandedProofPropagation = function (ticks) {
                var container = $('<div></div>');
                if (ticks === null)
                    return container;
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
                    table[j][0] = biomodel.GetVariableById(ticks[0].Variables[j].Id).Name;
                    var v = ticks[0].Variables[j];
                    color[j][0] = v.Lo === v.Hi;
                    for (var i = 1; i < l + 1; i++) {
                        var ij = ticks[l - i].Variables[j];
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
                container.addClass('scrollable-results');
                container.children('table').removeClass('variables-table').addClass('proof-propagation-table');
                container.find("td").eq(0).width(150);
                return container;
            };
            return ProofPresenter;
        })();
        Presenters.ProofPresenter = ProofPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=proofpresenter.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var SimulationPresenter = (function () {
            function SimulationPresenter(appModel, simulationAccordeon, simulationExpanded, simulationViewer, popupViewer, ajax, logService, exportService, messagebox) {
                var _this = this;
                this.appModel = appModel;
                this.compactViewer = simulationViewer;
                this.expandedViewer = simulationExpanded;
                this.logService = logService;
                this.ajax = ajax;
                this.simulationAccordeon = simulationAccordeon;
                this.messagebox = messagebox;
                var that = this;
                this.initValues = [];
                simulationExpanded.SetOnPlotVariablesSelectionChanged(function (param) {
                    that.variables[param.ind].Seen = param.check;
                    that.compactViewer.ChangeVisibility(param);
                });
                //window.Commands.On("ChangePlotVariables", function (param) {
                //    that.variables[param.ind].Seen = param.check;
                //    that.compactViewer.ChangeVisibility(param);
                //});
                window.Commands.On("RunSimulation", function (param) {
                    that.expandedViewer.StandbyMode();
                    that.ClearPlot(param.data);
                    try {
                        var stableModel = BMA.Model.ExportBioModel(that.appModel.BioModel);
                        var variables = that.ConvertParam(param.data);
                        logService.LogSimulationRun();
                        that.StartSimulation({ model: stableModel, variables: variables, num: param.num });
                    }
                    catch (ex) {
                        that.messagebox.Show(ex);
                        that.expandedViewer.ActiveMode();
                    }
                });
                window.Commands.On("SimulationRequested", function (args) {
                    if (that.CurrentModelChanged()) {
                        try {
                            var stableModel = BMA.Model.ExportBioModel(that.appModel.BioModel);
                        }
                        catch (ex) {
                            that.compactViewer.SetData({ data: undefined, plot: undefined, error: { title: "Invalid Model", message: ex } });
                            return;
                        }
                        that.simulationAccordeon.bmaaccordion({ contentLoaded: { ind: "#icon2", val: false } });
                        that.expandedSimulationVariables = undefined;
                        that.UpdateVariables();
                        that.compactView = that.CreateVariablesCompactView();
                        that.compactViewer.SetData({
                            data: {
                                variables: that.compactView,
                                colorData: undefined
                            },
                            plot: undefined,
                            error: undefined
                        });
                        var initValues = that.initValues;
                        that.expandedViewer.Set({
                            variables: that.GetSortedVars(),
                            colors: that.variables,
                            init: initValues
                        });
                        window.Commands.Execute("RunSimulation", { num: 10, data: initValues });
                    }
                    else {
                        var variables = that.CreateVariablesCompactView();
                        var colorData = that.CreateProgressionMinTable();
                        that.compactViewer.SetData({
                            data: { variables: variables, colorData: colorData },
                            plot: that.variables
                        });
                    }
                });
                window.Commands.On("Expand", function (param) {
                    if (_this.appModel.BioModel.Variables.length !== 0) {
                        var full = undefined;
                        switch (param) {
                            case "SimulationVariables":
                                if (that.expandedSimulationVariables !== undefined) {
                                    full = that.expandedSimulationVariables;
                                }
                                else {
                                    that.expandedViewer.Set({ variables: that.GetSortedVars(), colors: that.variables, init: that.initValues });
                                    full = that.expandedViewer.GetViewer();
                                }
                                break;
                            case "SimulationPlot":
                                full = $('<div></div>').simulationplot({ colors: that.variables });
                                break;
                            default:
                                simulationViewer.Show({ tab: undefined });
                        }
                        if (full !== undefined) {
                            simulationViewer.Hide({ tab: param });
                            popupViewer.Show({ tab: param, content: full });
                        }
                    }
                });
                window.Commands.On("Collapse", function (param) {
                    simulationViewer.Show({ tab: param });
                    popupViewer.Hide();
                });
                window.Commands.On('ExportCSV', function () {
                    var csv = that.CreateCSV(',');
                    exportService.Export(csv, appModel.BioModel.Name, 'csv');
                });
            }
            SimulationPresenter.prototype.GetSortedVars = function () {
                var vars = this.appModel.BioModel.Variables.sort(function (x, y) {
                    return x.Id < y.Id ? -1 : 1;
                });
                return vars;
            };
            SimulationPresenter.prototype.UpdateVariables = function () {
                var that = this;
                var vars = that.appModel.BioModel.Variables.sort(function (x, y) {
                    return x.Id < y.Id ? -1 : 1;
                });
                that.variables = [];
                that.initValues = [];
                for (var i = 0; i < vars.length; i++) {
                    this.variables.push({
                        Id: vars[i].Id,
                        Color: this.getRandomColor(),
                        Seen: true,
                        Plot: [],
                        Init: vars[i].RangeFrom,
                        Name: vars[i].Name
                    });
                    this.variables[i].Plot[0] = this.variables[i].Init;
                    this.initValues[i] = this.variables[i].Init;
                }
            };
            SimulationPresenter.prototype.ClearPlot = function (init) {
                this.initValues = [];
                for (var i = 0; i < this.variables.length; i++) {
                    this.variables[i].Plot = [];
                    this.variables[i].Plot[0] = (init !== undefined) ? init[i] : this.variables[i].Init;
                    this.initValues.push(this.variables[i].Plot[0]);
                }
            };
            SimulationPresenter.prototype.GetById = function (arr, id) {
                for (var i = 0; i < arr.length; i++)
                    if (id === arr[i].Id)
                        return i;
                return undefined;
            };
            SimulationPresenter.prototype.CurrentModelChanged = function () {
                if (this.currentModel === undefined) {
                    this.Snapshot();
                    return true;
                }
                else {
                    try {
                        var q = JSON.stringify(BMA.Model.ExportBioModel(this.currentModel));
                        var w = JSON.stringify(BMA.Model.ExportBioModel(this.appModel.BioModel));
                        return q !== w;
                    }
                    catch (ex) {
                        this.Snapshot();
                        return true;
                    }
                }
            };
            SimulationPresenter.prototype.Snapshot = function () {
                this.currentModel = this.appModel.BioModel.Clone();
            };
            SimulationPresenter.prototype.StartSimulation = function (param) {
                var that = this;
                if (param.num === undefined || param.num === 0) {
                    var colorData = that.CreateProgressionMinTable();
                    that.compactViewer.SetData({
                        data: {
                            variables: that.compactView,
                            colorData: colorData
                        },
                        plot: that.variables,
                        error: undefined
                    });
                    that.expandedSimulationVariables = that.expandedViewer.GetViewer();
                    that.expandedViewer.ActiveMode();
                    that.Snapshot();
                    that.simulationAccordeon.bmaaccordion({ contentLoaded: { ind: "#icon2", val: true } });
                    return;
                }
                else {
                    var simulate = {
                        "Model": param.model,
                        "Variables": param.variables
                    };
                    if (param.variables !== undefined && param.variables !== null) {
                        var result = that.ajax.Invoke(simulate)
                            .done(function (res) {
                            if (res.Variables !== null) {
                                that.expandedViewer.AddResult(res);
                                var d = that.ConvertResult(res);
                                that.AddData(d);
                                that.StartSimulation({ model: param.model, variables: res.Variables, num: param.num - 1 });
                            }
                            else {
                                that.expandedViewer.ActiveMode();
                                alert("Simulation Error: " + res.ErrorMessages);
                            }
                        })
                            .fail(function (XMLHttpRequest, textStatus, errorThrown) {
                            this.logService.LogSimulationError();
                            console.log(textStatus);
                            that.expandedViewer.ActiveMode();
                            alert("Simulate error: " + errorThrown);
                            return;
                        });
                    }
                    else
                        return;
                }
            };
            SimulationPresenter.prototype.AddData = function (d) {
                if (d !== null) {
                    for (var i = 0; i < d.length; i++) {
                        this.variables[i].Plot.push(d[i]);
                    }
                }
            };
            SimulationPresenter.prototype.CreateCSV = function (sep) {
                var csv = '';
                var that = this;
                var data = this.variables;
                for (var i = 0, len = data.length; i < len; i++) {
                    var ivar = that.appModel.BioModel.GetVariableById(data[i].Id);
                    var contid = ivar.ContainerId;
                    var cont = that.appModel.Layout.GetContainerById(contid);
                    if (cont !== undefined) {
                        csv += cont.Name + sep;
                    }
                    else
                        csv += '' + sep;
                    csv += ivar.Name + sep;
                    var plot = data[i].Plot;
                    for (var j = 0, plotl = plot.length; j < plotl; j++) {
                        csv += plot[j] + sep;
                    }
                    csv += "\n";
                }
                return csv;
            };
            SimulationPresenter.prototype.getRandomColor = function () {
                var r = this.GetRandomInt(0, 255);
                var g = this.GetRandomInt(0, 255);
                var b = this.GetRandomInt(0, 255);
                return "rgb(" + r + ", " + g + ", " + b + ")";
            };
            SimulationPresenter.prototype.GetRandomInt = function (min, max) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            };
            SimulationPresenter.prototype.GetResults = function () {
                var res = [];
                for (var i = 0; i < this.variables.length; i++) {
                    res.push(this.variables[i].Plot);
                }
                return res;
            };
            SimulationPresenter.prototype.CreateProgressionMinTable = function () {
                var table = [];
                var res = this.GetResults();
                if (res.length < 1)
                    return;
                for (var i = 0, len = res.length; i < len; i++) {
                    table[i] = [];
                    table[i][0] = false;
                    var l = res[i].length;
                    for (var j = 1; j < l; j++) {
                        table[i][j] = res[i][j] !== res[i][j - 1];
                    }
                }
                return table;
            };
            SimulationPresenter.prototype.CreateVariablesCompactView = function () {
                var that = this;
                var table = [];
                var variables = this.appModel.BioModel.Variables;
                for (var i = 0; i < this.variables.length; i++) {
                    var ivar = this.appModel.BioModel.GetVariableById(this.variables[i].Id);
                    table[i] = [];
                    table[i][0] = this.variables[i].Color;
                    table[i][1] = (function () {
                        var cont = that.appModel.Layout.GetContainerById(ivar.ContainerId);
                        return cont !== undefined ? cont.Name : '';
                    })();
                    table[i][2] = ivar.Name;
                    table[i][3] = ivar.RangeFrom + ' - ' + ivar.RangeTo;
                }
                return table;
            };
            SimulationPresenter.prototype.ConvertParam = function (arr) {
                var res = [];
                for (var i = 0; i < arr.length; i++) {
                    res[i] = {
                        "Id": this.variables[i].Id,
                        "Value": arr[i]
                    };
                }
                return res;
            };
            SimulationPresenter.prototype.ConvertResult = function (res) {
                var data = [];
                if (res.Variables !== undefined && res.Variables !== null) {
                    for (var i = 0; i < res.Variables.length; i++)
                        data[i] = res.Variables[i].Value;
                }
                return data;
            };
            return SimulationPresenter;
        })();
        Presenters.SimulationPresenter = SimulationPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=simulationpresenter.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var ModelStoragePresenter = (function () {
            function ModelStoragePresenter(appModel, fileLoaderDriver, checker, logService, exportService) {
                var that = this;
                window.Commands.On("NewModel", function (args) {
                    try {
                        if (checker.IsChanged(appModel)) {
                            var userDialog = $('<div></div>').appendTo('body').userdialog({
                                message: "Do you want to save changes?",
                                actions: [
                                    {
                                        button: 'Yes',
                                        callback: function () { userDialog.detach(); }
                                    },
                                    {
                                        button: 'No',
                                        callback: function () {
                                            userDialog.detach();
                                            load();
                                        }
                                    },
                                    {
                                        button: 'Cancel',
                                        callback: function () { userDialog.detach(); }
                                    }
                                ]
                            });
                        }
                        else
                            load();
                    }
                    catch (ex) {
                        load();
                    }
                    function load() {
                        window.Commands.Execute('SetPlotSettings', { MaxWidth: 3200, MinWidth: 800 });
                        window.Commands.Execute('ModelFitToView', '');
                        appModel.Deserialize(undefined);
                        checker.Snapshot(appModel);
                        logService.LogNewModelCreated();
                    }
                });
                window.Commands.On("ImportModel", function (args) {
                    try {
                        if (checker.IsChanged(appModel)) {
                            var userDialog = $('<div></div>').appendTo('body').userdialog({
                                message: "Do you want to save changes?",
                                actions: [
                                    {
                                        button: 'Yes',
                                        callback: function () { userDialog.detach(); }
                                    },
                                    {
                                        button: 'No',
                                        callback: function () {
                                            userDialog.detach();
                                            load();
                                        }
                                    },
                                    {
                                        button: 'Cancel',
                                        callback: function () { userDialog.detach(); }
                                    }
                                ]
                            });
                        }
                        else {
                            logService.LogImportModel();
                            load();
                        }
                    }
                    catch (ex) {
                        alert(ex);
                        logService.LogImportModel();
                        load();
                    }
                    function load() {
                        window.Commands.Execute('SetPlotSettings', { MaxWidth: 3200, MinWidth: 800 });
                        window.Commands.Execute('ModelFitToView', '');
                        fileLoaderDriver.OpenFileDialog().done(function (fileName) {
                            var fileReader = new FileReader();
                            fileReader.onload = function () {
                                var fileContent = fileReader.result;
                                try {
                                    var data = $.parseXML(fileContent);
                                    var model = BMA.ParseXmlModel(data, window.GridSettings);
                                    appModel.Reset(model.Model, model.Layout);
                                }
                                catch (exc) {
                                    console.log("XML parsing failed: " + exc + ". Trying JSON");
                                    try {
                                        appModel.Deserialize(fileReader.result);
                                    }
                                    catch (exc2) {
                                        console.log("JSON failed: " + exc + ". Trying legacy JSON version");
                                        appModel.DeserializeLegacyJSON(fileReader.result);
                                    }
                                }
                                checker.Snapshot(appModel);
                            };
                            fileReader.readAsText(fileName);
                        });
                    }
                });
                window.Commands.On("ExportModel", function (args) {
                    try {
                        var data = appModel.Serialize();
                        exportService.Export(data, appModel.BioModel.Name, 'json');
                        //var ret = saveTextAs(data, appModel.BioModel.Name + ".json");
                        checker.Snapshot(appModel);
                    }
                    catch (ex) {
                        alert("Couldn't export model: " + ex);
                    }
                });
            }
            return ModelStoragePresenter;
        })();
        Presenters.ModelStoragePresenter = ModelStoragePresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=modelstoragepresenter.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var FormulaValidationPresenter = (function () {
            function FormulaValidationPresenter(editor, ajax) {
                var that = this;
                this.editorDriver = editor;
                this.ajax = ajax;
                window.Commands.On("FormulaEdited", function (param) {
                    var formula = param.formula;
                    var inputs = param.inputs;
                    for (var item in inputs) {
                        if (inputs[item] > 1) {
                            if (formula.split(item).length - 1 !== inputs[item] && formula !== "") {
                                that.editorDriver.SetValidation(false, 'Need equal number of repeating inputs in formula');
                                return;
                            }
                        }
                    }
                    if (formula !== "")
                        var result = that.ajax.Invoke({ Formula: formula })
                            .done(function (res) {
                            that.editorDriver.SetValidation(res.IsValid, res.Message);
                        })
                            .fail(function (res) {
                            that.editorDriver.SetValidation(undefined, '');
                        });
                    else {
                        that.editorDriver.SetValidation(undefined, '');
                    }
                });
            }
            return FormulaValidationPresenter;
        })();
        Presenters.FormulaValidationPresenter = FormulaValidationPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=formulavalidationpresenter.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var FurtherTestingPresenter = (function () {
            function FurtherTestingPresenter(appModel, driver, popupViewer, ajax, messagebox, logService) {
                var _this = this;
                var that = this;
                this.appModel = appModel;
                this.driver = driver;
                this.popupViewer = popupViewer;
                this.ajax = ajax;
                this.messagebox = messagebox;
                window.Commands.On("ProofFailed", function (param) {
                    if (param !== undefined) {
                        that.driver.ShowStartFurtherTestingToggler();
                        that.model = param.Model;
                        that.result = param.Res;
                        that.variables = param.Variables;
                    }
                    else {
                        that.data = undefined;
                    }
                });
                function OnProofStarting() {
                    that.driver.ActiveMode();
                    that.driver.HideStartFurtherTestingToggler();
                    that.driver.HideResults();
                    that.data = undefined;
                }
                window.Commands.On("ProofStarting", function () {
                    OnProofStarting();
                });
                window.Commands.On("FurtherTestingRequested", function () {
                    if (that.result.length !== 0 && that.model !== undefined && that.result !== undefined && that.variables !== undefined) {
                        that.driver.StandbyMode();
                        logService.LogFurtherTestingRun();
                        var result = that.ajax.Invoke({
                            Model: that.model,
                            Analysis: that.result,
                        })
                            .done(function (res2) {
                            that.driver.ActiveMode();
                            if (res2.CounterExamples !== null) {
                                that.driver.HideStartFurtherTestingToggler();
                                if (res2.CounterExamples.length === 0) {
                                }
                                else {
                                    var bif = null, osc = null, fix = null;
                                    for (var i = 0; i < res2.CounterExamples.length; i++) {
                                        switch (res2.CounterExamples[i].Status) {
                                            case "Bifurcation":
                                                bif = res2.CounterExamples[i];
                                                break;
                                            case "Cycle":
                                                osc = res2.CounterExamples[i];
                                                break;
                                            case "Fixpoint":
                                                fix = res2.CounterExamples[i];
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
                                        var label = $('<div></div>').addClass('further-testing-tab');
                                        var icon = $('<div></div>').addClass('bifurcations-icon').appendTo(label);
                                        var text = $('<div></div>').text('Bifurcations').appendTo(label);
                                        tabLabels.push(label);
                                    }
                                    if (osc !== null) {
                                        var parseOscillations = that.ParseOscillations(osc.Variables);
                                        var oscillationsView = that.CreateOscillationsView(that.variables, parseOscillations);
                                        data.push(oscillationsView);
                                        headers.push(["Cell", "Name", "Calculated Bound", "Oscillation"]);
                                        var label = $('<div></div>').addClass('further-testing-tab');
                                        var icon = $('<div></div>').addClass('oscillations-icon').appendTo(label);
                                        var text = $('<div></div>').text('Oscillations').appendTo(label);
                                        tabLabels.push(label);
                                    }
                                    if (fix !== null && bif === null && osc === null) {
                                        try {
                                            var parseFix = that.ParseFixPoint(fix.Variables);
                                            window.Commands.Execute("ProofByFurtherTesting", {
                                                issucceeded: true,
                                                message: 'Further testing has been determined the model to be stable with the following stable state',
                                                fixPoint: parseFix
                                            });
                                            OnProofStarting();
                                        }
                                        catch (ex) {
                                            that.messagebox.Show("FurtherTesting error: Invalid service response");
                                            that.driver.ShowStartFurtherTestingToggler();
                                        }
                                        ;
                                    }
                                    else {
                                        that.data = { tabLabels: tabLabels, tableHeaders: headers, data: data };
                                        that.driver.ShowResults(that.data);
                                    }
                                }
                            }
                            else {
                                logService.LogFurtherTestingError();
                                that.driver.ActiveMode();
                                if (res2.Error !== null && res2.Error !== undefined) {
                                    that.messagebox.Show("FurtherTesting error: " + res2.Error);
                                }
                                else {
                                    that.messagebox.Show("FurtherTesting error: Invalid service response");
                                }
                            }
                        })
                            .fail(function (XMLHttpRequest, textStatus, errorThrown) {
                            that.driver.ActiveMode();
                            that.messagebox.Show("FurtherTesting error: Invalid service response");
                        });
                    }
                    else
                        that.messagebox.Show("No Variables");
                });
                window.Commands.On("Expand", function (param) {
                    switch (param) {
                        case "FurtherTesting":
                            that.driver.HideStartFurtherTestingToggler();
                            that.driver.HideResults();
                            var content = $('<div></div>').furthertesting();
                            content.furthertesting("SetData", that.data);
                            var full = content.children().eq(1).children().eq(1);
                            _this.popupViewer.Show({ tab: param, content: full });
                            break;
                        default:
                            that.driver.ShowResults(that.data);
                            break;
                    }
                });
                window.Commands.On("Collapse", function (param) {
                    switch (param) {
                        case "FurtherTesting":
                            that.driver.ShowResults(that.data);
                            _this.popupViewer.Hide();
                            break;
                    }
                });
            }
            FurtherTestingPresenter.prototype.ParseOscillations = function (variables) {
                var table = [];
                for (var j = 0; j < variables.length; j++) {
                    var parse = this.ParseId(variables[j].Id);
                    if (table[parseInt(parse[0])] === undefined)
                        table[parseInt(parse[0])] = [];
                    table[parseInt(parse[0])][parseInt(parse[1])] = variables[j].Value;
                }
                var result = [];
                for (var i = 0; i < table.length; i++) {
                    if (table[i] !== undefined) {
                        result[i] = { min: table[i][0], max: table[i][0], oscillations: "" };
                        for (var j = 0; j < table[i].length - 1; j++) {
                            if (table[i][j] < result[i].min)
                                result[i].min = table[i][j];
                            if (table[i][j] > result[i].max)
                                result[i].max = table[i][j];
                            result[i].oscillations += table[i][j] + ",";
                        }
                        result[i].oscillations += table[i][table[i].length - 1];
                    }
                }
                return result;
            };
            FurtherTestingPresenter.prototype.ParseBifurcations = function (variables) {
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
            };
            FurtherTestingPresenter.prototype.CreateOscillationsView = function (variables, results) {
                var that = this;
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    var resid = results[variables[i].Id];
                    table[i] = [];
                    table[i][0] = (function () {
                        var cont = that.appModel.Layout.GetContainerById(variables[i].ContainerId);
                        return cont !== undefined ? cont.Name : '';
                    })();
                    table[i][1] = variables[i].Name;
                    table[i][2] = resid.min + '-' + resid.max;
                    table[i][3] = resid.oscillations;
                }
                return table;
            };
            FurtherTestingPresenter.prototype.CreateBifurcationsView = function (variables, results) {
                var that = this;
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    var resid = results[variables[i].Id];
                    table[i] = [];
                    table[i][0] = (function () {
                        var cont = that.appModel.Layout.GetContainerById(variables[i].ContainerId);
                        return cont !== undefined ? cont.Name : '';
                    })();
                    table[i][1] = variables[i].Name;
                    if (resid.min !== resid.max)
                        table[i][2] = resid.min + '-' + resid.max;
                    else
                        table[i][2] = resid.min;
                    table[i][3] = resid.Fix1;
                    table[i][4] = resid.Fix2;
                }
                return table;
            };
            FurtherTestingPresenter.prototype.ParseFixPoint = function (variables) {
                var fixPoints = [];
                var that = this;
                variables.forEach(function (val, ind) {
                    fixPoints.push({
                        "Id": that.ParseId(val.Id)[0],
                        "Value": val.Value
                    });
                });
                return fixPoints;
            };
            FurtherTestingPresenter.prototype.ParseId = function (id) {
                var parse = id.split('^');
                return parse;
            };
            return FurtherTestingPresenter;
        })();
        Presenters.FurtherTestingPresenter = FurtherTestingPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=furthertestingpresenter.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var LocalStoragePresenter = (function () {
            function LocalStoragePresenter(appModel, editor, tool, messagebox, checker, logService) {
                var that = this;
                this.appModel = appModel;
                this.driver = editor;
                this.tool = tool;
                this.messagebox = messagebox;
                this.checker = checker;
                var keys = that.tool.GetModelList();
                this.driver.SetItems(keys);
                this.driver.Hide();
                window.Commands.On("LocalStorageChanged", function () {
                    var keys = that.tool.GetModelList();
                    if (keys === undefined || keys.length == 0)
                        that.driver.Message("The model repository is empty");
                    else
                        that.driver.Message('');
                    that.driver.SetItems(keys);
                });
                window.Commands.On("LocalStorageRemoveModel", function (key) {
                    that.tool.RemoveModel(key);
                });
                window.Commands.On("LocalStorageRequested", function () {
                    var keys = that.tool.GetModelList();
                    that.driver.SetItems(keys);
                    that.driver.Show();
                });
                window.Commands.On("LocalStorageSaveModel", function () {
                    try {
                        logService.LogSaveModel();
                        var key = appModel.BioModel.Name;
                        that.tool.SaveModel(key, JSON.parse(appModel.Serialize()));
                        that.checker.Snapshot(that.appModel);
                    }
                    catch (ex) {
                        alert("Couldn't save model: " + ex);
                    }
                });
                window.Commands.On("LocalStorageLoadModel", function (key) {
                    try {
                        if (that.checker.IsChanged(that.appModel)) {
                            var userDialog = $('<div></div>').appendTo('body').userdialog({
                                message: "Do you want to save changes?",
                                actions: [
                                    {
                                        button: 'Yes',
                                        callback: function () {
                                            userDialog.detach();
                                            window.Commands.Execute("LocalStorageSaveModel", {});
                                        }
                                    },
                                    {
                                        button: 'No',
                                        callback: function () {
                                            userDialog.detach();
                                            load();
                                        }
                                    },
                                    {
                                        button: 'Cancel',
                                        callback: function () { userDialog.detach(); }
                                    }
                                ]
                            });
                        }
                        else
                            load();
                    }
                    catch (ex) {
                        alert(ex);
                        load();
                    }
                    function load() {
                        if (that.tool.IsInRepo(key)) {
                            appModel.Deserialize(JSON.stringify(that.tool.LoadModel(key)));
                            that.checker.Snapshot(that.appModel);
                        }
                        else {
                            that.messagebox.Show("The model was removed from outside");
                            window.Commands.Execute("LocalStorageChanged", {});
                        }
                    }
                });
                window.Commands.On("LocalStorageInitModel", function (key) {
                    if (that.tool.IsInRepo(key)) {
                        appModel.Deserialize(JSON.stringify(that.tool.LoadModel(key)));
                        that.checker.Snapshot(that.appModel);
                    }
                });
                window.Commands.Execute("LocalStorageChanged", {});
            }
            return LocalStoragePresenter;
        })();
        Presenters.LocalStoragePresenter = LocalStoragePresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=localstoragepresenter.js.map
/// <reference path="..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
var BMA;
(function (BMA) {
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
    ;
    var SessionLog = (function () {
        function SessionLog() {
            this.userId = $.cookie("BMAClient.UserID");
            if (this.userId === undefined)
                this.userId = generateUUID();
            $.cookie("BMAClient.UserID", this.userId, { expires: 365 * 10 }); // Set cookie with persistent user ID that will last for 10 years from now
            this.sessionId = generateUUID();
            this.logIn = new Date();
            this.logOut = new Date();
            this.proofCount = 0;
            this.simulationCount = 0;
            this.furtherTestingCount = 0;
            this.newModelCount = 0;
            this.saveModelCount = 0;
            this.importModelCount = 0;
            this.proofErrorCount = this.furtherTestingErrorCount = this.simulationErrorCount = 0;
        }
        SessionLog.prototype.LogProofError = function () {
            this.proofErrorCount++;
        };
        SessionLog.prototype.LogSimulationError = function () {
            this.simulationErrorCount++;
        };
        SessionLog.prototype.LogFurtherTestingError = function () {
            this.furtherTestingErrorCount++;
        };
        SessionLog.prototype.LogProofRun = function () {
            this.proofCount++;
        };
        SessionLog.prototype.LogSimulationRun = function () {
            this.simulationCount++;
        };
        SessionLog.prototype.LogFurtherTestingRun = function () {
            this.furtherTestingCount++;
        };
        SessionLog.prototype.LogNewModelCreated = function () {
            this.newModelCount++;
        };
        SessionLog.prototype.LogImportModel = function () {
            this.importModelCount++;
        };
        SessionLog.prototype.LogSaveModel = function () {
            this.saveModelCount++;
        };
        SessionLog.prototype.CloseSession = function () {
            this.logOut = new Date();
            return {
                Proof: this.proofCount,
                Simulation: this.simulationCount,
                FurtherTesting: this.furtherTestingCount,
                NewModel: this.newModelCount,
                ImportModel: this.importModelCount,
                SaveModel: this.saveModelCount,
                LogIn: this.logIn.toJSON(),
                LogOut: this.logOut.toJSON(),
                UserID: this.userId,
                SessionID: this.sessionId,
                ProofErrorCount: this.proofErrorCount,
                SimulationErrorCount: this.simulationErrorCount,
                FurtherTestingErrorCount: this.furtherTestingErrorCount
            };
        };
        return SessionLog;
    })();
    BMA.SessionLog = SessionLog;
})(BMA || (BMA = {}));
//# sourceMappingURL=UserLog.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    var accordion = $.widget("BMA.bmaaccordion", {
        version: "1.11.0",
        options: {
            active: 0,
            animate: {},
            collapsible: true,
            event: "click",
            position: "center",
            // callbacks
            activate: null,
            beforeActivate: null,
            contentLoaded: { ind: "", val: true },
            z_index: 0
        },
        hideProps: {},
        showProps: {},
        _create: function () {
            this.element.addClass("bma-accordion-container");
            var options = this.options;
            this.prevShow = this.prevHide = $();
            this.element.addClass("ui-accordion")
                .attr("role", "tablist");
            // don't allow collapsible: false and active: false / null
            if (!options.collapsible && (options.active === false || options.active == null)) {
                options.active = 0;
            }
            this._processPanels();
            // handle negative values
            if (options.active < 0) {
                options.active += this.headers.length;
            }
            this._refresh();
        },
        _getCreateEventData: function () {
            return {
                header: this.active,
                panel: !this.active.length ? $() : this.active.next()
            };
        },
        _destroy: function () {
            var contents;
            // clean up main element
            this.element
                .removeClass("ui-accordion ui-widget ui-helper-reset")
                .removeAttr("role");
            // clean up headers
            this.headers
                .removeClass("ui-accordion-header ui-accordion-header-active ui-state-default " +
                "ui-corner-all ui-state-active ui-state-disabled ui-corner-top")
                .removeAttr("role")
                .removeAttr("aria-expanded")
                .removeAttr("aria-selected")
                .removeAttr("aria-controls")
                .removeAttr("tabIndex")
                .removeUniqueId();
            // clean up content panels
            contents = this.headers.next()
                .removeClass("ui-helper-reset ui-widget-content ui-corner-bottom " +
                "ui-accordion-content ui-accordion-content-active ui-state-disabled")
                .css("display", "")
                .removeAttr("role")
                .removeAttr("aria-hidden")
                .removeAttr("aria-labelledby")
                .removeUniqueId();
        },
        _processAnimation: function (context) {
            var that = this;
            var position = that.options.position;
            var distantion = 0;
            switch (position) {
                case "left":
                case "right":
                    distantion = context.outerWidth();
                    break;
                case "top":
                case "bottom":
                    distantion = context.outerHeight();
                    break;
                case "center":
                    return;
            }
            this.hideProps = {};
            this.showProps = {};
            this.hideProps[that.options.position] = "-=" + distantion;
            this.showProps[that.options.position] = "+=" + distantion;
            //context.show().css("z-index",1);
            context.css("z-index", that.options.z_index + 1);
            //this.headers.next().not(context).hide().css("z-index", 0);
            this.headers.next().not(context).css("z-index", that.options.z_index);
        },
        _setOption: function (key, value) {
            var that = this;
            if (key === "active") {
                // _activate() will handle invalid values and update this.options
                this._activate(value);
                return;
            }
            if (key === "event") {
                if (this.options.event) {
                    this._off(this.headers, this.options.event);
                }
                value.ind;
                this._setupEvents(value);
            }
            if (key == "contentLoaded") {
                var isthatActive;
                if (typeof value.ind === "number") {
                    isthatActive = that.headers[value.ind][0] === that.active[0];
                    that.loadingList[value.ind] = value.val;
                }
                else if (typeof value.ind === "string") {
                    isthatActive = $(value.ind)[0] === that.active[0];
                    that.loadingList[that.headers.index($(value.ind))] = value.val;
                }
                else if (typeof value.ind === "JQuery") {
                    isthatActive = value.ind[0] === that.active[0];
                    that.loadingList[that.headers.index(value.ind)] = value.val;
                }
                if (value.val) {
                    if (isthatActive) {
                        that._hideLoading(that.active);
                        var eventData = {
                            oldHeader: $(),
                            oldPanel: $(),
                            newHeader: that.active,
                            newPanel: that.active.next()
                        };
                        that._toggle(eventData);
                    }
                }
            }
            if (key == "position") {
                switch (value) {
                    case "left":
                    case "right":
                    case "top":
                    case "bottom":
                    case "center":
                        that.options.position = value;
                }
                return;
            }
            // setting collapsible: false while collapsed; open first panel
            if (key === "collapsible" && !value && this.options.active === false) {
                this._activate(0);
            }
            // #5332 - opacity doesn't cascade to positioned elements in IE
            // so we need to add the disabled class to the headers and panels
            if (key === "disabled") {
                this.element
                    .toggleClass("ui-state-disabled", !!value)
                    .attr("aria-disabled", value);
                this.headers.add(this.options.context)
                    .toggleClass("ui-state-disabled", !!value);
            }
            this._super(key, value);
        },
        _keydown: function (event) {
            if (event.altKey || event.ctrlKey) {
                return;
            }
            var keyCode = $.ui.keyCode, length = this.headers.length, currentIndex = this.headers.index(event.target), toFocus = undefined;
            switch (event.keyCode) {
                case keyCode.RIGHT:
                case keyCode.DOWN:
                    toFocus = this.headers[(currentIndex + 1) % length];
                    break;
                case keyCode.LEFT:
                case keyCode.UP:
                    toFocus = this.headers[(currentIndex - 1 + length) % length];
                    break;
                //case keyCode.SPACE:
                case keyCode.ENTER:
                    this._eventHandler(event);
                    break;
                case keyCode.HOME:
                    toFocus = this.headers[0];
                    break;
                case keyCode.END:
                    toFocus = this.headers[length - 1];
                    break;
            }
            if (toFocus !== undefined) {
                $(event.target).attr("tabIndex", -1);
                $(toFocus).attr("tabIndex", 0);
                //toFocus.focus();
                event.preventDefault();
            }
        },
        _panelKeyDown: function (event) {
            if (event.keyCode === $.ui.keyCode.UP && event.ctrlKey) {
            }
        },
        refresh: function () {
            var options = this.options;
            this._processPanels();
            // was collapsed or no panel
            if ((options.active === false && options.collapsible === true) || !this.headers.length) {
                options.active = false;
                this.active = $();
            }
            else if (options.active === false) {
                this._activate(0);
            }
            else if (this.active.length && !$.contains(this.element[0], this.active[0])) {
                // all remaining panel are disabled
                if (this.headers.length === this.headers.find(".ui-state-disabled").length) {
                    options.active = false;
                    this.active = $();
                }
                else {
                    this._activate(Math.max(0, options.active - 1));
                }
            }
            else {
                // make sure active index is correct
                options.active = this.headers.index(this.active);
            }
            this._refresh();
        },
        _processPanels: function () {
            var that = this;
            var position = that.options.position;
            this.element.css(position, 0);
            this.headers = that.element.children().filter(':even');
            this.headers
                .addClass("bma-accordion-header");
            //var loading = that.options.showLoading;
            this.loadingList = [];
            for (var ind = 0; ind < this.headers.length; ind++) {
                that.loadingList[ind] = true;
                var th = this.headers[ind];
                var child = $(th).next();
                var distantion = 0;
                switch (position) {
                    case "left":
                    case "right":
                        distantion = child.outerWidth();
                        $(th).css("top", ($(th).outerHeight() + 10) * ind);
                        break;
                    case "top":
                    case "bottom":
                        distantion = child.outerHeight();
                        $(th).css("left", ($(th).outerWidth() + 10) * ind);
                        break;
                    case "center":
                        that.headers
                            .removeClass("accordion-expanded")
                            .addClass("accordion-collapsed");
                        that.headers.next().hide();
                        return;
                }
                that.headers.css("position", "absolute");
                that.headers.css(position, 0);
                child.css("position", "absolute");
                child.css(position, -distantion);
            }
        },
        _refresh: function () {
            var maxHeight, options = this.options, parent = this.element.parent();
            this.active = $();
            this.active.next()
                .addClass("ui-accordion-content-active");
            //.show();
            var that = this;
            this.headers
                .attr("role", "tab")
                .each(function () {
                var header = $(this), headerId = header.uniqueId().attr("id"), panel = header.next(), panelId = panel.uniqueId().attr("id");
                header.attr("aria-controls", panelId);
                panel.attr("aria-labelledby", headerId);
            })
                .next()
                .attr("role", "tabpanel");
            this.headers
                .not(this.active)
                .attr({
                "aria-selected": "false",
                "aria-expanded": "false",
                tabIndex: -1
            })
                .next()
                .attr({
                "aria-hidden": "true"
            })
                .hide();
            // make sure at least one header is in the tab order
            if (!this.active.length) {
                this.headers.eq(0).attr("tabIndex", 0);
            }
            else {
                this.active.attr({
                    "aria-selected": "true",
                    "aria-expanded": "true",
                    tabIndex: 0
                })
                    .next()
                    .attr({
                    "aria-hidden": "false"
                });
            }
            this._setupEvents(options.event);
        },
        _findActive: function (selector) {
            return typeof selector === "number" ? this.headers.eq(selector) : $();
        },
        _setupEvents: function (event) {
            var events = {
                keydown: "_keydown"
            };
            if (event) {
                $.each(event.split(" "), function (index, eventName) {
                    events[eventName] = "eventHandler";
                });
            }
            //this._off(this.headers.add(this.options.context));
            this._off(this.headers);
            this._on(this.headers, events);
            //this._on(this.options.context, { keydown: "_panelKeyDown" });
            this._on(this.headers.next(), { keydown: "_panelKeyDown" });
            //this._hoverable(this.headers);
            //this._focusable(this.headers);
        },
        eventHandler: function (event) {
            var options = this.options, active = this.active, clicked = $(event.currentTarget).eq(0), clickedIsActive = clicked[0] === active[0], collapsing = clickedIsActive && options.collapsible, toShow = collapsing ? $() : clicked.next(), toHide = this.loadingList[this.headers.index(this.active)] ? active.next() : $(), 
            //toShow = collapsing ? $() : options.context,
            eventData = {
                oldHeader: active,
                oldPanel: toHide,
                newHeader: clicked,
                newPanel: toShow
            };
            event.preventDefault();
            if (
            // click on active header, but not collapsible
            (clickedIsActive && !options.collapsible) ||
                // allow canceling activation
                (this._trigger("beforeActivate", event, eventData) === false)) {
                return;
            }
            if (toShow.is(":hidden")) {
                //toShow.show();
                window.Commands.Execute(clicked.attr("data-command"), {});
            }
            eventData.newHeader.css("z-index", this.options.z_index + 2);
            this.headers.not(eventData.newHeader).css("z-index", this.options.z_index); //0);
            // when the call to ._toggle() comes after the class changes
            // it causes a very odd bug in IE 8 (see #6720)
            //this.active.next().show();
            this.active = clickedIsActive ? $() : clicked;
            if (!this.loadingList[this.headers.index(clicked)]) {
                eventData.newPanel = $();
                if (!collapsing) {
                    this._hideLoading(this.headers.not(clicked));
                    this._toggle(eventData);
                    this._showLoading(clicked);
                }
                else {
                    this._hideLoading(clicked);
                }
                return;
            }
            this._toggle(eventData);
            // switch classes
            // corner classes on the previously active header stay after the animation
            active.removeClass("ui-accordion-header-active ui-state-active");
            if (!clickedIsActive) {
                clicked
                    .removeClass("ui-corner-all")
                    .addClass("ui-accordion-header-active  ui-corner-top");
                clicked
                    .addClass("ui-accordion-content-active");
            }
        },
        _toggle: function (data) {
            var toShow = data.newPanel, toHide = this.prevShow.length ? this.prevShow : data.oldPanel;
            var that = this;
            // handle activating a panel during the animation for another activation
            this.prevShow.add(this.prevHide).stop(true, true);
            this.prevShow = toShow;
            this.prevHide = toHide;
            if (that.options.animate && that.options.position != "center") {
                that._animate(toShow, toHide, data);
            }
            else {
                toHide.hide();
                toShow.show();
                //if (this.options.context.is(":hidden"))
                if (data.newHeader.next().is(":hidden")) {
                    data.newHeader
                        .removeClass("accordion-expanded")
                        .removeClass("accordion-shadow")
                        .addClass("accordion-collapsed");
                }
                else {
                    data.newHeader
                        .removeClass("accordion-collapsed")
                        .addClass("accordion-expanded")
                        .addClass("accordion-shadow");
                }
                that._toggleComplete(data);
            }
            toHide.attr({
                "aria-hidden": "true"
            }); //.hide();
            toHide.prev().attr("aria-selected", "false");
            // if we're switching panels, remove the old header from the tab order
            // if we're opening from collapsed state, remove the previous header from the tab order
            // if we're collapsing, then keep the collapsing header in the tab order
            if (toShow.length && toHide.length) {
                toHide.prev().attr({
                    "tabIndex": -1,
                    "aria-expanded": "false"
                });
            }
            else if (toShow.length) {
                this.headers.filter(function () {
                    return $(this).attr("tabIndex") === 0;
                })
                    .attr("tabIndex", -1);
            }
            toShow
                .attr("aria-hidden", "false")
                .prev()
                .attr({
                "aria-selected": "true",
                tabIndex: 0,
                "aria-expanded": "true"
            });
            if (that.options.onactivetabchanged) {
                that.options.onactivetabchanged();
            }
        },
        _showLoading: function (clicked) {
            clicked.animate({ width: "+=60px" });
            var snipper = $('<div class="spinner loading"></div>').appendTo(clicked);
            for (var i = 1; i < 4; i++) {
                $('<div></div>').addClass('bounce' + i).appendTo(snipper);
            }
            //$('<img src="../../images/60x60.gif">').appendTo(clicked).addClass("loading");
        },
        _hideLoading: function (toHide) {
            toHide.each(function () {
                var load = $(this).children().filter(".loading");
                if (load.length) {
                    load.detach();
                    $(this).animate({ width: "-=60px" });
                }
            });
        },
        _animate: function (toShow, toHide, data) {
            var total, easing, duration, that = this, adjust = 0, down = toShow.length &&
                (!toHide.length || (toShow.index() < toHide.index())), animate = this.options.animate || {}, options = down && animate.down || animate, complete = function () {
                that._toggleComplete(data);
            };
            if (typeof options === "number") {
                duration = options;
            }
            if (typeof options === "string") {
                easing = options;
            }
            // fall back from options to animation in case of partial down settings
            easing = easing || options.easing || animate.easing;
            duration = duration || options.duration || animate.duration;
            var that = this;
            this._hideLoading(this.headers.not(this.active));
            if (!toShow.length) {
                that._processAnimation(toHide);
                that.element.animate(that.hideProps, duration, easing, complete);
                return;
            }
            if (!toHide.length) {
                that._processAnimation(toShow);
                toShow.show();
                that.element.animate(that.showProps, duration, easing, complete);
                return;
            }
            //context.show()
            //this.headers.next().not(context).hide()
            //toHide.hide().css("z-index", 0);
            //toShow.show().css("z-index", 1);
            toHide.css("z-index", that.options.z_index); //0);
            toShow.css("z-index", that.options.z_index + 1);
            this._toggleComplete(data);
        },
        _toggleComplete: function (data) {
            var toHide = data.oldPanel;
            var toShow = data.newPanel;
            //toHide.hide();
            //toShow.show();
            data.newPanel.css("z-index", this.options.z_index + 1);
            toHide
                .removeClass("ui-accordion-content-active")
                .prev()
                .removeClass("ui-corner-top")
                .addClass("ui-corner-all");
            toHide.hide();
            toShow.show();
            // Work around for rendering bug in IE (#5421)
            if (toHide.length) {
                toHide.parent()[0].className = toHide.parent()[0].className;
            }
            this._trigger("activate", null, data);
            //this.headers.not(this.active).next().hide();
        }
    });
}(jQuery));
//# sourceMappingURL=accordeon.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.bmazoomslider", {
        options: {
            step: 10,
            value: 0,
            min: 0,
            max: 100
        },
        _create: function () {
            var that = this;
            this.element.addClass("zoomslider-container");
            var command = this.element.attr("data-command");
            var zoomplus = $('<img>')
                .attr("id", "zoom-plus")
                .attr("src", "images/zoomplus.svg")
                .addClass("hoverable")
                .appendTo(that.element);
            this.zoomslider = $('<div></div>')
                .appendTo(that.element);
            var zoomminus = $('<img>')
                .attr("id", "zoom-minus")
                .attr("src", "images/zoomminus.svg")
                .addClass("hoverable")
                .appendTo(that.element);
            this.zoomslider.slider({
                min: that.options.min,
                max: that.options.max,
                //step: that.options.step,
                value: that.options.value,
                change: function (event, ui) {
                    var val = that.zoomslider.slider("option", "value");
                    var isExternal = val > that.options.max ||
                        val < that.options.min;
                    if (!isExternal) {
                        that.options.value = val;
                    }
                    else {
                        var newval = val > that.options.max ? that.options.max : that.options.min;
                        that.options.value = newval;
                        that.zoomslider.slider("option", "value", newval);
                    }
                    if (command !== undefined && command !== "") {
                        window.Commands.Execute(command, { value: val, isExternal: isExternal });
                    }
                }
            });
            this.zoomslider.removeClass().addClass("zoomslider-bar");
            this.zoomslider.find('a').removeClass().addClass('zoomslider-pointer');
            zoomplus.bind("click", function () {
                var val = that.zoomslider.slider("option", "value") - that.options.step;
                that.zoomslider.slider("option", "value", val);
            });
            zoomminus.bind("click", function () {
                var val = that.zoomslider.slider("option", "value") + that.options.step;
                that.zoomslider.slider("option", "value", val);
            });
        },
        _destroy: function () {
            var contents;
            // clean up main element
            this.element.removeClass("zoomslider-container");
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "value":
                    if (this.options.value !== value) {
                        this.options.value = value;
                        this.zoomslider.slider("option", "value", value);
                    }
                    break;
                case "min":
                    this.options.min = value;
                    this.zoomslider.slider("option", "min", value);
                    break;
                case "max":
                    this.options.max = value;
                    this.zoomslider.slider("option", "max", value);
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=bmaslider.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.coloredtableviewer", {
        options: {
            header: [],
            numericData: undefined,
            colorData: undefined,
            type: "standart",
            onChangePlotVariables: undefined,
        },
        _create: function () {
            this.refresh();
        },
        refresh: function () {
            this.element.empty();
            var that = this;
            var options = this.options;
            this.table = $('<table></table>');
            this.table.appendTo(that.element);
            switch (options.type) {
                case "standart":
                    if (options.numericData !== undefined && options.numericData !== null && options.numericData.length !== 0) {
                        this.table.addClass("variables-table");
                        this.createHeader(options.header);
                        this.arrayToTable(options.numericData);
                        if (options.colorData !== undefined)
                            this.paintTable(options.colorData);
                    }
                    break;
                case "color":
                    this.table.addClass("proof-propagation-overview");
                    if (options.colorData !== undefined && options.colorData.length !== 0) {
                        var that = this;
                        var color = options.colorData;
                        for (var i = 0; i < color.length; i++) {
                            var tr = $('<tr></tr>').appendTo(that.table);
                            for (var j = 0; j < color[i].length; j++) {
                                var td = $('<td></td>').appendTo(tr);
                                if (color[i][j] !== undefined) {
                                    if (color[i][j])
                                        td.addClass('propagation-cell-green');
                                    else
                                        td.addClass('propagation-cell-red');
                                }
                            }
                        }
                    }
                    break;
                case "graph-min":
                    if (options.numericData !== undefined && options.numericData !== null && options.numericData.length !== 0) {
                        this.table.addClass("variables-table");
                        this.createHeader(options.header);
                        this.arrayToTableGraphMin(options.numericData);
                        if (options.colorData !== undefined)
                            this.paintTable(options.colorData);
                    }
                    break;
                case "graph-max":
                    if (options.numericData !== undefined && options.numericData !== null && options.numericData.length !== 0) {
                        this.table.addClass("variables-table");
                        this.createHeader(options.header);
                        var tr0 = that.table.find("tr").eq(0);
                        tr0.children("td").eq(0).attr("colspan", "2");
                        tr0.children("td").eq(2).attr("colspan", "2");
                        this.arrayToTableGraphMax(options.numericData);
                        if (options.colorData !== undefined)
                            this.paintTable(options.colorData);
                    }
                    break;
                case "simulation-min":
                    this.table.addClass("proof-propagation-overview");
                    if (options.colorData !== undefined && options.colorData.length !== 0) {
                        var that = this;
                        var color = options.colorData;
                        for (var i = 0; i < color.length; i++) {
                            var tr = $('<tr></tr>').appendTo(that.table);
                            for (var j = 0; j < color[i].length; j++) {
                                var td = $('<td></td>').appendTo(tr);
                                if (color[i][j]) {
                                    td.addClass('change'); //.css("background-color", "#FFF729"); //no guide
                                }
                            }
                        }
                    }
                    break;
            }
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            if (key === "header")
                this.options.header = value;
            if (key === "numericData")
                this.options.numericData = value;
            if (key === "colorData") {
                this.options.colorData = value;
                if (this.options.colorData !== undefined) {
                    this.paintTable(this.options.colorData);
                    return;
                }
            }
            if (key === "onChangePlotVariables")
                this.options.onChangePlotVariables = value;
            this._super(key, value);
            if (value !== null && value !== undefined)
                this.refresh();
        },
        createHeader: function (header) {
            var that = this;
            var tr = $('<tr></tr>').appendTo(that.table);
            for (var i = 0; i < header.length; i++) {
                $('<td></td>').text(header[i]).appendTo(tr);
            }
        },
        arrayToTableGraphMin: function (array) {
            var that = this;
            for (var i = 0; i < array.length; i++) {
                var tr = $('<tr></tr>').appendTo(that.table);
                var td0 = $('<td></td>').appendTo(tr);
                if (array[i][0] !== undefined)
                    td0.css("background-color", array[i][0]);
                for (var j = 1; j < array[i].length; j++) {
                    $('<td></td>').text(array[i][j]).appendTo(tr);
                }
            }
        },
        arrayToTableGraphMax: function (array) {
            var that = this;
            var vars = this.options.variables;
            for (var i = 0; i < array.length; i++) {
                var tr = $('<tr></tr>').appendTo(that.table);
                var td0 = $('<td></td>').appendTo(tr);
                var buttontd = $('<td></td>').appendTo(tr);
                if (array[i][1] && array[i][0] !== undefined) {
                    td0.css("background-color", array[i][0]);
                    buttontd.addClass("plot-check");
                }
                buttontd.bind("click", function () {
                    $(this).toggleClass("plot-check");
                    var check = $(this).hasClass("plot-check");
                    if (check) {
                        $(this).prev().css("background-color", array[$(this).parent().index() - 1][0]);
                        that.alldiv.attr("checked", that.checkAllButtons());
                    }
                    else {
                        that.alldiv.attr("checked", false);
                        $(this).prev().css("background-color", "transparent");
                    }
                    //window.Commands.Execute("ChangePlotVariables", { ind: $(this).parent().index() - 1, check: check });
                    if (that.options.onChangePlotVariables !== undefined)
                        that.options.onChangePlotVariables({ ind: $(this).parent().index() - 1, check: check });
                });
                for (var j = 2; j < array[i].length; j++) {
                    $('<td></td>').text(array[i][j]).appendTo(tr);
                }
            }
            this.buttons = that.table.find("tr").not(":first-child").find("td:nth-child(2)");
            var alltr = $('<tr></tr>').appendTo(that.table);
            var tdall0 = $('<td></td>').appendTo(alltr);
            this.allcheck = $('<td id="allcheck"></td>').appendTo(alltr).addClass("plot-check");
            var tdall1 = $('<td></td>').appendTo(alltr);
            this.alldiv = $('<div></div>').attr("checked", that.checkAllButtons()).text("ALL").appendTo(tdall1);
            tdall1.css("border-left", "none");
            this.allcheck.bind("click", function () {
                that.alldiv.attr("checked", !that.alldiv.attr("checked"));
                if (that.alldiv.attr("checked")) {
                    for (var i = 0; i < that.buttons.length; i++) {
                        if (!$(that.buttons[i]).hasClass("plot-check"))
                            $(that.buttons[i]).click();
                    }
                }
                else {
                    for (var i = 0; i < that.buttons.length; i++) {
                        if ($(that.buttons[i]).hasClass("plot-check"))
                            $(that.buttons[i]).click();
                    }
                }
            });
        },
        getColors: function () {
            var that = this;
            if (this.options.type === "graph-max") {
                var tds = this.table.find("tr:not(:first-child)").children("td: nth-child(2)");
                var data = [];
                tds.each(function (ind, val) {
                    if ($(this).hasClass("plot-check"))
                        data[ind] = that.options.data.variables[ind].color;
                });
            }
        },
        checkAllButtons: function () {
            var that = this;
            var l = that.buttons.length;
            for (var i = 0; i < l; i++) {
                if (!that.buttons.eq(i).hasClass("plot-check"))
                    return false;
            }
            return true;
        },
        getAllButton: function () {
            if (this.allcheck !== undefined)
                return this.allcheck;
        },
        arrayToTable: function (array) {
            var that = this;
            for (var i = 0; i < array.length; i++) {
                var tr = $('<tr></tr>').appendTo(that.table);
                for (var j = 0; j < array[i].length; j++) {
                    $('<td></td>').text(array[i][j]).appendTo(tr);
                }
            }
        },
        paintTable: function (color) {
            var that = this;
            var table = that.table;
            var over = 0;
            if (that.options.header !== undefined && that.options.header.length !== 0)
                over = 1;
            for (var i = 0; i < color.length; i++) {
                var tds = table.find("tr").eq(i + over).children("td");
                if (color[i].length > tds.length) {
                    console.log("Incompatible sizes of numeric and color data-2");
                    return;
                }
                ;
                for (var j = 0; j < color[i].length; j++) {
                    var td = tds.eq(j);
                    if (color[i][j] !== undefined) {
                        if (color[i][j])
                            td.addClass('propagation-cell-green');
                        else
                            td.addClass('propagation-cell-red');
                    }
                }
            }
            return table;
        }
    });
}(jQuery));
//# sourceMappingURL=coloredtableviewer.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\functionsregistry.ts"/>
(function ($) {
    $.widget("BMA.containernameeditor", {
        options: {
            name: "name"
        },
        _create: function () {
            var that = this;
            var closediv = $('<div></div>').addClass('close-icon').appendTo(that.element);
            var closing = $('<img src="../../images/close.png">').appendTo(closediv);
            closing.bind("click", function () {
                that.element.hide();
            });
            this.element
                .addClass("container-name")
                .draggable({ containment: "parent", scroll: false });
            this.name = $('<input>')
                .attr("type", "text")
                .attr("size", 15)
                .attr("placeholder", "Container Name")
                .appendTo(that.element);
            this.name.bind("input change", function () {
                that.options.name = that.name.val();
                window.Commands.Execute("ContainerNameEdited", {});
            });
            this.name.val(that.options.name);
        },
        _setOption: function (key, value) {
            var that = this;
            if (key === "name") {
                this.options.name = value;
                this.name.val(value);
            }
            $.Widget.prototype._setOption.apply(this, arguments);
            this._super("_setOption", key, value);
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
}(jQuery));
//# sourceMappingURL=containernameeditor.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.drawingsurface", {
        _plot: null,
        _gridLinesPlot: null,
        _svgPlot: null,
        _lightSvgPlot: null,
        _rectsPlot: null,
        _dragService: null,
        //_zoomObservable: undefined,
        _zoomObs: undefined,
        _onlyZoomEnabled: false,
        _mouseMoves: null,
        _domPlot: null,
        options: {
            isNavigationEnabled: true,
            svg: undefined,
            zoom: 50,
            dropFilter: ["drawingsurface-droppable"],
            useContraints: true
        },
        _plotSettings: {
            MinWidth: 0.01,
            MaxWidth: 1e5
        },
        _checkDropFilter: function (ui) {
            if (this.options !== undefined && this.options.dropFilter !== undefined) {
                var classes = this.options.dropFilter;
                for (var i = 0; i < classes.length; i++) {
                    if (ui.hasClass(classes[i]))
                        return true;
                }
            }
            return false;
        },
        _svgLoaded: function () {
            if (this.options.svg !== undefined && this._svgPlot !== undefined) {
                this._svgPlot.svg.clear();
                this._svgPlot.svg.add(this.options.svg);
            }
        },
        _lightSvgLoaded: function () {
            if (this.options.lightSvg !== undefined && this._lightSvgPlot !== undefined) {
                this._lightSvgPlot.svg.configure({ "pointer-events": "none" }, false);
                this._lightSvgPlot.svg.clear();
                this._lightSvgPlot.svg.add(this.options.svg);
            }
        },
        _create: function () {
            var that = this;
            if (window.PlotSettings !== undefined) {
                this._plotSettings = window.PlotSettings;
            }
            //this._zoomObs = undefined;
            //this._zoomObservable = Rx.Observable.create(function (rx) {
            //    that._zoomObs = rx;
            //});
            var plotDiv = $("<div></div>").width(this.element.width()).height(this.element.height()).attr("data-idd-plot", "plot").appendTo(that.element);
            var gridLinesPlotDiv = $("<div></div>").attr("data-idd-plot", "scalableGridLines").appendTo(plotDiv);
            var rectsPlotDiv = $("<div></div>").attr("data-idd-plot", "rectsPlot").appendTo(plotDiv);
            var svgPlotDiv = $("<div></div>").attr("data-idd-plot", "svgPlot").appendTo(plotDiv);
            var domPlotDiv = $("<div></div>").attr("data-idd-plot", "dom").appendTo(plotDiv);
            var svgPlotDiv2 = $("<div></div>").attr("data-idd-plot", "svgPlot").appendTo(plotDiv);
            this.lightSVGDiv = svgPlotDiv2;
            //empty div for event handling
            //$("<div></div>").attr("data-idd-plot", "plot").appendTo(plotDiv);
            that._plot = InteractiveDataDisplay.asPlot(plotDiv);
            this._plot.aspectRatio = 1;
            var svgPlot = that._plot.get(svgPlotDiv[0]);
            this._svgPlot = svgPlot;
            var lightSvgPlot = that._plot.get(svgPlotDiv2[0]);
            this._lightSvgPlot = lightSvgPlot;
            this._domPlot = that._plot.get(domPlotDiv[0]);
            this._rectsPlot = that._plot.get(rectsPlotDiv[0]);
            //rectsPlot.draw({ rects: [{ x: 0, y: 0, width: 500, height: 500, fill: "red" }] })
            if (this.options.svg !== undefined) {
                if (svgPlot.svg === undefined) {
                    svgPlot.host.on("svgLoaded", this._svgLoaded);
                }
                else {
                    svgPlot.svg.clear();
                    svgPlot.svg.add(this.options.svg);
                }
            }
            if (lightSvgPlot.svg === undefined) {
                lightSvgPlot.host.on("svgLoaded", this._lightSvgLoaded);
            }
            else {
                //lightSvgPlot.svg.configure({ style: "pointer-events:none;" }, false);
                lightSvgPlot.svg.clear();
                if (this.options.lightSvg !== undefined)
                    lightSvgPlot.svg.add(this.options.lightSvg);
            }
            plotDiv.droppable({
                drop: function (event, ui) {
                    event.stopPropagation();
                    if (!that._checkDropFilter(ui.draggable))
                        return;
                    var cs = svgPlot.getScreenToDataTransform();
                    var position = {
                        x: cs.screenToDataX(event.pageX - plotDiv.offset().left),
                        y: -cs.screenToDataY(event.pageY - plotDiv.offset().top)
                    };
                    if (that.options.isNavigationEnabled !== true) {
                        that._executeCommand("DrawingSurfaceClick", position);
                    }
                    that._executeCommand("DrawingSurfaceDrop", position);
                }
            });
            plotDiv.bind("click touchstart", function (arg) {
                var cs = svgPlot.getScreenToDataTransform();
                if (arg.originalEvent !== undefined) {
                    arg = arg.originalEvent;
                }
                arg.stopPropagation();
                that._executeCommand("DrawingSurfaceClick", {
                    x: cs.screenToDataX(arg.pageX - plotDiv.offset().left),
                    y: -cs.screenToDataY(arg.pageY - plotDiv.offset().top),
                    screenX: arg.pageX - plotDiv.offset().left,
                    screenY: arg.pageY - plotDiv.offset().top
                });
            });
            plotDiv.mousedown(function (e) {
                e.stopPropagation();
            });
            plotDiv.dblclick(function (arg) {
                var cs = svgPlot.getScreenToDataTransform();
                if (arg.originalEvent !== undefined) {
                    arg = arg.originalEvent;
                }
                that._executeCommand("DrawingSurfaceDoubleClick", {
                    x: cs.screenToDataX(arg.pageX - plotDiv.offset().left),
                    y: -cs.screenToDataY(arg.pageY - plotDiv.offset().top)
                });
            });
            //Subject that converts input mouse events into Pan gestures 
            var createPanSubject = function (vc) {
                var _doc = $(document);
                var mouseDown = vc.onAsObservable("mousedown");
                var mouseMove = vc.onAsObservable("mousemove");
                var mouseUp = _doc.onAsObservable("mouseup");
                var stopPanning = mouseUp;
                var mouseDrags = mouseDown.selectMany(function (md) {
                    var cs = svgPlot.getScreenToDataTransform();
                    var x0 = cs.screenToDataX(md.pageX - plotDiv.offset().left);
                    var y0 = -cs.screenToDataY(md.pageY - plotDiv.offset().top);
                    return mouseMove.select(function (mm) {
                        //var cs = svgPlot.getScreenToDataTransform();
                        var x1 = cs.screenToDataX(mm.pageX - plotDiv.offset().left);
                        var y1 = -cs.screenToDataY(mm.pageY - plotDiv.offset().top);
                        return { x0: x0, y0: y0, x1: x1, y1: y1 };
                    }).takeUntil(stopPanning);
                });
                var touchStart = vc.onAsObservable("touchstart");
                var touchMove = vc.onAsObservable("touchmove");
                var touchEnd = _doc.onAsObservable("touchend");
                var touchCancel = _doc.onAsObservable("touchcancel");
                var gestures = touchStart.selectMany(function (md) {
                    var cs = svgPlot.getScreenToDataTransform();
                    var x0 = cs.screenToDataX(md.originalEvent.pageX - plotDiv.offset().left);
                    var y0 = -cs.screenToDataY(md.originalEvent.pageY - plotDiv.offset().top);
                    return touchMove.takeUntil(touchEnd.merge(touchCancel)).select(function (tm) {
                        var x1 = cs.screenToDataX(tm.originalEvent.pageX - plotDiv.offset().left);
                        var y1 = -cs.screenToDataY(tm.originalEvent.pageY - plotDiv.offset().top);
                        return { x0: x0, y0: y0, x1: x1, y1: y1 };
                    });
                });
                return mouseDrags.merge(gestures);
            };
            var createDragStartSubject = function (vc) {
                var _doc = $(document);
                var mousedown = vc.onAsObservable("mousedown").where(function (md) {
                    return md.button === 0;
                });
                var mouseMove = vc.onAsObservable("mousemove");
                var mouseUp = _doc.onAsObservable("mouseup");
                var stopPanning = mouseUp;
                var dragStarts = mousedown.selectMany(function (md) {
                    var cs = svgPlot.getScreenToDataTransform();
                    var x0 = cs.screenToDataX(md.pageX - plotDiv.offset().left);
                    var y0 = -cs.screenToDataY(md.pageY - plotDiv.offset().top);
                    return mouseMove.select(function (mm) { return { x: x0, y: y0 }; }).first().takeUntil(mouseUp);
                });
                var touchStart = vc.onAsObservable("touchstart");
                var touchMove = vc.onAsObservable("touchmove");
                var touchEnd = _doc.onAsObservable("touchend");
                var touchCancel = _doc.onAsObservable("touchcancel");
                var touchDragStarts = touchStart.selectMany(function (md) {
                    var cs = svgPlot.getScreenToDataTransform();
                    var x0 = cs.screenToDataX(md.originalEvent.pageX - plotDiv.offset().left);
                    var y0 = -cs.screenToDataY(md.originalEvent.pageY - plotDiv.offset().top);
                    return touchMove.select(function (mm) { return { x: x0, y: y0 }; }).first().takeUntil(touchEnd.merge(touchCancel));
                });
                return dragStarts;
            };
            var createDragEndSubject = function (vc) {
                var _doc = $(document);
                var mousedown = that._plot.centralPart.onAsObservable("mousedown");
                var mouseMove = vc.onAsObservable("mousemove");
                var mouseUp = _doc.onAsObservable("mouseup");
                var touchEnd = _doc.onAsObservable("touchend");
                var touchCancel = _doc.onAsObservable("touchcancel");
                var stopPanning = mouseUp.merge(touchEnd).merge(touchCancel);
                var dragEndings = stopPanning; //.takeWhile(mouseMove);
                return dragEndings;
            };
            this._dragService = {
                dragStart: createDragStartSubject(that._plot.centralPart),
                drag: createPanSubject(that._plot.centralPart),
                dragEnd: createDragEndSubject(that._plot.centralPart)
            };
            this._mouseMoves = that._plot.centralPart.onAsObservable("mousemove").select(function (mm) {
                var cs = svgPlot.getScreenToDataTransform();
                var x0 = cs.screenToDataX(mm.originalEvent.pageX - plotDiv.offset().left);
                var y0 = -cs.screenToDataY(mm.originalEvent.pageY - plotDiv.offset().top);
                return {
                    x: x0,
                    y: y0
                };
            });
            this._gridLinesPlot = that._plot.get(gridLinesPlotDiv[0]);
            var yDT = new InteractiveDataDisplay.DataTransform(function (x) {
                return -x;
            }, function (y) {
                return -y;
            }, undefined);
            this._plot.yDataTransform = yDT;
            /*
            this._domPlot.yDataTransform = new InteractiveDataDisplay.DataTransform(
                function (x) {
                    return x;
                },
                function (y) {
                    return y;
                },
                undefined);
            */
            var width = 1600;
            that.options.zoom = width;
            if (this.options.isNavigationEnabled) {
                this._setGestureSource(this._onlyZoomEnabled);
            }
            else {
                that._plot.navigation.gestureSource = undefined;
            }
            that._plot.navigation.setVisibleRect({ x: 0, y: -50, width: width, height: width / 2.5 }, false);
            that._plot.host.bind("visibleRectChanged", function (args) {
                if (Math.round(that._plot.visibleRect.width) !== that.options.zoom) {
                    that._executeCommand("VisibleRectChanged", that._plot.visibleRect.width);
                }
            });
            $(window).resize(function () { that.resize(); });
            that.resize();
            this.refresh();
        },
        resize: function () {
            if (this._plot !== null && this._plot !== undefined) {
                this._plot.host.width(this.element.width());
                this._plot.host.height(this.element.height());
                this._plot.requestUpdateLayout();
            }
        },
        _executeCommand: function (commandName, args) {
            if (this.options.commands !== undefined) {
                this.options.commands.Execute(commandName, args);
            }
            else {
                window.Commands.Execute(commandName, args);
            }
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "svg":
                    if (this._svgPlot !== undefined && this._svgPlot.svg !== undefined) {
                        this._svgPlot.svg.clear();
                        if (value !== undefined) {
                            this._svgPlot.svg.add(value);
                        }
                    }
                    break;
                case "lightSvg":
                    if (this._lightSvgPlot !== undefined && this._lightSvgPlot.svg !== undefined) {
                        this._lightSvgPlot.svg.clear();
                        if (value !== undefined) {
                            this._lightSvgPlot.svg.add(value);
                        }
                    }
                    break;
                case "isNavigationEnabled":
                    if (value === true) {
                        if (this._onlyZoomEnabled === true) {
                            this._setGestureSource(false);
                            //var gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(this._plot.host).where(function (g) {
                            //    return g.Type !== "Zoom" || g.scaleFactor > 1 && that._plot.visibleRect.width < that._plotSettings.MaxWidth || g.scaleFactor < 1 && that._plot.visibleRect.width > that._plotSettings.MinWidth;
                            //});
                            //this._plot.navigation.gestureSource = gestureSource;
                            this._onlyZoomEnabled = false;
                        }
                    }
                    else {
                        this._setGestureSource(true);
                        //var gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(this._plot.host).where(function (g) {
                        //    return g.Type === "Zoom" && (g.scaleFactor > 1 && that._plot.visibleRect.width < that._plotSettings.MaxWidth || g.scaleFactor < 1 && that._plot.visibleRect.width > that._plotSettings.MinWidth);
                        //});
                        //this._plot.navigation.gestureSource = gestureSource;
                        this._onlyZoomEnabled = true;
                    }
                    break;
                case "grid":
                    if (value !== undefined) {
                        this._gridLinesPlot.x0 = value.x0;
                        this._gridLinesPlot.y0 = value.y0;
                        this._gridLinesPlot.xStep = value.xStep;
                        this._gridLinesPlot.yStep = value.yStep;
                        this._plot.requestUpdateLayout();
                    }
                    break;
                case "zoom":
                    if (value !== undefined) {
                        if (that._plot.visibleRect.width !== value) {
                            var oldPlotRect = that._plot.visibleRect;
                            var xCenter = oldPlotRect.x + oldPlotRect.width / 2;
                            var yCenter = oldPlotRect.y + oldPlotRect.height / 2;
                            var scale = oldPlotRect.width / value;
                            var newHeight = oldPlotRect.height / scale;
                            var newrect = {
                                x: xCenter - value / 2,
                                y: yCenter - newHeight / 2,
                                width: value,
                                height: newHeight
                            };
                            //console.log(newrect.y);
                            that._plot.navigation.setVisibleRect(newrect, false);
                            that.options.zoom = value;
                        }
                    }
                    break;
                case "visibleRect":
                    if (value !== undefined) {
                        that._plot.navigation.setVisibleRect({ x: value.x, y: -value.y - value.height, width: value.width, height: value.height }, false);
                    }
                    break;
                case "gridVisibility":
                    this._gridLinesPlot.isVisible = value;
                    this._plot.requestUpdateLayout();
                    break;
                case "rects":
                    this._rectsPlot.draw({ rects: value });
                    this._plot.requestUpdateLayout();
                    break;
                case "isLightSVGTop":
                    if (value) {
                    }
                    else {
                    }
                    break;
                case "plotConstraint":
                    this._plotSettings = value;
                    break;
                case "useContraints":
                    this._setGestureSource(this._onlyZoomEnabled);
                    break;
            }
            this._super(key, value);
        },
        _setGestureSource: function (onlyZoom) {
            var that = this;
            var gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(this._plot.host).where(function (g) {
                var constraint = onlyZoom ?
                    g.Type === "Zoom" && (!that.options.useContraints || g.scaleFactor > 1 && that._plot.visibleRect.width < that._plotSettings.MaxWidth || g.scaleFactor < 1 && that._plot.visibleRect.width > that._plotSettings.MinWidth) :
                    g.Type !== "Zoom" || (!that.options.useContraints || g.scaleFactor > 1 && that._plot.visibleRect.width < that._plotSettings.MaxWidth || g.scaleFactor < 1 && that._plot.visibleRect.width > that._plotSettings.MinWidth);
                return constraint;
            });
            this._plot.navigation.gestureSource = gestureSource;
        },
        _setOptions: function (options) {
            this._super(options);
            this.refresh();
        },
        refresh: function () {
        },
        _constrain: function (value) {
            return value;
        },
        destroy: function () {
            this.element.empty();
        },
        getDragSubject: function () {
            return this._dragService;
        },
        getMouseMoves: function () {
            return this._mouseMoves;
        },
        getPlotX: function (left) {
            var cs = this._svgPlot.getScreenToDataTransform();
            return cs.screenToDataX(left);
        },
        getPlotY: function (top) {
            var cs = this._svgPlot.getScreenToDataTransform();
            return -cs.screenToDataY(top);
        },
        getLeft: function (x) {
            var cs = this._svgPlot.getTransform();
            return -cs.dataToScreenX(x);
        },
        getTop: function (y) {
            var cs = this._svgPlot.getTransform();
            return -cs.dataToScreenY(y);
        },
        getPixelWidth: function () {
            var cs = this._svgPlot.getScreenToDataTransform();
            return cs.screenToDataX(1) - cs.screenToDataX(0);
        },
        getZoomSubject: function () {
            return this._zoomService;
        },
        setCenter: function (p) {
            var plotRect = this._plot.visibleRect;
            this._plot.navigation.setVisibleRect({ x: p.x - plotRect.width / 2, y: p.y - plotRect.height / 2, width: plotRect.width, height: plotRect.height }, false);
        },
        getSVG: function () {
            return this._svgPlot.svg;
        },
        getSecondarySVG: function () {
            return this._lightSvgPlot.svg;
        },
        getCentralPart: function () {
            return this._domPlot;
        },
        updateLayout: function () {
            this._plot.updateLayout();
        }
    });
}(jQuery));
//# sourceMappingURL=drawingsurface.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.progressiontable", {
        options: {
            interval: undefined,
            data: undefined,
            header: "Initial Value",
            tags: undefined,
            init: undefined,
            canEditInitialValue: true,
        },
        _create: function () {
            var that = this;
            var options = that.options;
            that.element.addClass('simulation-progression-table-container');
            this.init = $('<div></div>')
                .appendTo(that.element);
            this.RefreshInit();
            this.data = $('<div></div>')
                .addClass("bma-simulation-data-table")
                .appendTo(that.element);
            this.InitData();
        },
        Randomise: function () {
            var rands = this.init.find("tr").not(":first-child").children("td:nth-child(2)");
            rands.click();
        },
        InitData: function () {
            this.ClearData();
            if (this.options.data !== undefined && this.options.data.length !== 0) {
                var data = this.options.data;
                if (data[0].length === this.options.interval.length)
                    for (var i = 0; i < data.length; i++) {
                        this.AddData(data[i]);
                    }
            }
        },
        RefreshInit: function () {
            var that = this;
            var options = this.options;
            this.init.empty();
            var table = $('<table></table>')
                .addClass("variables-table")
                .appendTo(that.init);
            var tr0 = $('<tr></tr>').appendTo(table);
            if (that.options.header !== undefined)
                $('<td></td>').width(120).attr("colspan", "2").text(that.options.header).appendTo(tr0);
            if (that.options.interval !== undefined) {
                for (var i = 0; i < that.options.interval.length; i++) {
                    var tr = $('<tr></tr>').appendTo(table);
                    var td = $('<td></td>').appendTo(tr);
                    var input = $('<input type="text">').width("100%").appendTo(td);
                    var init = that.options.init !== undefined ? that.options.init[i] || that.options.interval[i] : that.options.interval[i];
                    if (Array.isArray(init))
                        input.val(init[0]);
                    else
                        input.val(init);
                    if (that.options.canEditInitialValue) {
                        var random = $('<td></td>')
                            .addClass("random-small bma-random-icon2 hoverable")
                            .appendTo(tr);
                        //random.filter(':nth-child(even)').addClass('bma-random-icon1');
                        //random.filter(':nth-child(odd)').addClass('bma-random-icon2');
                        random.bind("click", function () {
                            var prev = parseInt($(this).prev().children("input").eq(0).val());
                            var index = $(this).parent().index() - 1;
                            var randomValue = that.GetRandomInt(parseInt(that.options.interval[index][0]), parseInt(that.options.interval[index][1]));
                            $(this).prev().children("input").eq(0).val(randomValue); //randomValue);
                            if (randomValue !== prev)
                                $(this).parent().addClass('red');
                            else
                                $(this).parent().removeClass('red');
                        });
                    }
                    else {
                        input.attr("disabled", "disabled");
                    }
                }
            }
        },
        FindClone: function (column) {
            var trs = this.data.find("tr");
            var tr0 = trs.eq(0);
            for (var i = 0; i < tr0.children("td").length - 1; i++) {
                var tds = trs.children("td:nth-child(" + (i + 1) + ")");
                if (this.IsClone(column, tds)) {
                    if (this.repeat === undefined)
                        this.repeat = tds;
                    return i;
                }
            }
            return undefined;
        },
        IsClone: function (td1, td2) {
            if (td1.length !== td2.length)
                return false;
            else {
                var arr = [];
                for (var i = 0; i < td1.length; i++) {
                    arr[i] = td1.eq(i).text() + " " + td2.eq(i).text();
                    if (td1.eq(i).text() !== td2.eq(i).text())
                        return false;
                }
                return true;
            }
        },
        GetInit: function () {
            var init = [];
            var inputs = this.init.find("tr:not(:first-child)").children("td:first-child").children("input");
            inputs.each(function (ind) {
                init[ind] = parseInt($(this).val());
            });
            return init;
        },
        ClearData: function () {
            this.data.empty();
        },
        AddData: function (data) {
            var that = this;
            //var data = this.data;
            if (data !== undefined) {
                var trs = that.data.find("tr");
                if (trs.length === 0) {
                    that.repeat = undefined;
                    var table = $('<table></table>')
                        .addClass("progression-table")
                        .appendTo(that.data);
                    if (that.options.tags !== undefined) {
                        var tr0 = $('<tr></tr>').addClass("table-tags").appendTo(table);
                        var count = (that.options.tags.length > 0) ? 1 : 0;
                        var prevState = undefined;
                        var prevTd;
                        var compareTags = function (prev, curr) {
                            if (prev === undefined)
                                return false;
                            if (prev.length === curr.length) {
                                for (var j = 0; j < prev.length; j++) {
                                    if (prev[j] !== curr[j])
                                        return false;
                                }
                                return true;
                            }
                            return false;
                        };
                        for (var i = 0; i < that.options.tags.length; i++) {
                            if (!compareTags(prevState, that.options.tags[i])) {
                                if (count > 1)
                                    $(prevTd).attr("colspan", count);
                                prevState = that.options.tags[i];
                                prevTd = $('<td></td>').text(prevState).appendTo(tr0);
                                count = 1;
                            }
                            else {
                                count++;
                                if (i == that.options.tags.length - 1)
                                    $(prevTd).attr("colspan", count);
                            }
                        }
                    }
                    for (var i = 0; i < data.length; i++) {
                        var tr = $('<tr></tr>').appendTo(table);
                        var td = $('<td></td>').text(data[i]).appendTo(tr);
                    }
                }
                else {
                    if (that.options.tags !== undefined)
                        trs = trs.slice(1);
                    trs.each(function (ind) {
                        var td = $('<td></td>').text(data[ind]).appendTo($(this));
                        //$('<span></span>').text(data[ind]).appendTo(td);
                        if (td.text() !== td.prev().text())
                            td.addClass('change');
                    });
                    var last = that.data.find("tr").children("td:last-child");
                    if (that.repeat !== undefined) {
                        if (that.IsClone(that.repeat, last))
                            that.Highlight(that.data.find("tr:first-child").children("td").length - 1);
                        else
                            ;
                    }
                    else {
                        var cloneInd = that.FindClone(last);
                        if (cloneInd !== undefined) {
                            that.Highlight(cloneInd);
                            that.Highlight(that.data.find("tr:first-child").children("td").length - 1);
                        }
                    }
                }
            }
        },
        Highlight: function (ind) {
            var that = this;
            var tds = this.data.find("tr").children("td:nth-child(" + (ind + 1) + ")");
            tds.each(function (ind) {
                $(this).addClass('repeat');
                //var div = $('<div></div>').appendTo($(this));
                //div.addClass('repeat');
            });
        },
        GetRandomInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "interval":
                    this.options.interval = value;
                    this.RefreshInit();
                    break;
                case "header":
                    this.options.header = value;
                    break;
                case "init":
                    this.options.init = value;
                    this.RefreshInit();
                    break;
                case "data":
                    this.options.data = value;
                    this.InitData();
                    break;
                case "tags":
                    this.options.tags = value;
                    this.InitData();
                    break;
                case "canEditInitialValue":
                    this.options.canEditInitialValue = value;
                    this.RefreshInit();
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=progressiontable.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.proofresultviewer", {
        options: {
            issucceeded: true,
            time: 0,
            data: undefined,
            message: ''
        },
        refreshSuccess: function () {
            var that = this;
            var options = this.options;
            this.resultDiv.empty();
            switch (options.issucceeded) {
                case true:
                    $('<img src="../../images/succeeded.svg">').appendTo(this.resultDiv);
                    $('<div></div>').addClass('stabilize-prooved').text('Stabilizes').appendTo(this.resultDiv);
                    break;
                case false:
                    $('<img src="../../images/failed.svg">').appendTo(this.resultDiv);
                    $('<div></div>').addClass('stabilize-failed').text('Failed to Stabilize').appendTo(this.resultDiv);
                    break;
                case undefined:
                    $('<img src="../../images/failed.svg">').appendTo(this.resultDiv);
                    $('<div></div>').addClass('stabilize-failed').text('Service Error').appendTo(this.resultDiv);
                    break;
                default:
                    $('<img src="../../images/failed.svg">').appendTo(this.resultDiv);
                    $('<div></div>').addClass('stabilize-failed').text(options.issucceeded).appendTo(this.resultDiv);
                    break;
            }
        },
        refreshMessage: function () {
            this.proofmessage.text(this.options.message);
        },
        refreshData: function () {
            var that = this;
            var options = this.options;
            this.compactvariables.resultswindowviewer();
            this.proofPropagation.resultswindowviewer();
            if (options.data !== undefined && options.data.numericData !== undefined && options.data.numericData !== null && options.data.numericData.length !== 0) {
                var variables = $("<div></div>")
                    .addClass("scrollable-results")
                    .coloredtableviewer({
                    header: ["Name", "Formula", "Range"],
                    numericData: options.data.numericData,
                    colorData: options.data.colorVariables
                });
                this.compactvariables.resultswindowviewer({
                    header: "Variables",
                    content: variables,
                    icon: "max",
                    tabid: "ProofVariables"
                });
                if (options.data.colorData !== undefined && options.data.colorData !== null && options.data.colorData.length !== 0) {
                    var proof = $("<div></div>")
                        .addClass("scrollable-results")
                        .coloredtableviewer({
                        type: "color",
                        colorData: options.data.colorData,
                    });
                    this.proofPropagation.resultswindowviewer({
                        header: "Proof Propagation",
                        content: proof,
                        icon: "max",
                        tabid: "ProofPropagation"
                    });
                }
            }
            else {
                this.compactvariables.resultswindowviewer("destroy");
                this.proofPropagation.resultswindowviewer("destroy");
            }
        },
        show: function (tab) {
            if (tab === undefined) {
                this.compactvariables.show();
                this.proofPropagation.show();
            }
            if (tab === "ProofVariables") {
                this.compactvariables.show();
            }
            if (tab === "ProofPropagation") {
                this.proofPropagation.show();
            }
        },
        hide: function (tab) {
            if (tab === "ProofVariables") {
                this.compactvariables.hide();
                this.element.children().not(this.compactvariables).show();
            }
            if (tab === "ProofPropagation") {
                this.proofPropagation.hide();
                this.element.children().not(this.proofPropagation).show();
            }
        },
        _create: function () {
            var that = this;
            var options = this.options;
            //$('<span>Proof Analysis</span>')
            //    .addClass('window-title')
            //    .appendTo(that.element);
            this.resultDiv = $('<div></div>')
                .addClass("proof-state")
                .appendTo(that.element);
            this.proofmessage = $('<p></p>').appendTo(that.element);
            $('<br></br>').appendTo(that.element);
            this.compactvariables = $('<div></div>')
                .addClass('proof-variables')
                .appendTo(that.element)
                .resultswindowviewer();
            this.proofPropagation = $('<div></div>')
                .addClass('proof-propagation')
                .appendTo(that.element)
                .resultswindowviewer();
            this.refreshSuccess();
            this.refreshMessage();
            this.refreshData();
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "issucceeded":
                    this.options.issucceeded = value;
                    this.refreshSuccess();
                    break;
                case "data":
                    this.options.data = value;
                    this.refreshData();
                    break;
                case "message":
                    this.options.message = value;
                    this.refreshMessage();
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=proofresultviewer.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.furthertesting", {
        options: {
            header: "Further Testing",
            toggler: undefined,
            tabid: "FurtherTesting",
            buttonMode: "ActiveMode",
            tableHeaders: [],
            data: [],
            tabLabels: [],
        },
        ChangeMode: function () {
            var that = this;
            switch (this.options.buttonMode) {
                case "ActiveMode":
                    this.toggler
                        .removeClass("waiting")
                        .text("Further Testing");
                    break;
                case "StandbyMode":
                    this.toggler
                        .addClass("waiting")
                        .text("");
                    var snipper = $('<div class="spinner"></div>').appendTo(this.toggler);
                    for (var i = 1; i < 4; i++) {
                        $('<div></div>').addClass('bounce' + i).appendTo(snipper);
                    }
                    break;
            }
        },
        _create: function () {
            var that = this;
            var options = this.options;
            var defaultToggler = $('<button></button>').text("Further Testing").addClass('action-button-small red further-testing-button');
            this.element.addClass("further-testing-box");
            this.toggler = that.options.toggler || defaultToggler;
            this.toggler
                .appendTo(this.element)
                .hide();
            this.toggler.bind("click", function () {
                window.Commands.Execute("FurtherTestingRequested", {});
            });
            this.results = $('<div></div>')
                .appendTo(this.element)
                .resultswindowviewer();
            this.refresh();
        },
        refresh: function () {
            var that = this;
            var options = this.options;
            var tabs = $('<div></div>');
            var ul = $('<ul></ul>').appendTo(tabs);
            if (that.options.data !== null && that.options.data !== undefined && that.options.tabLabels !== null && that.options.tabLabels !== undefined && that.options.tableHeaders !== null && that.options.tableHeaders !== undefined) {
                for (var i = 0; i < that.options.data.length; i++) {
                    var li = $('<li></li>').appendTo(ul);
                    var a = $('<a href="#FurtherTestingTab' + i + '"></a>').appendTo(li);
                    that.options.tabLabels[i].appendTo(a);
                }
                for (var i = 0; i < that.options.data.length; i++) {
                    var content = $('<div></div>')
                        .attr('id', 'FurtherTestingTab' + i)
                        .addClass("scrollable-results")
                        .coloredtableviewer({ numericData: that.options.data[i], header: that.options.tableHeaders[i] })
                        .appendTo(tabs);
                    content.find('table').removeClass('variables-table').addClass('furhter-testing');
                }
                tabs.tabs();
                tabs.removeClass("ui-widget ui-widget-content ui-corner-all");
                tabs.children("ul").removeClass("ui-helper-reset ui-widget-header ui-corner-all");
                tabs.children("div").removeClass("ui-tabs-panel ui-widget-content ui-corner-bottom");
                this.results.resultswindowviewer({ header: that.options.header, content: tabs, icon: "max", tabid: that.options.tabid });
            }
            else {
                this.results.resultswindowviewer();
                this.results.resultswindowviewer("destroy");
            }
            this.ChangeMode();
        },
        GetToggler: function () {
            return this.toggler;
        },
        ShowStartToggler: function () {
            this.toggler.show();
        },
        SetData: function (arg) {
            if (arg !== undefined) {
                this.options.data = arg.data;
                this.options.tableHeaders = arg.tableHeaders;
                this.options.tabLabels = arg.tabLabels;
            }
            else {
                this.options.data = this.options.tableHeaders = this.options.tabLabels = undefined;
            }
            this.refresh();
        },
        HideStartToggler: function () {
            this.toggler.hide();
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "header":
                    this.options.header = value;
                    this.header.text(value);
                    break;
                case "data":
                    this.options.data = value;
                    this.refresh();
                    break;
                case "buttonMode":
                    this.options.buttonMode = value;
                    this.ChangeMode();
                    break;
            }
            this._super(key, value);
            //this.refresh();
        }
    });
}(jQuery));
//# sourceMappingURL=furthertestingviewer.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.localstoragewidget", {
        options: {
            items: [],
        },
        _create: function () {
            var that = this;
            var items = this.options.items;
            this.element.addClass('model-repository');
            var header = $('<span></span>')
                .text("Repository")
                .addClass('window-title')
                .appendTo(that.element);
            var closediv = $('<div></div>').addClass('close-icon').appendTo(that.element);
            var closing = $('<img src="../../images/close.png">').appendTo(closediv);
            closing.bind("click", function () {
                that.element.hide();
            });
            that.element.draggable({ containment: "parent", scroll: false });
            this.message = $('<div></div>')
                .appendTo(this.element);
            this.repo = $('<div></div>')
                .appendTo(this.element);
            if (Silverlight.isInstalled()) {
                var slWidget = $('<div></div>').appendTo(this.element);
                var getSilverlightMethodCall = "javascript:Silverlight.getSilverlight(\"5.0.61118.0\");";
                var installImageUrl = "http://go.microsoft.com/fwlink/?LinkId=161376";
                var imageAltText = "Get Microsoft Silverlight";
                var altHtml = "<a href='{1}' style='text-decoration: none;'>" +
                    "<img src='{2}' alt='{3}' " +
                    "style='border-style: none'/></a>";
                altHtml = altHtml.replace('{1}', getSilverlightMethodCall);
                altHtml = altHtml.replace('{2}', installImageUrl);
                altHtml = altHtml.replace('{3}', imageAltText);
                Silverlight.createObject("ClientBin/BioCheck.xap", slWidget[0], "slPlugin", {
                    width: "250", height: "50",
                    background: "white", alt: altHtml,
                    version: "5.0.61118.0"
                }, 
                // See the event handlers in the full example.
                { onError: onSilverlightError }, "param1=value1,param2=value2", "row3");
            }
            this.refresh();
        },
        refresh: function () {
            this._createHTML();
        },
        AddItem: function (item) {
            this.options.items.push(item);
            this.refresh();
        },
        _createHTML: function (items) {
            var items = this.options.items;
            this.repo.empty();
            var that = this;
            this.ol = $('<ol></ol>').appendTo(this.repo);
            for (var i = 0; i < items.length; i++) {
                var li = $('<li></li>').text(items[i]).appendTo(this.ol);
                //var a = $('<a></a>').addClass('delete').appendTo(li);
                var removeBtn = $('<button></button>').addClass("delete icon-delete").appendTo(li); // $('<img alt="" src="../images/icon-delete.svg">').appendTo(a);//
                removeBtn.bind("click", function (event) {
                    event.stopPropagation();
                    window.Commands.Execute("LocalStorageRemoveModel", "user." + items[$(this).parent().index()]);
                });
            }
            this.ol.selectable({
                stop: function () {
                    var ind = that.repo.find(".ui-selected").index();
                    window.Commands.Execute("LocalStorageLoadModel", "user." + items[ind]);
                }
            });
        },
        Message: function (msg) {
            this.message.text(msg);
        },
        _setOption: function (key, value) {
            switch (key) {
                case "items":
                    this.options.items = value;
                    this.refresh();
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
            this._super("_setOption", key, value);
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
            this.element.empty();
        }
    });
}(jQuery));
//# sourceMappingURL=localstoragewidget.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.resultswindowviewer", {
        options: {
            isResizable: false,
            content: $(),
            header: "",
            icon: "",
            effects: { effect: 'size', easing: 'easeInExpo', duration: 200, complete: function () { } },
            tabid: "",
            onresize: undefined
        },
        reseticon: function () {
            var that = this;
            var options = this.options;
            this.buttondiv.empty();
            var url = "";
            if (this.options.icon === "max")
                url = "../../images/maximize.png";
            else if (this.options.icon === "min")
                url = "../../images/minimize.png";
            else
                url = this.options.icon;
            this.button = $('<img src=' + url + '>').addClass('expand-window-icon');
            this.button.appendTo(this.buttondiv);
            this.button.bind("click", function () {
                if (options.icon === "max")
                    window.Commands.Execute("Expand", that.options.tabid);
                if (options.icon === "min")
                    window.Commands.Execute("Collapse", that.options.tabid);
            });
        },
        refresh: function () {
            var that = this;
            var options = this.options;
            this.content.detach();
            if (options.content !== undefined) {
                this.content = options.content.appendTo(that.element);
            }
        },
        _create: function () {
            var that = this;
            var options = this.options;
            if (options.isResizable) {
                this.element.resizable({
                    minWidth: 800,
                    minHeight: 600,
                    resize: function (event, ui) {
                        if (that.options.onresize !== undefined) {
                            that.options.onresize !== undefined;
                        }
                    }
                });
                this.element.width(800);
                this.element.height(600);
                this.element.trigger("resize");
            }
            else {
                if (this.element.hasClass("ui-resizable")) {
                    this.element.resizable("destroy");
                    this.element.css("width", '');
                    this.element.css("height", '');
                }
            }
            this.header = $('<div></div>')
                .addClass('analysis-title')
                .appendTo(this.element);
            $('<span></span>')
                .text(options.header)
                .appendTo(this.header);
            this.buttondiv = $('<div></div>').addClass("expand-collapse-bttn").appendTo(that.header);
            //this.icon = $('<div></div>').appendTo(this.header);
            this.content = $('<div></div>').appendTo(this.element);
            this.reseticon();
            this.refresh();
        },
        toggle: function () {
            this.element.toggle(this.options.effects);
        },
        getbutton: function () {
            return this.button;
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "header":
                    this.header.children("span").text(value);
                    break;
                case "content":
                    if (this.options.content !== value) {
                        this.options.content = value;
                        this.refresh();
                    }
                    break;
                case "icon":
                    this.options.icon = value;
                    this.reseticon();
                    break;
                case "isResizable":
                    if (this.options.isResizable !== value) {
                        if (value) {
                            this.element.resizable({
                                minWidth: 800,
                                minHeight: 600,
                                resize: function (event, ui) {
                                    if (that.options.onresize !== undefined) {
                                        that.options.onresize !== undefined;
                                    }
                                }
                            });
                            this.element.width(800);
                            this.element.height(600);
                            this.element.trigger("resize");
                        }
                        else {
                            this.element.resizable("destroy");
                            this.element.css("width", '');
                            this.element.css("height", '');
                        }
                    }
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=resultswindowviewer.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.simulationplot", {
        options: {
            //data: undefined,
            colors: undefined,
            labels: undefined,
        },
        _create: function () {
            var that = this;
            this.refresh();
            this.element.addClass('simulation-plot-box');
        },
        //changeVisibility: function (param) {
        //    var polyline = this._chart.get(this.chartdiv.children().eq(param.ind).attr("id"));
        //    polyline.isVisible = param.check;
        //    var legenditem = this.element.find(".simulationplot-legend-legendcontainer");//[data-index=" + param.ind + "]");//.attr("data-index", i)
        //    //if (param.check) legenditem.hide();
        //    //else legenditem.show();
        //    alert(legenditem.length);
        //},
        refresh: function () {
            var that = this;
            var options = this.options;
            this.element.empty();
            this.chartdiv = $('<div id="chart"></div>')
                .attr("data-idd-plot", "figure")
                .width("70%")
                .height('100%')
                .css("float", "left")
                .appendTo(that.element);
            var legendDiv = $('<div></div>').addClass("simulationplot-legend-legendcontainer").appendTo(that.element);
            var gridLinesPlotDiv = $("<div></div>")
                .attr("id", "glPlot")
                .attr("data-idd-plot", "scalableGridLines")
                .appendTo(this.chartdiv);
            ///states markers on plot
            that.domPlot = undefined;
            if (that.options.labels !== undefined && that.options.labels !== null) {
                that.domPlot = $("<div></div>").attr("id", "domPlot").attr("data-idd-plot", "dom").appendTo(that.chartdiv);
            }
            ///
            that._chart = InteractiveDataDisplay.asPlot(that.chartdiv);
            //
            if (that.domPlot !== undefined) {
                var domPlot2 = that._chart.get(that.domPlot[0]);
                for (var i = 0; i < that.options.labels.length; i++) {
                    var label = $("<div></div>").attr("data-idd-plot", "svgPlot").addClass((that.options.labels[i].text.length > 1) ? "stripes" : "")
                        .addClass("simulationplot-label");
                    for (var j = 0; j < that.options.labels[i].text.length; j++)
                        var marker = $("<div></div>").text(that.options.labels[i].text[j]).attr("data-idd-scale", "element")
                            .addClass("state-button").appendTo(label);
                    domPlot2.add(label, "element", that.options.labels[i].x, that.options.labels[i].y, that.options.labels[i].width, that.options.labels[i].height, (that.options.labels[i].width > 1) ? 0 : 0.5, 1);
                    (i % 2 == 0) ? label.addClass("repeat") : 0;
                }
            }
            //
            if (that.options.colors !== undefined && that.options.colors !== null) {
                for (var i = 0; i < that.options.colors.length; i++) {
                    var plotName = "plot" + i;
                    that._chart.polyline(plotName, undefined);
                }
                that._chart.isAutoFitEnabled = true;
                this._gridLinesPlot = that._chart.get(gridLinesPlotDiv[0]);
                this._gridLinesPlot.x0 = 0;
                this._gridLinesPlot.y0 = 0;
                this._gridLinesPlot.xStep = 1;
                this._gridLinesPlot.yStep = 1;
                var bottomLabels = [];
                var leftLabels = [];
                var max = 0;
                if (options.colors !== undefined) {
                    for (var i = 0; i < options.colors.length; i++) {
                        var y = options.colors[i].Plot;
                        var m = that.Max(y);
                        if (m > max)
                            max = m;
                        var plotName = "plot" + i;
                        var polyline = that._chart.get(plotName);
                        if (polyline !== undefined) {
                            polyline.stroke = options.colors[i].Color;
                            polyline.isVisible = options.colors[i].Seen;
                            polyline.draw({ y: y, thickness: 4, lineJoin: 'round' });
                        }
                        var legendItem = $("<div></div>").addClass("simulationplot-legend-legenditem").attr("data-index", i).appendTo(legendDiv);
                        if (!options.colors[i].Seen)
                            legendItem.hide();
                        var colorBoxContainer = $("<div></div>").addClass("simulationplot-legend-colorboxcontainer").appendTo(legendItem);
                        var colorBox = $("<div></div>").addClass("simulationplot-legend-colorbox").css("background-color", options.colors[i].Color).appendTo(colorBoxContainer);
                        var nameBox = $("<div></div>").text(options.colors[i].Name).addClass("simulationplot-legend-namebox").appendTo(legendItem);
                        legendItem.hover(function () {
                            var index = parseInt($(this).attr("data-index"));
                            var p = that.highlightPlot;
                            if (p !== undefined) {
                                p.stroke = options.colors[index].Color;
                                p.isVisible = true;
                                p.draw({ y: options.colors[index].Plot, thickness: 8, lineJoin: 'round' });
                                for (var i = 0; i < options.colors.length; i++) {
                                    var plotName = "plot" + i;
                                    var polyline = that._chart.get(plotName);
                                    if (polyline !== undefined) {
                                        polyline.stroke = "lightgray";
                                    }
                                }
                            }
                        }, function () {
                            var p = that.highlightPlot;
                            if (p !== undefined) {
                                p.isVisible = false;
                                for (var i = 0; i < options.colors.length; i++) {
                                    var plotName = "plot" + i;
                                    var polyline = that._chart.get(plotName);
                                    if (polyline !== undefined) {
                                        polyline.stroke = options.colors[i].Color;
                                    }
                                }
                            }
                        });
                    }
                    for (var i = 0; i < options.colors[0].Plot.length; i++) {
                        bottomLabels[i] = i.toString();
                    }
                    for (var i = 0; i < max + 1; i++) {
                        leftLabels[i] = i.toString();
                    }
                }
                this.highlightPlot = that._chart.polyline("_hightlightPlot", undefined);
                var bottomAxis = that._chart.addAxis("bottom", "labels", { labels: bottomLabels });
                var leftAxis = that._chart.addAxis("left", "labels", { labels: leftLabels });
                var bounds = that._chart.aggregateBounds();
                bounds.bounds.height += 0.04; // padding
                bounds.bounds.y -= 0.02; // padding
                that._chart.navigation.setVisibleRect(bounds.bounds, false);
                that._chart.centralPart.mousedown(function (e) {
                    e.stopPropagation();
                });
                bottomAxis.mousedown(function (e) {
                    e.stopPropagation();
                });
                leftAxis.mousedown(function (e) {
                    e.stopPropagation();
                });
                var gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(that._chart.centralPart);
                var bottomAxisGestures = InteractiveDataDisplay.Gestures.applyHorizontalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(bottomAxis));
                var leftAxisGestures = InteractiveDataDisplay.Gestures.applyVerticalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(leftAxis));
                that._chart.navigation.gestureSource = gestureSource.merge(bottomAxisGestures.merge(leftAxisGestures));
            }
        },
        Max: function (y) {
            if (y !== null && y !== undefined) {
                var max = y[0];
                for (var i = 0; i < y.length; i++) {
                    if (y[i] > max)
                        max = y[i];
                }
                return max;
            }
            else
                return undefined;
        },
        getPlot: function () {
            return this._chart;
        },
        ChangeVisibility: function (ind, check) {
            var plotName = "plot" + ind;
            var polyline = this._chart.get(plotName);
            this.options.colors[ind].Seen = check;
            polyline.isVisible = check;
            var legenditem = this.element.find(".simulationplot-legend-legenditem[data-index=" + ind + "]"); //.attr("data-index", i)
            if (check)
                legenditem.show();
            else
                legenditem.hide();
        },
        _destroy: function () {
            var that = this;
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "colors":
                    this.options.colors = value;
                    break;
                case "labels":
                    this.options.labels = value;
                    break;
            }
            if (value !== null && value !== undefined)
                this.refresh();
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=simulationplot.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.simulationexpanded", {
        options: {
            data: undefined,
            init: undefined,
            interval: undefined,
            variables: undefined,
            num: 10,
            buttonMode: "ActiveMode",
            step: 10,
            onChangePlotVariables: undefined
        },
        _create: function () {
            var that = this;
            var options = that.options;
            var randomise = $('<div></div>')
                .addClass("randomise-button")
                .appendTo(that.element);
            var randomIcon = $('<div></div>').addClass("bma-random-icon2").appendTo(randomise);
            var randomLabel = $('<div></div>').text("Randomise").appendTo(randomise);
            var tables = $('<div></div>')
                .addClass("scrollable-results")
                .appendTo(this.element);
            this.small_table = $('<div></div>')
                .addClass('small-simulation-popout-table')
                .appendTo(tables);
            this.big_table = $('<div></div>')
                .addClass('big-simulation-popout-table')
                .appendTo(tables);
            var stepsdiv = $('<div></div>').addClass('steps-container').appendTo(that.element);
            this.big_table.progressiontable();
            randomise.click(function () {
                that.big_table.progressiontable("Randomise");
            });
            if (options.variables !== undefined) {
                this.small_table.coloredtableviewer({
                    header: ["Graph", "Name", "Range"],
                    type: "graph-max",
                    numericData: that.options.variables
                });
                if (options.interval !== undefined && options.interval.length !== 0) {
                    this.big_table.progressiontable({
                        init: options.init,
                        interval: options.interval,
                        data: options.data
                    });
                }
            }
            if (options.onChangePlotVariables !== undefined) {
                this.small_table.coloredtableviewer({
                    onChangePlotVariables: options.onChangePlotVariables
                });
            }
            var step = this.options.step;
            var stepsul = $('<ul></ul>').addClass('button-list').appendTo(stepsdiv);
            var li = $('<li></li>').addClass('action-button-small grey').appendTo(stepsul);
            var li0 = $('<li></li>').appendTo(stepsul);
            var li1 = $('<li></li>').addClass('steps').appendTo(stepsul);
            var li2 = $('<li></li>').appendTo(stepsul);
            var li3 = $('<li></li>').addClass('action-button green').appendTo(stepsul);
            var exportCSV = $('<button></button>')
                .text('EXPORT CSV')
                .appendTo(li);
            exportCSV.bind('click', function () {
                window.Commands.Execute('ExportCSV', {});
            });
            var add10 = $('<button></button>').text('+ ' + step).appendTo(li0);
            add10.bind("click", function () {
                that._setOption("num", that.options.num + step);
            });
            this.num = $('<button></button>').text('STEPS: ' + that.options.num).appendTo(li1);
            var min10 = $('<button></button>').text('- ' + step).appendTo(li2);
            min10.bind("click", function () {
                that._setOption("num", that.options.num - step);
            });
            this.RunButton = $('<button></button>').addClass('run-button').text('Run').appendTo(li3);
            this.refresh();
        },
        ChangeMode: function () {
            var that = this;
            switch (this.options.buttonMode) {
                case "ActiveMode":
                    var li = this.RunButton.parent();
                    li.removeClass('waiting');
                    li.find('.spinner').detach();
                    this.RunButton.text('Run');
                    this.RunButton.bind("click", function () {
                        that.big_table.progressiontable("ClearData");
                        window.Commands.Execute("RunSimulation", {
                            data: that.big_table.progressiontable("GetInit"),
                            num: that.options.num
                        });
                    });
                    break;
                case "StandbyMode":
                    var li = this.RunButton.parent();
                    li.addClass('waiting');
                    this.RunButton.text('');
                    var snipper = $('<div class="spinner"></div>').appendTo(this.RunButton);
                    for (var i = 1; i < 4; i++) {
                        $('<div></div>').addClass('bounce' + i).appendTo(snipper);
                    }
                    //                < div class="bounce1" > </div>
                    //< div class="bounce2" > </div>
                    //< div class="bounce3" > </div>
                    this.RunButton.unbind("click");
                    break;
            }
        },
        refresh: function () {
            var that = this;
            var options = this.options;
            if (options.variables !== undefined) {
                this.small_table.coloredtableviewer({
                    header: ["Graph", "Name", "Range"],
                    type: "graph-max",
                    numericData: that.options.variables
                });
                if (options.interval !== undefined && options.interval.length !== 0) {
                    this.big_table.progressiontable({ interval: options.interval, data: options.data });
                }
            }
            this.ChangeMode();
        },
        AddResult: function (res) {
            this.big_table.progressiontable("AddData", res);
        },
        getColors: function () {
            this.small_table.coloredtableviewer("GetColors");
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            var options = this.options;
            switch (key) {
                case "data":
                    this.options.data = value;
                    //if (value !== null && value !== undefined)
                    if (options.interval !== undefined && options.interval.length !== 0) {
                        this.big_table.progressiontable({ interval: options.interval, data: options.data });
                    }
                    break;
                case "init":
                    this.options.init = value;
                    this.big_table.progressiontable({ init: value });
                    break;
                case "num":
                    if (value < 0)
                        value = 0;
                    this.options.num = value;
                    this.num.text('STEPS: ' + value);
                    break;
                case "variables":
                    this.options.variables = value;
                    this.small_table.coloredtableviewer({
                        header: ["Graph", "Name", "Range"],
                        type: "graph-max",
                        numericData: that.options.variables
                    });
                case "interval":
                    this.options.interval = value;
                    this.big_table.progressiontable({ interval: value });
                    break;
                case "buttonMode":
                    this.options.buttonMode = value;
                    this.ChangeMode();
                    break;
                case "onChangePlotVariables":
                    this.small_table.coloredtableviewer({
                        onChangePlotVariables: value
                    });
                    break;
                default:
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=simulationexpanded.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.simulationviewer", {
        options: {
            data: undefined,
            plot: undefined,
            error: undefined
        },
        refresh: function () {
            var that = this;
            var data = this.options.data;
            if (that.options.error !== undefined) {
                that.errorDiv.empty();
                that.errorDiv.show();
                var errTitle = $('<div></div>').addClass('proof-state').appendTo(that.errorDiv);
                $('<img src="../../images/failed.svg">').appendTo(errTitle);
                $('<div></div>').addClass('stabilize-failed').text(that.options.error.title).appendTo(errTitle);
                $('<div></div>').text(that.options.error.message).appendTo(that.errorDiv);
            }
            else {
                that.errorDiv.hide();
            }
            var container = $('<div></div>').addClass("marginable");
            if (data !== undefined &&
                data.variables !== undefined &&
                data.variables.length !== 0) {
                var variablestable = $('<div></div>')
                    .appendTo(container)
                    .addClass("scrollable-results");
                variablestable.coloredtableviewer({
                    header: ["Graph", "Cell", "Name", "Range"],
                    type: "graph-min",
                    numericData: data.variables
                });
                if (data.colorData !== undefined && data.colorData.length !== 0) {
                    var colortable = $('<div></div>')
                        .addClass("scrollable-results")
                        .appendTo(container)
                        .coloredtableviewer({
                        type: "simulation-min",
                        colorData: data.colorData
                    });
                }
                that.variables.resultswindowviewer({
                    header: "Variables",
                    content: container,
                    icon: "max",
                    tabid: "SimulationVariables"
                });
            }
            else {
                this.variables.resultswindowviewer();
                that.variables.resultswindowviewer("destroy");
            }
            if (that.options.plot !== undefined && that.options.plot.length !== 0) {
                that.plot = $('<div></div>').addClass('plot-min').simulationplot({ colors: that.options.plot }); //.height(160)
                that.plotDiv.resultswindowviewer({
                    header: "Simulation Graph",
                    content: that.plot,
                    icon: "max",
                    tabid: "SimulationPlot"
                });
            }
            else {
                that.plotDiv.resultswindowviewer();
                that.plotDiv.resultswindowviewer("destroy");
            }
        },
        _create: function () {
            var that = this;
            this.errorDiv = $('<div></div>')
                .appendTo(that.element);
            this.variables = $('<div></div>')
                .addClass('simulation-variables')
                .appendTo(that.element)
                .resultswindowviewer();
            this.plotDiv = $('<div></div>')
                .appendTo(that.element)
                .resultswindowviewer();
            this.refresh();
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            var options = this.options;
            if (key === "data")
                this.options.data = value;
            if (key === "plot")
                this.options.plot = value;
            this._super(key, value);
            this.refresh();
        },
        show: function (tab) {
            switch (tab) {
                case undefined:
                    this.variables.show();
                    this.plotDiv.show();
                    break;
                case "SimulationVariables":
                    this.variables.show();
                    break;
                case "SimulationPlot":
                    this.plotDiv.show();
                    break;
            }
        },
        hide: function (tab) {
            if (tab === "SimulationVariables") {
                this.variables.hide();
                this.element.children().not(this.variables).show();
            }
            if (tab === "SimulationPlot") {
                this.plotDiv.hide();
                this.element.children().not(this.plotDiv).show();
            }
        },
        ChangeVisibility: function (ind, check) {
            try {
                this.plot.simulationplot("ChangeVisibility", ind, check);
            }
            catch (ex) { }
        }
    });
}(jQuery));
//# sourceMappingURL=simulationviewer.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.userdialog", {
        options: {
            message: '',
            actions: [
                { button: 'Yes', callback: function () { } },
                { button: 'No', callback: function () { } },
                { button: 'Cancel', callback: function () { } }
            ]
        },
        _create: function () {
            var that = this;
            this.element.addClass("window dialog");
            this.element.draggable({ containment: "parent", scroll: false });
            this._add_close_button();
            this.message = $('<div><div>')
                .text(this.options.message)
                .addClass('window-title')
                .appendTo(that.element);
            this.buttons = $('<div><div>')
                .addClass("button-list")
                .appendTo(that.element);
            var actions = this.options.actions;
            if (actions !== undefined) {
                for (var i = 0; i < actions.length; i++) {
                    var bttn = $('<button></button>').text(actions[i].button).appendTo(that.buttons);
                    bttn.bind('click', actions[i].callback);
                }
            }
            //var yesBtn = $('<button></button>').text('Yes').appendTo(this.buttons);
            //var noBtn = $('<button></button>').text('No').appendTo(this.buttons);
            //var cancelBtn = $('<button></button>').text('Cancel').appendTo(this.buttons);
            //this._bind_functions();
            this._popup_position();
        },
        _add_close_button: function () {
            var that = this;
            var closediv = $('<div></div>').addClass("close-icon").appendTo(that.element);
            var closing = $('<img>').attr('src', '../../images/close.png').appendTo(closediv);
            closing.bind("click", function () {
                that.element.hide();
            });
        },
        _popup_position: function () {
            var my_popup = $('.dialog');
            my_popup.each(function () {
                var my_popup_w = $(this).outerWidth(), my_popup_h = $(this).outerHeight(), win_w = $(window).outerWidth(), win_h = $(window).outerHeight(), popup_half_w = (win_w - my_popup_w) / 2, popup_half_h = (win_h - my_popup_h) / 2;
                if (win_w > my_popup_w) {
                    my_popup.css({ 'left': popup_half_w });
                }
                if (win_w < my_popup_w) {
                    my_popup.css({ 'left': 5, });
                }
                if (win_h > my_popup_h) {
                    my_popup.css({ 'top': popup_half_h });
                }
                if (win_h < my_popup_h) {
                    my_popup.css({ 'top': 5 });
                }
            });
        },
        //_bind_functions: function () {
        //    var functions = this.options.functions;
        //    var btns = this.buttons.children("button");
        //    if (functions !== undefined) {
        //        for (var i = 0; i < functions.length; i++)
        //            btns.eq(i).bind("click", functions[i]);
        //    }
        //},
        Show: function () {
            this.element.show();
        },
        Hide: function () {
            this.element.hide();
        },
        _destroy: function () {
            this.element.empty();
            this.element.detach();
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "message":
                    this.message.text(that.options.message);
                    break;
            }
            this._super(key, value);
        }
    });
}(jQuery));
//# sourceMappingURL=userdialog.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\functionsregistry.ts"/>
(function ($) {
    $.widget("BMA.bmaeditor", {
        options: {
            //variable: BMA.Model.Variable
            name: "name",
            rangeFrom: 0,
            rangeTo: 0,
            functions: ["VAR", "CONST"],
            operators1: ["+", "-", "*", "/"],
            operators2: ["AVG", "MIN", "MAX", "CEIL", "FLOOR"],
            inputs: [],
            formula: "",
            approved: undefined
        },
        resetElement: function () {
            var that = this;
            this.name.val(that.options.name);
            this.rangeFrom.val(that.options.rangeFrom);
            this.rangeTo.val(that.options.rangeTo);
            this.listOfInputs.empty();
            var inputs = this.options.inputs;
            inputs.forEach(function (val, ind) {
                var item = $('<div></div>').text(val).appendTo(that.listOfInputs);
                item.bind("click", function () {
                    that.formulaTextArea.insertAtCaret("var(" + $(this).text() + ")").change();
                    that.listOfInputs.hide();
                });
            });
            this.formulaTextArea.val(that.options.formula);
            window.Commands.Execute("FormulaEdited", { formula: that.options.formula, inputs: that._inputsArray() });
        },
        SetValidation: function (result, message) {
            this.options.approved = result;
            var that = this;
            if (this.options.approved === undefined) {
                that.element.removeClass('bmaeditor-expanded');
                that.prooficon.removeClass("formula-failed-icon");
                that.prooficon.removeClass("formula-validated-icon");
                this.formulaTextArea.removeClass("formula-failed-textarea");
                this.formulaTextArea.removeClass("formula-validated-textarea");
            }
            else {
                if (this.options.approved === true) {
                    that.prooficon.removeClass("formula-failed-icon").addClass("formula-validated-icon");
                    this.formulaTextArea.removeClass("formula-failed-textarea").addClass("formula-validated-textarea");
                    that.element.removeClass('bmaeditor-expanded');
                }
                else if (this.options.approved === false) {
                    that.prooficon.removeClass("formula-validated-icon").addClass("formula-failed-icon");
                    this.formulaTextArea.removeClass("formula-validated-textarea").addClass("formula-failed-textarea");
                    that.element.addClass('bmaeditor-expanded');
                }
            }
            that.errorMessage.text(message);
        },
        getCaretPos: function (jq) {
            var obj = jq[0];
            obj.focus();
            if (obj.selectionStart)
                return obj.selectionStart; //Gecko
            else if (document.selection) {
                var sel = document.selection.createRange();
                var clone = sel.duplicate();
                sel.collapse(true);
                clone.moveToElementText(obj);
                clone.setEndPoint('EndToEnd', sel);
                return clone.text.length;
            }
            return 0;
        },
        _create: function () {
            var that = this;
            this.element.addClass("variable-editor");
            this.element.draggable({ containment: "parent", scroll: false });
            this._appendInputs();
            this._processExpandingContent();
            this._bindExpanding();
            this.resetElement();
        },
        _appendInputs: function () {
            var that = this;
            var div = $('<div></div>').addClass("close-icon").appendTo(that.element);
            var closing = $('<img src="../../images/close.png">').appendTo(div);
            closing.bind("click", function () {
                that.element.hide();
            });
            var namerangeDiv = $('<div></div>')
                .addClass('editor-namerange-container')
                .appendTo(that.element);
            this.name = $('<input type="text" size="15">')
                .addClass("variable-name")
                .attr("placeholder", "Variable Name")
                .appendTo(namerangeDiv);
            var rangeDiv = $('<div></div>').appendTo(namerangeDiv);
            var rangeLabel = $('<span></span>')
                .text("Range")
                .appendTo(rangeDiv);
            this.rangeFrom = $('<input type="text" min="0" max="100" size="1">')
                .attr("placeholder", "min")
                .appendTo(rangeDiv);
            var divtriangles1 = $('<div></div>').addClass("div-triangles").appendTo(rangeDiv);
            var upfrom = $('<div></div>').addClass("triangle-up").appendTo(divtriangles1);
            upfrom.bind("click", function () {
                var valu = Number(that.rangeFrom.val());
                that._setOption("rangeFrom", valu + 1);
                window.Commands.Execute("VariableEdited", {});
            });
            var downfrom = $('<div></div>').addClass("triangle-down").appendTo(divtriangles1);
            downfrom.bind("click", function () {
                var valu = Number(that.rangeFrom.val());
                that._setOption("rangeFrom", valu - 1);
                window.Commands.Execute("VariableEdited", {});
            });
            this.rangeTo = $('<input type="text" min="0" max="100" size="1">')
                .attr("placeholder", "max")
                .appendTo(rangeDiv);
            var divtriangles2 = $('<div></div>').addClass("div-triangles").appendTo(rangeDiv);
            var upto = $('<div></div>').addClass("triangle-up").appendTo(divtriangles2);
            upto.bind("click", function () {
                var valu = Number(that.rangeTo.val());
                that._setOption("rangeTo", valu + 1);
                window.Commands.Execute("VariableEdited", {});
            });
            var downto = $('<div></div>').addClass("triangle-down").appendTo(divtriangles2);
            downto.bind("click", function () {
                var valu = Number(that.rangeTo.val());
                that._setOption("rangeTo", valu - 1);
                window.Commands.Execute("VariableEdited", {});
            });
            var formulaDiv = $('<div></div>')
                .addClass('target-function')
                .appendTo(that.element);
            $('<div></div>')
                .addClass("window-title")
                .text("Target Function")
                .appendTo(formulaDiv);
            this.formulaTextArea = $('<textarea></textarea>')
                .attr("spellcheck", "false")
                .addClass("formula-text-area")
                .appendTo(formulaDiv);
            this.prooficon = $('<div></div>')
                .addClass("validation-icon")
                .appendTo(formulaDiv);
            this.errorMessage = $('<div></div>')
                .addClass("formula-validation-message")
                .appendTo(formulaDiv);
        },
        _processExpandingContent: function () {
            var that = this;
            var inputsDiv = $('<div></div>').addClass('functions').appendTo(that.element);
            $('<div></div>')
                .addClass("window-title")
                .text("Inputs")
                .appendTo(inputsDiv);
            var inpUl = $('<ul></ul>').appendTo(inputsDiv);
            //var div = $('<div></div>').appendTo(that.element);
            var operatorsDiv = $('<div></div>').addClass('operators').appendTo(that.element);
            $('<div></div>')
                .addClass("window-title")
                .text("Operators")
                .appendTo(operatorsDiv);
            var opUl1 = $('<ul></ul>').appendTo(operatorsDiv);
            var opUl2 = $('<ul></ul>').appendTo(operatorsDiv);
            this.infoTextArea = $('<div></div>').addClass('operators-info').appendTo(operatorsDiv);
            var functions = this.options.functions;
            functions.forEach(function (val, ind) {
                var item = $('<li></li>').appendTo(inpUl);
                var span = $('<button></button>').text(val).appendTo(item);
                item.hover(function () { that._OnHoverFunction($(this).children("button"), that.infoTextArea); }, function () { that._OffHoverFunction($(this).children("button"), that.infoTextArea); });
                if (ind !== 0) {
                    item.click(function () {
                        var about = window.FunctionsRegistry.GetFunctionByName($(this).text());
                        that._InsertToFormula(about);
                    });
                }
            });
            var operators1 = this.options.operators1;
            operators1.forEach(function (val, ind) {
                var item = $('<li></li>').appendTo(opUl1);
                var span = $('<button></button>').text(val).appendTo(item);
                item.hover(function () { that._OnHoverFunction($(this).children("button"), that.infoTextArea); }, function () { that._OffHoverFunction($(this).children("button"), that.infoTextArea); });
                item.click(function () {
                    var about = window.FunctionsRegistry.GetFunctionByName($(this).text());
                    that._InsertToFormula(about);
                });
            });
            var operators2 = this.options.operators2;
            operators2.forEach(function (val, ind) {
                var item = $('<li></li>').appendTo(opUl2);
                var span = $('<button></button>').text(val).appendTo(item);
                item.hover(function () { that._OnHoverFunction($(this).children("button"), that.infoTextArea); }, function () { that._OffHoverFunction($(this).children("button"), that.infoTextArea); });
                item.click(function () {
                    var about = window.FunctionsRegistry.GetFunctionByName($(this).text());
                    that._InsertToFormula(about);
                });
            });
            operatorsDiv.width(opUl2.width());
            this.inputsList = inpUl.children().eq(0).addClass("var-button");
            var inpbttn = this.inputsList.children("button").addClass("inputs-list-header");
            var expandinputsbttn = $('<div></div>')
                .addClass('inputs-expandbttn')
                .appendTo(inpbttn);
            this.listOfInputs = $('<div></div>')
                .addClass("inputs-list-content")
                .appendTo(that.inputsList).hide();
            this.inputsList.bind("click", function () {
                if (that.listOfInputs.is(":hidden")) {
                    that.inputsList.css("border-radius", "15px 15px 0 0");
                    that.listOfInputs.show();
                    inpbttn.addClass('inputs-list-header-expanded');
                }
                else {
                    that.inputsList.css("border-radius", "15px");
                    that.listOfInputs.hide();
                    inpbttn.removeClass('inputs-list-header-expanded');
                }
            });
        },
        _OnHoverFunction: function (item, textarea) {
            var selected = item.addClass("ui-selected");
            item.parent().children().not(selected).removeClass("ui-selected");
            this._refreshText(selected, textarea);
        },
        _OffHoverFunction: function (item, textarea) {
            item.parent().children().removeClass("ui-selected");
            textarea.text("");
        },
        _InsertToFormula: function (item) {
            var caret = this.getCaretPos(this.formulaTextArea) + item.Offset;
            this.formulaTextArea.insertAtCaret(item.InsertText).change();
            this.formulaTextArea[0].setSelectionRange(caret, caret);
        },
        _refreshText: function (selected, div) {
            var that = this;
            div.empty();
            var fun = window.FunctionsRegistry.GetFunctionByName(selected.text());
            $('<h3></h3>').text(fun.Head).appendTo(div);
            $('<p></p>').text(fun.About).appendTo(div);
        },
        _bindExpanding: function () {
            var that = this;
            this.name.bind("input change", function () {
                that.options.name = that.name.val();
                window.Commands.Execute("VariableEdited", {});
            });
            this.rangeFrom.bind("input change", function () {
                that._setOption("rangeFrom", that.rangeFrom.val());
                window.Commands.Execute("VariableEdited", {});
            });
            this.rangeTo.bind("input change", function () {
                that._setOption("rangeTo", that.rangeTo.val());
                window.Commands.Execute("VariableEdited", {});
            });
            this.formulaTextArea.bind("input change propertychange", function () {
                that._setOption("formula", that.formulaTextArea.val());
                window.Commands.Execute("VariableEdited", {});
            });
        },
        _inputsArray: function () {
            var inputs = this.options.inputs;
            var arr = {};
            for (var i = 0; i < inputs.length; i++) {
                if (arr[inputs[i]] === undefined)
                    arr[inputs[i]] = 1;
                else
                    arr[inputs[i]]++;
            }
            return arr;
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "name":
                    that.options.name = value;
                    this.name.val(that.options.name);
                    break;
                case "rangeFrom":
                    if (value > 100)
                        value = 100;
                    if (value < 0)
                        value = 0;
                    that.options.rangeFrom = value;
                    this.rangeFrom.val(that.options.rangeFrom);
                    break;
                case "rangeTo":
                    if (value > 100)
                        value = 100;
                    if (value < 0)
                        value = 0;
                    that.options.rangeTo = value;
                    this.rangeTo.val(that.options.rangeTo);
                    break;
                case "formula":
                    that.options.formula = value;
                    var inparr = that._inputsArray();
                    if (this.formulaTextArea.val() !== that.options.formula)
                        this.formulaTextArea.val(that.options.formula);
                    window.Commands.Execute("FormulaEdited", { formula: that.options.formula, inputs: inparr });
                    break;
                case "inputs":
                    this.options.inputs = value;
                    this.listOfInputs.empty();
                    var inputs = this.options.inputs;
                    inputs.forEach(function (val, ind) {
                        var item = $('<div></div>').text(val).appendTo(that.listOfInputs);
                        item.bind("click", function () {
                            that.formulaTextArea.insertAtCaret("var(" + $(this).text() + ")").change();
                            that.listOfInputs.hide();
                        });
                    });
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
            this._super("_setOption", key, value);
            //window.Commands.Execute("VariableEdited", {})
            //this.resetElement();
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
}(jQuery));
jQuery.fn.extend({
    insertAtCaret: function (myValue) {
        return this.each(function (i) {
            if (document.selection) {
                // Для браузеров типа Internet Explorer
                this.focus();
                var sel = document.selection.createRange();
                sel.text = myValue;
                this.focus();
            }
            else if (this.selectionStart || this.selectionStart == '0') {
                // Для браузеров типа Firefox и других Webkit-ов
                var startPos = this.selectionStart;
                var endPos = this.selectionEnd;
                var scrollTop = this.scrollTop;
                this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
                this.focus();
                this.selectionStart = startPos + myValue.length;
                this.selectionEnd = startPos + myValue.length;
                this.scrollTop = scrollTop;
            }
            else {
                this.value += myValue;
                this.focus();
            }
        });
    }
});
//# sourceMappingURL=variablesOptionsEditor.js.map
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.visibilitysettings", {
        _getList: function () {
            return this.list || this.element.find("ol,ul").eq(0);
            ;
        },
        _create: function () {
            var that = this;
            this.list = this._getList();
            this.items = this.list.find("li");
            this.listOptions = [];
            this.items.each(function (ind) {
                var item = this;
                that.listOptions[ind] = {};
                var option = $(item).children(':first-child');
                that.listOptions[ind].name = option.text();
                var buttons = option.next();
                var children = buttons.children();
                children.each(function () {
                    var child = this;
                    var text = $(child).text();
                    var behavior = $(child).attr("data-behavior");
                    if (behavior !== undefined) {
                        var command, value = undefined;
                        try {
                            command = $(child).attr("data-command");
                        }
                        catch (ex) {
                            console.log("Error binding to command: " + ex);
                        }
                        switch (behavior) {
                            case "action":
                                $(this).bind('click', function () {
                                    window.Commands.Execute(command, {});
                                });
                                break;
                            case "toggle":
                                if (that.listOptions[ind].toggle === undefined) {
                                    value = command !== undefined ? ($(child).attr("data-default") === "true") : undefined;
                                    var button = $('<button></button>')
                                        .appendTo($(child));
                                    if (value) {
                                        button.parent().addClass("default-button onoff green");
                                        button.text("ON");
                                    }
                                    else {
                                        button.parent().addClass("default-button onoff grey");
                                        button.text("OFF");
                                    }
                                    that.listOptions[ind].toggle = value;
                                    that.listOptions[ind].toggleButton = button;
                                    if (command !== undefined) {
                                        button.parent().bind("click", function (e) {
                                            that.listOptions[ind].toggle = !that.listOptions[ind].toggle;
                                            window.Commands.Execute(command, that.listOptions[ind].toggle);
                                            that.changeButtonONOFFStyle(ind);
                                        });
                                    }
                                }
                                else
                                    console.log("Names of options should be different");
                                break;
                            case "increment":
                                if (that.listOptions[ind].increment === undefined) {
                                    value = command !== undefined ? parseInt($(child).attr("data-default")) || 10 : undefined;
                                    $(this).addClass('pill-button-box');
                                    var plus = $('<button>+</button>').addClass("pill-button")
                                        .appendTo($(child))
                                        .addClass("hoverable");
                                    var minus = $('<button>-</button>').addClass("pill-button")
                                        .appendTo($(child))
                                        .addClass("hoverable");
                                    that.listOptions[ind].increment = value;
                                    plus.bind("click", function () {
                                        that.listOptions[ind].increment++;
                                        window.Commands.Execute(command, that.listOptions[ind].increment);
                                    });
                                    minus.bind("click", function () {
                                        that.listOptions[ind].increment--;
                                        window.Commands.Execute(command, that.listOptions[ind].increment);
                                    });
                                }
                                break;
                        }
                    }
                });
            });
        },
        changeButtonONOFFStyle: function (ind) {
            var button = this.listOptions[ind].toggleButton;
            if (!this.listOptions[ind].toggle) {
                button.text("OFF");
                button.parent().removeClass("green").addClass("grey");
            }
            else {
                button.text("ON");
                button.parent().removeClass("grey").addClass("green");
            }
        },
        _setOption: function (key, value) {
            switch (key) {
                case "settingsState":
                    for (var i = 0; i < this.listOptions.length; i++) {
                        if (this.listOptions[i].name === value.name) {
                            this.listOptions[i].toggle = value.toggle;
                            this.changeButtonONOFFStyle(i);
                            this.listOptions[i].increment = value.increment;
                            return;
                        }
                        else
                            console.log("No such option");
                    }
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
            this._super("_setOption", key, value);
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
}(jQuery));
//# sourceMappingURL=visibilitysettings.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.keyframetable", {
        options: {
            id: 0,
        },
        _create: function () {
            var that = this;
            var elem = this.element.addClass('keyframe-table');
            var table = $('<table></table>').appendTo(elem);
            for (var i = 0; i < 5; i++) {
                var td = $('<td></td>').appendTo(table);
                td.droppable({
                    drop: function (event, ui) {
                        window.Commands.Execute('KeyframeDropped', { location: $(this) });
                    }
                });
            }
            var remove = $('<div></div>').addClass('remove-keyframe').appendTo(elem);
            remove.bind('click', function () {
                window.Commands.Execute('RemoveKeyframe', that.options.id);
            });
        },
        _destroy: function () {
            this.element.empty();
        }
    });
}(jQuery));
//# sourceMappingURL=keyframetable.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.keyframecompact", {
        options: {
            items: ['init'],
            canedit: false
        },
        _create: function () {
            this.element.addClass('keyframe-compact');
            this.content = $('<ul></ul>').appendTo(this.element);
            var addbttn = $('<div></div>')
                .addClass('keyframe-btn add')
                .appendTo(this.content);
            addbttn.bind('click', function () {
                window.Commands.Execute('AddKeyframe', {});
            });
            this.refresh();
        },
        refresh: function () {
            var that = this;
            this.content.children(':not(.add)');
            var items = this.options.items;
            items.forEach(function (i) {
                that._appendbutton(i);
            });
        },
        add: function (items) {
            var that = this;
            if (Array.isArray(items)) {
                items.forEach(function (i) {
                    that._appendbutton(i);
                    that.options.items.push('i');
                });
            }
            else {
                that._appendbutton(items);
                that.options.items.push(items);
            }
        },
        del: function (ind) {
            var that = this;
            this.options.items.splice(ind, 1);
            this.content.child().eq(ind + 1).detach();
        },
        _appendbutton: function (item) {
            var that = this;
            if (that.options.canedit) {
                var li = $('<li></li>').insertBefore(that.content.find('.add'));
                var btn = $('<a></a>')
                    .addClass('keyframe-btn mutable')
                    .appendTo(li);
                btn.bind('click', function () {
                    that.content.find('.keyframe-btn').removeClass('selected');
                    $(this).addClass('selected');
                    window.Commands.Execute("KeyframeSelected", { ind: $(this).index() });
                });
                var input = $('<input type="text" size="2">').appendTo(btn);
                input.val(item);
                input.bind('change input', function () {
                    var ind = $(this).parent().index();
                    that.options.items[ind] = $(this).val();
                    window.Commands.Execute("ChangedKeyframeName", { ind: ind, name: that.options.items[ind] });
                });
            }
            else {
                var li = $('<li></li>').insertBefore(that.content.find('.add'));
                var btn = $('<a></a>')
                    .addClass('keyframe-btn')
                    .appendTo(li);
                var name = $('<div></div>').text(item).appendTo(btn);
            }
        }
    });
}(jQuery));
//# sourceMappingURL=keyframecompact.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.ltlstatesviewer", {
        options: {},
        _create: function () {
            var that = this;
            var elem = this.element;
            var key_div = $('<div></div>').appendTo(elem);
            this.key_content = $('<div></div>').keyframecompact({ canedit: true });
            this.key_content.appendTo(key_div);
            this.elempanel = $('<div></div>').appendTo(elem);
            this._create_elempanel();
            var inita = this.key_content.find('a').eq(0);
            inita.attr('href', '#ltlinit');
            var inittab = $('<div></div>').attr('id', 'ltlinit').appendTo(elem);
            this.keyframetable = $('<div></div>').appendTo(inittab);
            this.keyframetable.keyframetable();
            this.element.tabs();
        },
        _refresh: function () {
            this.element.tabs('refresh');
        },
        _create_elempanel: function () {
            var ul = $('<div></div>')
                .addClass('keyframe-panel')
                .appendTo(this.elempanel);
            var kfrms = window.KeyframesRegistry.Keyframes;
            for (var i = 0, l = kfrms.length; i < l; i++) {
                var img = kfrms[i].Icon;
                var li = $('<img>')
                    .addClass('keyframe-element')
                    .appendTo(ul);
                li.attr('src', img);
                li.draggable({
                    helper: function (event, ui) {
                        return $('<img>').attr('src', $(this).attr('src')).addClass('keyframe-element-draggable').appendTo('body');
                    },
                    scroll: false,
                    start: function (event, ui) {
                        window.Commands.Execute('KeyframeStartDrag', $(this).index());
                    }
                });
            }
            ul.buttonset();
        },
        _destroy: function () {
            this.element.removeClass().empty();
        },
        addState: function (items) {
            this.key_content.keyframecompact('add', items);
            var li = this.key_content.find('li');
            var a = li.eq(li.length - 1).children('a').eq(0);
            var id = 'ltlstatetab' + (li.length - 1).toString();
            var div = $('<div></div>').attr('id', id).appendTo(this.element);
            var did = $('<div></div>').keyframetable();
            did.appendTo(div);
            a.attr('href', '#' + id);
            this._refresh();
        },
    });
}(jQuery));
//# sourceMappingURL=ltlstatesviewer.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.ltlviewer", {
        options: {},
        _create: function () {
            var that = this;
            var elem = this.element.addClass('ltl-results-tab');
            this.key_div = $('<div></div>').appendTo(elem);
            this.key_content = $('<div></div>').width(400).statescompact();
            this.key_div.resultswindowviewer({
                header: "States",
                icon: "max",
                content: that.key_content,
                tabid: "LTLStates"
            });
            this.temp_prop = $('<div></div>').appendTo(elem);
            this.temp_content = $('<div></div>').width(400).height(150).temporalpropertiesviewer();
            this.temp_prop.resultswindowviewer({
                header: "Temporal properties",
                icon: "max",
                content: this.temp_content,
                tabid: "LTLTempProp"
            });
        },
        _destroy: function () {
            this.element.empty();
        },
        Get: function (param) {
            switch (param) {
                case "LTLStates":
                    return this.key_div;
                case "LTLTempProp":
                    return this.temp_prop;
                case "LTLResults":
                    return this.results;
                default:
                    return undefined;
            }
        },
        GetTPViewer: function () {
            return this.temp_content;
        },
        GetStatesViewer: function () {
            return this.key_content;
        },
        Show: function (param) {
            if (param == undefined) {
                this.key_div.show();
                this.temp_prop.show();
            }
        }
    });
}(jQuery));
//# sourceMappingURL=ltlviewer.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.ltlresultsviewer", {
        _plot: undefined,
        _variables: undefined,
        _table: undefined,
        options: {
            data: [],
            init: [],
            variables: [],
            id: [],
            ranges: [],
            visibleItems: [],
            colors: [],
            onExportCSV: undefined
        },
        _create: function () {
            var that = this;
            this.element.empty();
            this.element.addClass("ltlresultsviewer");
            var root = this.element;
            var tablesContainer = $("<div></div>").addClass('ltl-simplot-container').appendTo(root);
            this._variables = $("<div></div>").addClass("small-simulation-popout-table").appendTo(tablesContainer); //root);
            this._table = $("<div></div>").addClass("big-simulation-popout-table").addClass("simulation-progression-table-container").appendTo(tablesContainer); //root);
            //var plotContainer = $("<div></div>").addClass("ltl-simplot-container").appendTo(root);
            this._plot = $("<div></div>").addClass("ltl-results").appendTo(root);
            var stepsul = $('<ul></ul>').addClass('button-list').css("float", "left").appendTo(root);
            var li = $('<li></li>').addClass('action-button-small grey').appendTo(stepsul);
            var exportCSV = $('<button></button>')
                .text('EXPORT CSV')
                .appendTo(li);
            exportCSV.bind('click', function () {
                if (that.options.onExportCSV !== undefined) {
                    that.options.onExportCSV();
                }
            });
            var changeVisibility = function (params) {
                var visibility = that.options.visibleItems.slice(0);
                visibility[params.ind] = params.check;
                that._setOption("visibleItems", visibility);
            };
            this._variables.coloredtableviewer({
                onChangePlotVariables: changeVisibility
            });
            this.refresh();
        },
        _setOption: function (key, value) {
            var that = this;
            var needUpdate = false;
            this._super(key, value);
            switch (key) {
                case "tags": {
                    needUpdate = true;
                    break;
                }
                case "labels": {
                    needUpdate = true;
                    break;
                }
                case "data": {
                    needUpdate = true;
                    break;
                }
                case "init": {
                    needUpdate = true;
                    break;
                }
                case "interval": {
                    needUpdate = true;
                    break;
                }
                case "variables": {
                    needUpdate = true;
                    break;
                }
                case "id": {
                    needUpdate = true;
                    break;
                }
                case "ranges": {
                    var variables = [];
                    if (this.options.ranges !== undefined && this.options.variables !== undefined) {
                        for (var i = 0; i < this.options.variables.length; i++) {
                            that.options.variables[i][3] = that.options.ranges[i].min;
                            that.options.variables[i][4] = that.options.ranges[i].max;
                        }
                        needUpdate = true;
                    }
                    break;
                }
                case "visibleItems": {
                    var variables = [];
                    if (this.options.visibleItems !== undefined && this.options.variables !== undefined) {
                        for (var i = 0; i < this.options.variables.length; i++)
                            this.options.variables[i][1] = this.options.visibleItems[i];
                        needUpdate = true;
                    }
                    break;
                }
                case "colors": {
                    if (value !== undefined && value.length !== 0)
                        this._plot.simulationplot({
                            colors: value,
                        });
                    break;
                }
                default: break;
            }
            if (needUpdate) {
                this.refresh();
                this.createPlotData();
            }
        },
        _setOptions: function (options) {
            this._super(options);
        },
        refresh: function () {
            var that = this;
            if (this.options.variables !== undefined && this.options.variables.length !== 0) {
                this._variables.coloredtableviewer({
                    header: ["Graph", "Name", "Range"],
                    type: "graph-max",
                    numericData: that.options.variables,
                });
                if (this.options.interval !== undefined && this.options.interval.length !== 0
                    && this.options.data !== undefined && this.options.data.length !== 0
                    && this.options.tags !== undefined && this.options.tags.length !== 0) {
                    this._table.progressiontable({
                        interval: that.options.interval,
                        data: that.options.data,
                        tags: that.options.tags,
                        canEditInitialValue: false,
                        init: that.options.init
                    });
                    if (this.options.colors === undefined || this.options.colors.length == 0)
                        this.createPlotData();
                }
            }
        },
        createPlotData: function () {
            var that = this;
            var plotData = [];
            if (this.options.id === undefined && this.options.id.length == 0)
                this.options.id = [];
            if (this.options.ranges == undefined && this.options.ranges.length == 0)
                this.options.ranges = [];
            if (this.options.visibleItems == undefined && this.options.visibleItems.length == 0)
                this.options.visibleItems = [];
            for (var i = 0; i < this.options.variables.length; i++) {
                var pData = [];
                if (this.options.id.length < i + 1)
                    this.options.id.push(i);
                pData.push(this.options.init[i]);
                for (var j = 0; j < this.options.data.length; j++)
                    pData.push(this.options.data[j][i]);
                plotData.push({
                    Id: that.options.id[i],
                    Color: that.options.variables[i][0],
                    Seen: that.options.variables[i][1],
                    Plot: pData,
                    Init: that.options.init[i],
                    Name: that.options.variables[i][2],
                });
                if (this.options.ranges.length < i + 1)
                    this.options.ranges.push({
                        min: that.options.variables[i][3],
                        max: that.options.variables[i][4]
                    });
                if (this.options.visibleItems.length < i + 1)
                    this.options.visibleItems.push(that.options.variables[i][1]);
            }
            if (plotData !== undefined && plotData.length !== 0)
                this._plot.simulationplot({
                    colors: plotData,
                    labels: that.options.labels
                });
        },
    });
}(jQuery));
//# sourceMappingURL=ltlresultsviewer.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.stateseditor", {
        _stateButtons: null,
        _addStateButton: null,
        _toolbar: null,
        _keyframes: null,
        _description: null,
        _ltlStates: null,
        _ltlAddFormulaButton: null,
        _activeState: null,
        options: {
            variables: [],
            states: [],
            minConst: -99,
            maxConst: 100,
            commands: undefined,
            onStatesUpdated: undefined,
            onComboBoxOpen: undefined,
        },
        _create: function () {
            var that = this;
            this._stateButtons = $("<div></div>").addClass("state-buttons").addClass("states-editor").appendTo(this.element);
            that._initStates();
            this._addStateButton = $("<div>+</div>").addClass("state-button").addClass("new").appendTo(this._stateButtons).click(function () {
                that.addState();
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateAdded" });
            });
            this._description = $("<input></input>").attr("type", "text").addClass("state-description").attr("size", "15").attr("data-row-type", "description")
                .attr("placeholder", "Description").appendTo(this.element);
            this._description.bind("input change", function () {
                var idx = that.options.states.indexOf(that._activeState);
                that.options.states[idx].description = this.value;
                that._activeState.description = this.value;
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
            this._ltlStates = $("<div></div>").addClass("LTL-states").appendTo(this.element);
            var table = $("<table></table>").addClass("state-condition").attr("data-row-type", "add").appendTo(this._ltlStates);
            var tbody = $("<tbody></tbody>").appendTo(table);
            var tr = $("<tr></tr>").appendTo(tbody);
            this._ltlAddFormulaButton = $("<td>+</td>").addClass("LTL-line-new").appendTo(tr).click(function () {
                that.addFormula();
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
        },
        _initStates: function () {
            var that = this;
            for (var i = this.options.states.length - 1; i >= 0; i--) {
                var stateButton = $("<div>" + this.options.states[i].name + "</div>").attr("data-state-name", this.options.states[i].name)
                    .addClass("state-button").addClass("state").prependTo(this._stateButtons).click(function () {
                    that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                    for (var j = 0; j < that.options.states.length; j++) {
                        if (that.options.states[j].name == $(this).attr("data-state-name")) {
                            that._activeState = that.options.states[j];
                            break;
                        }
                    }
                    that.refresh();
                });
            }
        },
        addState: function (state) {
            if (state === void 0) { state = null; }
            var that = this;
            var stateName;
            var idx;
            if (state == null) {
                var k = this.options.states.length;
                idx = k;
                var lastStateName = "";
                for (var i = 0; i < k; i++) {
                    var lastStateIdx = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;
                    var stateIdx = this.options.states[i].name.length > 1 ? parseFloat(this.options.states[i].name.slice(1)) : 0;
                    if (stateIdx >= lastStateIdx) {
                        lastStateName = (lastStateName && stateIdx == lastStateIdx
                            && lastStateName.charAt(0) > this.options.states[i].name.charAt(0)) ?
                            lastStateName : this.options.states[i].name;
                    }
                }
                var charCode = lastStateName ? lastStateName.charCodeAt(0) : 65;
                var n = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;
                if (charCode >= 90) {
                    n++;
                    charCode = 65;
                }
                else if (lastStateName)
                    charCode++;
                stateName = n ? String.fromCharCode(charCode) + n : String.fromCharCode(charCode);
                var newState = {
                    name: stateName,
                    description: "",
                    formula: [
                        [
                            undefined,
                            undefined,
                            undefined
                        ],
                    ]
                };
                this.options.states.push(newState);
            }
            else {
                stateName = state.name;
                idx = this.options.states.indexOf(state);
            }
            var state = $("<div>" + stateName + "</div>").attr("data-state-name", stateName).addClass("state-button").addClass("state").click(function () {
                that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                for (var j = 0; j < that.options.states.length; j++) {
                    if (that.options.states[j].name == $(this).attr("data-state-name")) {
                        that._activeState = that.options.states[j];
                        break;
                    }
                }
                that.refresh();
            });
            if (this._activeState != null)
                that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
            this._activeState = this.options.states[idx];
            state.insertBefore(this._stateButtons.children().last());
            this.refresh();
        },
        addFormula: function (formula) {
            if (formula === void 0) { formula = null; }
            var that = this;
            var stateIdx = that.options.states.indexOf(that._activeState);
            var formulaIdx = that.options.states[stateIdx].formula.indexOf(formula);
            if (formula == null) {
                that.options.states[stateIdx].formula.push(formula);
                formulaIdx = that.options.states[stateIdx].formula.length - 1;
            }
            formula = formula && formula[0] && formula[1] && formula[2] ? formula : [
                {
                    type: "variable", value: formula && formula[0] && formula[0].value ? formula[0].value : {
                        container: undefined,
                        variable: undefined
                    },
                },
                { type: "operator", value: formula && formula[1] && formula[1].value ? formula[1].value : "=" },
                { type: "const", value: formula && formula[2] && formula[2].value ? formula[2].value : 0 },
            ];
            if (formula.length == 5) {
                var secondEq = [
                    {
                        type: "variable", value: formula[2] && formula[2].value ? formula[2].value : {
                            container: undefined,
                            variable: undefined
                        },
                    },
                    { type: "operator", value: formula[3] && formula[3].value ? formula[3].value : "<" },
                    { type: "const", value: formula[4] && formula[4].value ? formula[4].value : 0 },
                ];
                that.options.states[stateIdx].formula.splice(formulaIdx + 1, 0, secondEq);
                switch (formula[1].value) {
                    case ">":
                        formula[1].value = "<";
                    case "<":
                        formula[1].value = ">";
                    default: break;
                }
                formula = [
                    {
                        type: "variable", value: formula[2] && formula[2].value ? formula[2].value : {
                            container: undefined,
                            variable: undefined
                        },
                    },
                    { type: "operator", value: formula[1] && formula[1].value ? formula[1].value : ">" },
                    { type: "const", value: formula[0] && formula[0].value ? formula[0].value : 0 },
                ];
            }
            that.options.states[stateIdx].formula[formulaIdx] = formula;
            var table = $("<table></table>").addClass("state-condition").attr("data-row-type", "formula");
            var tbody = $("<tbody></tbody>").appendTo(table);
            var tr = $("<tr></tr>").appendTo(tbody);
            var variableTd = $("<td></td>").addClass("variable-select").appendTo(tr);
            that.createVariablePicker(variableTd, formula[0]);
            var operatorTd = $("<td></td>").addClass("operator").appendTo(tr);
            var operatorImg = $("<img>").appendTo(operatorTd);
            var setOperatorValue = function (value) {
                switch (value) {
                    case ">":
                        operatorImg.attr("src", "images/LTL-state-tool-gre.svg");
                        break;
                    case ">=":
                        operatorImg.attr("src", "images/LTL-state-tool-greq.svg");
                        break;
                    case "<":
                        operatorImg.attr("src", "images/LTL-state-tool-les.svg");
                        break;
                    case "<=":
                        operatorImg.attr("src", "images/LTL-state-tool-lesq.svg");
                        break;
                    case "=":
                        operatorImg.attr("src", "images/LTL-state-tool-equ.svg");
                        break;
                    case "<>":
                        value = ">";
                        formula[1].value = value;
                        operatorImg.attr("src", "images/LTL-state-tool-gre.svg");
                        var secondEq = [
                            {
                                type: "variable", value: formula[0] && formula[0].value ? formula[0].value : {
                                    container: undefined,
                                    variable: undefined
                                },
                            },
                            { type: "operator", value: "<" },
                            { type: "const", value: 0 },
                        ];
                        that.options.states[stateIdx].formula.splice(formulaIdx + 1, 0, secondEq);
                        that.refresh();
                        break;
                    default: break;
                }
                formula[1].value = value;
            };
            that.createOperatorPicker(operatorTd, setOperatorValue);
            setOperatorValue(formula[1].value);
            var constTd = $("<td></td>").addClass("const").appendTo(tr);
            var constInput = $("<input></input>").addClass("number-input").attr("type", "text").attr("value", formula[2] ? formula[2].value : 0).appendTo(constTd);
            constInput.bind("input change", function () {
                if (parseFloat(this.value) > that.options.maxConst)
                    this.value = that.options.maxConst;
                if (parseFloat(this.value) < that.options.minConst)
                    this.value = that.options.minConst;
                formula[2].value = this.value;
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
            var removeTd = $("<td></td>").addClass("LTL-line-del").appendTo(tr).click(function () {
                var stateIndex = that.options.states.indexOf(that._activeState);
                var tableIndex = table.index();
                that.options.states[stateIndex].formula.splice(tableIndex, 1);
                $(table).remove();
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
            var removeIcon = $("<img>").attr("src", "../images/state-line-del.svg").appendTo(removeTd);
            table.insertBefore(this._ltlStates.children().last());
        },
        createOperatorPicker: function (operatorTd, setOperatorValue) {
            var that = this;
            var firstLeft = $(operatorTd).offset().left;
            var firstTop = $(operatorTd).offset().top;
            var operatorExpandButton = $("<div></div>").addClass('inputs-expandbttn').appendTo(operatorTd);
            var operatorSelector = $("<div></div>").addClass("operator-picker").appendTo('body').hide();
            operatorSelector.offset({ top: firstTop + 57, left: firstLeft });
            var greDiv = $("<div></div>").attr("data-operator-type", ">").appendTo(operatorSelector);
            var gre = $("<img>").attr("src", "images/LTL-state-tool-gre.svg").appendTo(greDiv);
            var greqDiv = $("<div></div>").attr("data-operator-type", ">=").appendTo(operatorSelector);
            var greq = $("<img>").attr("src", "images/LTL-state-tool-greq.svg").appendTo(greqDiv);
            var lesDiv = $("<div></div>").attr("data-operator-type", "<").appendTo(operatorSelector);
            var les = $("<img>").attr("src", "images/LTL-state-tool-les.svg").appendTo(lesDiv);
            var lesqDiv = $("<div></div>").attr("data-operator-type", "<=").appendTo(operatorSelector);
            var lesq = $("<img>").attr("src", "images/LTL-state-tool-lesq.svg").appendTo(lesqDiv);
            var equDiv = $("<div></div>").attr("data-operator-type", "=").appendTo(operatorSelector);
            var equ = $("<img>").attr("src", "images/LTL-state-tool-equ.svg").appendTo(equDiv);
            var rangeDiv = $("<div></div>").attr("data-operator-type", "<>").appendTo(operatorSelector);
            var range = $("<img>").attr("src", "images/range.png").appendTo(rangeDiv);
            operatorExpandButton.bind("click", function () {
                if (operatorSelector.is(":hidden")) {
                    var offLeft = $(operatorTd).offset().left - firstLeft;
                    var offTop = $(operatorTd).offset().top - firstTop;
                    operatorSelector.offset({ top: offTop, left: offLeft });
                    firstLeft = $(operatorTd).offset().left;
                    firstTop = $(operatorTd).offset().top;
                    operatorSelector.show();
                    operatorExpandButton.addClass('inputs-list-header-expanded');
                }
                else {
                    operatorSelector.hide();
                    operatorExpandButton.removeClass('inputs-list-header-expanded');
                }
            });
            operatorSelector.children().bind("click", function () {
                var newOperator = $(this).attr("data-operator-type");
                setOperatorValue(newOperator);
                operatorSelector.hide();
                operatorExpandButton.removeClass('inputs-list-header-expanded');
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
            $(document).mousedown(function (e) {
                if (!operatorSelector.is(":hidden")) {
                    if (!operatorTd.is(e.target) && operatorTd.has(e.target).length === 0
                        && !operatorSelector.is(e.target) && operatorSelector.has(e.target).length === 0) {
                        operatorSelector.hide();
                        operatorExpandButton.removeClass('inputs-list-header-expanded');
                    }
                }
            });
        },
        createVariablePicker: function (variableTd, variable) {
            var that = this;
            var containerImg = $("<div></div>").addClass("container-image") /*attr("src", "../images/container.svg")*/.addClass("hidden").appendTo(variableTd);
            var selectedContainer = $("<p></p>").addClass("hidden").appendTo(variableTd);
            var variableImg = $("<div></div>").addClass("variable-image") /*attr("src", "../images/LTL-state-tool-var.svg")*/.appendTo(variableTd);
            var selectedVariable = $("<p></p>").appendTo(variableTd);
            var expandButton = $("<div></div>").addClass('inputs-expandbttn').appendTo(variableTd);
            var firstLeft = $(variableTd).offset().left;
            var firstTop = $(variableTd).offset().top;
            var variablePicker = $("<div></div>").addClass("variable-picker").appendTo('body').hide();
            variablePicker.offset({ top: firstTop + 57, left: firstLeft });
            var table = $("<table></table>").appendTo(variablePicker);
            var tbody = $("<tbody></tbody>").appendTo(table);
            var tr = $("<tr></tr>").appendTo(tbody);
            var tdContainer = $("<td></td>").appendTo(tr);
            var imgContainer = $("<div></div>").addClass("container-image") /*attr("src", "../images/container.svg")*/.appendTo(tdContainer);
            var tdVariable = $("<td></td>").appendTo(tr);
            var imgVariable = $("<div></div>").addClass("variable-image") /*attr("src", "../images/variable.svg")*/.appendTo(tdVariable);
            var trList = $("<tr></tr>").appendTo(tbody);
            var setSelectedValue = function (value) {
                var containerName;
                for (var i = 0; i < that.options.variables.length; i++)
                    if (that.options.variables[i].id == value.container) {
                        containerName = that.options.variables[i].name;
                        break;
                    }
                selectedContainer.text(containerName ? containerName : "ALL");
                selectedVariable.text(value.variable);
                variablePicker.hide();
                expandButton.removeClass('inputs-list-header-expanded');
                containerImg.removeClass("hidden");
                selectedContainer.removeClass("hidden");
            };
            var trDivs = this.updateVariablePicker(trList, setSelectedValue, variable);
            $(document).mousedown(function (e) {
                if (!variablePicker.is(":hidden")) {
                    if (!variableTd.is(e.target) && variableTd.has(e.target).length === 0
                        && !variablePicker.is(e.target) && variablePicker.has(e.target).length === 0) {
                        variablePicker.hide();
                        expandButton.removeClass('inputs-list-header-expanded');
                    }
                }
            });
            expandButton.bind("click", function () {
                if (variablePicker.is(":hidden")) {
                    var offLeft = $(variableTd).offset().left - firstLeft;
                    var offTop = $(variableTd).offset().top - firstTop;
                    variablePicker.offset({ top: offTop, left: offLeft });
                    firstLeft = $(variableTd).offset().left;
                    firstTop = $(variableTd).offset().top;
                    that.executeonComboBoxOpen();
                    trDivs = that.updateVariablePicker(trList, setSelectedValue, variable);
                    variablePicker.show();
                    expandButton.addClass('inputs-list-header-expanded');
                }
                else {
                    variablePicker.hide();
                    expandButton.removeClass('inputs-list-header-expanded');
                }
            });
        },
        updateVariablePicker: function (trList, setSelectedValue, currSymbol) {
            var that = this;
            trList.children().remove();
            var tdContainersList = $("<td></td>").addClass("list").appendTo(trList);
            var divContainers = $("<div></div>").addClass("scrollable").appendTo(tdContainersList);
            var tdVariablesList = $("<td></td>").addClass("list").appendTo(trList);
            var divVariables = $("<div></div>").addClass("scrollable").appendTo(tdVariablesList);
            if (currSymbol.value.container === undefined)
                currSymbol.value.container = 0;
            for (var i = 0; i < this.options.variables.length; i++) {
                var container = $("<a>" + this.options.variables[i].name + "</a>").attr("data-container-id", this.options.variables[i].id)
                    .appendTo(divContainers).click(function () {
                    that.setActiveContainer(divContainers, divVariables, this, setSelectedValue, currSymbol);
                });
                if (currSymbol.value != 0 && currSymbol.value.container == this.options.variables[i].id)
                    that.setActiveContainer(divContainers, divVariables, container, setSelectedValue, currSymbol);
            }
            if (currSymbol.value == 0)
                that.setActiveContainer(divContainers, divVariables, divContainers.children().eq(0), setSelectedValue, currSymbol);
            return { containers: divContainers, variables: divVariables, setSelectedValue: setSelectedValue };
        },
        setActiveContainer: function (divContainers, divVariables, container, setSelectedValue, currSymbol) {
            var that = this;
            divContainers.find(".active").removeClass("active");
            divVariables.children().remove();
            var idx = $(container).index();
            $(container).addClass("active");
            for (var j = 0; j < that.options.variables[idx].vars.length; j++) {
                var variableName = that.options.variables[idx].vars[j];
                if (that.options.variables[idx].vars[j] == "")
                    variableName = "Unnamed";
                var variable = $("<a>" + variableName + "</a>").attr("data-variable-name", that.options.variables[idx].vars[j])
                    .appendTo(divVariables).click(function () {
                    divVariables.find(".active").removeClass("active");
                    $(this).addClass("active");
                    currSymbol.value = { container: $(container).attr("data-container-id"), variable: $(this).attr("data-variable-name") };
                    setSelectedValue({ container: currSymbol.value.container, variable: currSymbol.value.variable ? currSymbol.value.variable : "Unnamed" });
                    that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
                });
                if (currSymbol.value != 0 && currSymbol.value.container == $(container).attr("data-container-id")
                    && currSymbol.value.variable == that.options.variables[idx].vars[j]) {
                    variable.addClass("active");
                    setSelectedValue({ container: $(container).attr("data-container-id"), variable: variableName });
                }
            }
        },
        refresh: function () {
            var that = this;
            this._stateButtons.find("[data-state-name='" + this._activeState.name + "']").addClass("active");
            $(this._ltlStates).find("[data-row-type='formula']").remove();
            this._description.val(this._activeState.description);
            for (var i = 0; i < this._activeState.formula.length; i++) {
                this.addFormula(this._activeState.formula[i]);
            }
        },
        executeStatesUpdate: function (args) {
            if (this.options.onStatesUpdated !== undefined) {
                this.options.onStatesUpdated(args);
            }
        },
        executeonComboBoxOpen: function (args) {
            if (this.options.onComboBoxOpen !== undefined) {
                this.options.onComboBoxOpen();
            }
        },
        _setOption: function (key, value) {
            var that = this;
            this._super(key, value);
            switch (key) {
                case "variables": {
                    this.options.variables = [];
                    for (var i = 0; i < value.length; i++) {
                        this.options.variables.push(value[i]);
                    }
                    break;
                }
                case "states": {
                    this.options.states = [];
                    this._stateButtons.children(".state").remove();
                    for (var i = 0; i < value.length; i++) {
                        this.options.states.push(value[i]);
                        if (value[i].formula.length == 0)
                            value[i].formula.push([undefined, undefined, undefined, undefined, undefined]);
                    }
                    if (this.options.states.length == 0) {
                        that.addState();
                        that.executeStatesUpdate({ states: that.options.states, changeType: "stateAdded" });
                    }
                    else {
                        this._initStates();
                        if (this._activeState != null)
                            that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                        this._activeState = this.options.states[0];
                        this.refresh();
                    }
                    break;
                }
                default: break;
            }
        },
    });
}(jQuery));
//# sourceMappingURL=stateseditor.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
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
            statesEditorExpand: undefined,
        },
        _create: function () {
            var that = this;
            this.element.addClass("state-compact");
            this._emptyStateAddButton = $("<div>+</div>").addClass("state-button-empty").addClass("new").appendTo(this.element).click(function () {
                if (that.options.states != null && that.options.states !== undefined && that.options.states.length !== 0) {
                    this._stateButtons.show();
                    this._emptyStateAddButton.hide();
                    this._emptyStatePlaceholder.hide();
                }
                else {
                    that.executeCommand("AddFirstStateRequested", {});
                }
            });
            this._emptyStatePlaceholder = $("<div>start by defining some model states</div>").addClass("state-placeholder").appendTo(this.element);
            this._stateButtons = $("<div></div>").addClass("state-buttons").appendTo(this.element).click(function () {
                that.executeStatesEditorExpand(); //executeCommand("AddFirstStateRequested", {});
            });
            for (var i = 0; i < this.options.states.length; i++) {
                var stateButton = $("<div>" + this.options.states[i].name + "</div>").addClass("state-button").appendTo(this._stateButtons);
                that.createToolTip(this.options.states[i], stateButton);
            }
            if (this.options.states.length == 0) {
                this._stateButtons.hide();
            }
            else {
                this._emptyStateAddButton.hide();
                this._emptyStatePlaceholder.hide();
            }
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "states": {
                    this.options.states = [];
                    this._stateButtons.children().remove();
                    for (var i = 0; i < value.length; i++) {
                        if (value[i].formula.length != 0) {
                            this.options.states.push(value[i]);
                            var stateButton = $("<div>" + value[i].name + "</div>").attr("data-state-name", value[i].name)
                                .addClass("state-button").appendTo(this._stateButtons);
                            that.createToolTip(value[i], stateButton);
                        }
                    }
                    if (this.options.states.length == 0) {
                        this._stateButtons.hide();
                        this._emptyStateAddButton.show();
                        this._emptyStatePlaceholder.show();
                    }
                    else {
                        this._stateButtons.show();
                        this._emptyStateAddButton.hide();
                        this._emptyStatePlaceholder.hide();
                    }
                    this.refresh();
                    break;
                }
                case "commands": {
                    this.options.commands = value;
                    break;
                }
                case "statesEditorExpand": {
                    this.options.statesEditorExpand = value;
                    break;
                }
                default: break;
            }
        },
        _setOptions: function (options) {
            this._super(options);
        },
        executeCommand: function (commandName, args) {
            if (this.options.commands) {
                this.options.commands.Execute(commandName, args);
            }
        },
        executeStatesEditorExpand: function () {
            if (this.options.statesEditorExpand) {
                this.options.statesEditorExpand();
            }
        },
        refresh: function () {
        },
        addState: function (state) {
        },
        createToolTip: function (value, button) {
            var that = this;
            button.tooltip({
                tooltipClass: "state-tooltip",
                content: function () {
                    var stateTooltip = $("<div></div>"); //.addClass("state-tooltip");
                    var description = $("<div>" + value.description + "</div>").appendTo(stateTooltip);
                    if (value.decription !== undefined && value.description != null && value.description != "")
                        description.hide();
                    else
                        description.show();
                    var table = $("<table></table>").appendTo(stateTooltip);
                    var tbody = $("<tbody></tbody>").appendTo(table);
                    for (var j = 0; j < value.formula.length; j++) {
                        var tr = that.getFormula(value.formula[j]);
                        tr.appendTo(tbody);
                    }
                    return stateTooltip;
                },
                position: {
                    at: "left-48px bottom",
                },
                show: null,
                items: "div.state-button"
            });
        },
        getFormula: function (formula) {
            var tr = $("<tr></tr>");
            for (var i = 0; i < 5; i++) {
                if (formula[i] !== undefined) {
                    switch (formula[i].type) {
                        case "variable": {
                            var td = $("<td></td>").addClass("variable-name").appendTo(tr);
                            var img = $("<img>").attr("src", "../../images/state-variable.svg").appendTo(td);
                            var br = $("<br>").appendTo(td);
                            var variableName = $("<div>" + formula[i].value + "</div>").appendTo(td);
                            break;
                        }
                        case "const": {
                            var td = $("<td></td>").appendTo(tr);
                            var cons = $("<div>" + formula[i].value + "</div>").appendTo(td);
                            break;
                        }
                        case "operator": {
                            var td = $("<td></td>").appendTo(tr);
                            var op = $("<div>" + formula[i].value + "</div>").appendTo(td);
                            break;
                        }
                        default: break;
                    }
                }
            }
            return tr;
        }
    });
}(jQuery));
//# sourceMappingURL=statescompact.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.compactltlresult", {
        options: {
            status: "nottested",
            isexpanded: false,
            steps: 10,
            ontestrequested: undefined,
            onstepschanged: undefined,
            onexpanded: undefined,
            onshowresultsrequested: undefined
        },
        _create: function () {
            this.element.empty();
            this.maindiv = $("<div></div>").appendTo(this.element);
            this._createView();
        },
        _createView: function () {
            var that = this;
            this.maindiv.empty();
            var opDiv = this.maindiv;
            switch (this.options.status) {
                case "nottested":
                    if (this.options.isexpanded) {
                        var ltltestdiv = $("<div></div>").addClass("LTL-test-options").appendTo(opDiv);
                        var sr = $("<div></div>").appendTo(ltltestdiv);
                        var d = $("<div>" + that.options.steps + " steps</div>")
                            .css("display", "inline-block")
                            .appendTo(sr);
                        var box = $("<div></div>").addClass("pill-button-box").css("margin-left", 5).appendTo(sr);
                        var minusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var minusb = $("<button>-</button>").appendTo(minusd);
                        minusb.click(function (e) {
                            that.options.steps--;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                        });
                        var plusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var plusb = $("<button>+</button>").appendTo(plusd);
                        plusb.click(function (e) {
                            that.options.steps++;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                        });
                        var ul = $("<ul></ul>").addClass("button-list").addClass("LTL-test").css("margin-top", 5).css("margin-bottom", 5).appendTo(ltltestdiv);
                        var li = $("<li></li>").addClass("action-button-small").addClass("grey").appendTo(ul);
                        var btn = $("<button>TEST </button>").appendTo(li);
                        btn.click(function () {
                            if (that.options.ontestrequested !== undefined) {
                                btn.empty();
                                that.createWaitAnim().appendTo(btn);
                                that.options.ontestrequested();
                            }
                        });
                    }
                    else {
                        var ul = $("<ul></ul>").addClass("button-list").addClass("LTL-test").css("margin-top", 0).appendTo(opDiv);
                        var li = $("<li></li>").addClass("action-button-small").addClass("grey").appendTo(ul);
                        var btn = $("<button>TEST </button>").appendTo(li);
                        btn.click(function () {
                            that.options.isexpanded = true;
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                    }
                    break;
                case "success":
                    if (this.options.isexpanded) {
                        /*
                         <div class="LTL-test-results true">
                            Simulation Found<br>12 steps<br>
                            <ul class="button-list">
                            <li><button>OPEN</button></li>
                            </ul>
                            </div>
                        */
                        var ltlresdiv = $("<div></div>").addClass("LTL-test-results").addClass("true").appendTo(opDiv);
                        ltlresdiv.html("true for ALL traces<br>");
                        var sr = $("<div></div>").appendTo(ltlresdiv);
                        var d = $("<div>" + that.options.steps + " steps</div>")
                            .css("display", "inline-block")
                            .appendTo(sr);
                        var box = $("<div></div>").addClass("pill-button-box").css("margin-left", 5).appendTo(sr);
                        var minusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var minusb = $("<button>-</button>").appendTo(minusd);
                        minusb.click(function (e) {
                            that.options.steps--;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var plusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var plusb = $("<button>+</button>").appendTo(plusd);
                        plusb.click(function (e) {
                            that.options.steps++;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var ul = $("<ul></ul>").addClass("button-list").css("margin", "5px 0 5px 0").appendTo(ltlresdiv);
                        var li = $("<li></li>").appendTo(ul);
                        var btn = $("<button><img src='../images/ltl_success.png'> example </button>").appendTo(li);
                        btn.click(function () {
                            if (that.options.onshowresultsrequested !== undefined) {
                                that.options.onshowresultsrequested();
                            }
                        });
                    }
                    else {
                        var ltlresdiv = $("<div>" + that.options.steps + " steps</div>").addClass("LTL-results-not-expanded").addClass("true").appendTo(opDiv); //
                        var ul = $("<ul></ul>").addClass("button-list").addClass("LTL-test").css("margin-top", 0).appendTo(opDiv);
                        var li = $("<li></li>").addClass("action-button-small").addClass("green").appendTo(ul);
                        var btn = $("<button>OPEN </button>").appendTo(li);
                        btn.click(function () {
                            that.options.isexpanded = true;
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                    }
                    break;
                case "partial success":
                    if (this.options.isexpanded) {
                        /*
                         <div class="LTL-test-results true">
                            Simulation Found<br>12 steps<br>
                            <ul class="button-list">
                            <li><button>OPEN</button></li>
                            </ul>
                            </div>
                        */
                        var ltlresdiv = $("<div></div>").addClass("LTL-test-results").addClass("true").appendTo(opDiv);
                        ltlresdiv.html("true for SOME traces<br>");
                        var sr = $("<div></div>").appendTo(ltlresdiv);
                        var d = $("<div>" + that.options.steps + " steps</div>")
                            .css("display", "inline-block")
                            .appendTo(sr);
                        var box = $("<div></div>").addClass("pill-button-box").css("margin-left", 5).appendTo(sr);
                        var minusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var minusb = $("<button>-</button>").appendTo(minusd);
                        minusb.click(function (e) {
                            that.options.steps--;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var plusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var plusb = $("<button>+</button>").appendTo(plusd);
                        plusb.click(function (e) {
                            that.options.steps++;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var ul = $("<ul></ul>").addClass("button-list").css("margin-top", 5).appendTo(ltlresdiv);
                        var liOk = $("<li></li>").css("margin-bottom", 5).appendTo(ul);
                        var btnOk = $("<button><img src='../images/ltl_success.png'>  example </button>").appendTo(liOk);
                        btnOk.click(function () {
                            if (that.options.onshowresultsrequested !== undefined) {
                                that.options.onshowresultsrequested(true);
                            }
                        });
                        var liX = $("<li></li>").css("margin-bottom", 5).addClass("red").appendTo(ul);
                        var btnX = $("<button><img src='../images/ltl_fail.png'> example </button>").appendTo(liX);
                        btnX.click(function () {
                            if (that.options.onshowresultsrequested !== undefined) {
                                that.options.onshowresultsrequested(false);
                            }
                        });
                    }
                    else {
                        var ltlresdiv = $("<div>" + that.options.steps + " steps</div>").addClass("LTL-results-not-expanded").addClass("true").appendTo(opDiv); //
                        var ul = $("<ul></ul>").addClass("button-list").addClass("LTL-test").css("margin-top", 0).appendTo(opDiv);
                        var li = $("<li></li>").addClass("action-button-small").addClass("green").appendTo(ul);
                        var btn = $("<button>OPEN </button>").appendTo(li);
                        btn.click(function () {
                            that.options.isexpanded = true;
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                    }
                    break;
                case "fail":
                    if (this.options.isexpanded) {
                        /*
                         <div class="LTL-test-results false">
                            No Simulation Found<br>
                            12 steps <div class="pill-button-box">
                            <div class="pill-button"><button>-</button></div>
                            <div class="pill-button"><button>+</button></div>
                        </div><br>
                            <ul class="button-list">
                                <li><button>TEST AGAIN</button></li>
                            </ul>
                        </div>
                         */
                        var ltlresdiv = $("<div></div>").addClass("LTL-test-results").addClass("false").appendTo(opDiv);
                        var fr = $("<div>NO trace found</div>").appendTo(ltlresdiv);
                        var sr = $("<div></div>").appendTo(ltlresdiv);
                        var d = $("<div>" + that.options.steps + " steps</div>")
                            .css("display", "inline-block")
                            .appendTo(sr);
                        var box = $("<div></div>").addClass("pill-button-box").css("margin-left", 5).appendTo(sr);
                        var minusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var minusb = $("<button>-</button>").appendTo(minusd);
                        minusb.click(function (e) {
                            that.options.steps--;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var plusd = $("<div></div>").addClass("pill-button").width(17).css("font-size", "13.333px").appendTo(box);
                        var plusb = $("<button>+</button>").appendTo(plusd);
                        plusb.click(function (e) {
                            that.options.steps++;
                            d.text(that.options.steps + " steps");
                            if (that.options.onstepschanged !== undefined) {
                                that.options.onstepschanged(that.options.steps);
                            }
                            that.options.status = "nottested";
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                        var ul = $("<ul></ul>").addClass("button-list").css("margin-top", 5).css("margin-bottom", 5).appendTo(ltlresdiv);
                        var li = $("<li></li>").appendTo(ul);
                        var btn = $("<button><img src='../images/ltl_fail.png'> example</button>").appendTo(li);
                        btn.click(function () {
                            if (that.options.onshowresultsrequested !== undefined) {
                                that.options.onshowresultsrequested();
                            }
                        });
                    }
                    else {
                        var ltlresdiv = $("<div>" + that.options.steps + " steps</div>").addClass("LTL-results-not-expanded").addClass("false").appendTo(opDiv); //
                        var ul = $("<ul></ul>").addClass("button-list").addClass("LTL-test").css("margin-top", 0).appendTo(opDiv);
                        var li = $("<li></li>").addClass("action-button-small").addClass("red").appendTo(ul);
                        var btn = $("<button>OPEN </button>").appendTo(li);
                        btn.click(function () {
                            that.options.isexpanded = true;
                            that._createView();
                            if (that.options.onexpanded !== undefined) {
                                that.options.onexpanded();
                            }
                        });
                    }
                    break;
                default:
                    break;
            }
        },
        createWaitAnim: function () {
            /*
             <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
             */
            var anim = $("<div></div>").addClass("spinner");
            $("<div></div>").addClass("bounce1").appendTo(anim);
            $("<div></div>").addClass("bounce2").appendTo(anim);
            $("<div></div>").addClass("bounce3").appendTo(anim);
            return anim;
        },
        _setOption: function (key, value) {
            var that = this;
            var needRefreshStates = false;
            switch (key) {
                case "status":
                    needRefreshStates = true;
                    break;
                case "isexpanded":
                    needRefreshStates = true;
                    break;
                default:
                    break;
            }
            this._super(key, value);
            if (needRefreshStates) {
                this._createView();
            }
        },
        _setOptions: function (options) {
            this._super(options);
        },
        _destroy: function () {
            this.element.empty();
        }
    });
}(jQuery));
//# sourceMappingURL=compactltlresult.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
(function ($) {
    $.widget("BMA.temporalpropertieseditor", {
        _drawingSurface: undefined,
        copyzone: undefined,
        deletezone: undefined,
        options: {
            states: [],
            drawingSurfaceHeight: "calc(100% - 113px - 30px)",
            onfittoview: undefined
        },
        _refreshStates: function () {
            var that = this;
            this.statesbtns.empty();
            for (var i = 0; i < this.options.states.length; i++) {
                var stateName = this.options.states[i].Name;
                var stateDiv = $("<div></div>")
                    .addClass("state-button")
                    .addClass("ltl-tp-droppable")
                    .attr("data-state", stateName)
                    .css("z-index", 6)
                    .css("cursor", "pointer")
                    .text(stateName)
                    .appendTo(that.statesbtns);
                stateDiv.draggable({
                    helper: "clone",
                    start: function (event, ui) {
                        $(this).draggable("option", "cursorAt", {
                            left: 0,
                            top: 0 //Math.floor(ui.helper.height() / 2)
                        });
                        that._executeCommand("AddStateSelect", $(this).attr("data-state"));
                    }
                });
            }
        },
        _addCustomState: function (statesbtns, name, imagePath) {
            var that = this;
            var state = $("<div></div>")
                .addClass("state-button")
                .addClass("ltl-tp-droppable")
                .attr("data-state", name)
                .css("z-index", 6)
                .css("cursor", "pointer")
                .appendTo(statesbtns);
            $("<img>").attr("src", imagePath).appendTo(state);
            state.draggable({
                helper: "clone",
                start: function (event, ui) {
                    $(this).draggable("option", "cursorAt", {
                        left: 0,
                        top: 0 //Math.floor(ui.helper.height() / 2)
                    });
                    that._executeCommand("AddStateSelect", $(this).attr("data-state"));
                }
            });
            return state;
        },
        _create: function () {
            var that = this;
            var root = this.element;
            var title = $("<div></div>").addClass("window-title").text("Temporal Properties").appendTo(root);
            var toolbar = $("<div></div>").addClass("temporal-toolbar").width("calc(100% - 20px)").appendTo(root);
            //Adding states
            var states = $("<div></div>").addClass("state-buttons").width("calc(100% - 570px)").html("States<br>").appendTo(toolbar);
            this.statesbtns = $("<div></div>").addClass("btns").appendTo(states);
            this._refreshStates();
            //$("<div></div>").addClass("state-button new").text("+").appendTo(statesbtns);
            //Adding pre-defined states
            var conststates = $("<div></div>").addClass("state-buttons").width(130).html("&nbsp;<br>").appendTo(toolbar);
            var statesbtns = $("<div></div>").addClass("btns").appendTo(conststates);
            //Oscilation state
            this._addCustomState(statesbtns, "oscillationstate", "../images/oscillation-state.svg");
            //Selfloop state
            this._addCustomState(statesbtns, "selfloopstate", "../images/selfloop-state.svg");
            //True-state state
            this._addCustomState(statesbtns, "truestate", "../images/true-state.svg");
            //Adding operators
            var operators = $("<div></div>").addClass("temporal-operators").html("Operators<br>").appendTo(toolbar);
            var operatorsDiv = $("<div></div>").addClass("operators").appendTo(operators);
            var registry = new BMA.LTLOperations.OperatorsRegistry();
            for (var i = 0; i < registry.Operators.length; i++) {
                var operator = registry.Operators[i];
                var opDiv = $("<div></div>")
                    .addClass("operator")
                    .addClass("ltl-tp-droppable")
                    .attr("data-operator", operator.Name)
                    .css("z-index", 6)
                    .css("cursor", "pointer")
                    .appendTo(operatorsDiv);
                var spaceStr = "&nbsp;&nbsp;";
                if (operator.OperandsCount > 1) {
                    $("<div></div>").addClass("hole").appendTo(opDiv);
                    spaceStr = "";
                }
                var label = $("<div></div>").addClass("label").html(spaceStr + operator.Name).appendTo(opDiv);
                $("<div></div>").addClass("hole").appendTo(opDiv);
                opDiv.draggable({
                    helper: "clone",
                    start: function (event, ui) {
                        $(this).draggable("option", "cursorAt", {
                            left: 0,
                            top: 0 //Math.floor(ui.helper.height() / 2)
                        });
                        that._executeCommand("AddOperatorSelect", $(this).attr("data-operator"));
                    }
                });
            }
            //Adding drawing surface
            var drawingSurfaceCnt = $("<div></div>").addClass("bma-drawingsurfacecontainer").css("min-height", "200px").height(this.options.drawingSurfaceHeight).width("100%").appendTo(root);
            this._drawingSurface = $("<div></div>").addClass("bma-drawingsurface").appendTo(drawingSurfaceCnt);
            this._drawingSurface.drawingsurface({ useContraints: false });
            var drawingSurface = this._drawingSurface;
            drawingSurface.drawingsurface({
                gridVisibility: false,
                dropFilter: ["ltl-tp-droppable"],
                plotConstraint: {
                    MinWidth: 100,
                    MaxWidth: 1000
                }
            });
            if (that.options.commands !== undefined) {
                drawingSurface.drawingsurface({ commands: that.options.commands });
            }
            drawingSurface.drawingsurface({ visibleRect: { x: 0, y: 0, width: drawingSurfaceCnt.width(), height: drawingSurfaceCnt.height() } });
            drawingSurface.drawingsurface({
                isLightSVGTop: true
            });
            //Adding drop zones
            /*
             <div class="temporal-dropzones">
                <div class="dropzone copy">
                    <img src="../images/LTL-copy.svg" alt="">
                </div>
                <div class="dropzone delete">
                        <img src="../images/LTL-delete.svg" alt="">
                </div>
    
            </div>
            */
            var dom = drawingSurface.drawingsurface("getCentralPart");
            var dropzones = $("<div></div>").addClass("temporal-dropzones").prependTo(dom.host);
            dropzones.width("100%");
            this.copyzone = $("<div></div>").addClass("dropzone copy").appendTo(dropzones);
            this.copyzone.width("calc(50% - 15px - 3px)");
            $("<img>").attr("src", "../images/LTL-copy.svg").attr("alt", "").appendTo(this.copyzone);
            this.deletezone = $("<div></div>").addClass("dropzone delete").appendTo(dropzones);
            this.deletezone.width("calc(50% - 15px - 3px)");
            $("<img>").attr("src", "../images/LTL-delete.svg").attr("alt", "").appendTo(this.deletezone);
            var fitDiv = $("<div></div>").addClass("fit-screen").css("z-index", InteractiveDataDisplay.ZIndexDOMMarkers + 1).css("cursor", "pointer").appendTo(dom.host);
            $("<img>").attr("src", "../images/screen-fit.svg").appendTo(fitDiv);
            fitDiv.click(function () {
                if (that.options.onfittoview !== undefined) {
                    that.options.onfittoview();
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
            drawingSurfaceCnt.contextmenu({
                delegate: drawingSurfaceCnt,
                autoFocus: true,
                preventContextMenuForPopup: true,
                preventSelect: true,
                taphold: true,
                menu: [
                    { title: "Cut", cmd: "Cut", uiIcon: "ui-icon-scissors" },
                    { title: "Copy", cmd: "Copy", uiIcon: "ui-icon-copy" },
                    { title: "Paste", cmd: "Paste", uiIcon: "ui-icon-clipboard" },
                    { title: "Delete", cmd: "Delete", uiIcon: "ui-icon-trash" },
                    { title: "Export", cmd: "Export" },
                    { title: "Import", cmd: "Import" }
                ],
                beforeOpen: function (event, ui) {
                    ui.menu.zIndex(50);
                    var x = holdCords.holdX || event.pageX;
                    var y = holdCords.holdX || event.pageY;
                    var left = x - drawingSurface.offset().left;
                    var top = y - drawingSurface.offset().top;
                    that._executeCommand("TemporalPropertiesEditorContextMenuOpening", {
                        left: left,
                        top: top
                    });
                },
                select: function (event, ui) {
                    var args = {};
                    var commandName = "TemporalPropertiesEditor" + ui.cmd;
                    var x = holdCords.holdX || event.pageX;
                    var y = holdCords.holdX || event.pageY;
                    args.left = x - drawingSurface.offset().left;
                    args.top = y - drawingSurface.offset().top;
                    that._executeCommand(commandName, args);
                }
            });
        },
        getContextMenuPanel: function () {
            return this.element.find(".bma-drawingsurfacecontainer");
        },
        getDrawingSurface: function () {
            return this.element.find(".bma-drawingsurface");
        },
        _executeCommand: function (commandName, args) {
            if (this.options.commands !== undefined) {
                this.options.commands.Execute(commandName, args);
            }
            else {
                window.Commands.Execute(commandName, args);
            }
        },
        _setOption: function (key, value) {
            var that = this;
            var needRefreshStates = false;
            switch (key) {
                case "commands":
                    this._drawingSurface.drawingsurface({ commands: value });
                case "states":
                    needRefreshStates = true;
                default:
                    break;
            }
            this._super(key, value);
            if (needRefreshStates) {
                this._refreshStates();
            }
        },
        destroy: function () {
            this.element.empty();
        },
        setcopyzonevisibility: function (isVisible) {
            if (isVisible) {
                this.copyzone.show();
            }
            else {
                this.copyzone.hide();
            }
        },
        setdeletezonevisibility: function (isVisible) {
            if (isVisible) {
                this.deletezone.show();
            }
            else {
                this.deletezone.hide();
            }
        },
        highlightcopyzone: function (isHighlighted) {
            if (isHighlighted) {
                this.copyzone.addClass("hovered");
            }
            else {
                this.copyzone.removeClass("hovered");
            }
        },
        highlightdeletezone: function (isHighlighted) {
            if (isHighlighted) {
                this.deletezone.addClass("hovered");
            }
            else {
                this.deletezone.removeClass("hovered");
            }
        },
        getcopyzonebbox: function () {
            var x = this._drawingSurface.drawingsurface("getPlotX", 15);
            var y = this._drawingSurface.drawingsurface("getPlotY", this._drawingSurface.height() - 10 - this.copyzone.height());
            var bbox = {
                x: x,
                y: y,
                width: this._drawingSurface.drawingsurface("getPlotX", 15 + this.copyzone.width()) - x,
                height: this._drawingSurface.drawingsurface("getPlotY", this._drawingSurface.height() - 10) - y
            };
            return bbox;
        },
        getdeletezonebbox: function () {
            var x = this._drawingSurface.drawingsurface("getPlotX", 15 + this.copyzone.width() + 6);
            var y = this._drawingSurface.drawingsurface("getPlotY", this._drawingSurface.height() - 10 - this.deletezone.height());
            var bbox = {
                x: x,
                y: y,
                width: this._drawingSurface.drawingsurface("getPlotX", 15 + this.copyzone.width() + 6 + this.copyzone.width()) - x,
                height: this._drawingSurface.drawingsurface("getPlotY", this._drawingSurface.height() - 10) - y
            };
            return bbox;
        },
        updateLayout: function () {
            this._drawingSurface.drawingsurface("updateLayout");
        }
    });
}(jQuery));
//# sourceMappingURL=tpeditor.js.map
(function ($) {
    $.widget("BMA.temporalpropertiesviewer", {
        _svg: undefined,
        _pixelOffset: 10,
        options: {
            operations: [],
            padding: { x: 3, y: 5 }
        },
        _create: function () {
            var that = this;
            var root = this.element;
            root.css("overflow-y", "auto").css("overflow-x", "auto");
            this.attentionDiv = $("<div></div>").text("No temporal properties. Open editor to create some").appendTo(root);
            var svgdiv = $("<div></div>").appendTo(root);
            this.svgdiv = svgdiv;
            var pixofs = this._pixelOffset;
            svgdiv.svg({
                onLoad: function (svg) {
                    that._svg = svg;
                    svg.configure({
                        width: root.width() - pixofs,
                        height: root.height() - pixofs,
                        viewBox: "0 0 " + (root.width() - pixofs) + " " + (root.height() - pixofs),
                        preserveAspectRatio: "none meet"
                    }, true);
                    that.refresh();
                }
            });
            svgdiv.hide();
        },
        refresh: function () {
            if (this._svg !== undefined) {
                this._svg.clear();
                var operations = this.options.operations;
                var currentPos = { x: 0, y: 0 };
                var height = this.options.padding.y;
                var width = 0;
                for (var i = 0; i < operations.length; i++) {
                    var opLayout = new BMA.LTLOperations.OperationLayout(this._svg, operations[i].operation, { x: 0, y: 0 });
                    opLayout.AnalysisStatus = operations[i].status;
                    var opbbox = opLayout.BoundingBox;
                    opLayout.Position = { x: opbbox.width / 2 + this.options.padding.x, y: height + opbbox.height / 2 };
                    height += opbbox.height + this.options.padding.y;
                    width = Math.max(width, opbbox.width);
                }
                width += 2 * this.options.padding.x;
                height += this.options.padding.y;
                this.svgdiv.width(width);
                this.svgdiv.height(height);
                this._svg.configure({
                    width: width,
                    height: height,
                    viewBox: "0 0 " + width + " " + height
                }, true);
            }
        },
        _setOption: function (key, value) {
            var that = this;
            switch (key) {
                case "operations":
                    if (value !== undefined && value.length > 0) {
                        that.svgdiv.show();
                        that.attentionDiv.hide();
                    }
                    else {
                        that.svgdiv.hide();
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
}(jQuery));
//# sourceMappingURL=tpviewer.js.map
var BMA;
(function (BMA) {
    var Presenters;
    (function (Presenters) {
        var LTLPresenter = (function () {
            function LTLPresenter(commands, appModel, statesEditorDriver, temporlapropertieseditor, ltlviewer, ltlresultsviewer, ajax, popupViewer, exportService, fileLoaderDriver) {
                var _this = this;
                var that = this;
                this.appModel = appModel;
                this.statespresenter = new BMA.LTL.StatesPresenter(commands, this.appModel, statesEditorDriver, ltlviewer.GetStatesViewer());
                temporlapropertieseditor.SetStates(appModel.States);
                statesEditorDriver.SetModel(appModel.BioModel, appModel.Layout);
                window.Commands.On("AppModelChanged", function (args) {
                    statesEditorDriver.SetModel(appModel.BioModel, appModel.Layout);
                });
                window.Commands.On("Expand", function (param) {
                    switch (param) {
                        case "LTLStates":
                            statesEditorDriver.Show();
                            break;
                        case "LTLTempProp":
                            temporlapropertieseditor.Show();
                            commands.Execute("TemporalPropertiesEditorExpanded", {});
                            if (_this.tppresenter === undefined) {
                                _this.tppresenter = new BMA.LTL.TemporalPropertiesPresenter(commands, appModel, ajax, temporlapropertieseditor, _this.statespresenter);
                            }
                            break;
                        default:
                            ltlviewer.Show(undefined);
                            break;
                    }
                });
                window.Commands.On("Collapse", function (param) {
                    temporlapropertieseditor.Hide();
                    statesEditorDriver.Hide();
                    ltlresultsviewer.Hide();
                    popupViewer.Hide();
                });
                window.Commands.On("ModelReset", function (args) {
                    var ops = [];
                    for (var i = 0; i < appModel.Operations.length; i++) {
                        ops.push({
                            operation: appModel.Operations[i].Clone(),
                            status: "nottested"
                        });
                    }
                    ltlviewer.GetTemporalPropertiesViewer().SetOperations(ops);
                });
                //window.Commands.On("LTLRequested",(args) => {
                //    ltlviewer.GetTemporalPropertiesViewer().Refresh();
                //});
                commands.On("TemporalPropertiesOperationsChanged", function (args) {
                    ltlviewer.GetTemporalPropertiesViewer().SetOperations(args);
                });
                var ltlDataToExport = undefined;
                commands.On("ShowLTLResults", function (args) {
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
                commands.On("ExportLTLFormula", function (args) {
                    if (args.operation !== undefined) {
                        exportService.Export(JSON.stringify(BMA.Model.ExportOperation(args.operation, true)), "operation", "txt");
                    }
                });
                commands.On("ImportLTLFormula", function (args) {
                    fileLoaderDriver.OpenFileDialog().done(function (fileName) {
                        var fileReader = new FileReader();
                        fileReader.onload = function () {
                            var fileContent = fileReader.result;
                            var obj = JSON.parse(fileContent);
                            var operation = BMA.Model.ImportOperand(obj, undefined);
                            if (operation instanceof BMA.LTLOperations.Operation) {
                                var op = operation;
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
            LTLPresenter.prototype.UpdateOperationStates = function (operation, map) {
                var that = this;
                for (var i = 0; i < operation.Operands.length; i++) {
                    var op = operation.Operands[i];
                    if (op instanceof BMA.LTLOperations.Keyframe) {
                        op.Name = map[op.Name];
                    }
                    else if (op instanceof BMA.LTLOperations.Operation) {
                        that.UpdateOperationStates(op, map);
                    }
                }
            };
            LTLPresenter.prototype.GetStates = function (operation) {
                var that = this;
                var result = [];
                for (var i = 0; i < operation.Operands.length; i++) {
                    var op = operation.Operands[i];
                    if (op !== undefined && op !== null) {
                        if (op instanceof BMA.LTLOperations.Keyframe) {
                            result.push(op.Clone());
                        }
                        else if (op instanceof BMA.LTLOperations.Operation) {
                            var states = that.GetStates(op);
                            for (var j = 0; j < states.length; j++) {
                                result.push(states[j]);
                            }
                        }
                    }
                }
                return result;
            };
            LTLPresenter.prototype.MergeStates = function (currentStates, newStates) {
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
            };
            LTLPresenter.prototype.CreateCSV = function (ltlDataToExport, sep) {
                var csv = '';
                var that = this;
                var variables = ltlDataToExport.model.Variables;
                var ticks = ltlDataToExport.ticks.sort(function (x, y) {
                    return x.Time < y.Time ? -1 : 1;
                });
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    var cont = that.appModel.Layout.GetContainerById(variable.ContainerId);
                    if (cont !== undefined) {
                        csv += cont.Name + sep;
                    }
                    else {
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
            };
            return LTLPresenter;
        })();
        Presenters.LTLPresenter = LTLPresenter;
    })(Presenters = BMA.Presenters || (BMA.Presenters = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=LTLpresenter.js.map
var BMA;
(function (BMA) {
    var LTL;
    (function (LTL) {
        var StatesPresenter = (function () {
            function StatesPresenter(commands, appModel, stateseditordriver, statesviewerdriver) {
                var _this = this;
                var that = this;
                this.appModel = appModel;
                this.statesEditor = stateseditordriver;
                this.statesViewer = statesviewerdriver;
                this.statesEditor.SetStates(appModel.States);
                this.statesViewer.SetStates(appModel.States);
                this.statesViewer.SetCommands(commands);
                commands.On("AddFirstStateRequested", function (args) {
                    if (appModel.States.length === 0) {
                        var newState = new BMA.LTLOperations.Keyframe("A", "", []);
                        appModel.States.push(newState);
                        _this.statesEditor.SetStates(appModel.States);
                        _this.statesViewer.SetStates(appModel.States);
                    }
                    stateseditordriver.Show();
                });
                commands.On("KeyframesChanged", function (args) {
                    if (_this.CompareStatesToAppModel(args.states)) {
                        appModel.States = args.states;
                        that.statesViewer.SetStates(args.states);
                    }
                });
                commands.On("UpdateStatesEditorOptions", function (args) {
                    that.statesEditor.SetModel(that.appModel.BioModel, that.appModel.Layout);
                });
                window.Commands.On("ModelReset", function (args) {
                    _this.statesEditor.SetStates(appModel.States);
                    _this.statesViewer.SetStates(appModel.States);
                });
            }
            StatesPresenter.prototype.GetStateByName = function (name) {
                if (name === "truestate")
                    return new BMA.LTLOperations.TrueKeyframe();
                else if (name === "oscillationstate")
                    return new BMA.LTLOperations.OscillationKeyframe();
                else if (name === "selfloopstate")
                    return new BMA.LTLOperations.SelfLoopKeyframe();
                var keyframes = this.appModel.States;
                for (var i = 0; i < keyframes.length; i++) {
                    if (keyframes[i].Name === name)
                        return keyframes[i]; //TODO: Check whether clone is needed here
                }
                return undefined;
            };
            StatesPresenter.prototype.UpdateStatesFromModel = function () {
                this.statesEditor.SetStates(this.appModel.States);
                this.statesViewer.SetStates(this.appModel.States);
            };
            StatesPresenter.prototype.CompareStatesToAppModel = function (states) {
                if (states.length !== this.appModel.States.length)
                    return true;
                else {
                    for (var i = 0; i < states.length; i++) {
                        var st = states[i];
                        var appst = this.appModel.States[i];
                        if (st.Name !== appst.Name || st.GetFormula() !== appst.GetFormula())
                            return true;
                    }
                    return false;
                }
            };
            return StatesPresenter;
        })();
        LTL.StatesPresenter = StatesPresenter;
    })(LTL = BMA.LTL || (BMA.LTL = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=states.js.map
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\..\model\biomodel.ts"/>
/// <reference path="..\..\model\model.ts"/>
/// <reference path="..\..\uidrivers\commoninterfaces.ts"/>
/// <reference path="..\..\uidrivers\ltlinterfaces.ts"/>
/// <reference path="..\..\model\operation.ts"/>
/// <reference path="..\..\commands.ts"/>
var BMA;
(function (BMA) {
    var LTL;
    (function (LTL) {
        var TemporalPropertiesPresenter = (function () {
            function TemporalPropertiesPresenter(commands, appModel, ajax, tpEditorDriver, statesPresenter) {
                var _this = this;
                this.controlPanels = [];
                this.controlPanelPadding = 3;
                this.isUpdateControlRequested = false;
                this.zoomConstraints = {
                    minWidth: 100,
                    maxWidth: 1000
                };
                this.states = [];
                var that = this;
                this.appModel = appModel;
                this.ajax = ajax;
                this.tpEditorDriver = tpEditorDriver;
                this.driver = tpEditorDriver.GetSVGDriver();
                this.navigationDriver = tpEditorDriver.GetNavigationDriver();
                this.dragService = tpEditorDriver.GetDragService();
                this.commands = commands;
                this.statesPresenter = statesPresenter;
                this.ltlcompactviewfactory = new BMA.UIDrivers.LTLResultsViewerFactory();
                this.operatorRegistry = new BMA.LTLOperations.OperatorsRegistry();
                this.operations = [];
                var contextMenu = tpEditorDriver.GetContextMenuDriver();
                tpEditorDriver.SetCopyZoneVisibility(false);
                tpEditorDriver.SetDeleteZoneVisibility(false);
                commands.On("AddOperatorSelect", function (operatorName) {
                    that.elementToAdd = { type: "operator", name: operatorName };
                });
                commands.On("AddStateSelect", function (stateName) {
                    that.elementToAdd = { type: "state", name: stateName };
                });
                commands.On("DrawingSurfaceDrop", function (args) {
                    if (that.elementToAdd !== undefined) {
                        var position = { x: args.x, y: args.y };
                        var operation = that.GetOperationAtPoint(args.x, args.y);
                        var emptyCell = undefined;
                        if (operation !== undefined) {
                            emptyCell = operation.GetEmptySlotAtPosition(position.x, position.y);
                        }
                        if (that.elementToAdd.type === "operator") {
                            var registry = _this.operatorRegistry;
                            var op = new BMA.LTLOperations.Operation();
                            op.Operator = registry.GetOperatorByName(that.elementToAdd.name);
                            op.Operands = op.Operator.OperandsCount > 1 ? [undefined, undefined] : [undefined];
                            if (operation !== undefined) {
                                if (emptyCell !== undefined) {
                                    emptyCell.operation.Operands[emptyCell.operandIndex] = op;
                                    operation.Refresh();
                                }
                            }
                            else {
                                var operationLayout = new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), op, position);
                                if (that.HasIntersections(operationLayout)) {
                                    operationLayout.IsVisible = false;
                                }
                                else {
                                    that.operations.push(operationLayout);
                                }
                            }
                        }
                        else if (that.elementToAdd.type === "state") {
                            var state = statesPresenter.GetStateByName(that.elementToAdd.name);
                            if (operation !== undefined && emptyCell !== undefined) {
                                emptyCell.operation.Operands[emptyCell.operandIndex] = state;
                                operation.Refresh();
                            }
                        }
                        _this.OnOperationsChanged();
                    }
                });
                commands.On("TemporalPropertiesEditorContextMenuOpening", function (args) {
                    var x = that.driver.GetPlotX(args.left);
                    var y = that.driver.GetPlotY(args.top);
                    _this.contextElement = {
                        x: x,
                        y: y
                    };
                    //that.driver.GetLightSVGRef().rect(x - 5, y - 5, 10, 10, { stroke: "red", fill: "transparent" });
                    var canPaste = _this.clipboard !== undefined;
                    var stagingOp = _this.GetOperationAtPoint(x, y);
                    if (stagingOp !== undefined) {
                        var emptyCell = stagingOp.GetEmptySlotAtPosition(x, y);
                        _this.contextElement.operationlayoutref = stagingOp;
                        _this.contextElement.emptyslot = emptyCell;
                        contextMenu.ShowMenuItems([
                            { name: "Cut", isVisible: true },
                            { name: "Copy", isVisible: true },
                            { name: "Paste", isVisible: emptyCell !== undefined },
                            { name: "Delete", isVisible: true },
                            { name: "Export", isVisible: true },
                            { name: "Import", isVisible: false },
                        ]);
                        contextMenu.EnableMenuItems([
                            { name: "Cut", isEnabled: emptyCell === undefined },
                            { name: "Copy", isEnabled: emptyCell === undefined },
                            { name: "Delete", isEnabled: emptyCell === undefined },
                            { name: "Paste", isEnabled: canPaste },
                            { name: "Export", isEnabled: true },
                        ]);
                    }
                    else {
                        if (_this.clipboard !== undefined) {
                            var operationLayout = new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), _this.clipboard.operation, { x: x, y: y });
                            canPaste = !_this.HasIntersections(operationLayout) && _this.clipboard.operation.operator !== undefined;
                            operationLayout.IsVisible = false;
                        }
                        contextMenu.ShowMenuItems([
                            { name: "Cut", isVisible: false },
                            { name: "Copy", isVisible: false },
                            { name: "Paste", isVisible: true },
                            { name: "Delete", isVisible: false },
                            { name: "Export", isVisible: false },
                            { name: "Import", isVisible: true },
                        ]);
                        contextMenu.EnableMenuItems([
                            { name: "Paste", isEnabled: canPaste }
                        ]);
                    }
                });
                commands.On("TemporalPropertiesEditorExport", function (args) {
                    if (_this.contextElement !== undefined) {
                        var operation = _this.contextElement.operationlayoutref.PickOperation(_this.contextElement.x, _this.contextElement.y);
                        var clonned = operation !== undefined ? operation.Clone() : undefined;
                        commands.Execute("ExportLTLFormula", { operation: clonned });
                    }
                });
                commands.On("TemporalPropertiesEditorImport", function (args) {
                    if (_this.contextElement !== undefined) {
                        commands.Execute("ImportLTLFormula", {
                            position: { x: _this.contextElement.x, y: _this.contextElement.y }
                        });
                    }
                });
                commands.On("TemporalPropertiesEditorCut", function (args) {
                    if (_this.contextElement !== undefined) {
                        _this.contextElement.operationlayoutref.AnalysisStatus = "nottested";
                        var unpinned = _this.contextElement.operationlayoutref.UnpinOperation(_this.contextElement.x, _this.contextElement.y);
                        var clonned = unpinned.operation !== undefined ? unpinned.operation.Clone() : undefined;
                        _this.clipboard = {
                            operation: clonned,
                        };
                        if (unpinned.isRoot) {
                            _this.operations.splice(_this.operations.indexOf(_this.contextElement.operationlayoutref), 1);
                            _this.contextElement.operationlayoutref.IsVisible = false;
                        }
                        tpEditorDriver.SetCopyZoneVisibility(_this.clipboard !== undefined);
                        _this.OnOperationsChanged();
                    }
                });
                commands.On("TemporalPropertiesEditorCopy", function (args) {
                    if (_this.contextElement !== undefined) {
                        var operation = _this.contextElement.operationlayoutref.PickOperation(_this.contextElement.x, _this.contextElement.y);
                        var clonned = operation !== undefined ? operation.Clone() : undefined;
                        _this.clipboard = {
                            operation: clonned
                        };
                        tpEditorDriver.SetCopyZoneVisibility(_this.clipboard !== undefined);
                    }
                });
                commands.On("TemporalPropertiesEditorPaste", function (args) {
                    var x = _this.contextElement.x;
                    var y = _this.contextElement.y;
                    if (_this.clipboard !== undefined) {
                        var op = _this.clipboard.operation.Clone();
                        if (_this.contextElement.emptyslot !== undefined) {
                            var emptyCell = _this.contextElement.emptyslot;
                            emptyCell.operation.Operands[emptyCell.operandIndex] = op;
                            _this.contextElement.operationlayoutref.Refresh();
                        }
                        else {
                            var operationLayout = new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), op, { x: x, y: y });
                            _this.operations.push(operationLayout);
                        }
                        _this.OnOperationsChanged();
                    }
                });
                commands.On("TemporalPropertiesEditorDelete", function (args) {
                    if (_this.contextElement !== undefined) {
                        _this.contextElement.operationlayoutref.AnalysisStatus = "nottested";
                        var op = _this.contextElement.operationlayoutref.UnpinOperation(_this.contextElement.x, _this.contextElement.y);
                        if (op.isRoot) {
                            var ind = _this.operations.indexOf(_this.contextElement.operationlayoutref);
                            _this.contextElement.operationlayoutref.IsVisible = false;
                            _this.operations.splice(ind, 1);
                        }
                        _this.OnOperationsChanged();
                    }
                });
                commands.On("KeyframesChanged", function (args) {
                    if (_this.CompareStatesToLocal(args.states)) {
                        //this.ClearResults();
                        _this.states = args.states;
                        tpEditorDriver.SetStates(args.states);
                        for (var i = 0; i < _this.operations.length; i++) {
                            var op = _this.operations[i];
                            op.RefreshStates(args.states);
                        }
                        _this.FitToView();
                        _this.OnOperationsChanged(true, false);
                        that.isUpdateControlRequested = true;
                    }
                });
                commands.On("TemporalPropertiesEditorExpanded", function (args) {
                    if (that.isUpdateControlRequested) {
                        that.UpdateControlPanels();
                        that.isUpdateControlRequested = false;
                    }
                    for (var i = 0; i < that.operations.length; i++) {
                        that.operations[i].Refresh();
                    }
                });
                commands.On("VisibleRectChanged", function (param) {
                    //if (param < this.zoomConstraints.minWidth) {
                    //    param = this.zoomConstraints.minWidth;
                    //    this.navigationDriver.SetZoom(param);
                    //}
                    //if (param > this.zoomConstraints.maxWidth) {
                    //    param = this.zoomConstraints.maxWidth;
                    //    this.navigationDriver.SetZoom(param);
                    //}
                    //var zoom = (param - window.PlotSettings.MinWidth) / 24;
                    //commands.Execute("ZoomSliderBind", zoom);
                });
                that.dragService.GetMouseMoves().subscribe(function (gesture) {
                    if (that.previousHighlightedOperation !== undefined) {
                        that.previousHighlightedOperation.Refresh();
                        that.previousHighlightedOperation = undefined;
                    }
                    var staginOp = that.GetOperationAtPoint(gesture.x, gesture.y);
                    if (staginOp !== undefined) {
                        staginOp.HighlightAtPosition(gesture.x, gesture.y);
                        that.previousHighlightedOperation = staginOp;
                    }
                    if (_this.clipboard !== undefined) {
                        var copyZoneBB = tpEditorDriver.GetCopyZoneBBox();
                        if (that.Intersects(gesture, copyZoneBB)) {
                            tpEditorDriver.HighlightCopyZone(true);
                        }
                        else {
                            tpEditorDriver.HighlightCopyZone(false);
                        }
                    }
                });
                var dragSubject = that.dragService.GetDragSubject();
                dragSubject.dragStart.subscribe(function (gesture) {
                    var copyZoneBbox = that.tpEditorDriver.GetCopyZoneBBox();
                    if (that.clipboard !== undefined && that.Intersects(gesture, copyZoneBbox)) {
                        that.navigationDriver.TurnNavigation(false);
                        _this.stagingOperation = {
                            operation: new BMA.LTLOperations.OperationLayout(that.driver.GetLightSVGRef(), _this.clipboard.operation, gesture),
                            originRef: undefined,
                            originIndex: undefined,
                            isRoot: undefined,
                            parentoperation: undefined,
                            parentoperationindex: undefined,
                            fromclipboard: true
                        };
                    }
                    else {
                        var staginOp = _this.GetOperationAtPoint(gesture.x, gesture.y);
                        if (staginOp !== undefined) {
                            tpEditorDriver.SetCopyZoneVisibility(true);
                            tpEditorDriver.SetDeleteZoneVisibility(true);
                            staginOp.AnalysisStatus = "nottested";
                            that.navigationDriver.TurnNavigation(false);
                            var unpinned = staginOp.UnpinOperation(gesture.x, gesture.y);
                            _this.stagingOperation = {
                                operation: new BMA.LTLOperations.OperationLayout(that.driver.GetLightSVGRef(), unpinned.operation, gesture),
                                originRef: staginOp,
                                originIndex: _this.operations.indexOf(staginOp),
                                isRoot: unpinned.isRoot,
                                parentoperation: unpinned.parentoperation,
                                parentoperationindex: unpinned.parentoperationindex,
                                fromclipboard: false
                            };
                            if (that.controlPanels !== undefined && that.controlPanels[that.stagingOperation.originIndex] !== undefined) {
                                that.controlPanels[that.stagingOperation.originIndex].dommarker.hide();
                            }
                            //this.stagingOperation.operation.Scale = { x: 0.4, y: 0.4 };
                            staginOp.IsVisible = !unpinned.isRoot;
                        }
                    }
                });
                dragSubject.drag.subscribe(function (gesture) {
                    if (_this.stagingOperation !== undefined) {
                        var bbox = _this.stagingOperation.operation.BoundingBox;
                        _this.stagingOperation.operation.Position = { x: gesture.x1 + _this.stagingOperation.operation.Scale.x * bbox.width / 2, y: gesture.y1 + _this.stagingOperation.operation.Scale.y * bbox.height / 2 };
                        var copyZoneBB = tpEditorDriver.GetCopyZoneBBox();
                        var deleteZoneBB = tpEditorDriver.GetDeleteZoneBBox();
                        var position = {
                            x: gesture.x1,
                            y: gesture.y1
                        };
                        if (_this.Intersects(position, copyZoneBB)) {
                            tpEditorDriver.HighlightCopyZone(true);
                            tpEditorDriver.HighlightDeleteZone(false);
                        }
                        else if (_this.Intersects(position, deleteZoneBB)) {
                            tpEditorDriver.HighlightCopyZone(false);
                            tpEditorDriver.HighlightDeleteZone(true);
                        }
                        else {
                            tpEditorDriver.HighlightCopyZone(false);
                            tpEditorDriver.HighlightDeleteZone(false);
                        }
                    }
                });
                dragSubject.dragEnd.subscribe(function (gesture) {
                    if (_this.stagingOperation !== undefined) {
                        that.navigationDriver.TurnNavigation(true);
                        _this.stagingOperation.operation.IsVisible = false;
                        var bbox = _this.stagingOperation.operation.BoundingBox;
                        var position = {
                            x: _this.stagingOperation.operation.Position.x - _this.stagingOperation.operation.Scale.x * bbox.width / 2,
                            y: _this.stagingOperation.operation.Position.y - _this.stagingOperation.operation.Scale.y * bbox.height / 2,
                        };
                        _this.stagingOperation.operation.Position = {
                            x: position.x + bbox.width / 2,
                            y: position.y + bbox.height / 2
                        };
                        tpEditorDriver.HighlightCopyZone(false);
                        tpEditorDriver.HighlightDeleteZone(false);
                        var copyZoneBB = tpEditorDriver.GetCopyZoneBBox();
                        var deleteZoneBB = tpEditorDriver.GetDeleteZoneBBox();
                        if (that.Intersects(position, copyZoneBB) && !_this.stagingOperation.fromclipboard) {
                            _this.clipboard = {
                                operation: _this.stagingOperation.operation.Operation.Clone()
                            };
                            //Operation should stay in its origin place
                            if (_this.stagingOperation.isRoot) {
                                _this.stagingOperation.originRef.IsVisible = true;
                            }
                            else {
                                _this.stagingOperation.parentoperation.Operands[_this.stagingOperation.parentoperationindex] = _this.stagingOperation.operation.Operation;
                                _this.stagingOperation.originRef.Refresh();
                            }
                        }
                        else if (that.Intersects(position, deleteZoneBB) && !_this.stagingOperation.fromclipboard) {
                            if (_this.stagingOperation.isRoot) {
                                _this.operations.splice(_this.stagingOperation.originIndex, 1);
                            }
                        }
                        else {
                            if (!_this.HasIntersections(_this.stagingOperation.operation)) {
                                if (_this.stagingOperation.fromclipboard) {
                                    if (_this.stagingOperation.operation.IsOperation) {
                                        _this.operations.push(new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), _this.stagingOperation.operation.Operation.Clone(), _this.stagingOperation.operation.Position));
                                    }
                                }
                                else {
                                    if (_this.stagingOperation.operation.IsOperation) {
                                        if (_this.stagingOperation.isRoot) {
                                            _this.stagingOperation.originRef.Position = _this.stagingOperation.operation.Position;
                                            _this.stagingOperation.originRef.IsVisible = true;
                                        }
                                        else {
                                            _this.operations.push(new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), _this.stagingOperation.operation.Operation, _this.stagingOperation.operation.Position));
                                        }
                                    }
                                    else {
                                        //State should state in its origin place
                                        _this.stagingOperation.parentoperation.Operands[_this.stagingOperation.parentoperationindex] = _this.stagingOperation.operation.Operation;
                                        _this.stagingOperation.originRef.Refresh();
                                    }
                                }
                            }
                            else {
                                var operation = _this.GetOperationAtPoint(position.x, position.y);
                                if (operation !== undefined) {
                                    var emptyCell = undefined;
                                    emptyCell = operation.GetEmptySlotAtPosition(position.x, position.y);
                                    if (emptyCell !== undefined) {
                                        //emptyCell.opLayout = operation;
                                        emptyCell.operation.Operands[emptyCell.operandIndex] = _this.stagingOperation.operation.Operation.Clone();
                                        operation.Refresh();
                                        operation.AnalysisStatus = "nottested";
                                        if (_this.stagingOperation.isRoot) {
                                            _this.operations[_this.stagingOperation.originIndex].IsVisible = false;
                                            _this.operations.splice(_this.stagingOperation.originIndex, 1);
                                        }
                                    }
                                    else {
                                        if (!_this.stagingOperation.fromclipboard) {
                                            //Operation should stay in its origin place
                                            if (_this.stagingOperation.isRoot) {
                                                _this.stagingOperation.originRef.IsVisible = true;
                                            }
                                            else {
                                                _this.stagingOperation.parentoperation.Operands[_this.stagingOperation.parentoperationindex] = _this.stagingOperation.operation.Operation;
                                                _this.stagingOperation.originRef.Refresh();
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (!_this.stagingOperation.fromclipboard) {
                                        //Operation should stay in its origin place
                                        if (_this.stagingOperation.isRoot) {
                                            _this.stagingOperation.originRef.IsVisible = true;
                                        }
                                        else {
                                            _this.stagingOperation.parentoperation.Operands[_this.stagingOperation.parentoperationindex] = _this.stagingOperation.operation.Operation;
                                            _this.stagingOperation.originRef.Refresh();
                                        }
                                    }
                                }
                            }
                        }
                        _this.stagingOperation.operation.IsVisible = false;
                        _this.stagingOperation = undefined;
                        tpEditorDriver.SetCopyZoneVisibility(_this.clipboard !== undefined);
                        tpEditorDriver.SetDeleteZoneVisibility(false);
                        _this.OnOperationsChanged();
                    }
                });
                window.Commands.On("ModelReset", function (args) {
                    for (var i = 0; i < _this.operations.length; i++) {
                        _this.operations[i].IsVisible = false;
                    }
                    _this.operations = [];
                    _this.LoadFromAppModel();
                });
                tpEditorDriver.SetFitToViewCallback(function () {
                    that.FitToView();
                });
                this.LoadFromAppModel();
            }
            TemporalPropertiesPresenter.prototype.CompareStatesToLocal = function (states) {
                if (states.length !== this.states.length)
                    return true;
                else {
                    for (var i = 0; i < states.length; i++) {
                        var st = states[i];
                        var appst = this.states[i];
                        if (st.Name !== appst.Name || st.GetFormula() !== appst.GetFormula())
                            return true;
                    }
                    return false;
                }
            };
            TemporalPropertiesPresenter.prototype.FitToView = function () {
                if (this.operations.length < 1)
                    this.driver.SetVisibleRect({ x: 0, y: 0, width: 800, height: 600 });
                else {
                    var bbox = this.operations[0].BoundingBox;
                    for (var i = 1; i < this.operations.length; i++) {
                        var unitBbbox = this.operations[i].BoundingBox;
                        var x = Math.min(bbox.x, unitBbbox.x);
                        var y = Math.min(bbox.y, unitBbbox.y);
                        bbox = {
                            x: x,
                            y: y,
                            width: Math.max(bbox.x + bbox.width, unitBbbox.x + unitBbbox.width) - x,
                            height: Math.max(bbox.y + bbox.height, unitBbbox.y + unitBbbox.height) - y
                        };
                    }
                    var size = Math.max(bbox.width, bbox.height);
                    if (size < this.zoomConstraints.minWidth)
                        this.zoomConstraints.minWidth = size;
                    else if (size > this.zoomConstraints.maxWidth)
                        this.zoomConstraints.maxWidth = size;
                    bbox = {
                        x: bbox.x,
                        y: bbox.y,
                        width: size,
                        height: size
                    };
                    this.driver.SetVisibleRect(bbox);
                }
            };
            TemporalPropertiesPresenter.prototype.LoadFromAppModel = function () {
                var appModel = this.appModel;
                var height = 0;
                var padding = 5;
                if (appModel.Operations !== undefined && appModel.Operations.length > 0) {
                    for (var i = 0; i < appModel.Operations.length; i++) {
                        var newOp = new BMA.LTLOperations.OperationLayout(this.driver.GetSVGRef(), appModel.Operations[i], { x: 0, y: 0 });
                        height += newOp.BoundingBox.height / 2 + padding;
                        newOp.Position = { x: 0, y: height };
                        height += newOp.BoundingBox.height / 2 + padding;
                        this.operations.push(newOp);
                    }
                }
                this.states = appModel.States;
                this.tpEditorDriver.SetStates(appModel.States);
                for (var i = 0; i < this.operations.length; i++) {
                    var op = this.operations[i];
                    op.RefreshStates(appModel.States);
                }
                this.FitToView();
                this.OnOperationsChanged(true, false);
            };
            TemporalPropertiesPresenter.prototype.GetOperationAtPoint = function (x, y) {
                var that = this;
                var operations = this.operations;
                for (var i = 0; i < operations.length; i++) {
                    if (!operations[i].IsVisible)
                        continue;
                    var bbox = operations[i].BoundingBox;
                    if (this.Intersects({ x: x, y: y }, bbox)) {
                        return operations[i];
                    }
                }
                return undefined;
            };
            TemporalPropertiesPresenter.prototype.HasIntersections = function (operation) {
                var that = this;
                var operations = this.operations;
                var opBbox = operation.BoundingBox;
                for (var i = 0; i < operations.length; i++) {
                    if (!operations[i].IsVisible)
                        continue;
                    var bbox = operations[i].BoundingBox;
                    if (this.HasIntersection(opBbox, bbox))
                        return true;
                }
                return false;
            };
            TemporalPropertiesPresenter.prototype.HasIntersection = function (bbox, bbox2) {
                var isXIntersects = bbox2.x <= bbox.x + bbox.width && bbox2.x + bbox2.width >= bbox.x;
                var isYIntersects = bbox2.y <= bbox.y + bbox.height && bbox2.y + bbox2.height >= bbox.y;
                return isXIntersects && isYIntersects;
            };
            TemporalPropertiesPresenter.prototype.Intersects = function (point, bbox) {
                return bbox.x <= point.x && (bbox.x + bbox.width) >= point.x && bbox.y <= point.y && (bbox.y + bbox.height) >= point.y;
            };
            TemporalPropertiesPresenter.prototype.PerformLTL = function (operation, domplot, driver) {
                var that = this;
                if (operation.IsCompleted) {
                    var formula = operation.Operation.GetFormula();
                    var model = BMA.Model.ExportBioModel(that.appModel.BioModel);
                    var proofInput = {
                        "Name": model.Name,
                        "Relationships": model.Relationships,
                        "Variables": model.Variables,
                        "Formula": formula,
                        "Number_of_steps": driver.GetSteps()
                    };
                    var result = that.ajax.Invoke(proofInput)
                        .done(function (res) {
                        if (res.Ticks == null) {
                            alert(res.Error);
                        }
                        else {
                            if (res.Status === "True") {
                                driver.SetShowResultsCallback(function () {
                                    that.commands.Execute("ShowLTLResults", {
                                        ticks: res.Ticks
                                    });
                                });
                                driver.SetStatus("success");
                                operation.AnalysisStatus = "success";
                            }
                            else {
                                driver.SetStatus("fail");
                                operation.AnalysisStatus = "fail";
                            }
                            domplot.updateLayout();
                            that.OnOperationsChanged(false);
                        }
                    })
                        .fail(function () {
                        //alert("LTL failed");
                    });
                }
                else {
                    operation.HighlightEmptySlots("red");
                    driver.SetStatus("nottested");
                }
            };
            /*
            private ClearResults() {
                for (var i = 0; i < this.operations.length; i++) {
                    this.operations[i].AnalysisStatus = "nottested";
                }
            }
            */
            TemporalPropertiesPresenter.prototype.SubscribeToLTLRequest = function (driver, domplot, op) {
                var that = this;
                driver.SetLTLRequestedCallback(function () {
                    that.PerformLTL(op, domplot, driver);
                });
            };
            TemporalPropertiesPresenter.prototype.SubscribeToLTLCompactExpand = function (driver, domplot) {
                driver.SetOnExpandedCallback(function () {
                    domplot.updateLayout();
                });
            };
            TemporalPropertiesPresenter.prototype.UpdateControlPanels = function () {
                var that = this;
                var copyzonebbox = this.tpEditorDriver.GetCopyZoneBBox();
                var deletezonebbox = this.tpEditorDriver.GetDeleteZoneBBox();
                var cps = this.controlPanels;
                var dom = this.navigationDriver.GetNavigationSurface();
                for (var i = 0; i < cps.length; i++) {
                    dom.remove(cps[i].dommarker);
                }
                this.controlPanels = [];
                for (var i = 0; i < this.operations.length; i++) {
                    var op = this.operations[i];
                    var bbox = op.BoundingBox;
                    var opDiv = $("<div></div>");
                    var cp = {
                        dommarker: opDiv,
                        status: op.AnalysisStatus
                    };
                    var driver = new BMA.UIDrivers.LTLResultsCompactViewer(opDiv);
                    driver.SetStatus(op.AnalysisStatus);
                    //TODO: set steps 
                    that.SubscribeToLTLRequest(driver, dom, op);
                    that.SubscribeToLTLCompactExpand(driver, dom);
                    dom.add(opDiv, "none", bbox.x + bbox.width + this.controlPanelPadding, -op.Position.y, 0, 0, 0, 0.5);
                    this.controlPanels.push(cp);
                }
            };
            TemporalPropertiesPresenter.prototype.OnOperationsChanged = function (updateControls, updateAppModel) {
                if (updateControls === void 0) { updateControls = true; }
                if (updateAppModel === void 0) { updateAppModel = true; }
                var that = this;
                var ops = [];
                var operations = [];
                for (var i = 0; i < this.operations.length; i++) {
                    operations.push(this.operations[i].Operation.Clone());
                    ops.push({ operation: this.operations[i].Operation.Clone(), status: this.operations[i].AnalysisStatus });
                }
                if (updateControls) {
                    this.UpdateControlPanels();
                }
                if (updateAppModel)
                    this.appModel.Operations = operations;
                this.commands.Execute("TemporalPropertiesOperationsChanged", ops);
            };
            TemporalPropertiesPresenter.prototype.AddOperation = function (operation, position) {
                var that = this;
                var newOp = new BMA.LTLOperations.OperationLayout(that.driver.GetSVGRef(), operation, position);
                newOp.RefreshStates(this.appModel.States);
                this.operations.push(newOp);
                this.OnOperationsChanged(true);
            };
            return TemporalPropertiesPresenter;
        })();
        LTL.TemporalPropertiesPresenter = TemporalPropertiesPresenter;
    })(LTL = BMA.LTL || (BMA.LTL = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=temporalproperties.js.map
var BMA;
(function (BMA) {
    var LTLOperations;
    (function (LTLOperations) {
        var OperatorsRegistry = (function () {
            function OperatorsRegistry() {
                var that = this;
                this.operators = [];
                var formulacreator = function (funcname) {
                    return function (op) {
                        var f = '(' + funcname;
                        for (var i = 0; i < op.length; i++) {
                            f += ' ' + op[i].GetFormula();
                        }
                        return f + ')';
                    };
                };
                this.operators.push(new LTLOperations.Operator('UNTIL', 2, formulacreator('Until')));
                this.operators.push(new LTLOperations.Operator('RELEASE', 2, formulacreator('Release')));
                this.operators.push(new LTLOperations.Operator('AND', 2, formulacreator('And')));
                this.operators.push(new LTLOperations.Operator('OR', 2, formulacreator('Or')));
                this.operators.push(new LTLOperations.Operator('IMPLIES', 2, formulacreator('Implies')));
                this.operators.push(new LTLOperations.Operator('NOT', 1, formulacreator('Not')));
                this.operators.push(new LTLOperations.Operator('NEXT', 1, formulacreator('Next')));
                this.operators.push(new LTLOperations.Operator('ALWAYS', 1, formulacreator('Always')));
                this.operators.push(new LTLOperations.Operator('EVENTUALLY', 1, formulacreator('Eventually')));
            }
            Object.defineProperty(OperatorsRegistry.prototype, "Operators", {
                get: function () {
                    return this.operators;
                },
                enumerable: true,
                configurable: true
            });
            OperatorsRegistry.prototype.GetOperatorByName = function (name) {
                for (var i = 0; i < this.operators.length; i++) {
                    if (this.operators[i].Name === name)
                        return this.operators[i];
                }
                return undefined;
            };
            return OperatorsRegistry;
        })();
        LTLOperations.OperatorsRegistry = OperatorsRegistry;
    })(LTLOperations = BMA.LTLOperations || (BMA.LTLOperations = {}));
})(BMA || (BMA = {}));
//# sourceMappingURL=operatorsregistry.js.map