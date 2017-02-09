'use strict';

/* eslint-env node, mocha */

/**
 * Test for Characters API
 */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;
const clone   = helpers.cloneWith;

module.exports = function() {

	var Character;

	before(function() {
		Character = helpers.app.models.Characters;
	});

	describe( 'GET /', function() {
		helpers.defaultTests( '/v1/characters' );

		helpers.testPerms( { url: '/v1/characters', verb: 'getting' }, [
			{ text: 'with user token' },
			{ text: 'PCs with NPC roles', token: 'anst' },
			{ text: 'with role', token: 'nst', code: 200 },
			{ text: 'venue NPCs without venue role', token: 'vst', where: {and:[{venue:'space'},{type:'NPC'}]} },
			{ text: 'venue NPCs without venue filter', token: 'vst', where: {type:'NPC'} },
			{ text: 'NPCs with venue role and filter', token: 'vst', where: {and:[{venue:'cam-anarch'},{type:'NPC'}]}, code: 200 },
			{ text: 'PC venue role without venue', token: 'vst' },
			{ text: 'PC venue role with venue', token: 'vst', where: { venue: 'cam-anarch' }, code: 200 },
			{ text: 'NPCs without role', token: 'adst', where: { type: 'NPC' } },
			{ text: 'NPCs with role', token: 'dst', where: { type: 'NPC' }, code: 200 }
		]);

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
	});

	describe( 'POST /', function() {

		helpers.defaultTests( '/v1/characters', 'post' );

		afterEach( 'resets test data', function( done ) {
			Character.bypass().destroyAll({ id: { gt: 3 } })
			.then( () => done() )
			.catch( err => done( err ) );
		});

		let body = {
			userid: 11,
			orgunit: 4,
			name: 'Test',
			type: 'PC',
			venue: 'cam-anarch'
		};

		helpers.testPerms( { url: '/v1/characters', verb: 'creating', method: 'post' }, [
			{ text: 'without correct role', body, token: 'adst' },
			{ text: 'with correct role', body, token: 'nst', code: 200 },
			{ text: 'for self', body: clone( body, 'userid', 1 ), code: 200 },
			{ text: 'with id set', body: clone( body, 'id', 1 ), token: 'nst', code: 400 },
			{ text: 'without attributes', body: {}, token: 'nst', code: 422 },
			{ text: 'without correct venue role', body, token: 'anst' },
			{ text: 'with correct venue role', body: clone( body, 'venue', 'space' ), token: 'anst', code: 200 }
		]);

		it( 'fails for creating NPC for self', function( done ) {
			let char = Object.assign( {}, body );
			char.userid = 1;
			char.type = 'NPC';

			request.post( '/v1/characters' )
			.query({ token: 'user1' })
			.send( char )
			.expect( 400, done );
		});

		it( 'provides correct data', function( done ) {
			request.post( '/v1/characters' )
			.query({ token: 'user1' })
			.send( clone( body, 'userid', 1 ) )
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

		helpers.testPerms( { url: '/v1/characters/%id', verb: 'getting' }, [
			{ text: 'other PC without role', id: 3 },
			{ text: 'NPC without role', id: 2 },
			{ text: 'other PC without venue role', id: 3 },
			{ text: 'NPC without venue role', id: 3, token: 'anst' },
			{ text: 'character not under org', id: 3, token: 'dst' },
			{ text: 'own PC', id: 1, code: 200 },
			{ text: 'PC with role', id: 1, token: 'dst', code: 200 },
			{ text: 'PC with venue role', id: 1, token: 'vst', code: 200 },
			{ text: 'NPC with role', id: 2, token: 'dst', code: 200 },
			{ text: 'NPC with venue role', id: 2, token: 'anst', code: 200 },
		]);

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

		helpers.testPerms( { url: '/v1/characters/%id', verb: 'updating', method: 'put' }, [
			{ text: 'PC without correct role', id: 1, body, token: 'adst' },
			{ text: 'PC for self', id: 1, body, code: 200 },
			{ text: 'PC with correct role', id: 1, body, token: 'nst', code: 200 },
			{ text: 'PC without correct venue role', id: 1, body, token: 'anst' },
			{ text: 'PC not under org unit', id: 1, body, token: 'otherDst' },
			{ text: 'NPC with correct role', id: 2, body: npc, token: 'nst', code: 200 },
			{ text: 'NPC with correct venue role', id: 2, body: npc, token: 'anst', code: 200 },
			{ text: 'without attributes', id: 1, token: 'nst', code: 422 },
			{ text: 'PC without user ID', id: 1, body: clone( body, 'userid', null ), token: 'nst', code: 400 },
			{ text: 'NPC with user ID', id: 2, body: clone( body, 'userid', 1 ), token: 'nst', code: 400 },
			{ text: 'character type', id: 1, body: clone( body, 'type', 'NPC' ), code: 400 },
			{ text: 'character venue', id: 1, body: clone( body, 'venue', 'space' ), code: 400 },
			{ text: 'character user ID', id: 1, body: clone( body, 'userid', 2 ), code: 400 },
			{ text: 'character org unit', id: 1, body: clone( body, 'orgunit', 3 ), code: 400 }
		]);

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

		helpers.testPerms( { url: '/v1/characters/%id/replace', verb: 'updating', method: 'post' }, [
			{ text: 'PC without correct role', id: 1, body, token: 'adst' },
			{ text: 'PC for self', id: 1, body, code: 200 },
			{ text: 'PC with correct role', id: 1, body, token: 'nst', code: 200 },
			{ text: 'PC without correct venue role', id: 1, body, token: 'anst' },
			{ text: 'PC not under org unit', id: 1, body, token: 'otherDst' },
			{ text: 'NPC with correct role', id: 2, body: npc, token: 'nst', code: 200 },
			{ text: 'NPC with correct venue role', id: 2, body: npc, token: 'anst', code: 200 },
			{ text: 'without attributes', id: 1, token: 'nst', code: 422 },
			{ text: 'PC without user ID', id: 1, body: clone( body, 'userid', null ), token: 'nst', code: 400 },
			{ text: 'NPC with user ID', id: 2, body: clone( body, 'userid', 1 ), token: 'nst', code: 400 },
			{ text: 'character type', id: 1, body: clone( body, 'type', 'NPC' ), code: 400 },
			{ text: 'character venue', id: 1, body: clone( body, 'venue', 'space' ), code: 400 },
			{ text: 'character user ID', id: 1, body: clone( body, 'userid', 2 ), code: 400 },
			{ text: 'character org unit', id: 1, body: clone( body, 'orgunit', 3 ), code: 400 }
		]);

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

	describe( 'HEAD /{id}', function() {
		helpers.defaultTests( '/v1/characters/1', 'head' );

		helpers.testPerms( { url: '/v1/characters/%id', method: 'head' }, [
			{ text: 'a valid token is provided', id: 1, code: 200 },
			{ text: 'the character doesn\'t exist', id: 10, code: 404 }
		]);
	});

	describe( 'GET /{id}/exists', function() {
		helpers.defaultTests( '/v1/characters/1/exists' );

		helpers.testPerms( { url: '/v1/characters/%id/exists' }, [
			{ text: 'a valid token is provided', id: 1, code: 200 },
			{ text: 'the character doesn\'t exist', id: 10, code: 200 }
		]);

		it( 'provides correct data', function( done ) {
			request.get( '/v1/characters/10/exists' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				resp.body.should.have.property( 'exists', false );
				done();
			});
		})
	});

	describe( 'DELETE /{id}', function() {
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

		helpers.testPerms( { url: '/v1/characters/%id', method: 'delete', verb: 'deleting' }, [
			{ text: 'PC without correct role', token: 'user2', id: 1 },
			{ text: 'PC without correct venue role', token: 'anst', id: 1 },
			{ text: 'PC outside org unit', token: 'otherDst', id: 1 },
			{ text: 'PC with correct role', token: 'nst', id: 1, code: 200 },
			{ text: 'PC with correct venue role', token: 'vst', id: 1, code: 200 },
			{ text: 'own PC', id: 1, code: 200 },
			{ text: 'NPC without correct role', id: 2 },
			{ text: 'NPC without correct venue role', token: 'vst', id: 2 },
			{ text: 'NPC outside org unit', token: 'otherDst', id: 2 },
			{ text: 'NPC with correct role', token: 'nst', id: 2, code: 200 },
			{ text: 'NPC with correct venue role', token: 'anst', id: 2, code: 200 },
		]);

		it( 'sets active to false', function( done ) {
			request.delete( '/v1/characters/1' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( err => {
				if ( err ) {
					return done( err );
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

	describe( 'GET /{id}/tags', function() {
		helpers.defaultTests( '/v1/characters/1/tags' );

		helpers.testPerms( '/v1/characters/%id/tags', [
			{ text: 'getting other PC without role', id: 3 },
			{ text: 'getting NPC without role', id: 2 },
			{ text: 'getting other PC without venue role', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue role', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with role', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue role', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with role', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue role', code: 200, id: 2, token: 'anst' },
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

	describe( 'GET /{id}/tags/count', function() {
		helpers.defaultTests( '/v1/characters/1/tags/count' );

		helpers.testPerms( '/v1/characters/%id/tags/count', [
			{ text: 'getting other PC without role', id: 3 },
			{ text: 'getting NPC without role', id: 3 },
			{ text: 'getting other PC without venue role', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue role', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with role', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue role', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with role', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue role', code: 200, id: 2, token: 'anst' },
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

	describe( 'PUT /{id}/tags/rel/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/tags/rel/1', 'put' );

		afterEach( 'resets test data', function( done ) {
			helpers.app.models.CharacterTags.destroyAll({ id: { gt: 4 } })
			.then( () => done() )
			.catch( err => done( err ) );
		});

		helpers.testPerms(
			{ url: '/v1/characters/%id/tags/rel/%fk', method: 'put', verb: 'tags' },
			[
				{ text: 'other PC without role', token: 'user2', id: 1, fk: 1 },
				{ text: 'other PC without venue role', token: 'anst', id: 1, fk: 1 },
				{ text: 'NPC without role', id: 2, fk: 5 },
				{ text: 'NPC without venue NPC role', id: 2, fk: 4, token: 'vst' },
				{ text: 'non-existent tag', id: 1, fk: 100, token: 'nst', code: 404 },
				{ text: 'non-existent character', id: 100, fk: 1, token: 'nst', code: 404 },
				{ text: 'PC with NPC tag', id: 1, fk: 5, code: 400 },
				{ text: 'PC with incorrect venue tag', id: 3, fk: 1, token: 'nst', code: 400 },
				{ text: 'NPC with PC tag', id: 2, fk: 1, token: 'nst', code: 400 },
				{ text: 'NPC with incorrect venue tag', id: 2, fk: 5, token: 'nst', code: 400 },
				{ text: 'own PC with correct tag', id: 1, fk: 1, code: 200 },
				{ text: 'PC with correct role', id: 1, fk: 1, token: 'dst', code: 200 },
				{ text: 'NPC with correct role', id: 2, fk: 4, token: 'dst', code: 200 },
				{ text: 'NPC with correct venue role', id: 2, fk: 4, token: 'anst', code: 200 }
			]
		);

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

	describe( 'DELETE /{id}/tags/rel/{fk}', function() {
		helpers.defaultTests( '/v1/characters/1/tags/rel/1', 'delete' );

		afterEach( 'resets test data', function( done ) {
			let CharacterTags = helpers.app.models.CharacterTags;
			CharacterTags.replaceOrCreate([
				{ id: 1, characterid: 1, tagid: 1 },
				{ id: 2, characterid: 1, tagid: 2 },
				{ id: 3, characterid: 1, tagid: 3 },
				{ id: 4, characterid: 2, tagid: 4 }
			], () => done() );
		});

		helpers.testPerms(
			{ url: '/v1/characters/%id/tags/rel/%fk', method: 'delete', verb: 'untags' },
			[
				{ text: 'other PC without role', token: 'user2', id: 1, fk: 1 },
				{ text: 'other PC without venue role', token: 'anst', id: 1, fk: 1 },
				{ text: 'NPC without role', id: 2, fk: 5 },
				{ text: 'NPC without venue NPC role', id: 2, fk: 4, token: 'vst' },
				{ text: 'own PC with correct tag', id: 1, fk: 1, code: 204 },
				{ text: 'PC with correct role', id: 1, fk: 1, token: 'dst', code: 204 },
				{ text: 'NPC with correct role', id: 2, fk: 4, token: 'dst', code: 204 },
				{ text: 'NPC with correct venue role', id: 2, fk: 4, token: 'anst', code: 204 }
			]);

		it( 'correctly deletes a tag', function( done ) {
			request.delete( '/v1/characters/1/tags/rel/1' )
			.query({ token: 'user1' })
			.expect( 204 )
			.end( err => {
				if ( err ) {
					return done( err );
				}
				request.get( '/v1/characters/1/tags' )
				.query({ token: 'user1' })
				.end( ( err, resp ) => {
					resp.body.should.be.an.Array().with.length( 2 );
					done();
				});
			});
		});
	});

	describe.skip( 'GET /{id}/textSheets', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets' );

		helpers.testPerms( '/v1/characters/%id/textSheets', [
			{ text: 'getting other PC without role', id: 1 },
			{ text: 'getting NPC without role', id: 1 },
			{ text: 'getting other PC without venue role', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue role', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with role', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue role', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with role', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue role', code: 200, id: 2, token: 'anst' },
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
			{ text: 'updating other PC without role', id: 3, body },
			{ text: 'updating NPC without role', id: 2, body },
			{ text: 'updating other PC without venue role', id: 3, token: 'anst', body },
			{ text: 'updating NPC without venue role', id: 3, token: 'anst', body },
			{ text: 'updating character not under org', id: 3, token: 'dst', body },
			{ text: 'updating own PC', code: 200, id: 1, body },
			{ text: 'updating PC with role', code: 200, id: 1, token: 'dst', body },
			{ text: 'updating PC with venue role', code: 200, id: 1, token: 'vst', body },
			{ text: 'updating NPC with role', code: 200, id: 2, token: 'dst', body },
			{ text: 'updating NPC with venue role', code: 200, id: 2, token: 'anst', body },
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
			{ text: 'getting other PC without role', id: 1, fk: 1 },
			{ text: 'getting NPC without role', id: 1, fk: 1 },
			{ text: 'getting other PC without venue role', id: 3, fk: 1, token: 'anst' },
			{ text: 'getting NPC without venue role', id: 3, fk: 1, token: 'anst' },
			{ text: 'getting character not under org', id: 3, fk: 1, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1, fk: 1 },
			{ text: 'getting PC with role', code: 200, id: 1, fk: 1, token: 'dst' },
			{ text: 'getting PC with venue role', code: 200, id: 1, fk: 1, token: 'vst' },
			{ text: 'getting NPC with role', code: 200, id: 2, fk: 1, token: 'dst' },
			{ text: 'getting NPC with venue role', code: 200, id: 2, fk: 1, token: 'anst' },
		]);
	});

	describe.skip( 'GET /{id}/textSheets/count', function() {
		helpers.defaultTests( '/v1/characters/1/textSheets/count' );

		helpers.testPerms( '/v1/characters/%id/textSheets/count', [
			{ text: 'getting other PC without role', id: 1 },
			{ text: 'getting NPC without role', id: 1 },
			{ text: 'getting other PC without venue role', id: 3, token: 'anst' },
			{ text: 'getting NPC without venue role', id: 3, token: 'anst' },
			{ text: 'getting character not under org', id: 3, token: 'dst' },
			{ text: 'getting own PC', code: 200, id: 1 },
			{ text: 'getting PC with role', code: 200, id: 1, token: 'dst' },
			{ text: 'getting PC with venue role', code: 200, id: 1, token: 'vst' },
			{ text: 'getting NPC with role', code: 200, id: 2, token: 'dst' },
			{ text: 'getting NPC with venue role', code: 200, id: 2, token: 'anst' },
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
