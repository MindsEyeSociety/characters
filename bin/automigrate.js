const path = require( 'path' );

const app = require( path.resolve( __dirname, '../server/server' ) );
const ds = app.datasources.mysql;

const models = [ 'Characters', 'CharacterTags', 'Tags', 'TextSheets' ];

models.forEach( model => {
	ds.automigrate( model, function( err ) {
		if ( err ) throw err;
		ds.disconnect();
	});
});
