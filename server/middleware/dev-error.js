module.exports = () => function( err, req, res, next ) {

	require( 'pretty-error' ).start();

	if ( err.stack ) {
		console.error( err.stack );
	}
	next( err );
};
