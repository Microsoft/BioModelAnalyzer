﻿/// <reference path="Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="script\model\biomodel.ts"/>
/// <reference path="script\model\model.ts"/>
/// <reference path="script\model\visualsettings.ts"/>
/// <reference path="script\commands.ts"/>
/// <reference path="script\elementsregistry.ts"/>
/// <reference path="script\functionsregistry.ts"/>
/// <reference path="script\uidrivers.interfaces.ts"/>
/// <reference path="script\uidrivers.ts"/>
/// <reference path="script\presenters\presenters.ts"/>
/// <reference path="script\presenters\furthertestingpresenter.ts"/>
/// <reference path="script\presenters\simulationpresenter.ts"/>
/// <reference path="script\presenters\formulavalidationpresenter.ts"/>
/// <reference path="script\SVGHelper.ts"/>

/// <reference path="script\widgets\drawingsurface.ts"/>
/// <reference path="script\widgets\simulationplot.ts"/>
/// <reference path="script\widgets\simulationviewer.ts"/>
/// <reference path="script\widgets\simulationexpanded.ts"/>
/// <reference path="script\widgets\accordeon.ts"/>
/// <reference path="script\widgets\visibilitysettings.ts"/>
/// <reference path="script\widgets\elementbutton.ts"/>
/// <reference path="script\widgets\bmaslider.ts"/>
/// <reference path="script\widgets\variablesOptionsEditor.ts"/>
/// <reference path="script\widgets\progressiontable.ts"/>
/// <reference path="script\widgets\proofresultviewer.ts"/>
/// <reference path="script\widgets\furthertestingviewer.ts"/>
/// <reference path="script\widgets\resultswindowviewer.ts"/>
/// <reference path="script\widgets\coloredtableviewer.ts"/>
/// <reference path="script\widgets\containernameeditor.ts"/>

declare var saveTextAs: any;

