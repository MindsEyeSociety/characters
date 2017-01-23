const app = require( '../server/server' );
const ds  = app.datasources.mysql;

const models = [ 'Characters', 'CharacterTags', 'Tags', 'TextSheets' ];

models.forEach( model => {
	ds.automigrate( model, function( err ) {
		if ( err ) {
			throw err;
		}
		ds.disconnect();
	});
});
