﻿var BMA;
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
    })(BMA.UIDrivers || (BMA.UIDrivers = {}));
    var UIDrivers = BMA.UIDrivers;
})(BMA || (BMA = {}));
