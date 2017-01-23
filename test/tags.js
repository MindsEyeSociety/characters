'use strict';

/* eslint-env node, mocha */

/**
 * Test for Tags API
 */

const should  = require( 'should' ); // eslint-disable-line no-unused-vars

const helpers = require( './helpers' );
const request = helpers.request;

module.exports = function() {

	// var Tags;
	//
	// before(function() {
	// 	Tags = helpers.app.models.Tags;
	// });

	describe( 'GET /', function() {

		helpers.defaultTests( '/v1/tags' );

		it( 'provides only PC tags by default', function( done ) {
			request.get( '/v1/tags' )
			.query({ token: 'user1' })
			.expect( 200 )
			.end( ( err, resp ) => {
				if ( err ) {
					throw err;
				}
				resp.body.forEach( tag => {
					tag.should.have.property( 'type', 'PC' );
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

	describe( 'GET /id', function() {
		helpers.defaultTests( '/v1/tags/1' );

		it( 'works for PC tag' );

		it( 'fails for NPC tag without permission' );

		it( 'fails for NPC tag without right venue permission' );

		it( 'works for NPC tag with right permission' );

		it( 'works for NPC tag with right venue permission' );
	});
};
