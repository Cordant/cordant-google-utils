'use strict';
const GoogleUtils = require('../dist/index.js').GoogleUtils;
const expect = require('chai').expect;

describe('GoogleUtils instance creation', () => {
    it('new instance should be truthy', () => {
        const googleUtils = new GoogleUtils();
        expect(!!googleUtils).to.equal(true);
    });

    it('new instance and impersonation without params should throw an error', () => {
        const googleUtils = new GoogleUtils();
        googleUtils.impersonate().catch((err) => {
            expect(err).to.equal('Invalid parameters');
        })
    });

    it('new instance and init without params should throw an error', () => {
        const googleUtils = new GoogleUtils();
        googleUtils.init().catch((err) => {
            expect(err).to.equal('Invalid parameters');
        })
    });
});