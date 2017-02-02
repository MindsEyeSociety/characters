'use strict';

/* eslint-env node, mocha */

/**
 * Test for Tags API
 */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;

module.exports = function() {

	var Character;

	before(function() {
		Character = helpers.app.models.Characters;
	});

	describe( 'GET /', function() {
		helpers.defaultTests( '/v1/characters' );

		it( 'fails if user token is provided', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'user1' })
			.expect( 403, done );
		});

		it( 'fails if npc only token for PCs is provided', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'anst' })
			.expect( 403, done );
		});

		it( 'works if a valid token is provided', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.expect( 200, done );
		});

		it( 'returns the correct data', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.forEach( character => {
					character.should.have.properties([
						'name',
						'userid',
						'type',
						'orgunit',
						'venue',
						'active',
						'source',
						'id'
					]);
				});
				done();
			});
		});

		it( 'returns active PCs by default', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array().and.have.length( 2 );
				resp.body.forEach( character => {
					character.type.should.equal( 'PC' );
					character.active.should.equal( true );
				});
				done();
			});
		});

		it( 'returns PCs under office org only', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'dst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.should.have.a.length( 1 );
				resp.body.forEach( character => {
					character.should.have.property( 'orgunit', 4 );
				});
				done();
			});
		});

		it( 'returns PCs by org unit', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"orgunit":2}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.should.have.a.length( 1 );
				resp.body.forEach( character => {
					character.should.have.property( 'orgunit', 2 );
				});
				done();
			});
		});

		it( 'returns empty array if out of bounds org is set', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"orgunit":2}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.should.be.empty();
				done();
			});
		});

		it( 'returns PCs by venue', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"venue":"cam-anarch"}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.should.have.a.length( 1 );
				resp.body.forEach( character => {
					character.should.have.property( 'venue', 'cam-anarch' );
				});
				done();
			});
		});

		it( 'returns PCs by user ID', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"userid":1}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.should.have.a.length( 2 );
				done();
			});
		});

		it( 'fails for PC venue role without venue set', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.expect( 403, done );
		});

		it( 'works for PC venue role with venue set', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"venue":"cam-anarch"}}' })
			.expect( 200, done );
		});

		it( 'fails for NPCs without role', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'adst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 403, done );
		});

		it( 'works for NPCs with role', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 200, done );
		});

		it( 'only provides NPCs', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.forEach( npc => {
					npc.should.have.property( 'type', 'NPC' );
				});
				done();
			});
		});

		it( 'fails for venue NPCs without venue role', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"and":[{"venue":"space"},{"type":"NPC"}]}}' })
			.expect( 403, done );
		});

		it( 'fails for venue NPCs without venue filter', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 403, done );
		});

		it.only( 'works for NPCs with venue role and filter', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"and":[{"venue":"cam-anarch"},{"type":"NPC"}]}}' })
			.expect( 200, done );
		});
	});

	describe( 'POST /', function() {
		helpers.defaultTests( '/v1/characters', 'post' );
	});

	describe( 'PATCH /', function() {
		helpers.defaultTests( '/v1/characters', 'patch' );
	});

	describe( 'GET /{id}', function() {
		helpers.defaultTests( '/v1/characters/1' );
	});

	describe( 'PATCH /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'patch' );
	});

	describe( 'HEAD /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'head' );
	});

	describe( 'DELETE /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'delete' );
	});

	describe( 'GET /{id}/exists', function() {
		helpers.defaultTests( '/v1/characters/1/exists' );
	});

	describe( 'GET /{id}/tags', function() {
		helpers.defaultTests( '/v1/characters/1/tags' );
	});

	describe( 'GET /{id}/tags/count', function() {
		helpers.defaultTests( '/v1/characters/1/tags/count' );
	});

	describe( 'GET /{id}/textSheets', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets' );
	});

	describe( 'POST /{id}/textSheets', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets', 'post' );
	});

	describe( 'GET /{id}/textSheets/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets/1' );
	});

	describe( 'GET /{id}/textSheets/count', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets/count' );
	});

	describe( 'GET /count', function() {
		helpers.defaultTests( '/v1/characters/count' );
	});

	describe( 'GET /findOne', function() {
		helpers.defaultTests( '/v1/characters/findOne' );
	});

	describe( 'GET /me', function() {
		helpers.defaultTests( '/v1/characters/me' );
	});

	describe( 'Verify disabled endpoints', function() {
		let endpoints = [
			[ 'put', '/1' ],
			[ 'post', '/1/tags' ],
			[ 'delete', '/1/tags' ],
			[ 'get', '/1/tags/1' ],
			[ 'put', '/1/tags/1' ],
			[ 'delete', '/1/tags/1' ],
			[ 'head', '/1/tags/rel/1' ],
			[ 'put', '/1/tags/rel/1' ],
			[ 'delete', '/1/tags/rel/1' ],
			[ 'post', '/1/replace' ],
			[ 'get', '/change-stream' ],
			[ 'post', '/change-stream' ],
			[ 'post', '/replaceOrCreate' ],
			[ 'post', '/update' ],
			[ 'post', '/upsertWithWhere' ]
		];

		endpoints.forEach( obj => {
			it( `${obj[0].toUpperCase()} ${obj[1]}`, function( done ) {
				request[ obj[0] ]( '/v1/characters' + obj[1] )
				.query({ token: 'nst' })
				.expect( 404, done );
			});
		});
	});

};
