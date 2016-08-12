//need to handle unary operators
//temporal and logic

import { Token } from 'chevrotain'
import * as _ from 'underscore'
import { TokenType } from './NLParser'
/**
 * Util functions that handle printing of the AST generated by the parser
 */
export function toHumanReadableString(AST) {
    var reversePolishTokens = [];
    performPostOrderTraversal(AST, reversePolishTokens);
    return convertReversePolishFormulaToInfix(reversePolishTokens.reverse())
}

function performPostOrderTraversal(node, outputTokens) {
    if (node.left) {
        performPostOrderTraversal(node.left, outputTokens);
    }
    if (node.right) {
        performPostOrderTraversal(node.right, outputTokens);
    }
    if (node.value) {
        if (node.type == "relationalExpression") {
            outputTokens.unshift(node.left + node.value.value + node.right);
        }
        else if (node.value.type === "binaryOperator") {
            outputTokens.unshift(node.value.value);
        }
        else {
            outputTokens.unshift(node.value);
        }
    }
}
function convertReversePolishFormulaToInfix(reversePolishTokens) {
    var stack = [];
    _.each(reversePolishTokens, function (t: any) {
        if (t.TOKEN_TYPE === TokenType.LOGICAL_BINARY) {
            if (stack.length < 2) {
                throw Error("Parse Exception");
            }
            else {
                var varX = stack.pop()
                var varY = stack.pop()
                stack.unshift("(" + varY + " " + t.LABEL + " " + varX + ")");
            }
        }
        else {
            stack.push(t);
        }
    });

    while (stack.length > 1) {
        stack.unshift(stack.pop().LABEL + "(" + stack.pop() + ")")
    }
    return stack[0]
}