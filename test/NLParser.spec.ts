import { expect } from 'chai'
import { default as NLParser, ParserResponseType } from '../src/NLParser/NLParser'
import * as ASTUtils from '../src/NLParser/ASTUtils'
import { ModelFile, Ltl } from '../src/BMA'

let testModel: ModelFile = require('./data/testmodel.json')
let ltlMultipleStates: Ltl = require('./data/ltl-multiple-states.json')
let ltlMultipleVariables: Ltl = require('./data/ltl-multiple-variables.json')

it('parse() should handle single variables', () => {
    var sentence = "can you give me a simulation where x is 1"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "x=1"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() handles LTL operator precedence and assosiativeity correctly', () => {
    var sentence = "give me some simulation where it is always the case that if x is 1 then y is 5 and followed by z is 25"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "always((x=1 implies (y=5 and next(z=25))))"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() should handle variables with names that are substrings of operators eg: notch, eventualkanize', () => {
    var sentence = "show me a simulation where notch is 1 and eventualkanize is 20"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "(notch=1 and eventualkanize=20)"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() should handle tokens that are substrings of operators but are not variables as they need to be handled by the lexer and cannot be extracted in preprocessing eg: the "not" in "did not" can match with the not operator and "work" can match with the or operator', () => {
    var sentence = "no, that did not work or. can you give me a simulation where x is 1 and y is 1"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "(x=1 and y=1)"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() should handle if/then pattern and convert to implies', () => {
    var sentence = "show me a simulation where if x is 1 then y is 1"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "(x=1 implies y=1)"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() should prepend trailing unary operators maintaining their ordering', () => {
    var sentence = "show me a simulation where a=1 and b=2 happens eventually"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "eventually((a=1 and b=2))"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})
it('parse() should automatically recover from tokens that appear incorrectly anywhere in the token stream according to the grammar', () => {
    var sentence = "no that and previous one were incorrect show me a simulation where it is always the case that if x is 1 then y is 5 and the whole thing is followed by z is 25"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "always((x=1 implies (y=5 and next(z=25))))"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})

it('parse() should throw an error when sentence cannot be parsed', () => {
    var sentence = "show me a simulation where it is always the case that if x is 1 then y is and or or or or 5 "
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = ParserResponseType.PARSE_ERROR
    expect(parserResponse.responseType).to.equal(expected)
})

it('parse() should thandle variables with spances in them as well as keywords', () => {
    var sentence = "show me a simulation where if protein and molecules is 1 then active protein is 5 "
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "((protein and molecules)=1 implies (active protein)=5)"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})
it('parse() should remove illegal instances of model variable usage', () => {
    var sentence = "can you give me a simulation where a is 1 and next b is 2"
    var parserResponse = NLParser.parse(sentence, testModel)
    var expected = "(a=1 and next(b=2))"
    expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
})
describe('parse() should handle composite operator usage', () => {
    it('parse() should handle "never" keywords usage', () => {
        var sentence = "can you give me a simulation where it is never the case that a is 1 and b is 2"
        var parserResponse = NLParser.parse(sentence, testModel)
        var expected = "not(eventually((a=1 and b=2)))"
        expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
    })
    it('parse() should handle "never" keywords usage as trailing operator', () => {
        var sentence = "can you give me a simulation such that a is 1 and b is 2 never happens"
        var parserResponse = NLParser.parse(sentence, testModel)
        var expected = "not(eventually((a=1 and b=2)))"
        expect(ASTUtils.toHumanReadableString(parserResponse.AST, testModel)).to.equal(expected)
    })
})