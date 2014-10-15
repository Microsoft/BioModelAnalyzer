﻿module BMA {
    export module Presenters {
        export class LocalStoragePresenter {
            private driver: BMA.UIDrivers.ILocalStorageDriver;

            constructor(appModel: BMA.Model.AppModel, editor: BMA.UIDrivers.ILocalStorageDriver) {
                var that = this;
                this.driver = editor;
                var keys = that.ScanLocalStorage();
                this.driver.SetItems(keys);
                this.driver.Hide();

                window.Commands.On("LocalStorageChanged", function (arg) {
                    if (arg !== undefined && window.localStorage.getItem(arg) === undefined) {
                        that.driver.AddItem(arg, {});
                    }
                    else {
                        var keys = that.ScanLocalStorage();
                        that.driver.SetItems(keys);
                    }
                });

                window.Commands.On("LocalStorageRequested", function () {
                    that.driver.Show();
                });

                window.Commands.On("LocalStorageSave", function () {
                    var key = appModel.BioModel.Name;
                    if (window.localStorage.getItem(key) !== undefined) {
                        //var dialog = $("<div></div>").dialog({
                        //    resizable: false,
                        //    height: 140,
                        //    modal: true,
                        //    buttons: {
                        //        "Save": function () {
                        //            window.localStorage.setItem(key, appModel.Serialize());
                        //            window.Commands.Execute("LocalStorageChanged", {});
                        //            $(this).dialog("close");
                        //            $(this).detach();
                        //        },
                        //        Cancel: function () {
                        //            $(this).dialog("close");
                        //            $(this).detach();
                        //        }
                        //    }
                        //});
                        //$('<span></span>').text("There is file with such name in repository").appendTo(dialog);
                        alert("The file will be overwritten");
                        window.localStorage.setItem(key, appModel.Serialize());
                        window.Commands.Execute("LocalStorageChanged", {});
                    }
                });

                window.Commands.On("LocalStorageOpen", function (key) {
                    appModel.Reset(window.localStorage.getItem(key));
                })
            }

            public ParseItem(item): boolean {
                var ml = JSON.parse(item);

                if (ml === undefined || ml.model === undefined || ml.layout === undefined ||
                    ml.model.variables === undefined ||
                    ml.layout.variables === undefined ||
                    ml.model.variables.length !== ml.layout.variables.length ||
                    ml.layout.containers === undefined ||
                    ml.model.relationships === undefined) {
                    return false;
                }
                else return true;
            }

            public ScanLocalStorage(): any[] {
                var keys = [];
                for (var i = 0; i < window.localStorage.length; i++) {
                    var key = window.localStorage.key(i);
                    var item = window.localStorage.getItem(key);
                    if (this.ParseItem(item)) {
                        keys.push(key);
                    }
                }
                return keys;
            }
        }
    }
}
