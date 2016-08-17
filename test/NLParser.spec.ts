import * as chai from 'chai'
import NLParser from '../src/NLParser/NLParser'
var expect = chai.expect;

it('parse() should handle a complex query with prefix, inline and suffix temporal operators with if/then clase', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "y", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "x", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "give me some simulation where it is always the case that if x is 1 then y is 5 is followed by x is 5 in the eventual case"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = '"eventually(always((x=1 implies y=5)))'
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
it('parse() should return an error set for an invalid set of input tokens', () => {
    var model = { "Model": { "Name": "model 1", "Variables": [{ "Name": "a", "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Name": "b", "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }] } }
    var sentence = "sdfsdf sdfsdf sdfsdf sdf sdf sdf sd f if a=1 and b=1"
    var parserResponse = NLParser.parse(sentence, model)
    var expected = '[{"name":"MismatchedTokenException","message":"Expecting --> then <-- but found --> \'\' <--","token":{"image":"","offset":-1,"startLine":-1,"startColumn":-1,"endLine":-1,"endColumn":-1,"isInsertedInRecovery":false},"resyncedTokens":[],"context":{"ruleStack":["formula","ifFormula"],"ruleOccurrenceStack":[1,1]}}]'
    expect(JSON.stringify(parserResponse.errors)).to.equal(expected)
})
