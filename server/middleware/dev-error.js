module.exports = () => function( err, req, res, next ) {

	require( 'pretty-error' ).start();

	console.error( err.stack );
	next( err );
};
