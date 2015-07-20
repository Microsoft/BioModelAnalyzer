﻿module BMA {
    export module LTLOperations {
        export class OperationLayout {
            private operation: Operation;
            private layout: any;
            private padding: { x: number; y: number };
            private keyFrameSize = 25;

            private emptyLocations = [];

            constructor(operation: Operation) {
                this.operation = operation;
                this.padding = { x: 5, y: 10 };

                this.emptyLocations = this.FindEmptyLocations(this.operation, 0, 0);
            }

            public get Operation(): Operation {
                return this.operation;
            }

            public get Padding(): { x: number; y: number } {
                return this.padding;
            }

            public set Padding(value: { x: number; y: number }) {
                this.padding = value;
                this.emptyLocations = this.FindEmptyLocations(this.operation, 0, 0);
            }

            private FindEmptyLocations(operation: BMA.LTLOperations.Operation, x: number, y: number): { x: number; y: number }[] {
                //var layout = this.CreateLayout(operation);

                return null;
            }

            private CreateLayout(svg, operation): any {
                var that = this;
                var layout: any = {};

                var paddingX = this.padding.x;

                var op = operation;
                var operator = (<any>op).Operator;
                if (operator !== undefined) {
                    layout.operands = [];
                    layout.operator = operator.Name;
                    var operands = (<BMA.LTLOperations.Operation>op).Operands;
                    var layer = 0;
                    var width = (this.GetOperatorWidth(svg, operator.Name)).width;

                    if (operands.length === 1) {
                        width += paddingX;
                    }

                    for (var i = 0; i < operands.length; i++) {
                        var operand = operands[i];

                        if (operand !== undefined) {
                            var calcLW = that.CreateLayout(svg, operand);
                            layer = Math.max(layer, calcLW.layer);
                            layout.operands.push(calcLW);
                            width += (calcLW.width + paddingX * 2);
                        } else {
                            layout.operands.push({ isEmpty: true, width: this.keyFrameSize });
                            width += (this.keyFrameSize + 2 * paddingX);
                        }
                    }

                    layout.layer = layer + 1;
                    layout.width = width;
                    return layout;
                } else {
                    var w = this.keyFrameSize;
                    layout.layer = 1;
                    layout.width = w;
                    return layout;
                }
            }

            private GetOperatorWidth(svg: any, operator: string): { width: number; height: number } {
                var t = svg.text(0,0, operator, {
                    "font-size": 10,
                    "fill": "black"
                });

                var bbox = t.getBBox();
                
                var result = { width: bbox.width, height: bbox.height };

                svg.remove(t);

                return result;
            }

            private RenderLayoutPart(svg: any, position: { x: number; y: number }, layoutPart: any, operandPosition: string) {
                var paddingX = this.padding.x;
                var paddingY = this.padding.y;

                if (layoutPart.isEmpty) {
                    svg.circle(position.x, position.y, this.keyFrameSize / 2, { stroke: "black", fill: "red" });
                } else {
                    var operator = layoutPart.operator;
                    if (operator !== undefined) {
                        var operation = layoutPart;

                        var halfWidth = layoutPart.width / 2;
                        var height = 25 + paddingY * layoutPart.layer;

                        var opSVG = svg.rect(position.x - halfWidth, position.y - height / 2, halfWidth * 2, height, height / 2, height / 2, { stroke: "black", fill: "transparent" });

                        var operands = operation.operands;

                        var operatorPadding = 1;
                        //var operatorW = this.GetOperatorWidth(svg, operation.operator);
                        switch (operands.length) {
                            case 1:

                                svg.text(position.x - halfWidth + paddingX, position.y + 3, operation.operator, {
                                    "font-size": 10,
                                    "fill": "black"
                                });

                                this.RenderLayoutPart(svg, {
                                    x: position.x + halfWidth - (<any>operands[0]).width / 2 - paddingX,
                                    y: position.y
                                },
                                    operands[0], "right");

                                break;
                            case 2:

                                this.RenderLayoutPart(svg, {
                                    x: position.x - halfWidth + (<any>operands[0]).width / 2 + paddingX,
                                    y: position.y
                                },
                                    operands[0], "left");


                                this.RenderLayoutPart(svg, {
                                    x: position.x + halfWidth - (<any>operands[1]).width / 2 - paddingX,
                                    y: position.y
                                },
                                    operands[1], "right");

                                svg.text(position.x - halfWidth + (<any>operands[0]).width + 2 * paddingX, position.y + 3, operation.operator, {
                                    "font-size": 10,
                                    "fill": "black"
                                });

                                break;
                            default:
                                throw "Rendering of operators with " + operands.length + " operands is not supported";


                        }
                    } else {
                        svg.circle(position.x, position.y, this.keyFrameSize / 2, { stroke: "black", fill: "rgb(238,238,238)" });
                    }
                }
            }

            public Render(svg: any, position: { x: number; y: number }) {
                this.layout = this.CreateLayout(svg, this.operation);
                this.RenderLayoutPart(svg, position, this.layout, undefined);
            }
        }
    }
}