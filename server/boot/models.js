'use strict';

/**
 * Removes all change stream functionality from all models.
 */
module.exports = function( app ) {
	let models = app.models;
	let names  = Object.keys( models );
	names.forEach( name => {
		let model = models[ name ];
		model.disableRemoteMethodByName( 'upsertWithWhere' );
		model.disableRemoteMethodByName( 'createChangeStream' );
		model.disableRemoteMethodByName( 'updateAll' );
		model.disableRemoteMethodByName( 'replaceById' );
		model.disableRemoteMethodByName( 'replaceOrCreate' );
	});
}
