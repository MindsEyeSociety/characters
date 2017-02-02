const Promise = require( 'bluebird' );
const debug = require( 'debug' )( 'characters' );

const app = require( '../server/server' );

function seed( table, data ) {
	let model = app.models[ table ];
	let oldPerms = model.checkPerms;
	model.checkPerms = () => true;
	return model.destroyAll( () => model.create( data, err => {
		debug( `Seeded ${table}.` );
		if ( err ) {
			throw err;
		}
		model.checkPerms = oldPerms;
		return model;
	}) );
}

var promises = [];

promises.push( seed( 'Characters', [
	{
		'id': 1,
		'userid': 1,
		'orgunit': 4,
		'name': 'Lark Perzy Winslow Pellettieri McPhee',
		'type': 'PC',
		'venue': 'cam-anarch'
	},
	{
		'id': 2,
		'userid': 2,
		'orgunit': 4,
		'name': 'Messingw',
		'type': 'NPC',
		'venue': 'space'
	},
	{
		'id': 3,
		'userid': 1,
		'orgunit': 2,
		'name': 'Codes with Fury',
		'type': 'PC',
		'venue': 'apoc'
	}
]) );


promises.push( seed( 'Tags', [
	{
		'name': 'Toreador',
		'venue': 'cam-anarch'
	},
	{
		'name': 'Camarilla',
		'venue': 'cam-anarch'
	},
	{
		'name': 'Neonate',
		'venue': 'cam-anarch'
	},
	{
		'name': 'Actor',
		'venue': 'space',
		'type': 'NPC'
	},
	{
		'name': 'Mage',
		'venue': 'cam-anarch',
		'type': 'NPC'
	}
]) );

promises.push( seed( 'TextSheets', [
	{
		'characterid': 1,
		'sheet': 'first sheet',
		'xp': 'creation stuff',
		'background': 'art and things',
		'modifiedat': '2017-01-01 00:00:00',
		'modifiedby': 1
	},
	{
		'characterid': 1,
		'sheet': 'second sheet',
		'xp': 'creation stuff; more stuff',
		'background': 'art and things',
		'modifiedat': '2017-01-02 00:00:00',
		'modifiedby': 2
	},
	{
		'characterid': 2,
		'sheet': 'actor sheet',
		'modifiedat': '2017-01-01 00:00:00',
		'modifiedby': 2
	}
]) );

promises.push( seed( 'CharacterTags', [
	{
		'characterid': 1,
		'tagid': 1
	},
	{
		'characterid': 1,
		'tagid': 2
	},
	{
		'characterid': 1,
		'tagid': 3
	},
	{
		'characterid': 2,
		'tagid': 4
	}
]) );

let main = module.exports = function( done ) {
	return Promise.all( promises )
	.then( () => done() );
}

if ( require.main === module ) {
	main( () => {
		console.log( `Seeded ${promises.length} tables.` );
		process.exit();
	});
}
