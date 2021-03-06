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

	let settings = {};
	if ( _.isPlainObject( url ) ) {
		settings = url;
		url = settings.url;
		method = settings.method || method;
	}

	let request = supertest( app );
	tests.forEach( test => {
		_.defaults( test, {
			code: 403,
			token: 'user1',
			url: url
		});
		let start = 'fails if';
		if ( test.code < 300 ) {
			start = 'works if';
		}

		if ( settings.verb ) {
			start += ' ' + settings.verb;
		}

		if ( test.id ) {
			test.url = test.url.replace( '%id', test.id );
		}
		if ( test.fk ) {
			test.url = test.url.replace( '%fk', test.fk );
		}

		it( `${start} ${test.text}`, function( done ) {
			let query = request[ method ]( test.url )
			.query({ token: test.token });

			if ( test.body ) {
				query.send( test.body );
			}
			if ( test.filter ) {
				query.query({ filter: JSON.stringify( test.filter ) });
			} else if ( test.where ) {
				query.query({ filter: JSON.stringify({ where: test.where }) });
			} else if ( test.query ) {
				query.query( test.query );
			}

			if ( ! test.debug ) {
				query.expect( test.code, done );
			} else {
				query.expect( test.code )
				.end( ( err, resp ) => {
					console.log( resp.statusCode, resp.body );
					done();
				});
			}
		})
	});
}

function cloneWith( obj, key, value ) {
	if ( ! _.isPlainObject( key ) ) {
		key = { [ key ]: value };
	}
	return Object.assign( {}, obj, key );
}

module.exports = {
	request: supertest( app ),
	internal: supertest( 'localhost:' + app.get( 'internalPort' ) ),
	app,
	defaultTests,
	testPerms,
	cloneWith
};
