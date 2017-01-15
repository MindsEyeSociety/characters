const path = require( 'path' );

const app = require( path.resolve( __dirname, '../server/server' ) );

const max = 4;

var seeded = 0;

function seed( table, data ) {
	let model = app.models[ table ];
	model.destroyAll( () => model.create( data, err => {
		if ( err ) {
			throw err;
		}
		console.log( `Finished seeding ${table}.` );
		seeded++;
		if ( max === seeded ) {
			process.exit();
		}
	}) );
}

seed( 'Characters', [
	{
		"userid": 1,
		"name": "Lark Perzy Winslow Pellettieri McPhee",
		"type": "PC",
		"venue": "Cam/Anarch",
		"orgunit": 4
	},
	{
		"userid": 2,
		"name": "Messingw",
		"type": "NPC",
		"venue": "Changeling",
		"orgunit": 4
	}
]);


seed( 'Tags', [
	{
		"name": "Toreador",
		"venue": "Cam/Anarch"
	},
	{
		"name": "Camarilla",
		"venue": "Cam/Anarch"
	},
	{
		"name": "Neonate",
		"venue": "Cam/Anarch"
	},
	{
		"name": "Actor",
		"venue": "Changeling",
		"type": "NPC"
	}
]);

seed( 'TextSheets', [
	{
		"characterid": 1,
		"sheet": "first sheet",
		"xp": "creation stuff",
		"background": "art and things",
		"modifiedat": "2017-01-01 00:00:00",
		"modifiedby": 1
	},
	{
		"characterid": 1,
		"sheet": "second sheet",
		"xp": "creation stuff; more stuff",
		"background": "art and things",
		"modifiedat": "2017-01-02 00:00:00",
		"modifiedby": 2
	},
	{
		"characterid": 2,
		"sheet": "actor sheet",
		"modifiedat": "2017-01-01 00:00:00",
		"modifiedby": 2
	}
]);

seed( 'CharacterTags', [
	{
		"characterid": 1,
		"tagid": 1
	},
	{
		"characterid": 1,
		"tagid": 2
	},
	{
		"characterid": 1,
		"tagid": 3
	},
	{
		"characterid": 2,
		"tagid": 4
	}
]);
