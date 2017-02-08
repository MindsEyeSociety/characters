'use strict';

/* eslint-env node, mocha */

const app       = require( '../server/server' );
const supertest = require( 'supertest' );
const _         = require( 'lodash' );

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

function testPerms( url, tests, method = 'get' ) {
	let request = supertest( app );
	tests.forEach( test => {
		_.defaults( test, {
			code: 403,
			token: 'user1',
			url: url
		});
		let start = 'fails if';
		if ( 200 === test.code ) {
			start = 'works if';
		}

		if ( test.id ) {
			test.url = test.url.replace( '%id', test.id );
		}
		if ( test.fk ) {
			test.url.replace( '%fk', test.fk );
		}

		it( `${start} ${test.text}`, function( done ) {
			let query = request[ method ]( test.url )
			.query({ token: test.token });

			if ( test.body ) {
				query.send( test.body );
			}
			if ( test.filter ) {
				query.query({ filter: JSON.stringify( test.filter ) });
			}

			query.expect( test.code, done );
		})
	});
}

module.exports = {
	request: supertest( app ),
	internal: supertest( 'localhost:' + app.get( 'internalPort' ) ),
	app,
	defaultTests,
	testPerms
};
