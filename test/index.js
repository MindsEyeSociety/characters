'use strict';

/* eslint-env node, mocha */

before( 'seed', function( done ) {
	require( '../bin/seed' )( done );
});

describe( 'Characters', require( './characters' ) );

describe( 'Tags', require( './tags' ) );
