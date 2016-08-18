import * as assert from 'assert'
import * as BMA from '../src/BMA'

let testmodel: BMA.ModelFile = require('./data/testmodel.json')

let states1 = [
    new BMA.LtlStateImpl('A', [{
        variable: 'x',
        operator: '=',
        value: 0
    }, {
        variable: 'y',
        operator: '>=',
        value: 1
    }, {
        variable: 'z',
        operator: '!=',
        value: 1
    }])
]
let formula1 = new BMA.LtlOperationImpl('EVENTUALLY', [
    new BMA.LtlOperationImpl('ALWAYS', [
        new BMA.LtlNameStateReferenceImpl('A')
    ])
])
let formula2 = new BMA.LtlOperationImpl('NOT', [
    new BMA.LtlNameStateReferenceImpl('A')
])

describe('BMA module', () => {
    describe('#getExpandedFormula', () => {
        it('should expand correctly', () => {
            let exp1 = BMA.getExpandedFormula(testmodel.Model, states1, formula1)
            let exp2 = BMA.getExpandedFormula(testmodel.Model, states1, formula2)

            assert.equal(exp1, '(Eventually (Always (And (And (= 3 0) (>= 2 1)) (!= 5 1))))')
            assert.equal(exp2, '(Not (And (And (= 3 0) (>= 2 1)) (!= 5 1)))')
        })
    })
    describe('#runFastSimulation', () => {
        it('should return the correct simulation response (basic)', () => {
            return BMA.runFastSimulation(testmodel.Model, '(Eventually True)', 10).then(response => {
                assert.strictEqual(response.Status, true)
            })
        })
        it('should return the correct simulation response (advanced)', () => {
            return BMA.runFastSimulation(testmodel.Model, '(Eventually (Always (And (And (= 3 0) (>= 2 1)) (!= 5 1))))', 10).then(response => {
                assert.strictEqual(response.Status, false)
            })
        })
    })
    describe('#runThoroughSimulation', () => {
        it('should return the correct polarity response', () => {
            let formula = '(Eventually True)'
            return BMA.runFastSimulation(testmodel.Model, formula, 10).then(resp1 => {
                assert.strictEqual(resp1.Status, true)
                return BMA.runThoroughSimulation(testmodel.Model, formula, 10, resp1).then(resp2 => {
                    assert.strictEqual(resp2.Status, false)
                })
            })
        })
    })
})