/* eslint-env mocha */
const db = require('../../lib/db');
const normalizeNom = db.normalizeNom;
const expect = require('expect.js');

describe('db', function() {

  describe('normalizeNom()', function() {
    describe('empty string', function() {
      it('should return an empty string.', function() {
        var result = normalizeNom('');
        expect(result).to.equal('');
      });
    });

    describe('Upercase string', function() {
      it('should return a lowercase string.', function() {
        var result = normalizeNom('ABC');
        expect(result).to.equal('abc');
      });
    });

    describe('String with white characters', function() {
      it('should return a string without white characters.', function() {
        var result = normalizeNom('a b c');
        expect(result).to.equal('abc');
      });
    });

    describe('Accent string', function() {
      it('should return a string without accent.', function() {
        var accent_str = 'ÂÃÄÀÁÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäæçèéêëìíîïðòóôöùûüýÿ';
        var expected_str = 'aaaaaaaeceeeeiiiinooooouuuuyaaaaaaeceeeeiiiioooouuuyy';
        var result = normalizeNom(accent_str);
        expect(result).to.equal(expected_str);
      });
    });
  });
});
