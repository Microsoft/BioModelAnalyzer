﻿(function ($) {
    $.widget("BMA.bmazoomslider", {
        options: {
            value: 0
        },
        _create: function () {
            var that = this;
            this.element.addClass("zoomslider-container");

            var zoomplus = $('<img id="zoom-plus" class="hoverable" src="images/zoomplus.png">').appendTo(that.element);
            this.zoomslider = $('<div class="bma-elementspanel-visibilityoptions-zoomslider"></div>').addClass("bma-elementspanel-visibilityoptions-zoomslider").appendTo(that.element);

            this.zoomslider.slider({ value: that.options.value, change: function (event, ui) {
                    that.options.value = ui.value;
                } });
            var zoomminus = $('<img id="zoom-minus" class="hoverable" src="images/zoomminus.png">').appendTo(that.element);

            zoomplus.bind("click", function () {
                that.zoomslider.slider("option", "value", that.zoomslider.slider("option", "value") - that.zoomslider.slider("option", "step"));
            });

            zoomminus.bind("click", function () {
                that.zoomslider.slider("option", "value", that.zoomslider.slider("option", "value") + that.zoomslider.slider("option", "step"));
            });
        },
        _destroy: function () {
            var contents;

            this.element.removeClass("zoomslider-container");

            this.element.children().filter(".bma-elementspanel-visibilityoptions-zoomslider").removeClass("bma-elementspanel-visibilityoptions-zoomslider").removeUniqueId();

            this.element.empty();
        },
        _setOption: function (key, value) {
            var that = this;
            this.zoomslider.slider("option", "value", that.options.value);
            this._super(key, value);
        }
    });
}(jQuery));
