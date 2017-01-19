const _ = require( 'lodash' );

const cache = require( '../helpers/cache' ).async;

module.exports = function( Characters ) {

	Characters.beforeRemote( 'find', ( ctx, instance, next ) => {
		cache.get( 'org-tree' )
		.then( tree => {
			console.log( tree );
			console.log( 'here', ctx.req.accessToken );
			next();
		});
	});

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
};
