﻿(function ($) {
    var accordion = $.widget("BMA.bmaaccordion", {
        version: "1.11.0",
        options: {
            active: 0,
            animate: {},
            collapsible: true,
            event: "click",
            position: "center",
            activate: null,
            beforeActivate: null
        },
        hideProps: {},
        showProps: {},
        _create: function () {
            this.element.addClass("accordion-container");
            var options = this.options;

            this.prevShow = this.prevHide = $();
            this.element.addClass("ui-accordion ui-widget ui-helper-reset").attr("role", "tablist");

            if (!options.collapsible && (options.active === false || options.active == null)) {
                options.active = 0;
            }

            this._processPanels();

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

            this.element.removeClass("ui-accordion ui-widget ui-helper-reset").removeAttr("role");

            this.headers.removeClass("ui-accordion-header ui-accordion-header-active ui-state-default " + "ui-corner-all ui-state-active ui-state-disabled ui-corner-top").removeAttr("role").removeAttr("aria-expanded").removeAttr("aria-selected").removeAttr("aria-controls").removeAttr("tabIndex").removeUniqueId();

            contents = this.headers.next().removeClass("ui-helper-reset ui-widget-content ui-corner-bottom " + "ui-accordion-content ui-accordion-content-active ui-state-disabled").css("display", "").removeAttr("role").removeAttr("aria-hidden").removeAttr("aria-labelledby").removeUniqueId();
        },
        _processAnimation: function (context) {
            var that = this;
            var position = that.options.position;
            var distantion = 0;

            switch (position) {
                case "left":
                case "right":
                    distantion = context.width();
                    break;
                case "top":
                case "bottom":
                    distantion = context.height();
                    break;
                case "center":
                    return;
            }
            this.hideProps = {};
            this.showProps = {};
            this.hideProps[that.options.position] = "-=" + distantion;
            this.showProps[that.options.position] = "+=" + distantion;
        },
        _setOption: function (key, value) {
            if (key === "active") {
                this._activate(value);
                return;
            }

            if (key === "event") {
                if (this.options.event) {
                    this._off(this.headers, this.options.event);
                }
                this._setupEvents(value);
            }

            this._super(key, value);

            if (key === "collapsible" && !value && this.options.active === false) {
                this._activate(0);
            }

            if (key === "disabled") {
                this.element.toggleClass("ui-state-disabled", !!value).attr("aria-disabled", value);
                this.headers.add(this.options.context).toggleClass("ui-state-disabled", !!value);
            }
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
                case keyCode.SPACE:
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
                toFocus.focus();
                event.preventDefault();
            }
        },
        _panelKeyDown: function (event) {
            if (event.keyCode === $.ui.keyCode.UP && event.ctrlKey) {
                $(event.currentTarget).prev().focus();
            }
        },
        refresh: function () {
            var options = this.options;
            this._processPanels();

            if ((options.active === false && options.collapsible === true) || !this.headers.length) {
                options.active = false;
                this.active = $();
            } else if (options.active === false) {
                this._activate(0);
            } else if (this.active.length && !$.contains(this.element[0], this.active[0])) {
                if (this.headers.length === this.headers.find(".ui-state-disabled").length) {
                    options.active = false;
                    this.active = $();
                } else {
                    this._activate(Math.max(0, options.active - 1));
                }
            } else {
                options.active = this.headers.index(this.active);
            }

            this._refresh();
        },
        _processPanels: function () {
            var that = this;
            var position = that.options.position;
            this.element.css(position, 0);
            this.headers = that.element.children().filter(':even');
            this.headers.addClass("ui-accordion-header ui-state-default ui-corner-all");

            this.headers.each(function () {
                var child = $(this).next();

                var distantion = 0;
                switch (position) {
                    case "left":
                    case "right":
                        distantion = child.width();
                        break;
                    case "top":
                    case "bottom":
                        distantion = child.height();
                        break;
                    case "center":
                        that.headers.removeClass("show").addClass("only");
                        return;
                }
                that.headers.css("position", "absolute");
                that.headers.css(position, 0);
                child.css("position", "absolute");
                child.css(position, -distantion);
            });
        },
        _refresh: function () {
            var maxHeight, options = this.options, parent = this.element.parent();
            this.active = $();
            this.active.next().addClass("ui-accordion-content-active");

            var that = this;
            this.headers.attr("role", "tab").each(function () {
                var header = $(this), headerId = header.uniqueId().attr("id"), panel = header.next(), panelId = panel.uniqueId().attr("id");
                header.attr("aria-controls", panelId);
                panel.attr("aria-labelledby", headerId);
            }).next().attr("role", "tabpanel");

            this.headers.not(this.active).attr({
                "aria-selected": "false",
                "aria-expanded": "false",
                tabIndex: -1
            }).next().attr({
                "aria-hidden": "true"
            }).hide();

            if (!this.active.length) {
                this.headers.eq(0).attr("tabIndex", 0);
            } else {
                this.active.attr({
                    "aria-selected": "true",
                    "aria-expanded": "true",
                    tabIndex: 0
                }).next().attr({
                    "aria-hidden": "false"
                });
            }

            this._setupEvents(options.event);
        },
        _findActive: function (selector) {
            return typeof selector === "number" ? this.options.header : $();
        },
        _setupEvents: function (event) {
            var events = {
                keydown: "_keydown"
            };
            if (event) {
                $.each(event.split(" "), function (index, eventName) {
                    events[eventName] = "_eventHandler";
                });
            }

            this._off(this.headers.add(this.options.context));
            this._on(this.headers, events);
            this._on(this.options.context, { keydown: "_panelKeyDown" });
            this._hoverable(this.headers);
            this._focusable(this.headers);
        },
        _eventHandler: function (event) {
            var options = this.options, active = this.active, clicked = $(event.currentTarget), clickedIsActive = clicked[0] === active[0], collapsing = clickedIsActive && options.collapsible, toShow = collapsing ? $() : clicked.next(), toHide = active.next(), eventData = {
                oldHeader: active,
                oldPanel: toHide,
                newHeader: collapsing ? $() : clicked,
                newPanel: toShow
            };
            event.preventDefault();

            if ((clickedIsActive && !options.collapsible) || (this._trigger("beforeActivate", event, eventData) === false)) {
                return;
            }

            this.active = clickedIsActive ? $() : clicked;
            this._toggle(eventData);

            active.removeClass("ui-accordion-header-active ui-state-active");

            if (!clickedIsActive) {
                clicked.removeClass("ui-corner-all").addClass("ui-accordion-header-active ui-state-active ui-corner-top");

                active.next().addClass("ui-accordion-content-active");
            }
        },
        _toggle: function (data) {
            var toShow = data.newPanel, toHide = this.prevShow.length ? this.prevShow : data.oldPanel;

            this.prevShow.add(this.prevHide).stop(true, true);
            this.prevShow = toShow;
            this.prevHide = toHide;
            if (this.options.animate && this.options.position != "center") {
                this._animate(toShow, toHide, data);
            } else {
                toHide.hide();
                toShow.show();
                if (this.options.context.is(":hidden"))
                    this.options.header.removeClass("show").addClass("only");
                else
                    this.options.header.removeClass("only").addClass("show");
                this._toggleComplete(data);
            }

            toHide.attr({
                "aria-hidden": "true"
            });
            toHide.prev().attr("aria-selected", "false");

            if (toShow.length && toHide.length) {
                toHide.prev().attr({
                    "tabIndex": -1,
                    "aria-expanded": "false"
                });
            } else if (toShow.length) {
                this.headers.filter(function () {
                    return $(this).attr("tabIndex") === 0;
                }).attr("tabIndex", -1);
            }

            toShow.attr("aria-hidden", "false").prev().attr({
                "aria-selected": "true",
                tabIndex: 0,
                "aria-expanded": "true"
            });
        },
        _animate: function (toShow, toHide, data) {
            var total, easing, duration, that = this, adjust = 0, down = toShow.length && (!toHide.length || (toShow.index() < toHide.index())), animate = this.options.animate || {}, options = down && animate.down || animate, complete = function () {
                that._toggleComplete(data);
            };

            if (typeof options === "number") {
                duration = options;
            }
            if (typeof options === "string") {
                easing = options;
            }

            easing = easing || options.easing || animate.easing;
            duration = duration || options.duration || animate.duration;
            var that = this;

            if (!toShow.length) {
                that._processAnimation(toHide);
                that.element.animate(that.hideProps, duration, easing, function () {
                    that._toggleComplete(data, "", "");
                    toHide.hide();
                });
                return;
            }

            if (!toHide.length) {
                toShow.show();
                that._processAnimation(toShow);
                that.element.animate(that.showProps, duration, easing, that._toggleComplete(data, "", ""));
                return;
            }
            toHide.hide();
            toShow.show();
        },
        _toggleComplete: function (data, classadd, classremove) {
            var toHide = data.oldPanel;

            toHide.removeClass("ui-accordion-content-active").prev().removeClass("ui-corner-top").addClass("ui-corner-all");

            if (toHide.length) {
                toHide.parent()[0].className = toHide.parent()[0].className;
            }
            this._trigger("activate", null, data);
        }
    });
}(jQuery));
