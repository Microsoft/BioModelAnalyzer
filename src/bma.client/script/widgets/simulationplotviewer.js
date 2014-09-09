﻿(function ($) {
    $.widget("BMA.simulationplotviewer", {
        options: {
            data: undefined
        },
        refresh: function () {
            var that = this;
            var options = this.options;
            if (that.options.data !== undefined) {
                for (var i = 0; i < that.options.data.length; i++) {
                    that._plot.draw({ x: that.options.ticks, y: that.options.data[i] });
                }
            }
        },
        _create: function () {
            var that = this;
            var options = this.options;
            var plotDiv = $('<div></div>').width(100).height(100).attr("data-idd-plot", "polyline").appendTo(that.element);
            $('<div>Plot should be here</div>').appendTo(that.element);
            that._plot = InteractiveDataDisplay.asPlot(plotDiv);

            that._plot.draw({ x: [0, 1, 2], y: [0, 1, 0] });

            this.refresh();
        },
        _destroy: function () {
            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            if (key === "data")
                this.options.data = value;
            this._super(key, value);
            this.refresh();
        }
    });
}(jQuery));
