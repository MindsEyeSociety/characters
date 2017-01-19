'use strict';

/**
 * Removes all change stream functionality from all models.
 */
module.exports = function( app ) {
	let models = app.models;
	let names  = Object.keys( models );
	names.forEach( name => {
		models[ name ].disableRemoteMethodByName( 'createChangeStream' );
	});
}
