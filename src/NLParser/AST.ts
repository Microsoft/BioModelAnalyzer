export const Type = {
    ConditionalsExpression: <'conditionalsExpression'>'conditionalsExpression',
    DisjunctionExpression: <'disjunctionExpression'>'disjunctionExpression',
    ConjunctionExpression: <'conjunctionExpression'>'conjunctionExpression',
    TemporalExpression: <'temporalExpression'>'temporalExpression',
    UnaryExpression: <'unaryExpression'>'unaryExpression',
    RelationalExpression: <'relationalExpression'>'relationalExpression',
    ImpliesOperator: <'impliesOperator'>'impliesOperator',
    DisjunctionOperator: <'disjunctionOperator'>'disjunctionOperator',
    ConjunctionOperator: <'conjunctionOperator'>'conjunctionOperator',
    UnaryOperator: <'unaryOperator'>'unaryOperator',
    BinaryTemporalOperator: <'binaryTemporalOperator'>'binaryTemporalOperator',
    RelationalOperator: <'relationalOperator'>'relationalOperator',
    FormulaPointer: <'formulaPointer'>'formulaPointer',
    ModelVariable: <'modelVariable'>'modelVariable',
    IntegerLiteral: <'integerLiteral'>'integerLiteral'
}

export const NonTerminalTypes = [
    Type.ConditionalsExpression,
    Type.DisjunctionExpression,
    Type.ConjunctionExpression,
    Type.TemporalExpression,
    Type.UnaryExpression,
    Type.RelationalExpression
]

export const TerminalTypes = [
    Type.ImpliesOperator,
    Type.DisjunctionOperator,
    Type.ConjunctionOperator,
    Type.UnaryOperator,
    Type.BinaryTemporalOperator,
    Type.RelationalOperator,
    Type.FormulaPointer,
    Type.ModelVariable,
    Type.IntegerLiteral
]

export const BinaryExpressionTypes = [
    Type.ConditionalsExpression,
    Type.DisjunctionExpression,
    Type.ConjunctionExpression,
    Type.TemporalExpression,
    Type.RelationalExpression
]

export const UnaryExpressionTypes = [
    Type.UnaryExpression
]

export type TypeName =
    typeof Type.ConditionalsExpression |
    typeof Type.ImpliesOperator |
    typeof Type.DisjunctionOperator |
    typeof Type.DisjunctionExpression |
    typeof Type.ConjunctionOperator |
    typeof Type.ConjunctionExpression |
    typeof Type.TemporalExpression |
    typeof Type.UnaryExpression |
    typeof Type.UnaryOperator |
    typeof Type.BinaryTemporalOperator |
    typeof Type.RelationalExpression |
    typeof Type.RelationalOperator |
    typeof Type.ModelVariable |
    typeof Type.IntegerLiteral |
    typeof Type.FormulaPointer

export interface Node<L extends Node<any, any>, R extends Node<any, any>> {
    type: TypeName
    value?: Node<any, any> | string | string[] | number
    left?: L
    right?: R
}

export interface InternalFormula {
    AST?: Formula
    resyncedToken?: any
    errorToken?: any
}

export type Formula = UnaryExpression |
    ConditionalsExpression | ConditionalsExpressionChild |
    DisjunctionExpression | DisjunctionExpressionChild

export type BinaryExpression =
    ConditionalsExpression | DisjunctionExpression | ConjunctionExpression |
    TemporalExpression | RelationalExpression

export type ImpliesOperatorSymbol = 'implies'

export interface ImpliesOperator extends Node<any, any> {
    type: typeof Type.ImpliesOperator
    value: ImpliesOperatorSymbol
}

export type ConditionalsExpressionChild = DisjunctionExpression | DisjunctionExpressionChild

export interface ConditionalsExpression extends Node<ConditionalsExpressionChild, ConditionalsExpressionChild> {
    type: typeof Type.ConditionalsExpression
    value: ImpliesOperator
    left: ConditionalsExpressionChild
    right: ConditionalsExpressionChild
}

export type DisjunctionOperatorSymbol = 'or'

export interface DisjunctionOperator extends Node<any, any> {
    type: typeof Type.DisjunctionOperator
    value: DisjunctionOperatorSymbol
}

export type DisjunctionExpressionChild = ConjunctionExpression | ConjunctionExpressionChild

export interface DisjunctionExpression extends Node<DisjunctionExpressionChild, DisjunctionExpressionChild> {
    type: typeof Type.DisjunctionExpression
    value: DisjunctionOperator,
    left: DisjunctionExpressionChild
    right: DisjunctionExpressionChild
}

export type ConjunctionOperatorSymbol = 'and'

export interface ConjunctionOperator extends Node<any, any> {
    type: typeof Type.ConjunctionOperator,
    value: ConjunctionOperatorSymbol
}

export type ConjunctionExpressionChild = TemporalExpression | AtomicExpression

export interface ConjunctionExpression extends Node<ConjunctionExpressionChild, ConjunctionExpressionChild> {
    type: typeof Type.ConjunctionExpression
    value: ConjunctionOperator
    left: ConjunctionExpressionChild
    right: ConjunctionExpressionChild
}

export interface TemporalExpression extends Node<AtomicExpression, AtomicExpression> {
    type: typeof Type.TemporalExpression
    value: BinaryTemporalOperator
    left: AtomicExpression
    right: AtomicExpression
}

export type AtomicExpression = RelationalExpression | UnaryExpression | FormulaPointer

export type UnaryOperatorSymbol =
    'not' | 'next' | 'always' | 'eventually'

export interface UnaryOperator extends Node<any, any> {
    type: typeof Type.UnaryOperator
    value: UnaryOperatorSymbol
}

export interface UnaryExpression extends Node<Node<any, any>, any> {
    type: typeof Type.UnaryExpression
    value: UnaryOperator
    left: Node<any, any>
}

export interface RelationalExpression extends Node<ModelVariable, IntegerLiteral> {
    type: typeof Type.RelationalExpression
    value: RelationalOperator
    left: ModelVariable
    right: IntegerLiteral
}

export type BinaryTemporalOperatorSymbol =
    'until' | 'weak until' | 'release' | 'upto'

export interface BinaryTemporalOperator extends Node<any, any> {
    type: typeof Type.BinaryTemporalOperator
    value: BinaryTemporalOperatorSymbol
}

export type RelationalOperatorSymbol =
    '=' | '>' | '<' | '<=' | '>=' | '!='

export interface RelationalOperator extends Node<any, any> {
    type: typeof Type.RelationalOperator
    value: RelationalOperatorSymbol
}

export interface ModelVariable extends Node<any, any> {
    type: typeof Type.ModelVariable
    value: number
}

export interface IntegerLiteral extends Node<any, any> {
    type: typeof Type.IntegerLiteral
    value: number
}

export interface FormulaPointer extends Node<any, any> {
    type: typeof Type.FormulaPointer
    value: number
}