interface JQuery {
    contextmenu(): JQueryUI.Widget;
    contextmenu(settings: Object): JQueryUI.Widget;
    contextmenu(optionLiteral: string, optionName: string): any;
    contextmenu(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}

$(document).ready(function () {
    //Creating CommandRegistry
    window.Commands = new BMA.CommandRegistry();

    //Creating ElementsRegistry
    window.ElementRegistry = new BMA.Elements.ElementsRegistry();

    //Creating FunctionsRegistry
    window.FunctionsRegistry = new BMA.Functions.FunctionsRegistry();

    //Creating model and layout
    var appModel = new BMA.Model.AppModel();

    //Loading widgets
    var drawingSurface = $("#drawingSurface");
    drawingSurface.drawingsurface();
    $("#zoomslider").bmazoomslider({value: 50});
    //$("#modelToolbarHeader").toolbarpanel();
    //$("#modelToolbarContent").toolbarpanel();
    $("#modelToolbarHeader").buttonset();
    $("#modelToolbarContent").buttonset();
    $("#modelToolbarSlider").bmaaccordion({ position: "left" });
    $("#visibilityOptionsContent").visibilitysettings();
    $("#visibilityOptionsSlider").bmaaccordion();

    $("#modelNameEditor").click(function (e) {
        e.stopPropagation();
    });

    $("#drawingSurceContainer").contextmenu({
        delegate: ".bma-drawingsurface",
        preventContextMenuForPopup: true,
        preventSelect: true,
        taphold: true,
        menu: [
            { title: "Cut", cmd: "Cut", uiIcon: "ui-icon-scissors" },
            { title: "Copy", cmd: "Copy", uiIcon: "ui-icon-copy" },
            { title: "Paste", cmd: "Paste", uiIcon: "ui-icon-clipboard", disabled: true },
            { title: "Delete", cmd: "Delete", uiIcon: "ui-icon-trash", disabled: true },
        ],
        beforeOpen: function (event, ui) {
            var left = event.pageX - $(".bma-drawingsurface").offset().left;
            var top = event.pageY - $(".bma-drawingsurface").offset().top;

            console.log("top " + top);
            console.log("left " + left);

            window.Commands.Execute("DrawingSurfaceContextMenuOpening", {
                left: left,
                top: top
            });
        },
        select: function (event, ui) {
            var commandName = "DrawingSurface" + ui.cmd;
            
            var left = event.pageX - $(".bma-drawingsurface").offset().left;
            var top = event.pageY - $(".bma-drawingsurface").offset().top;

            console.log("top " + top);
            console.log("left " + left);

            window.Commands.Execute(commandName, {
                left: left,
                top: top
            });
        }
    });

    $("#analytics").bmaaccordion({ position: "right" });
    $("#analytics").bmaaccordion({ contentLoaded: { ind: "#icon1", val: false } });
    $("#analytics").bmaaccordion({ contentLoaded: { ind: "#icon2", val: true } });
    
    //Preparing elements panel
    var elementPanel = $("#modelelemtoolbar");
    var elements = window.ElementRegistry.Elements;
    for (var i = 0; i < elements.length; i++) {
        var elem = elements[i];
        $("<input></input>")
            .attr("type", "radio")
            .attr("id", "btn-" + elem.Type)
            .attr("name", "drawing-button")
            .attr("data-type", elem.Type)
            .appendTo(elementPanel);

        var label = $("<label></label>").attr("for", "btn-" + elem.Type).appendTo(elementPanel);
        var img = $("<img></img>").attr("src", elem.IconURL).attr("title", elem.Description).appendTo(label);
    }

    elementPanel.children("input").not('[data-type="Activator"]').not('[data-type="Inhibitor"]').next().draggable({

        helper: function (event, ui) {
            return $(this).children().clone().appendTo('body');
        },

        scroll: false,

        start: function (event, ui) {
            $(this).draggable("option", "cursorAt", {
                left: Math.floor(ui.helper.width() / 2),
                top: Math.floor(ui.helper.height() / 2)
            });
            $('#' + $(this).attr("for")).click();
    }
    });

    $("#modelelemtoolbar input").click(function (event) {
        window.Commands.Execute("AddElementSelect", $(this).attr("data-type"));
    });
        
    elementPanel.buttonset();

    //undo/redo panel
    $("#button-pointer").click(function () {
        window.Commands.Execute("AddElementSelect", undefined);
    });

    $("#undoredotoolbar").buttonset();
    $("#button-undo").click(() => { window.Commands.Execute("Undo", undefined); });
    $("#button-redo").click(() => { window.Commands.Execute("Redo", undefined); });

    $("#editor").bmaeditor();
    $("#Proof-Analysis").proofresultviewer();
    $("#Further-Testing").furthertesting();
    $("#tabs-2").simulationviewer();
    var popup = $('<div class="popup-window"></div>').appendTo('body').hide().resultswindowviewer({icon: "min"});

    $("#newModelBtn").click(function (args) {
        window.Commands.Execute("NewModel", undefined);
    });

    $("#importModelBtn").click(function (args) {
        window.Commands.Execute("ImportModel", undefined);
    });

    $("#exportModelBtn").click(function (args) {
        window.Commands.Execute("ExportModel", undefined);
    });
    var expandedSimulation = $('<div></div>').simulationexpanded();


    //Visual Settings Presenter
    var visualSettings = new BMA.Model.AppVisualSettings(); 

    window.Commands.On("Commands.ToggleLabels", function (param) {
        visualSettings.TextLabelVisibility = param;
        window.ElementRegistry.LabelVisibility = param;
        window.Commands.Execute("DrawingSurfaceRefreshOutput", {});
    });

    window.Commands.On("Commands.LabelsSize", function (param) {
        visualSettings.TextLabelSize = param;
        window.ElementRegistry.LabelSize = param;
        window.Commands.Execute("DrawingSurfaceRefreshOutput", {});
    });

    //window.Commands.On("Commands.ToggleIcons", function (param) {
    //    visualSettings.IconsVisibility = param;
    //});

    //window.Commands.On("Commands.IconsSize", function (param) {
    //    visualSettings.IconsSize = param;
    //});


    window.Commands.On("Commands.LineWidth", function (param) {
        visualSettings.LineWidth = param;
        window.ElementRegistry.LineWidth = param;
        window.Commands.Execute("DrawingSurfaceRefreshOutput", {});
    });

    //Loading Drivers
    var svgPlotDriver = new BMA.UIDrivers.SVGPlotDriver(drawingSurface);
    var undoDriver = new BMA.UIDrivers.TurnableButtonDriver($("#button-undo"));
    var redoDriver = new BMA.UIDrivers.TurnableButtonDriver($("#button-redo"));
    var variableEditorDriver = new BMA.UIDrivers.VariableEditorDriver($("#editor"));
    var proofViewer = new BMA.UIDrivers.ProofViewer($("#analytics"), $("#Proof-Analysis"));
    var furtherTestingDriver = new BMA.UIDrivers.FurtherTestingDriver($("#Further-Testing"), undefined);
    var simulationViewer = new BMA.UIDrivers.SimulationViewerDriver($("#tabs-2"));
    var fullSimulationViewer = new BMA.UIDrivers.SimulationExpandedDriver(expandedSimulation);
    var popupDriver = new BMA.UIDrivers.PopupDriver(popup);
    var fileLoaderDriver = new BMA.UIDrivers.ModelFileLoader($("#fileLoader"));
    var contextMenuDriver = new BMA.UIDrivers.ContextMenuDriver($("#drawingSurceContainer"));
    var accordionHider = new BMA.UIDrivers.AccordionHider($("#analytics"));

    window.Commands.On("Commands.ToggleGrid", function (param) {
        visualSettings.GridVisibility = param;
        svgPlotDriver.SetGridVisibility(param);
    });

    window.Commands.On("ZoomSliderChanged", (args) => {
        svgPlotDriver.SetZoom(args.value);
    });
    window.Commands.On("ZoomSliderBind", (args) => {
        var value = Math.round((args.scaleFactor - 1) * 5) *10 + $("#zoomslider").bmazoomslider('option', 'value');
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        $("#zoomslider").bmazoomslider({ value: value });
        //svgPlotDriver.SetZoom(value);
        console.log(value);
    });

    

    window.Commands.On("AppModelChanged", () => {
        popupDriver.Hide();
    });

    //Loading presenters
    var drawingSurfacePresenter = new BMA.Presenters.DesignSurfacePresenter(appModel, svgPlotDriver, svgPlotDriver, svgPlotDriver, undoDriver, redoDriver, variableEditorDriver, contextMenuDriver);
    var proofPresenter = new BMA.Presenters.ProofPresenter(appModel, proofViewer, popupDriver);
    var furtherTestingPresenter = new BMA.Presenters.FurtherTestingPresenter(furtherTestingDriver, popupDriver);
    var simulationPresenter = new BMA.Presenters.SimulationPresenter(appModel, fullSimulationViewer, simulationViewer, popupDriver);
    var storagePresenter = new BMA.Presenters.ModelStoragePresenter(appModel, fileLoaderDriver);
    var formulaValidationPresenter = new BMA.Presenters.FormulaValidationPresenter(variableEditorDriver);
});