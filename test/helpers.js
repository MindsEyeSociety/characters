'use strict';

/* eslint-env node, mocha */

const app       = require( '../server/server' );
const supertest = require( 'supertest' );

function defaultTests( url, method = 'get' ) {
	it( 'fails if no token is provided', function( done ) {
		supertest( app )
		[ method ]( url )
		.expect( 403, done );
	});

	it.only( 'fails if an invalid token is provided', function( done ) {
		supertest( app )
		[ method ]( url )
		.query({ token: 'invalid' })
		.end( ( err, resp ) => {
			if ( err ) {
				throw err;
			}
			console.log( resp.status );
			console.log( resp.body );
			done();
		});
		// .expect( 403, done );
	});

	it( 'works if a valid token is provided', function( done ) {
		supertest( app )
		[ method ]( url )
		.query({ token: 'user1' })
		.expect( 200, done );
	});
}

module.exports = {
	request: supertest( app ),
	internal: supertest( 'localhost:' + app.get( 'internalPort' ) ),
	app,
	defaultTests
};
