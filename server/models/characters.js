const _ = require( 'lodash' );

module.exports = function( Characters ) {
	Characters.me = ( filter = {}, cb ) => {
		_.set( filter, 'where.userid', 1 );
		_.set( filter, 'where.type', 'PC' );
		Characters.find( filter, cb );
	};
	Characters.remoteMethod(
		'me', {
			http: { path: '/me', verb: 'get' },
			description: 'Returns array of characters of current user.',
			accessType: 'READ',
			accepts: { arg: 'filter', type: 'object', description: 'Filter defining fields, where, include, order, offset, and limit' },
			returns: { arg: 'data', type: [ Characters.modelName ], root: true }
		}
	);

	Characters.disableRemoteMethodByName( 'createChangeStream' );
};
