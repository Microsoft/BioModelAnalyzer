﻿/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.onedrivestoragewidget", {


        options: {
            items: [],
        },

        _create: function () {
            var that = this;
            this.repo = this.element;
            var items = this.options.items;
            //this.repo = $('<div></div>')
            //    .addClass("localstorage-repo")
            //    //.addClass('localstorage-widget')
            //    .appendTo(this.element);   

            this.refresh();
        },

        refresh: function () {
            this._createHTML();
        },

        AddItem: function (item) {
            this.options.items.push(item);
            this.refresh();
        },

        _createContextMenu: function () {
            var that = this;
            this.repo.contextmenu({
                delegate: "li",
                autoFocus: true,
                preventContextMenuForPopup: true,
                preventSelect: true,
                menu: [
                    { title: "Move to local", cmd: "MoveToLocal" },
                    { title: "Copy to local", cmd: "CopyToLocal" },
                    {
                        title: "Share", cmd: "Share", children: [
                            { title: "BMA link", cmd: "BMALink" },
                            { title: "Web link", cmd: "WebLink" },
                            { title: "Email", cmd: "Email" },
                        ]
                    },
                    { title: "Open BMA link", cmd: "OpenBMALink" },
                    { title: "Active Shares", cmd: "ActiveShares", children:[] },
                ],
                beforeOpen: function (event, ui) {
                    ui.menu.zIndex(50);
                    if ($(ui.target.context.parentElement).hasClass("table-tags"))
                        return false;
                },
                select: function (event, ui) {
                    var args: any = {};
                    args.command = ui.cmd;
                    args.column = $(ui.target.context).index();

                    if (that.options.onContextMenuItemSelected !== undefined)
                        that.options.onContextMenuItemSelected(args);
                }
            });
        },

        _createHTML: function (items) {
            var items = this.options.items;
            this.repo.empty();
            var that = this;
            this.ol = $('<ol></ol>').appendTo(this.repo);

            for (var i = 0; i < items.length; i++) {
                var li = $('<li></li>').text(items[i]).appendTo(this.ol);
                //var a = $('<a></a>').addClass('delete').appendTo(li);
                var removeBtn = $('<button></button>').addClass("delete icon-delete").appendTo(li);// $('<img alt="" src="../images/icon-delete.svg">').appendTo(a);//
                removeBtn.bind("click", function (event) {
                    event.stopPropagation();
                    window.Commands.Execute("LocalStorageRemoveModel", "user." + items[$(this).parent().index()]);
                })
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
            //$.Widget.prototype._setOption.apply(this, arguments);
            //this._super("_setOption", key, value);
            this._super(key, value);
        },

        destroy: function () {
            $.Widget.prototype.destroy.call(this);
            this.element.empty();
        }

    });
} (jQuery));

interface JQuery {
    onedrivestoragewidget(): JQuery;
    onedrivestoragewidget(settings: Object): JQuery;
    onedrivestoragewidget(optionLiteral: string, optionName: string): any;
    onedrivestoragewidget(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}
 