const _ = require( 'lodash' );

module.exports = function( Character ) {

	Character.beforeRemote( 'find', ( ctx, instance, next ) => {
		Character.getTree( ctx.req.accessToken )
		.then( ids => {
			_.set( ctx.args, 'filter.where.orgunit.inq', ids );
			next();
		});
	});

	Character.me = ( filter = {}, options, cb ) => {
		_.set( filter, 'where.userid', options.currentUserId );
		_.set( filter, 'where.type', 'PC' );
		Character.find( filter, cb );
	};

	Character.remoteMethod(
		'me', {
			http: { path: '/me', verb: 'get' },
			description: 'Returns array of characters of current user.',
			accessType: 'READ',
			accepts: [
				{ arg: 'filter', type: 'object', description: 'Filter defining fields, where, include, order, offset, and limit' },
				{ arg: 'options', type: 'object', http: 'optionsFromRequest' }
			],
			returns: { arg: 'data', type: [ Character.modelName ], root: true }
		}
	);

	/**
	 * Removes related modification endpoints.
	 */
	Character.disableRemoteMethodByName( 'prototype.__create__tags' );
	Character.disableRemoteMethodByName( 'prototype.__delete__tags' );
	Character.disableRemoteMethodByName( 'prototype.__findById__tags' );
	Character.disableRemoteMethodByName( 'prototype.__destroyById__tags' );
	Character.disableRemoteMethodByName( 'prototype.__updateById__tags' );
	Character.disableRemoteMethodByName( 'prototype.__link__tags' );
	Character.disableRemoteMethodByName( 'prototype.__exists__tags' );
	Character.disableRemoteMethodByName( 'prototype.__unlink__tags' );

	Character.disableRemoteMethodByName( 'prototype.__delete__textSheets' );
	Character.disableRemoteMethodByName( 'prototype.__destroyById__textSheets' );
	Character.disableRemoteMethodByName( 'prototype.__updateById__textSheets' );
};
