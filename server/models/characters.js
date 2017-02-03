const _ = require( 'lodash' );

const AuthError = require( '../helpers/errors' ).AuthError;
const RequestError = require( '../helpers/errors' ).RequestError;
const queries = require( '../helpers/queries' );
const venues = _.map( require( '../fixtures/venues' ), 'id' );

module.exports = function( Character ) {

	Character.beforeRemote( 'find', restrictBefore );
	Character.beforeRemote( 'findOne', restrictBefore );
	Character.beforeRemote( 'count', restrictBefore );

	Character.afterRemote( 'findById', restrictAfter );

	// Validates creation of new objects.
	Character.beforeRemote( 'create', ( ctx, instance, next ) => {
		if ( _.has( ctx.args.data, 'id' ) ) {
			return next( RequestError( 'Cannot update model' ) );
		} else if ( 'NPC' === ctx.args.data.type && ctx.args.data.userid ) {
			return next( RequestError( 'NPCs cannot have users' ) );
		}
		next();
	});

	/**
	 * Sets up validation.
	 */
	Character.validatesInclusionOf( 'type', { in: [ 'NPC', 'PC' ] } );
	Character.validatesInclusionOf( 'venue', { in: venues } );

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


	Character.extraPerms = ( perms, token, ctx ) => {

		if (
			-1 !== perms.indexOf( '$self' ) &&
			token.id === _.get( ctx, 'args.data.userid' )
		) {
			return true;
		}
		return false
	}


	/**
	 * Gets user's own characters.
	 * @param {Object}   [filter={}] Filters.
	 * @param {Object}   options     Options object. Not used.
	 * @param {Function} cb          Callback.
	 * @return {void}
	 */
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
};

/**
 * Restricts before a query takes place. Used when there's no ID.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictBefore( ctx, instance, next ) {

	if ( _.has( ctx.args, 'where' ) ) {
		_.set( ctx.args, 'filter.where', ctx.args.where );
	}

	// Parses the query to get the type.
	let type = _.get( ctx.args, 'filter.where.type' );
	if ( ! type ) {
		let ands = _.get( ctx.args, 'filter.where.and', {} );
		let typeObj = _.find( ands, 'type' );
		if ( typeObj ) {
			type = typeObj.type;
		}
	}

	if ( ! type ) {
		// Default to showing PCs.
		_.set( ctx.args, 'filter.where.type', 'PC' );
		type = 'PC';
	} else if ( -1 === [ 'NPC', 'PC', 'all' ].indexOf( type ) ) {
		return next( RequestError( 'Invalid filter type' ) );
	}

	// Set permission required based off of type of character.
	let perms = 'character_view';
	if ( 'NPC' === type ) {
		perms = 'npc_view';
	} else if ( 'all' === type ) {
		delete ctx.args.filter.where.type;
		perms = [ 'character_view', 'npc_view' ];
	}

	let Character = ctx.method.ctor;
	let hasPermission = Character.checkPerms( perms, ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		return next( AuthError() );
	}

	getTree( ctx.req.accessToken )
	.then( ids => {
		if ( true === ids ) {
			return; // National has zero restrictions.
		}

		// Sets the org units allowed.
		queries.addWhere( ctx, { orgunit: { inq: ids } } );

	}).then( () => {
		queries.restoreWhere( ctx.args );
		next();
	});
}

/**
 * Restricts after a query takes place. Used when there's an ID.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictAfter( ctx, instance, next ) {
	if ( null === ctx.result || 'PC' === ctx.result.type ) {
		return next();
	}

	let Character = ctx.method.ctor;
	let hasPermission = Character.checkPerms( 'npc_view', ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		next( AuthError() );
	} else {
		next();
	}
}

/**
 * Gets an array of valid org units under a given office.
 * @param {Object} token The user token object.
 * @return {Array}
 */
function getTree( token ) {

	// Exit if it's a National officer.
	if ( -1 !== token.units.indexOf( 1 ) ) {
		return Promise.resolve( true );
	}

	const cache = require( '../helpers/cache' ).async;

	const iterateTree = ( tree, id ) => {
		if ( tree.id === id ) {
			return gatherTree( tree );
		}
		for ( let child of tree.children ) {
			let result = iterateTree( child, id );
			if ( result ) {
				return result;
			}
		}
	};

	const gatherTree = tree => [ tree.id ].concat( tree.children.map( gatherTree ) );

	return cache.get( 'org-tree' )
	.then( tree => token.units.map( unit => iterateTree( tree, unit ) ) )
	.then( tree => _.flattenDeep( tree ) );
}
