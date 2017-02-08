'use strict';

/* eslint-env node, mocha */

/**
 * Test for Characters API
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
				resp.body.should.have.a.length( 1 );
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

		it( 'works for NPCs with venue role and filter', function( done ) {
			request.get( '/v1/characters' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"and":[{"venue":"cam-anarch"},{"type":"NPC"}]}}' })
			.expect( 200, done );
		});
	});

	describe( 'POST /', function() {

		helpers.defaultTests( '/v1/characters', 'post' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Character.bypass().destroyAll({ id: { gt: 3 } }),
				Character.bypass().replaceById( 1, {
					'userid': 1,
					'orgunit': 4,
					'name': 'Lark Perzy Winslow Pellettieri McPhee',
					'type': 'PC',
					'venue': 'cam-anarch'
				}),
				() => done()
			).catch( err => done( err ) );
		});

		const newChar = {
			userid: 11,
			orgunit: 4,
			name: 'Test',
			type: 'PC',
			venue: 'cam-anarch'
		};

		it( 'fails for creating without correct permission', function( done ) {
			request.post( '/v1/characters' )
			.query({ token: 'adst' })
			.send( newChar )
			.expect( 403, done );
		});

		it( 'works for creating PC for self', function( done ) {
			let char = Object.assign( {}, newChar );
			char.userid = 1;

			request.post( '/v1/characters' )
			.query({ token: 'user1' })
			.send( char )
			.expect( 200, done );
		});

		it( 'fails for creating NPC for self', function( done ) {
			let char = Object.assign( {}, newChar );
			char.userid = 1;
			char.type = 'NPC';

			request.post( '/v1/characters' )
			.query({ token: 'user1' })
			.send( char )
			.expect( 400, done );
		});

		it( 'works for creating with correct permission', function( done ) {
			request.post( '/v1/characters' )
			.query({ token: 'nst' })
			.send( newChar )
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				done();
			});
		});

		it( 'fails for creating without attributes', function( done ) {
			request.post( '/v1/characters' )
			.query({ token: 'nst' })
			.send({})
			.expect( 422, done );
		});

		it( 'fails for updating with correct permission', function( done ) {
			let char = Object.assign( {}, newChar );
			char.id = 1;

			request.post( '/v1/characters' )
			.query({ token: 'nst' })
			.send( char )
			.expect( 400, done );
		});

		it( 'fails for creating without correct venue permission', function( done ) {
			request.post( '/v1/characters' )
			.query({ token: 'anst' })
			.send( newChar )
			.expect( 403, done );
		});

		it( 'works for creating with correct venue permission', function( done ) {
			let char = Object.assign( {}, newChar );
			char.venue = 'space';

			request.post( '/v1/characters' )
			.query({ token: 'anst' })
			.send( char )
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				done();
			});
		});
	});

	describe( 'GET /{id}', function() {
		helpers.defaultTests( '/v1/characters/1' );

		it( 'fails if getting other PC without permission', function( done ) {
			request.get( '/v1/characters/3' )
			.query({ token: 'user1' })
			.expect( 403, done );
		});

		it( 'fails if getting NPC without permission', function( done ) {
			request.get( '/v1/characters/2' )
			.query({ token: 'user1' })
			.expect( 403, done );
		});

		it( 'fails if getting other PC without venue permission', function( done ) {
			request.get( '/v1/characters/3' )
			.query({ token: 'user1' })
			.expect( 403, done );
		});

		it( 'fails if getting NPC without venue permission', function( done ) {
			request.get( '/v1/characters/3' )
			.query({ token: 'anst' })
			.expect( 403, done );
		});

		it( 'fails if getting character not under org', function( done ) {
			request.get( '/v1/characters/3' )
			.query({ token: 'dst' })
			.expect( 403, done );
		});

		it( 'works if getting own PC', function( done ) {
			request.get( '/v1/characters/1' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'works if getting PC with permission', function( done ) {
			request.get( '/v1/characters/1' )
			.query({ token: 'dst' })
			.expect( 200, done );
		});

		it( 'works if getting PC with venue permission', function( done ) {
			request.get( '/v1/characters/1' )
			.query({ token: 'vst' })
			.expect( 200, done );
		});

		it( 'works if getting NPC with permission', function( done ) {
			request.get( '/v1/characters/2' )
			.query({ token: 'dst' })
			.expect( 200, done );
		});

		it( 'works if getting NPC with venue permission', function( done ) {
			request.get( '/v1/characters/2' )
			.query({ token: 'anst' })
			.expect( 200, done );
		});

		it( 'returns the correct data', function( done ) {
			request.get( '/v1/characters/1' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.properties({
					id: 1,
					userid: 1,
					orgunit: 4,
					name: 'Lark Perzy Winslow Pellettieri McPhee',
					type: 'PC',
					venue: 'cam-anarch'
				});
				resp.body.textSheets.should.be.an.Array().and.length( 1 );
				done();
			});
		});
	});

	describe( 'PUT /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'put' );

		let body = {
			name: 'Test',
			orgunit: 4,
			userid: 1,
			type: 'PC',
			venue: 'cam-anarch'
		};
		let npc = {
			orgunit: 4,
			name: 'Test',
			type: 'NPC',
			venue: 'space'
		};

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Character.bypass().replaceById( 1, body ),
				Character.bypass().replaceById( 2, npc ),
				() => done()
			)
			.catch( err => done( err ) );
		});

		helpers.testPerms( '/v1/characters/%id', [
			// { text: 'updating without correct role', id: 1, body, token: 'adst' },
			{ text: 'updating PC for self', id: 1, body, code: 200 },
			{ text: 'updating with correct role', id: 1, body, token: 'nst', code: 200 },
			{ text: 'updating without attributes', id: 1, token: 'nst', code: 422 },
			// { text: 'updating without correct venue role', id: 1, body, token: 'anst' },
			{ text: 'updating with correct venue role', id: 2, body: npc, token: 'anst', code: 200 },
		], 'put' );

		it( 'updates the data', function( done ) {
			request.put( '/v1/characters/1' )
			.query({ token: 'user1' })
			.send( body )
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'name', 'Test' );
				done();
			})
		});
	});

	describe( 'POST /{id}/replace', function() {
		helpers.defaultTests( '/v1/characters/1', 'post' );

		let body = {
			name: 'Test',
			orgunit: 4,
			userid: 1,
			type: 'PC',
			venue: 'cam-anarch'
		};
		let npc = {
			orgunit: 4,
			name: 'Test',
			type: 'NPC',
			venue: 'space'
		};

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Character.bypass().replaceById( 1, body ),
				Character.bypass().replaceById( 2, npc ),
				() => done()
			)
			.catch( err => done( err ) );
		});

		helpers.testPerms( '/v1/characters/%id/replace', [
			// { text: 'updating without correct role', id: 1, body, token: 'adst' },
			{ text: 'updating PC for self', id: 1, body, code: 200 },
			{ text: 'updating with correct role', id: 1, body, token: 'nst', code: 200 },
			{ text: 'updating without attributes', id: 1, token: 'nst', code: 422 },
			// { text: 'updating without correct venue role', id: 1, body, token: 'anst' },
			{ text: 'updating with correct venue role', id: 2, body: npc, token: 'anst', code: 200 },
		], 'post' );

		it( 'updates the data', function( done ) {
			request.post( '/v1/characters/1/replace' )
			.query({ token: 'user1' })
			.send( body )
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'name', 'Test' );
				done();
			})
		});
	});

	describe.skip( 'HEAD /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'head' );

		it( 'works if a valid token is provided', function( done ) {
			request.head( '/v1/characters/1' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'fails if the character doesn\'t exist', function( done ) {
			request.head( '/v1/characters/10' )
			.query({ token: 'user1' })
			.expect( 404, done );
		});
	});

	describe.skip( 'DELETE /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'delete' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Character.bypass().replaceOrCreate({
					'id': 1,
					'userid': 1,
					'orgunit': 4,
					'name': 'Lark Perzy Winslow Pellettieri McPhee',
					'type': 'PC',
					'venue': 'cam-anarch'
				}),
				Character.bypass().replaceOrCreate({
					'id': 2,
					'orgunit': 4,
					'name': 'Messingw',
					'type': 'NPC',
					'venue': 'space'
				}),
				() => done()
			)
			.catch( err => done( err ) );
		});

		it( 'fails for deleting without correct permission', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'user2' })
			.expect( 403, done );
		});

		it( 'works for deleting with correct permission', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'nst' })
			.expect( 200, done );
		});

		it( 'fails for deleting without correct venue permission', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'anst' })
			.expect( 403, done );
		});

		it( 'works for deleting with correct venue permission', function( done ) {
			request.delete( '/v1/characters/2' )
			.query({ token: 'anst' })
			.expect( 200, done );
		});

		it( 'works for deleting own character', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'sets active to false', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( err => {
				if ( err ) {
					done( err );
				}
				Character.bypass().findById( 1 )
				.then( data => {
					data.should.not.be.empty();
					data.should.have.property( 'userid', 1 );
					done();
				})
			});
		});
	});

	describe.skip( 'GET /{id}/exists', function() {
		helpers.defaultTests( '/v1/characters/1/exists' );

		it( 'works if a valid token is provided', function( done ) {
			request.get( '/v1/characters/1/exists' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'fails if the character doesn\'t exist', function( done ) {
			request.get( '/v1/characters/10/exists' )
			.query({ token: 'user1' })
			.expect( 404, done );
		});
	});

	describe( 'GET /{id}/tags', function() {
		helpers.defaultTests( '/v1/characters/1/tags' );

		helpers.testPerms( '/v1/characters/%id/tags', [
			// { text: 'getting other PC without permission', id: 3 },
			{ text: 'getting NPC without permission', id: 2 },
			{ text: 'getting other PC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue permission', id: 3, token: 'anst' },
			// { text: 'getting character not under org', id: 3, token: 'dst' },
			// { text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with permission', code: 200, id: 1, token: 'dst' },
			// { text: 'getting PC with venue permission', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with permission', code: 200, id: 2, token: 'dst' },
			// { text: 'getting NPC with venue permission', code: 200, id: 2, token: 'anst' },
		]);

		it( 'returns the correct data', function( done ) {
			request.get( '/v1/characters/1/tags' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.forEach( tag => {
					tag.should.have.properties([ 'name', 'venue', 'type', 'id' ]);
				});
				done();
			});
		});
	});

	describe.skip( 'GET /{id}/tags/count', function() {
		helpers.defaultTests( '/v1/characters/1/tags/count' );

		helpers.testPerms( '/v1/characters/%id/tags/count', [
			{ text: 'getting other PC without permission', id: 3 },
			{ text: 'getting NPC without permission', id: 3 },
			{ text: 'getting other PC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with permission', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue permission', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with permission', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue permission', code: 200, id: 2, token: 'anst' },
		]);

		it( 'returns the correct data', function( done ) {
			request.get( '/v1/characters/1/tags/count' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'count' );
				done();
			});
		});
	});

	describe.skip( 'PUT /{id}/tags/rel/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/tags/rel/1', 'put' );

		afterEach( 'resets test data', function( done ) {
			helpers.app.models.CharacterTags.destroyAll({ id: { gt: 4 } })
			.then( () => done() )
			.catch( err => done( err ) );
		});

		helpers.testPerms( '/v1/characters/%id/tags/rel/%fk', [
			{ text: 'tags other PC without permission', token: 'user2', id: 1, fk: 1 },
			{ text: 'tags other PC without venue permission', token: 'anst', id: 1, fk: 1 },
			{ text: 'tags NPC without permission', id: 2, fk: 5 },
			{ text: 'tags NPC without venue NPC permission', id: 2, fk: 4, token: 'vst' },
			{ text: 'tags non-existent tag', id: 1, fk: 100, token: 'nst', code: 404 },
			{ text: 'tags non-existent character', id: 100, fk: 1, token: 'nst', code: 404 },
			{ text: 'tags PC with NPC tag', id: 1, fk: 5, code: 400 },
			{ text: 'tags PC with incorrect venue tag', id: 3, fk: 1, token: 'nst', code: 400 },
			{ text: 'tags NPC with PC tag', id: 2, fk: 1, token: 'nst', code: 400 },
			{ text: 'tags NPC with incorrect venue tag', id: 2, fk: 5, token: 'nst', code: 400 },
			{ text: 'tags own PC with correct tag', id: 1, fk: 1, code: 200 },
			{ text: 'tags PC with correct permission', id: 1, fk: 1, token: 'dst', code: 200 },
			{ text: 'tags NPC with correct permission', id: 2, fk: 4, token: 'dst', code: 200 },
			{ text: 'tags NPC with correct venue permission', id: 2, fk: 4, token: 'anst', code: 200 }
		], 'put' );

		it( 'correctly creates a tag', function( done ) {
			request.put( '/v1/characters/1/tags/rel/1' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Object();
				resp.body.should.have.properties({
					'characterid': 1,
					'tagid': 1
				});
				done();
			});
		});
	});

	describe.skip( 'DELETE /{id}/tags/rel/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/tags/rel/1', 'delete' );

		afterEach( 'resets test data', function( done ) {
			let CharacterTags = helpers.app.models.CharacterTags;
			Promise.all([
				CharacterTags.replaceOrCreate({ id: 1, characterid: 1, tagid: 1 }),
				CharacterTags.replaceOrCreate({ id: 2, characterid: 1, tagid: 2 }),
				CharacterTags.replaceOrCreate({ id: 3, characterid: 1, tagid: 3 }),
				CharacterTags.replaceOrCreate({ id: 4, characterid: 2, tagid: 4 }),
				() => done()
			])
			.catch( err => done( err ) );
		});

		helpers.testPerms( '/v1/characters/%id/tags/rel/%fk', [
			{ text: 'tags other PC without permission', token: 'user2', id: 1, fk: 1 },
			{ text: 'tags other PC without venue permission', token: 'anst', id: 1, fk: 1 },
			{ text: 'tags NPC without permission', id: 2, fk: 5 },
			{ text: 'tags NPC without venue NPC permission', id: 2, fk: 4, token: 'vst' },
			{ text: 'tags non-existent tag', id: 1, fk: 100, token: 'nst', code: 404 },
			{ text: 'tags non-existent character', id: 100, fk: 1, token: 'nst', code: 404 },
			{ text: 'tags PC with NPC tag', id: 1, fk: 5, code: 400 },
			{ text: 'tags PC with incorrect venue tag', id: 3, fk: 1, token: 'nst', code: 400 },
			{ text: 'tags NPC with PC tag', id: 2, fk: 1, token: 'nst', code: 400 },
			{ text: 'tags NPC with incorrect venue tag', id: 2, fk: 5, token: 'nst', code: 400 },
			{ text: 'tags own PC with correct tag', id: 1, fk: 1, code: 200 },
			{ text: 'tags PC with correct permission', id: 1, fk: 1, token: 'dst', code: 200 },
			{ text: 'tags NPC with correct permission', id: 2, fk: 4, token: 'dst', code: 200 },
			{ text: 'tags NPC with correct venue permission', id: 2, fk: 4, token: 'anst', code: 200 }
		], 'delete' );

		it( 'correctly deletes a tag', function( done ) {
			request.delete( '/v1/characters/1/tags/rel/1' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( err => {
				if ( err ) {
					done( err );
				}
				request.get( '/v1/characters/1/tags' )
				.query({ token: 'user1' })
				.end( ( err, resp ) => {
					resp.body.should.be.an.Array().with.length( 3 );
					done();
				});
			});
		});
	});

	describe.skip( 'GET /{id}/textSheets', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets' );

		helpers.testPerms( '/v1/characters/%id/textSheets', [
			{ text: 'getting other PC without permission', id: 1 },
			{ text: 'getting NPC without permission', id: 1 },
			{ text: 'getting other PC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with permission', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue permission', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with permission', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue permission', code: 200, id: 2, token: 'anst' },
		]);
	});

	describe.skip( 'POST /{id}/textSheets', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets', 'post' );

		afterEach( 'resets test data', function( done ) {
			helpers.app.models.TextSheets.destroyAll({ id: { gt: 4 } })
			.then( () => done() )
			.catch( err => done( err ) );
		});

		let body = {
			sheet: 'test sheet',
			xp: 'test xp',
			background: 'test background'
		};

		helpers.testPerms( '/v1/characters/%id/textSheets', [
			{ text: 'updating other PC without permission', id: 3, body },
			{ text: 'updating NPC without permission', id: 2, body },
			{ text: 'updating other PC without venue permission', id: 3, token: 'anst', body },
			{ text: 'updating NPC without venue permission', id: 3, token: 'anst', body },
			{ text: 'updating character not under org', id: 3, token: 'dst', body },
			{ text: 'updating own PC', code: 200, id: 1, body },
			{ text: 'updating PC with permission', code: 200, id: 1, token: 'dst', body },
			{ text: 'updating PC with venue permission', code: 200, id: 1, token: 'vst', body },
			{ text: 'updating NPC with permission', code: 200, id: 2, token: 'dst', body },
			{ text: 'updating NPC with venue permission', code: 200, id: 2, token: 'anst', body },
		], 'post' );

		it( 'fails if missing sheet', function( done ) {
			let badBody = Object.assign( {}, body );
			badBody.sheet = null;
			request.post( '/v1/characters/1/textSheets' )
			.query({ token: 'user1' })
			.send( badBody )
			.expect( 422, done );
		});

		it( 'correctly creates a sheet', function( done ) {
			request.post( '/v1/characters/1/textSheets' )
			.query({ token: 'user1' })
			.send( body )
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Object();
				resp.body.should.have.properties({
					characterid: 1,
					sheet: 'test sheet',
					xp: 'test xp',
					background: 'test background',
					modifiedby: 1
				});
				resp.body.should.have.property( 'modifiedat' );
				done();
			});
		});
	});

	describe.skip( 'GET /{id}/textSheets/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets/1' );

		helpers.testPerms( '/v1/characters/%id/textSheets/%fk', [
			{ text: 'getting other PC without permission', id: 1, fk: 1 },
			{ text: 'getting NPC without permission', id: 1, fk: 1 },
			{ text: 'getting other PC without venue permission', id: 3, fk: 1, token: 'anst' },
			{ text: 'getting NPC without venue permission', id: 3, fk: 1, token: 'anst' },
			{ text: 'getting character not under org', id: 3, fk: 1, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1, fk: 1 },
			{ text: 'getting PC with permission', code: 200, id: 1, fk: 1, token: 'dst' },
			{ text: 'getting PC with venue permission', code: 200, id: 1, fk: 1, token: 'vst' },
			{ text: 'getting NPC with permission', code: 200, id: 2, fk: 1, token: 'dst' },
			{ text: 'getting NPC with venue permission', code: 200, id: 2, fk: 1, token: 'anst' },
		]);
	});

	describe.skip( 'GET /{id}/textSheets/count', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets/count' );

		helpers.testPerms( '/v1/characters/%id/textSheets/count', [
			{ text: 'getting other PC without permission', id: 1 },
			{ text: 'getting NPC without permission', id: 1 },
			{ text: 'getting other PC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue permission', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with permission', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue permission', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with permission', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue permission', code: 200, id: 2, token: 'anst' },
		]);
	});

	describe( 'GET /count', function() {
		helpers.defaultTests( '/v1/characters/count' );

		helpers.testPerms( '/v1/characters/count', [
			{ text: 'user token is provided' },
			{ text: 'valid token provided', token: 'nst', code: 200 },
			{ text: 'NPC only token for PCs is provided', token: 'anst' },
			{ text: 'PC venue role without venue set', token: 'vst' },
			// { text: 'PC venue role with venue set', token: 'vst', filter: { where: { venue: 'cam-anarch' } }, code: 200 },
			// { text: 'getting NPC without role', token: 'adst', filter: {where:{type:'NPC'}} },
			{ text: 'getting NPC with role', token: 'dst', filter: {where:{type:'NPC'}}, code: 200 },
			{ text: 'getting NPC without venue role', token: 'vst', filter: {where:{and:[{venue:'space'},{type:'NPC'}]}} },
			{ text: 'getting venue NPC without venue filter', token: 'vst', filter: {where:{type:'NPC'}} },
			{ text: 'getting NPC with role and filter', token: 'vst', filter: {where:{and:[{venue:'cam-anarch'},{type:'NPC'}]}} }
		]);
	});

	describe( 'GET /findOne', function() {
		helpers.defaultTests( '/v1/characters/findOne' );

		helpers.testPerms( '/v1/characters/findOne', [
			{ text: 'user token is provided' },
			{ text: 'valid token provided', token: 'nst', code: 200 },
			{ text: 'NPC only token for PCs is provided', token: 'anst' },
			{ text: 'PC venue role without venue set', token: 'vst' },
			{ text: 'PC venue role with venue set', token: 'vst', filter: { where: { venue: 'cam-anarch' } }, code: 200 },
			{ text: 'getting NPC without role', token: 'adst', filter: {where:{type:'NPC'}} },
			{ text: 'getting NPC with role', token: 'dst', filter: {where:{type:'NPC'}}, code: 200 },
			{ text: 'getting NPC without venue role', token: 'vst', filter: {where:{and:[{venue:'space'},{type:'NPC'}]}} },
			{ text: 'getting venue NPC without venue filter', token: 'vst', filter: {where:{type:'NPC'}} },
			{ text: 'getting NPC with role and filter', token: 'anst', filter: {where:{and:[{venue:'space'},{type:'NPC'}]}}, code: 200 }
		]);

		it( 'returns the correct data', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Object();
				resp.body.should.have.properties([
					'name',
					'userid',
					'type',
					'orgunit',
					'venue',
					'active',
					'source',
					'id'
				]);
				resp.body.should.have.properties({
					type: 'PC',
					active: true
				});
				done();
			});
		});

		it( 'returns PC under office org only', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'dst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'orgunit', 4 );
				done();
			});
		});

		it( 'returns PC by org unit', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"orgunit":2}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'orgunit', 2 );
				done();
			});
		});

		it( 'returns 404 if out of bounds org is set', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"orgunit":2}}' })
			.expect( 404, done );
		});

		it( 'returns PCs by venue', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"venue":"cam-anarch"}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'venue', 'cam-anarch' );
				done();
			});
		});

		it( 'returns PCs by user ID', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'nst' })
			.query({ filter: '{"where":{"userid":1}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'userid', 1 );
				done();
			});
		});

		it( 'only provides NPCs', function( done ) {
			request.get( '/v1/characters/findOne' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'type', 'NPC' );
				done();
			});
		});
	});

	describe( 'GET /me', function() {
		helpers.defaultTests( '/v1/characters/me' );

		it( 'gets own PCs', function( done ) {
			request.get( '/v1/characters/me' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.be.an.Array();
				resp.body.forEach( char => {
					char.should.have.property( 'userid', 1 );
				});
				done();
			});
		});

		it( 'gets own PCs', function( done ) {
			request.get( '/v1/characters/me' )
			.query({ token: 'none' })
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
	});

	describe( 'Verify disabled endpoints', function() {
		let endpoints = [
			[ 'patch', '/' ],
			[ 'patch', '/1' ],
			[ 'post', '/1/tags' ],
			[ 'delete', '/1/tags' ],
			[ 'get', '/1/tags/1' ],
			[ 'put', '/1/tags/1' ],
			[ 'delete', '/1/tags/1' ],
			[ 'head', '/1/tags/rel/1' ],
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
