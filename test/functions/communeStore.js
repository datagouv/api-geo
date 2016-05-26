/* eslint-env mocha */
const communeStore = require('../../lib/communeStore');
const expect = require('expect.js');

describe('communeStore', function() {

  describe('normalizeNom()', function() {
    describe('empty string', function() {
      it('should return an empty string.', function() {
        var result = communeStore.normalizeNom('');
        expect(result).to.equal('');
      });
    });

    describe('Upercase string', function() {
      it('should return a lowercase string.', function() {
        var result = communeStore.normalizeNom('ABC');
        expect(result).to.equal('abc');
      });
    });

    describe('String with white characters', function() {
      it('should return a string without white characters.', function() {
        var result = communeStore.normalizeNom('a b c');
        expect(result).to.equal('abc');
      });
    });

    describe('Accent string', function() {
      it('should return a string without accent.', function() {
        var accent_str = 'ÂÃÄÀÁÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäæçèéêëìíîïðòóôöùûüýÿ';
        var expected_str = 'aaaaaaaeceeeeiiiinooooouuuuyaaaaaaeceeeeiiiioooouuuyy';
        var result = communeStore.normalizeNom(accent_str);
        expect(result).to.equal(expected_str);
      });
    });
  });
});
