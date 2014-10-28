﻿module BMA
{
    export function ParseXmlModel(xml: XMLDocument, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): { Model: Model.BioModel; Layout: Model.Layout }
    {
        var $xml = $(xml);

        var $variables = $xml.children("Model").children("Variables").children("Variable");
        var modelVars = <Model.Variable[]>($variables.map((idx, elt) => {
            var $elt = $(elt);

            var containerId = $elt.children("ContainerId").text();
            containerId = containerId === "" ? "-1" : containerId;

            return new Model.Variable(
                parseInt($elt.attr("Id")),
                parseInt(containerId),
                $elt.children("Type").text(),
                $elt.attr("Name"),
                parseInt($elt.children("RangeFrom").text()),
                parseInt($elt.children("RangeTo").text()),
                $elt.children("Formula").text());
        }).get());

        var $relations = $xml.children("Model").children("Relationships").children("Relationship");
        var modelRels = <Model.Relationship[]>($relations.map((idx, elt) => {
            var $elt = $(elt);
            return new Model.Relationship(
                parseInt($elt.attr("Id")),
                parseInt($elt.children("FromVariableId").text()),
                parseInt($elt.children("ToVariableId").text()),
                $elt.children("Type").text());
        }).get());

        var $containers = $xml.children("Model").children("Containers").children("Container");
        var containers = <Model.ContainerLayout[]>($containers.map((idx, elt) => {
            var $elt = $(elt);

            var size = $elt.children("Size").text();
            size = size === "" ? "1" : size;

            return new Model.ContainerLayout(
                parseInt($elt.attr("Id")),
                parseInt(size),
                parseInt($elt.children("PositionX").text()),
                parseInt($elt.children("PositionY").text()));
        }).get());

        var varLayouts = $variables.map((idx, elt) => {
            var $elt = $(elt);



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
                } else {
                    cellX = "0";
                    cellY = "0";
                }
            }

            var positionX = $elt.children("PositionX").text();
            positionX = positionX === "" ? "0" : positionX;
            var positionY = $elt.children("PositionY").text();
            positionY = positionY === "" ? "0" : positionY;
            var angle = $elt.children("Angle").text();
            angle = angle === "" ? "0" : angle;

            return new Model.VarialbeLayout(
                parseInt($elt.attr("Id")),
                parseInt(cellX) * grid.xStep + grid.xOrigin + parseFloat(positionX) * (grid.xStep - 60) / 300 + 30,
                parseInt(cellY) * grid.yStep + grid.yOrigin + parseFloat(positionY) * (grid.yStep - 50) / 350 + 25,
                Number.NaN,
                Number.NaN,
                parseFloat(angle));
        }).get();

        return {
            Model: new Model.BioModel(
                $xml.children("Model").attr("Name"),
                modelVars,
                modelRels),
            Layout: new Model.Layout(
                containers,
                varLayouts)
        }
    }
} 