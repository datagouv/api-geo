/* eslint-env mocha */
const expect = require('expect.js');
const replaceAbbreviations = require('../lib/searchableCollection/replaceAbbreviations');

describe('replaceAbbreviations()', function () {
  const abbreviations = {
    'st': 'saint',
    'ste': 'sainte',
    'cgne': 'campagne',
  };

  beforeEach(done => {
    done();
  });

  describe('Words separated by spaces', function () {
    it('should replace Pattern', function () {
      const str = 'st louis';
      const out = 'saint louis';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });

    it('should replace Pattern', function () {
      const str = 'marcilly la cgne';
      const out = 'marcilly la campagne';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

  describe('Words separated by dashes', function () {
    it('should replace Pattern', function () {
      const str = 'st-louis';
      const out = 'saint louis';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });

    it('should replace Pattern', function () {
      const str = 'marcilly-la-cgne';
      const out = 'marcilly la campagne';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

  describe('search contained only one word', () => {
    it('should not replace Pattern', () => {
      const str = 'st';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(str);
    });
  });

  describe('Pattern is contained in a word', () => {
    it('should not replace Pattern', () => {
      const str = 'le stinx';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(str);
    });
  });

});
