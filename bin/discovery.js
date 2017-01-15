const path = require( 'path' );
const fs   = require( 'fs' );

const app = require( path.resolve( __dirname, '../server/server' ) );
const ds  = app.datasources.mysql;

var count = 0;

function createSchema( err, schema ) {
	if ( err ) {
		return console.error( err );
	}
	let name = schema.name.toLowerCase();
	let file = path.resolve( __dirname, `../server/models/${name}.json` );
	fs.writeFile( file, JSON.stringify( schema, null, '\t' ), err => {
		if ( err ) {
			return console.error( err );
		}
		console.log( 'Saved', name );
		count++;
		if ( 4 === count ) {
			process.exit();
		}
	});
}

ds.discoverSchema( 'characters', createSchema );
ds.discoverSchema( 'tags', createSchema );
ds.discoverSchema( 'text_sheets', createSchema );
ds.discoverSchema( 'character_tags', createSchema );
