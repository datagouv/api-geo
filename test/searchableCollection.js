/* eslint-env mocha */
const expect = require('expect.js');
const TokenIndex = require('../lib/searchableCollection/indexes/token');
const GeoIndex = require('../lib/searchableCollection/indexes/geo');
const TextIndex = require('../lib/searchableCollection/indexes/text');
const normalizeString = require('../lib/searchableCollection/normalizeString');
const lunr = require('lunr');

describe('searchableCollection', () => {
  describe('indexes', () => {
    describe('TokenIndex', () => {
      describe('#constructor', () => {
        describe('no key given', () => {
          it('should throw an error', () => {
            expect(() => new TokenIndex()).to.throwError();
          });
        });
        describe('successful construction', () => {
          let ind;
          beforeEach(() => ind = new TokenIndex('foo', { array: 'bar' }));
          it('should set _key property', () => expect(ind._key).to.be('foo'));
          it('should set _array property', () => expect(ind._array).to.be('bar'));
          it('should init _index Map', () => expect(ind._index).to.be.a(Map));
        });
        describe('no array option given', () => {
          const ind = new TokenIndex('foo');
          it('should default to false', () => expect(ind._array).to.be(false));
        });
      });

      describe('#indexForToken(token, item)', () => {
        describe('token already present in index', () => {
          let ind;
          beforeEach(() => {
            ind = new TokenIndex('foo');
            ind._index = new Map();
            ind._index.set('a', ['1']);
            expect(ind._index.size).to.be(1);
          });
          it('should append item to the token entry', () => {
            ind.indexForToken('a', '2');
            expect(ind._index.has('a')).to.be.ok();
            expect(ind._index.get('a')).to.eql(['1', '2']);
          });
          it('should not affect index size', () => {
            ind.indexForToken('a', '2');
            expect(ind._index.size).to.be(1);
          });
        });
        describe('token not present in index', () => {
          let ind;
          beforeEach(() => {
            ind = new TokenIndex('foo');
            ind._index = new Map();
            expect(ind._index.size).to.be(0);
          });
          it('should create a new token entry with this item', () => {
            ind.indexForToken('a', '2');
            expect(ind._index.has('a')).to.be.ok();
            expect(ind._index.get('a')).to.eql(['2']);
          });
          it('should affect index size', () => {
            ind.indexForToken('a', '2');
            expect(ind._index.size).to.be(1);
          });
        });
      });

      describe('#index(item)', () => {
        let indexForTokenCalls, ind;
        const customIndexForToken = (token, item) => indexForTokenCalls.push([token, item]);
        beforeEach(() => indexForTokenCalls = []);

        describe('item without indexed key', () => {
          it('should not call indexForToken', () => {
            ind = new TokenIndex('foo');
            ind.indexForToken = customIndexForToken;
            ind.index({ bar: 'lol' });
            expect(indexForTokenCalls).to.eql([]);
          });
        });

        describe('item with indexed key (array: false)', () => {
          it('should call indexForToken once', () => {
            ind = new TokenIndex('foo');
            ind.indexForToken = customIndexForToken;
            expect(ind._array).to.be(false);
            ind.index({ foo: 'lol' });
            expect(indexForTokenCalls).to.eql([['lol', { foo: 'lol' }]]);
          });
        });

        describe('item with indexed key (array: true)', () => {
          it('should call indexForToken for each array item', () => {
            ind = new TokenIndex('foo', { array: true });
            ind.indexForToken = customIndexForToken;
            expect(ind._array).to.be(true);
            ind.index({ foo: ['lol', 'lal'] });
            expect(indexForTokenCalls).to.eql([
              ['lol', { foo: ['lol', 'lal'] }],
              ['lal', { foo: ['lol', 'lal'] }],
            ]);
          });
        });
      });

      describe('#load(items)', () => {
        let ind, indexCalls;
        const customIndex = item => indexCalls.push(item);
        beforeEach(() => {
          ind = new TokenIndex('foo');
          indexCalls = [];
          ind.index = customIndex;
        });
        describe('call with an empty array', () => {
          it('should not call index', () => {
            ind.load([]);
            expect(indexCalls).to.have.length(0);
          });
        });
        describe('call with items', () => {
          it('should call index for each item in list', () => {
            ind.load(['a', 'b', 'c']);
            expect(indexCalls).to.eql(['a', 'b', 'c']);
          });
        });
      });

      describe('#find(token)', () => {
        describe('token present in index', () => {
          it('should return corresponding token entries', () => {
            const ind = new TokenIndex('foo');
            ind._index = new Map();
            ind._index.set('a', ['1', '2', '3']);
            expect(ind.find('a')).to.eql(['1', '2', '3']);
          });
        });
        describe('token not present in index', () => {
          it('should return an empty array', () => {
            const ind = new TokenIndex('foo');
            ind._index = new Map();
            expect(ind.find('a')).to.eql([]);
          });
        });
      });
    });

    describe('GeoIndex', () => {
      describe('#constructor', () => {
        describe('no key given', () => {
          it('should throw an error', () => {
            expect(() => new GeoIndex()).to.throwError();
          });
        });
        describe('successful construction', () => {
          let ind;
          beforeEach(() => ind = new GeoIndex('foo'));
          it('should set _key property', () => expect(ind._key).to.be('foo'));
          it('should init _tree rbush tree', () => expect(ind._tree).to.have.keys('_maxEntries', '_minEntries'));
        });
      });

      // Poor test, treeItem is missing
      describe('#indexForPolygonRings(polygonRings, item)', () => {
        it('should insert data in tree', () => {
          const ind = new GeoIndex('foo');
          const insertCalls = [];
          ind._tree = { insert: data => insertCalls.push(data) };
          ind.indexForPolygonRings([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], { foo: 'bar' });
          expect(insertCalls).to.have.length(1);
          expect(insertCalls[0].props).to.eql({ foo: 'bar' });
        });
      });

      describe('#index(item)', () => {
        let indexForPolygonRingsCalls, ind;
        const customIndexForPolygonRings = (polygonRings, item) => indexForPolygonRingsCalls.push([polygonRings, item]);
        beforeEach(() => {
          indexForPolygonRingsCalls = [];
          ind = new GeoIndex('foo');
          ind.indexForPolygonRings = customIndexForPolygonRings;
        });

        describe('item without indexed key', () => {
          it('should not call indexForToken', () => {
            ind.index({ bar: 'lol' });
            expect(indexForPolygonRingsCalls).to.eql([]);
          });
        });

        describe('item with indexed key (Polygon)', () => {
          it('should call indexForPolygonRings once', () => {
            ind.index({ foo: { type: 'Polygon', coordinates: 'a' } });
            expect(indexForPolygonRingsCalls).to.eql([['a', { foo: { type: 'Polygon', coordinates: 'a' } }]]);
          });
        });

        describe('item with indexed key (MultiPolygon)', () => {
          it('should call indexForPolygonRings for each Polygon', () => {
            ind.index({ foo: { type: 'MultiPolygon', coordinates: ['a', 'b'] } });
            expect(indexForPolygonRingsCalls).to.eql([
              ['a', { foo: { type: 'MultiPolygon', coordinates: ['a', 'b'] } }],
              ['b', { foo: { type: 'MultiPolygon', coordinates: ['a', 'b'] } }],
            ]);
          });
        });

        describe('item with indexed key (other)', () => {
          it('should call not cal indexForPolygonRings', () => {
            it('should not call indexForToken', () => {
              ind.index({ foo: { type: 'Point' } });
              expect(indexForPolygonRingsCalls).to.eql([]);
            });
          });
        });
      });

      describe('#load(items)', () => {
        let ind, indexCalls;
        const customIndex = item => indexCalls.push(item);
        beforeEach(() => {
          ind = new GeoIndex('foo');
          indexCalls = [];
          ind.index = customIndex;
        });
        describe('call with an empty array', () => {
          it('should not call index', () => {
            ind.load([]);
            expect(indexCalls).to.have.length(0);
          });
        });
        describe('call with items', () => {
          it('should call index for each item in list', () => {
            ind.load(['a', 'b', 'c']);
            expect(indexCalls).to.eql(['a', 'b', 'c']);
          });
        });
      });

      describe('#find(point)', () => {
        // Not tested yet
      });
    });

    describe('TextIndex', () => {
      describe('constructor', () => {
        describe('no key given', () => {
          it('should throw an error', () => {
            expect(() => new TextIndex()).to.throwError();
          });
        });

        describe('successful construction', () => {
          let ind;
          beforeEach(() => ind = new TextIndex('foo', { boost: '1', ref: '2' }));
          it('should set _key property', () => expect(ind._key).to.be('foo'));
          it('should set _boost property', () => expect(ind._boost).to.be('1'));
          it('should set _refKey property', () => expect(ind._refKey).to.be('2'));
          it('should init _refIndex Map', () => expect(ind._refIndex).to.be.a(Map));
          it('should init _index as a lunr Index', () => expect(ind._index).to.be.a(lunr.Index));
          // Need lunr instantiation tests
        });
        describe('no options given', () => {
          const ind = new TextIndex('foo');
          it('_boost should default to {}', () => expect(ind._boost).to.eql({}));
          it('_refKey should default to "id"', () => expect(ind._refKey).to.be('id'));
        });
      });

      describe('#index(item)', () => {
        let indexAddCalls, ind;
        beforeEach(() => {
          indexAddCalls = [];
          ind = new TextIndex('foo');
          ind._index = { add: item => indexAddCalls.push(item) };
          ind._refIndex = new Map();
          ind._refKey = 'ref';
        });

        describe('item without indexed key', () => {
          it('should not call _index.add', () => {
            ind.index({ ref: '1', bar: 'lol' });
            expect(indexAddCalls).to.eql([]);
          });
        });
        describe('item with indexed key', () => {
          it('should call _index.add once', () => {
            ind.index({ ref: '1', foo: 'bar' });
            expect(indexAddCalls).to.eql([{ ref: '1', foo: 'bar' }]);
          });
          it('should add item ref to _refIndex', () => {
            ind.index({ ref: '1', foo: 'bar' });
            expect(ind._refIndex.size).to.be(1);
            expect(ind._refIndex.has('1')).to.be.ok();
            expect(ind._refIndex.get('1')).to.eql({ ref: '1', foo: 'bar' });
          });
        });
      });

      describe('#load(items)', () => {
        let ind, indexCalls;
        const customIndex = item => indexCalls.push(item);
        beforeEach(() => {
          ind = new TextIndex('foo');
          indexCalls = [];
          ind.index = customIndex;
        });
        describe('call with an empty array', () => {
          it('should not call index', () => {
            ind.load([]);
            expect(indexCalls).to.have.length(0);
          });
        });
        describe('call with items', () => {
          it('should call index for each item in list', () => {
            ind.load(['a', 'b', 'c']);
            expect(indexCalls).to.eql(['a', 'b', 'c']);
          });
        });
      });

      describe('#find(terms, options)', () => {
        // Not tested yet
      });
    });
  });
});

describe('normalizeString()', function() {
  describe('empty string', function() {
    it('should return an empty string.', function() {
      const result = normalizeString('');
      expect(result).to.equal('');
    });
  });

  describe('Upercase string', function() {
    it('should return a lowercase string.', function() {
      const result = normalizeString('ABC');
      expect(result).to.equal('abc');
    });
  });

  describe('String with white characters', function() {
    it('should return a string without white characters.', function() {
      const result = normalizeString('a b c');
      expect(result).to.equal('abc');
    });
  });

  describe('Accent string', function() {
    it('should return a string without accent.', function() {
      const accent_str = 'ÂÃÄÀÁÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäæçèéêëìíîïðòóôöùûüýÿ';
      const expected_str = 'aaaaaaaeceeeeiiiinooooouuuuyaaaaaaeceeeeiiiioooouuuyy';
      const result = normalizeString(accent_str);
      expect(result).to.equal(expected_str);
    });
  });
});
