'use strict';

module.exports = function( Venues ) {
	Venues.get = cb => {
		cb( null, require( '../fixtures/venues' ) );
	};

	Venues.remoteMethod(
		'get', {
			http: { path: '/', verb: 'get' },
			description: 'Returns array of venues.',
			accessType: 'READ',
			returns: { arg: 'data', type: [ Venues.modelName ], root: true }
		}
	);
};
