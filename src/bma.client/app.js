﻿/// <reference path="Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="script\model.ts"/>
/// <reference path="script\commands.ts"/>
/// <reference path="script\elementsregistry.ts"/>
/// <reference path="script\uidrivers.interfaces.ts"/>
/// <reference path="script\uidrivers.ts"/>
/// <reference path="script\presenters.ts"/>
/// <reference path="script\drawingsurface.ts"/>
/// <reference path="script\drawingsurface.ts"/>

window.onload = function () {
    //Creating CommandRegistry
    window.Commands = new BMA.CommandRegistry();

    //Creating ElementsRegistry
    var elemntsRegistry = BMA.Elements.CreateElementsRegistry();

    $("#drawingSurface").drawingsurface();
};
//# sourceMappingURL=app.js.map
