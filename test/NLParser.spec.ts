import { expect } from 'chai'
import { default as NLParser, ParserResponseType } from '../src/NLParser/NLParser'

it('parse() should handle single variables', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "can you give me a simulation where x is 1"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "x=1"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() handles LTL operator precedence and assosiativeity correctly', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "z", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "give me some simulation where it is always the case that if x is 1 then y is 5 and followed by z is 25"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "always((x=1 implies (y=5 and next(z=25))))"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() should handle variables with names that are substrings of operators eg: notch, eventualkanize', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "notch", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "eventualkanize", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "show me a simulation where notch is 1 and eventualkanize is 20"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "(notch=1 and eventualkanize=20)"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() should handle tokens that are substrings of operators but are not variables as they need to be handled by the lexer and cannot be extracted in preprocessing eg: the "not" in "did not" can match with the not operator and "work" can match with the or operator', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "no, that did not work or. can you give me a simulation where x is 1 and y is 1"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "(x=1 and y=1)"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() should handle if/then pattern and convert to implies', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "show me a simulation where if x is 1 then y is 1"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "(x=1 implies y=1)"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() should prepend trailing unary operators maintaining their ordering', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "a", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "b", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "a=1 and b=2 happen eventually"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "eventually((a=1 and b=2))"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})
it('parse() should automatically recover from tokens that appear incorrectly anywhere in the token stream according to the grammar', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "z", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "no that and previous one were incorrect show me a simulation where it is always the case that if x is 1 then y is 5 and the whole thing is followed by z is 25"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "always((x=1 implies (y=5 and next(z=25))))"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})

it('parse() should throw an error when sentence cannot be parsed', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "x", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "y", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "z", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "show me a simulation where it is always the case that if x is 1 then y is and or or or or 5 "
    var parserResponse = NLParser.parse(sentence, model)
    var expected = ParserResponseType.PARSE_ERROR
    expect(parserResponse.responseType).to.equal(expected)
})

it('parse() should thandle variables with spances in them as well as keywords', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "protein and molecules", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "active protein", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "show me a simulation where if protein and molecules is 1 then active protein is 5 "
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "((protein and molecules)=1 implies (active protein)=5)"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})
it('parse() should remove illegal instances of model variable usage', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "a", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "b", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "can you give me a simulation where a is 1 and next b is 2"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = "(a=1 and next(b=2))"
    expect(parserResponse.humanReadableFormula).to.equal(expected)
})
describe('parse() should handle composite operator usage', () => {
    it('parse() should handle "never" keywords usage', () => {
        var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "a", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "b", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
        var sentence = "can you give me a simulation where it is never the case that a is 1 and b is 2"
        var parserResponse = NLParser.parse(sentence, model)
        var expected = "not(eventually((a=1 and b=2)))"
        expect(parserResponse.humanReadableFormula).to.equal(expected)
    })
    it('parse() should handle "never" keywords usage as trailing operator', () => {
        var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "a", "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "b", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
        var sentence = "can you give me a simulation such that a is 1 and b is 2 never happens"
        var parserResponse = NLParser.parse(sentence, model)
        var expected = "not(eventually((a=1 and b=2)))"
        expect(parserResponse.humanReadableFormula).to.equal(expected)
    })
})