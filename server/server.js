'use strict';

const loopback = require( 'loopback' );
const boot     = require( 'loopback-boot' );

const app = module.exports = loopback();

app.start = () => app.listen(function() {
	app.emit( 'started' );
	let baseUrl = app.get( 'url' ).replace( /\/$/, '' );
	console.log( 'Web server listening at: %s', baseUrl );

	if ( app.get( 'loopback-component-explorer' ) ) {
		let explorerPath = app.get( 'loopback-component-explorer' ).mountPath;
		console.log( 'Browse your REST API at %s%s', baseUrl, explorerPath );
	}
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot( app, __dirname, function( err ) {
	if ( err ) {
		throw err;
	}

	app.use( loopback.token({
		params: [ 'token' ],
		cookies: [ 'token' ],
		headers: [ 'token', 'X-Token-Auth' ],
		model: app.registry.getModel( 'Tokens' )
	}) );

	// start the server if `$ node server.js`
	if ( require.main === module ) {
		app.start();
	}
});
