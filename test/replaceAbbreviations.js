/* eslint-env mocha */
const expect = require('expect.js');
const replaceAbbreviations = require('../lib/searchableCollection/replaceAbbreviations');

describe.only('replaceAbbreviations()', function () {
  const abbreviations = {
    'st': 'saint',
    'ste': 'sainte',
    'cgne': 'campagne',
  };

  beforeEach(done => {
    done();
  });

  describe('Words separated by spaces', function () {
    it('should replace patern', function () {
      const str = '"st louis"';
      const out = 'saint louis';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });

    it('should replace patern', function () {
      const str = '"marcilly la cgne"';
      const out = 'marcilly la campagne';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

  describe('Words separated by dashes', function () {
    it('should replace patern', function () {
      const str = '"st-louis"';
      const out = 'saint louis';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });

    it('should replace patern', function () {
      const str = '"marcilly-la-cgne"';
      const out = 'marcilly la campagne';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

  describe('search contained only one word', () => {
    it('should not replace patern', () => {
      const str = '"st"';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(str);
    });
  });

  describe('Patern is contained in a word', () => {
    it('should not replace patern', () => {
      const str = '"le stinx"';
      const out = 'le stinx';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

  describe('Accents management', () => {
    it('sould not replace the accent with a space', () => {
      const str = '"St-Auban-sur-l\'Ouvèze"';
      const out = 'saint auban sur l\'ouveze';

      expect(replaceAbbreviations(str, abbreviations)).to.equal(out);
    });
  });

});
