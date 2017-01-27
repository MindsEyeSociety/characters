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

	const insertBob = method => function() {

		helpers.defaultTests( '/v1/tags', method );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().destroyAll({ id: { gt: 4 } }),
				Tag.bypass().replaceById( 1, { name: 'Toreador', venue: 'cam-anarch' } ),
				() => done()
			).catch( err => done( err ) );
		});

		it( 'fails for creating without correct permission', function( done ) {
			request[ method ]( '/v1/tags' )
			.query({ token: 'dst' })
			.send({ venue: 'cam-anarch', type: 'PC', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for creating with correct permission', function( done ) {
			request[ method ]( '/v1/tags' )
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

		it( 'works for updating with correct permission', function( done ) {
			request[ method ]( '/v1/tags' )
			.query({ token: 'nst' })
			.send({ id: 1, venue: 'cam-anarch', name: 'Test' })
			.expect( 'post' !== method ? 200 : 500 )
			.end( err => {
				if ( err ) {
					done( err );
				}
				if ( 'post' === method ) {
					return done();
				}
				Tag.findById( 1 )
				.then( tag => {
					tag.should.have.property( 'name', 'Test' );
					tag.should.have.property( 'id', 1 );
					done();
				});
			});
		});

		it( 'fails for creating without correct venue permission', function( done ) {
			request[ method ]( '/v1/tags' )
			.query({ token: 'anst' })
			.send({ venue: 'cam-anarch', type: 'PC', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for creating with correct venue permission', function( done ) {
			request[ method ]( '/v1/tags' )
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
	};

	describe( 'PATCH /', insertBob( 'patch' ) );
	describe( 'PUT /', insertBob( 'put' ) );
	describe( 'POST /', insertBob( 'post' ) );

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

	const update = method => function() {
		helpers.defaultTests( '/v1/tags', method );

		afterEach( 'resets test data', function( done ) {
			Promise.join(
				Tag.bypass().replaceById( 1, { name: 'Toreador', venue: 'cam-anarch' }),
				Tag.bypass().replaceById( 4, { name: 'Actor', venue: 'space' }),
				() => done()
			)
			.catch( err => done( err ) );
		});

		it( 'fails for updating without correct permission', function( done ) {
			request[ method ]( '/v1/tags/1' )
			.query({ token: 'dst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct permission', function( done ) {
			request[ method ]( '/v1/tags/1' )
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
			request[ method ]( '/v1/tags/1' )
			.query({ token: 'anst' })
			.send({ venue: 'cam-anarch', name: 'Test' })
			.expect( 403, done );
		});

		it( 'works for updating with correct venue permission', function( done ) {
			request[ method ]( '/v1/tags/4' )
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
	};

	describe( 'PATCH /{id}', update( 'patch' ) );
	describe( 'PUT /{id}', update( 'put' ) );

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

		it( 'fails for updating without correct permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'dst' })
			.expect( 403, done );
		});

		it( 'works for updating with correct permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'nst' })
			.expect( 200, done );
		});

		it( 'fails for updating without correct venue permission', function( done ) {
			request.delete( '/v1/tags/1' )
			.query({ token: 'anst' })
			.expect( 403, done );
		});

		it( 'works for updating with correct venue permission', function( done ) {
			request.delete( '/v1/tags/4' )
			.query({ token: 'anst' })
			.expect( 200, done );
		});
	});
};
