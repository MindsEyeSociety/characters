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

	it( 'fails if an invalid token is provided', function( done ) {
		supertest( app )
		[ method ]( url )
		.query({ token: 'invalid' })
		.expect( 403, done );
	});
}

module.exports = {
	request: supertest( app ),
	internal: supertest( 'localhost:' + app.get( 'internalPort' ) ),
	app,
	defaultTests
};
