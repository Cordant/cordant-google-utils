'use strict';
const GoogleUtils = require('../dist/index.js').GoogleUtils;

const expect = require('chai').expect;
describe('GoogleUtils function test', () => {
    it('should be truthy', () => {
        const googleUtils = new GoogleUtils();
        expect(!!googleUtils).to.equal(true);
    });
    it('should throw an error', () => {
        const googleUtils = new GoogleUtils();
        googleUtils.impersonate().catch((err) => {
            expect(err).to.equal('Invalid parameters');
        })
    });
});