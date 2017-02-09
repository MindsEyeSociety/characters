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

	var Tag;

	before(function() {
		Tag = helpers.app.models.Tags;
	});

	describe( 'GET /', function() {

		helpers.defaultTests( '/v1/tags' );

		it( 'works if a valid token is provided', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'provides only PC tags by default', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.forEach( tag => {
					tag.should.have.property( 'type', 'PC' );
				});
				done();
			});
		});

		it( 'provides correct data', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.forEach( tag => {
					tag.should.have.property( 'id' );
					tag.should.have.property( 'name' );
					tag.should.have.property( 'venue' );
					tag.should.have.property( 'type' );
				});
				done();
			});
		});

		it( 'fails if an invalid type is specified', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.query({ filter: '{"where":{"type":"invalid"}}' })
			.expect( 400, done );
		});

		it( 'fails for NPC tags without permission', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 403, done );
		});

		it( 'works for NPC tags with the right permission', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 200, done );
		});

		it( 'fails for NPC tags without the right venue permission', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"type":"NPC","venue":"space"}}' })
			.expect( 403, done );
		});

		it( 'works for NPC tags with the right venue permission', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"type":"NPC","venue":"cam-anarch"}}' })
			.expect( 200, done );
		});
	});

	describe( 'POST /', function() {

		helpers.defaultTests( '/v1/tags', 'post' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().destroyAll({ id: { gt: 5 } }),
				Tag.bypass().replaceById( 1, { name: 'Toreador', venue: 'cam-anarch' } ),
				() => done()
			).catch( err => done( err ) );
		});

		it( 'fails for creating without correct permission', function( done ) {
			request.post( '/v1/tags' )
			.query({ token: 'dst' })
			.send({ venue: 'cam-anarch', type: 'PC', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for creating with correct permission', function( done ) {
			request.post( '/v1/tags' )
			.query({ token: 'nst' })
			.send({ venue: 'cam-anarch', type: 'PC', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});

		it( 'fails for updating with correct permission', function( done ) {
			request.post( '/v1/tags' )
			.query({ token: 'nst' })
			.send({ id: 1, venue: 'cam-anarch', name: 'Test' })
			.expect( 500, done() );
		});

		it( 'fails for creating without correct venue permission', function( done ) {
			request.post( '/v1/tags' )
			.query({ token: 'anst' })
			.send({ venue: 'cam-anarch', type: 'PC', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for creating with correct venue permission', function( done ) {
			request.post( '/v1/tags' )
			.query({ token: 'anst' })
			.send({ venue: 'space', type: 'PC', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});
	});

	describe( 'GET /{id}', function() {
		helpers.defaultTests( '/v1/tags/1' );

		it( 'works if a valid token is provided', function( done ) {
			request.get( '/v1/tags/1' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'fails if the tag doesn\'t exist', function( done ) {
			request.get( '/v1/tags/10' )
			.query({ token: 'user1' })
			.expect( 404, done );
		});

		it( 'provides the correct data', function( done ) {
			request.get( '/v1/tags/1' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.properties({
					id: 1,
					name: 'Toreador',
					venue: 'cam-anarch',
					type: 'PC'
				});
				done();
			});
		});

		it( 'fails for NPC tag without permission', function( done ) {
			request.get( '/v1/tags/4' )
			.query({ token: 'user1' })
			.expect( 403, done );
		});

		it( 'works for NPC tag with right permission', function( done ) {
			request.get( '/v1/tags/4' )
			.query({ token: 'dst' })
			.expect( 200, done );
		});

		it( 'fails for NPC tag without right venue permission', function( done ) {
			request.get( '/v1/tags/4' )
			.query({ token: 'vst' })
			.expect( 403, done );
		});

		it( 'works for NPC tag with right venue permission', function( done ) {
			request.get( '/v1/tags/4' )
			.query({ token: 'dst' })
			.expect( 200, done );
		});
	});

	describe( 'HEAD /{id}', function() {
		helpers.defaultTests( '/v1/tags', 'head' );

		it( 'works if a valid token is provided', function( done ) {
			request.head( '/v1/tags/1' )
			.query({ token: 'user1' })
			.expect( 200, done );
		});

		it( 'fails if the tag doesn\'t exist', function( done ) {
			request.head( '/v1/tags/10' )
			.query({ token: 'user1' })
			.expect( 404, done );
		});
	});

	describe( 'PUT /{id}', function() {
		helpers.defaultTests( '/v1/tags', 'put' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().replaceById( 1, { name: 'Toreador', venue: 'cam-anarch' }),
				Tag.bypass().replaceById( 4, { name: 'Actor', venue: 'space' }),
				() => done()
			)
			.catch( err => done( err ) );
		});

		it( 'fails for updating without correct permission', function( done ) {
			request.put( '/v1/tags/1' )
			.query({ token: 'dst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct permission', function( done ) {
			request.put( '/v1/tags/1' )
			.query({ token: 'nst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});

		it( 'fails for updating without correct venue permission', function( done ) {
			request.put( '/v1/tags/1' )
			.query({ token: 'anst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct venue permission', function( done ) {
			request.put( '/v1/tags/4' )
			.query({ token: 'anst' })
			.send({ venue: 'space', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});
	});

	describe( 'POST /{id}/replace', function() {
		helpers.defaultTests( '/v1/tags', 'post' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().replaceById( 1, { name: 'Toreador', venue: 'cam-anarch' }),
				Tag.bypass().replaceById( 4, { name: 'Actor', venue: 'space' }),
				() => done()
			)
			.catch( err => done( err ) );
		});

		it( 'fails for updating without correct permission', function( done ) {
			request.post( '/v1/tags/1/replace' )
			.query({ token: 'dst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct permission', function( done ) {
			request.post( '/v1/tags/1/replace' )
			.query({ token: 'nst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});

		it( 'fails for updating without correct venue permission', function( done ) {
			request.post( '/v1/tags/1/replace' )
			.query({ token: 'anst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct venue permission', function( done ) {
			request.post( '/v1/tags/4/replace' )
			.query({ token: 'anst' })
			.send({ venue: 'space', name: 'Test' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					done( err );
				}
				resp.body.should.have.property( 'id' );
				Tag.findById( resp.body.id )
				.then( instance => {
					resp.body.should.deepEqual( instance.toJSON() );
					done();
				});
			});
		});
	});

	describe( 'DELETE /{id}', function() {
		helpers.defaultTests( '/v1/tags', 'delete' );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().upsert({ id: 1, name: 'Toreador', venue: 'cam-anarch', type: 'PC' }),
				Tag.bypass().upsert({ id: 4, name: 'Actor', venue: 'space', type: 'NPC' }),
				() => done()
			)
			.catch( err => done( err ) );
		});

		it( 'fails for deleting without correct permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'dst' })
			.expect( 403, done );
		});

		it( 'works for deleting with correct permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'nst' })
			.expect( 200, done );
		});

		it( 'fails for deleting without correct venue permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'anst' })
			.expect( 403, done );
		});

		it( 'works for deleting with correct venue permission', function( done ) {
			request.delete( '/v1/tags/4' )
			.query({ token: 'anst' })
			.expect( 200, done );
		});
	});

	describe( 'GET /{id}/characters', function() {
		helpers.defaultTests( '/v1/tags/1/characters' );

		helpers.testPerms( { url: '/v1/tags/%id/characters', verb: 'getting' }, [
			{ text: 'without PC role', id: 1 },
			{ text: 'without NPC role', id: 4 },
			{ text: 'without PC venue role', id: 1, token: 'anst' },
			{ text: 'without NPC venue role', id: 4, token: 'vst' },
			{ text: 'with PC role', id: 1, token: 'dst', code: 200 },
			{ text: 'with NPC role', id: 4, token: 'dst', code: 200 },
			{ text: 'with PC venue role', id: 1, token: 'vst', code: 200 },
			{ text: 'with NPC venue role', id: 4, token: 'anst', code: 200 },
		]);

		it( 'provides PCs under org unit', function( done ) {
			request.get( '/v1/tags/1/characters' )
			.query({ token: 'otherDst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				resp.body.should.be.an.Array().and.empty();
				done();
			});
		});

		it( 'provides the correct data', function( done ) {
			request.get( '/v1/tags/1/characters' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				resp.body.should.be.an.Array();
				resp.body.forEach( char => {
					char.should.have.properties([
						'name',
						'userid',
						'orgunit',
						'source',
						'id'
					]);
					char.should.have.properties({
						type: 'PC',
						venue: 'cam-anarch',
						active: true
					});
				});
				done();
			});
		})
	});

	describe( 'GET /{id}/characters/count', function() {
		helpers.defaultTests( '/v1/tags/1/characters/count' );

		helpers.testPerms( { url: '/v1/tags/%id/characters/count', verb: 'getting' }, [
			{ text: 'without PC role', id: 1 },
			{ text: 'without NPC role', id: 4 },
			{ text: 'without PC venue role', id: 1, token: 'anst' },
			{ text: 'without NPC venue role', id: 4, token: 'vst' },
			{ text: 'with PC role', id: 1, token: 'dst', code: 200 },
			{ text: 'with NPC role', id: 4, token: 'dst', code: 200 },
			{ text: 'with PC venue role', id: 1, token: 'vst', code: 200 },
			{ text: 'with NPC venue role', id: 4, token: 'anst', code: 200 },
		]);

		it( 'provides the correct data', function( done ) {
			request.get( '/v1/tags/1/characters/count' )
			.query({ token: 'nst' })
			.expect( 200 )
			.end( ( err, resp ) => {
				resp.body.should.have.property( 'count', 1 );
				done();
			});
		});
	});

	describe( 'GET /{id}/exists', function() {
		helpers.defaultTests( '/v1/tags/1/exists' );

		it( 'works if a valid token is provided', function( done ) {
			request.get( '/v1/tags/1/exists' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'exists', true );
				done();
			});
		});

		it( 'fails if the tag doesn\'t exist', function( done ) {
			request.get( '/v1/tags/10/exists' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'exists', false );
				done();
			});
		});
	});

	describe( 'GET /count', function() {
		helpers.defaultTests( '/v1/tags/count' );

		it( 'gets the correct PC count', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'count', 3 );
				done();
			});
		});

		it( 'fails for NPCs without permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'user1' })
			.query({ where: '{"type":"NPC"}' })
			.expect( 403, done );
		});

		it( 'gets the correct NPC count with permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'nst' })
			.query({ where: '{"type":"NPC"}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'count', 2 );
				done();
			});
		});

		it( 'fails for NPC count without right venue permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'anst' })
			.query({ where: '{"type":"NPC","venue":"cam-anarch"}' })
			.expect( 403, done );
		});

		it( 'gets NPC count with right venue permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'anst' })
			.query({ where: '{"type":"NPC","venue":"space"}' })
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'count', 1 );
				done();
			});
		});

		it( 'fails for all without permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'user1' })
			.query({ where: '{"type":"all"}' })
			.expect( 403, done );
		});

		it( 'gets the correct count of all with permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'nst' })
			.query({ where: '{"type":"all"}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'count', 5 );
				done();
			});
		});

		it( 'fails for all without right venue permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'anst' })
			.query({ where: '{"type":"all","venue":"cam-anarch"}' })
			.expect( 403, done );
		});

		it( 'gets the correct count of all with right venue permission', function( done ) {
			request.get( '/v1/tags/count' )
			.query({ token: 'vst' })
			.query({ where: '{"type":"all","venue":"cam-anarch"}' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.property( 'count', 4 );
				done();
			});
		});
	});

	describe( 'GET /findOne', function() {
		helpers.defaultTests( '/v1/tags/findOne' );

		it( 'gets a PC tag', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					return done( err );
				}
				resp.body.should.have.a.property( 'id', 1 );
				done();
			});
		});

		it( 'fails if PC tag doesn\'t exist', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'user1' })
			.query({ filter: '{"offset":10}' })
			.expect( 404, done );
		});

		it( 'fails for a NPC without permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'user1' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 403, done );
		});

		it( 'works for a NPC with permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"NPC"}}' })
			.expect( 200, done );
		});

		it( 'fails for a NPC without venue permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'anst' })
			.query({ filter: '{"where":{"type":"NPC","venue":"cam-anarch"}}' })
			.expect( 403, done );
		});

		it( 'works for a NPC with venue permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"type":"NPC","venue":"cam-anarch"}}' })
			.expect( 200, done );
		});

		it( 'fails for all without permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'user1' })
			.query({ filter: '{"where":{"type":"all"}}' })
			.expect( 403, done );
		});

		it( 'works for all with permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'dst' })
			.query({ filter: '{"where":{"type":"all"}}' })
			.expect( 200, done );
		});

		it( 'fails for all without venue permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'anst' })
			.query({ filter: '{"where":{"type":"all","venue":"cam-anarch"}}' })
			.expect( 403, done );
		});

		it( 'works for all with venue permission', function( done ) {
			request.get( '/v1/tags/findOne' )
			.query({ token: 'vst' })
			.query({ filter: '{"where":{"type":"all","venue":"cam-anarch"}}' })
			.expect( 200, done );
		});
	});

	describe( 'Verify disabled endpoints', function() {
		let endpoints = [
			[ 'patch', '/' ],
			[ 'patch', '/1' ],
			[ 'post', '/1/characters' ],
			[ 'delete', '/1/characters' ],
			[ 'get', '/1/characters/1' ],
			[ 'put', '/1/characters/1' ],
			[ 'delete', '/1/characters/1' ],
			[ 'head', '/1/characters/rel/1' ],
			[ 'put', '/1/characters/rel/1' ],
			[ 'delete', '/1/characters/rel/1' ],
			[ 'get', '/change-stream' ],
			[ 'post', '/change-stream' ],
			[ 'post', '/replaceOrCreate' ],
			[ 'post', '/update' ],
			[ 'post', '/upsertWithWhere' ]
		];

		endpoints.forEach( obj => {
			it( `${obj[0].toUpperCase()} ${obj[1]}`, function( done ) {
				request[ obj[0] ]( '/v1/tags' + obj[1] )
				.query({ token: 'nst' })
				.expect( 404, done );
			});
		});
	});
};
