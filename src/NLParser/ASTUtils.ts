import * as _ from 'underscore'
import { TokenType } from './NLParser'
import * as AST from './AST'
import * as BMA from '../BMA'

/**
 * Return a human readable formula string of an AST generated by the parser.
 * This string is in a specific format that can be read by the BMA tool.
 * 
 * @param node The AST.
 * @param bmaModel The BMA model.
 */
export function toHumanReadableString (node: AST.Node<any,any>, bmaModel: BMA.ModelFile) {
    console.log(JSON.stringify(node, null, 2))
    process.exit()
    let varName = id => _.find(bmaModel.Model.Variables, v => v.Id === id).Name

    let left = node.left ? toHumanReadableString(node.left, bmaModel) : null
    let right = node.right ? toHumanReadableString(node.right, bmaModel) : null

    if (node.type === 'modelVariable') {
        let name = varName(node.value)
        return name.indexOf(' ') >= 0 ? '(' + name + ')' : name
    } else if (AST.TerminalTypes.indexOf(node.type) !== -1) {
        return node.value
    } else if (node.type === 'relationalExpression') {
        return left + node.value.value + right
    } else if (AST.BinaryExpressionTypes.indexOf(node.type) !== -1 && node.right) {
        return '(' + left + ' ' + node.value.value + ' ' + right + ')'
    } else if (AST.UnaryExpressionTypes.indexOf(node.type) !== -1) {
        return node.value.value + '(' + left + ')'
    } else {
        return left
    }
}

/**
 * Return a BMA REST API-compatible formula string of an AST generated by the parser.
 * 
 * @param node The AST.
 * @param bmaModel The BMA model.
 */
export function toAPIString (node, bmaModel: BMA.ModelFile) {
    let varName = id => _.find(bmaModel.Model.Variables, v => v.Id === id).Name
    let upper = (s: string) => s[0].toUpperCase() + s.substr(1)

    let left = node.left ? toAPIString(node.left, bmaModel) : null
    let right = node.right ? toAPIString(node.right, bmaModel) : null

    if (typeof node === 'string' || typeof node === 'number') {
        return node
    } else if ('id' in node) {
        return node.id
    } else if (node.type === 'relationalExpression') {
        return '(' + node.value.value + ' ' + left + ' ' + right + ')'
    } else if (node.type === TokenType.BINARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.BINARY_OPERATOR)) {
        return '(' + upper(node.value.LABEL) + ' ' + left + ' ' + right + ')'
    } else if (node.type === TokenType.UNARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.UNARY_OPERATOR)) {
        return '(' + upper(node.value.LABEL) + ' ' + left + ')'
    } else {
        return left
    }
}

/**
 * Separates an AST into an LTL formula and states.  
 * The result can be used within a BMA model file. New state names are guaranteed to not
 * collide with names of the input model.
 */
export function toStatesAndFormula (node, bmaModel: BMA.ModelFile): BMA.Ltl {
    let varName = id => _.find(bmaModel.Model.Variables, v => v.Id === id).Name

    // A-Z
    let letters: string[] = Array.apply(0, Array(26)).map((x, y) => String.fromCharCode(65 + y))

    let states = bmaModel.ltl.states.slice()
    let unusedStateName = () => _.find(letters, letter => !states.some(state => state.name === letter))

    function toCompactRelationalExpression (node): BMA.LtlCompactStateRelationalExpression {
        return {
            variableName: varName(node.left.id),
            variableId: node.left.id,
            operator: node.value.value,
            value: node.right
        }
    }

    function walk (node, states: BMA.LtlState[]): BMA.LtlFormula  {
        if (node.type === 'relationalExpression') {
            let stateName = unusedStateName()
            let relationalExpression = toCompactRelationalExpression(node)
            states.push(new BMA.LtlStateImpl(stateName, [relationalExpression]))
            return new BMA.LtlNameStateReferenceImpl(stateName)
        } else if (node.type === TokenType.BINARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.BINARY_OPERATOR)) {
            // check for AND-nested relationalExpression tree
            // this becomes a state
            
            // FIXME don't use LABEL for testing
            if (node.value.LABEL == 'and' && node.left.type === 'relationalExpression') {
                let relExprNodes = [node.left]
                let curNode = node.right
                while (curNode.value.LABEL == 'and' && curNode.left.type === 'relationalExpression') {
                    relExprNodes.push(curNode.left)
                    curNode = curNode.right
                }
                let stateName = unusedStateName()

                if (curNode.type === 'relationalExpression') {
                    // no more nodes, we can collapse the tree of relational expressions to a single name state (see if-else below)
                    relExprNodes.push(curNode)
                }
                let relationalExpressions = relExprNodes.map(toCompactRelationalExpression)

                states.push(new BMA.LtlStateImpl(stateName, relationalExpressions))
                let stateNameRef = new BMA.LtlNameStateReferenceImpl(stateName)

                if (curNode.type === 'relationalExpression') {
                    // tree is collapsed to a single state name reference
                    return stateNameRef
                } else {
                    // more nodes that are not relational expressions are coming
                    // we create a state and <rest>
                    return new BMA.LtlOperationImpl(node.value.LABEL, [stateNameRef, walk(curNode, states)])
                }
            } else {
                return new BMA.LtlOperationImpl(node.value.LABEL, [walk(node.left, states), walk(node.right, states)])
            }

        } else if (node.type === TokenType.UNARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.UNARY_OPERATOR)) {
            return new BMA.LtlOperationImpl(node.value.LABEL, [walk(node.left, states)])
        } else {
            return walk(node.left, states)
        }
    }

    let simplifiedAST = simplifyAST(node)
    let formula = walk(simplifiedAST, states)
    
    // The following cast from LtlFormula to LtlOperation is a hack.
    // The BMA JSON format doesn't strictly allow it, but it still works in the tool (apart from some error messages and not being able to save).
    // TODO should a formula that is not an operation be wrapped in an Eventually operator? (is that equivalent?)
    let operations = [formula] as BMA.LtlOperation[]

    return {
        operations,
        states
    }
}

/** Removes all redundant nodes in the tree to make processing easier. */
export function simplifyAST (node) {
    if (typeof node === 'string' || typeof node === 'number') {
    } else if ('id' in node) {
    } else if (node.type === 'relationalExpression') {
    } else if (node.type === TokenType.BINARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.BINARY_OPERATOR)) {
        node.left = simplifyAST(node.left)
        node.right = simplifyAST(node.right)
    } else if (node.type === TokenType.UNARY_OPERATOR || (node.value && node.value.TOKEN_TYPE === TokenType.UNARY_OPERATOR)) {
        node.left = simplifyAST(node.left)
    } else {
        node = simplifyAST(node.left)
    }
    return node
}