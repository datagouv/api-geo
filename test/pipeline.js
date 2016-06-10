/* eslint-env mocha */
const pipeline = require('../lib/integration/pipeline');
const expect = require('expect.js');


describe('#pipeline', () => {
  describe('Empty pipeline', () => {
    it('should just call the callback', done => {
      pipeline([], done);
    });
  });
  describe('One stage pipeline', () => {
    it('context should be present', done => {
      pipeline([(ctx, next) => {
        expect(ctx).to.only.have.keys('debug');
        next();
      }], done);
    });
  });
  describe('Two stage pipeline', () => {
    it('should pass in each stage', done => {
      let passedStages = 0;
      pipeline([
        (ctx, next) => {
          passedStages++;
          next();
        },
        (ctx, next) => {
          passedStages++;
          next();
        },
      ], err => {
        expect(err).not.to.be.ok();
        expect(passedStages).to.be(2);
        done();
      });
    });
    it('context should be the same object', done => {
      let firstCtx;
      pipeline([
        (ctx, next) => {
          firstCtx = ctx;
          next();
        },
        (ctx, next) => {
          expect(ctx).to.be(firstCtx);
          next();
        },
      ], done);
    });
  });
});
