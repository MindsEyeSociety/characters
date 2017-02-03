const _ = require( 'lodash' );

const AuthError = require( '../helpers/errors' ).AuthError;
const RequestError = require( '../helpers/errors' ).RequestError;
const venues = _.map( require( '../fixtures/venues' ), 'id' );
const restoreWhere = require( '../helpers/queries' ).restoreWhere;

module.exports = function( Tag ) {

	/**
	 * Sets up validation.
	 */
	Tag.validatesInclusionOf( 'type', { in: [ 'NPC', 'PC' ] } );
	Tag.validatesInclusionOf( 'venue', { in: venues } );

	/**
	 * Sets up permissions.
	 */
	Tag.beforeRemote( 'find', restrictBefore );
	Tag.beforeRemote( 'findOne', restrictBefore );
	Tag.beforeRemote( 'count', restrictBefore );

	Tag.afterRemote( 'findById', restrictAfter );

	Tag.beforeRemote( 'create', restrictUpdateBefore );
	Tag.beforeRemote( 'upsert', restrictUpdateBefore );

	Tag.beforeRemote( 'deleteById', restrictDelete );

	/**
	 * Removes related modification endpoints.
	 */
	Tag.disableRemoteMethodByName( 'prototype.__create__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__delete__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__findById__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__destroyById__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__updateById__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__link__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__exists__characters' );
	Tag.disableRemoteMethodByName( 'prototype.__unlink__characters' );
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

	let type = _.get( ctx.args, 'filter.where.type' );

	if ( ! type ) {
		_.set( ctx.args, 'filter.where.type', 'PC' );
		restoreWhere( ctx.args );
		return next();
	} else if ( -1 === [ 'NPC', 'PC', 'all' ].indexOf( type ) ) {
		return next( RequestError( 'Invalid filter type' ) );
	}

	if ( 'PC' === type ) {
		restoreWhere( ctx.args );
		return next();
	} else if ( 'all' === type ) {
		delete ctx.args.filter.where.type;
	}

	let Tag = ctx.method.ctor;
	let hasPermission = Tag.checkPerms( 'npc_view', ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		next( AuthError() );
	} else {
		restoreWhere( ctx.args );
		next();
	}
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

	let Tag = ctx.method.ctor;
	let hasPermission = Tag.checkPerms( 'npc_view', ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		next( AuthError() );
	} else {
		next();
	}
}


/**
 * Restricts before an update query takes place.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictUpdateBefore( ctx, instance, next ) {
	let perms = _.get( ctx.req.accessToken, 'offices.1' );

	if ( ! perms || ! 'character_tag_edit' in perms ) {
		return next( AuthError() );
	}
	next();
}


/**
 * Restricts before a delete query takes place.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictDelete( ctx, instance, next ) {
	let perms = _.chain( ctx.args.options.offices ).values().flatten().uniq().value();

	for ( let perm of perms ) {
		if ( 'character_tag_delete' === perm || 'admin' === perm ) {
			return next();
		}
	}

	if ( ! ctx.args.id ) {
		return next( AuthError() );
	}

	let Tag = ctx.method.ctor;
	Tag.findById( ctx.args.id )
	.then( tag => {
		for ( let perm of perms ) {
			if ( `character_tag_delete_${tag.venue}` === perm ) {
				return next();
			}
		}
		return next( AuthError() );
	});
}
