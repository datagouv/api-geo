/* eslint-env mocha */
const normalizeString = require('../lib/normalizeString');
const expect = require('expect.js');

describe('normalizeString()', function() {
  describe('empty string', function() {
    it('should return an empty string.', function() {
      var result = normalizeString('');
      expect(result).to.equal('');
    });
  });

  describe('Upercase string', function() {
    it('should return a lowercase string.', function() {
      var result = normalizeString('ABC');
      expect(result).to.equal('abc');
    });
  });

  describe('String with white characters', function() {
    it('should return a string without white characters.', function() {
      var result = normalizeString('a b c');
      expect(result).to.equal('abc');
    });
  });

  describe('Accent string', function() {
    it('should return a string without accent.', function() {
      var accent_str = 'ÂÃÄÀÁÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäæçèéêëìíîïðòóôöùûüýÿ';
      var expected_str = 'aaaaaaaeceeeeiiiinooooouuuuyaaaaaaeceeeeiiiioooouuuyy';
      var result = normalizeString(accent_str);
      expect(result).to.equal(expected_str);
    });
  });
});
