const _ = require( 'lodash' );

module.exports = function( Characters ) {

	Characters.createOptionsFromRemotingContext = ( ctx ) => {

		if ( ! _.get( ctx, 'req.accessToken.id' ) ) {
			throw new Error( 'Invalid token provided' );
		}

		return {
			currentUserId: ctx.req.accessToken.id
		}
	};

	Characters.me = ( filter = {}, options, cb ) => {
		_.set( filter, 'where.userid', options.currentUserId );
		_.set( filter, 'where.type', 'PC' );
		Characters.find( filter, cb );
	};

	Characters.remoteMethod(
		'me', {
			http: { path: '/me', verb: 'get' },
			description: 'Returns array of characters of current user.',
			accessType: 'READ',
			accepts: [
				{ arg: 'filter', type: 'object', description: 'Filter defining fields, where, include, order, offset, and limit' },
				{ arg: 'options', type: 'object', http: 'optionsFromRequest' }
			],
			returns: { arg: 'data', type: [ Characters.modelName ], root: true }
		}
	);

	Characters.disableRemoteMethodByName( 'createChangeStream' );
};
