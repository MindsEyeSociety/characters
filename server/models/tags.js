const _ = require( 'lodash' );

const AuthError = require( '../helpers/errors' ).AuthError;
const RequestError = require( '../helpers/errors' ).RequestError;
const venues = _.map( require( '../fixtures/venues' ), 'id' );

module.exports = function( Tag ) {

	/**
	 * Sets up permissions.
	 */
	Tag.beforeRemote( 'find', restrictBefore );
	Tag.beforeRemote( 'findOne', restrictBefore );
	Tag.beforeRemote( 'count', restrictBefore );

	Tag.afterRemote( 'findById', restrictAfter );

	Tag.beforeRemote( 'create', restrictUpdateBefore );
	Tag.beforeRemote( 'upsert', restrictUpdateBefore );

	Tag.observe( 'before save', ( ctx, next ) => {
		if ( Tag.bypassPerms ) {
			Tag.bypassPerms = false;
			return next();
		}

		let perms = [ 'character_tag_edit' ];
		let venue;

		if ( ctx.isNewInstance && ctx.instance.venue ) {
			venue = ctx.instance.venue;
		} else if ( ctx.currentInstance ) {
			venue = ctx.currentInstance.venue;
		} else if ( ctx.instance ) {
			venue = ctx.instance.venue;
		}

		if ( venue ) {
			perms.push( `character_tag_edit_${venue}` );
		}

		let hasPermission = Tag.checkPerms(
			perms,
			{ offices: _.get( ctx.options, 'offices' ) }
		);

		if ( ! hasPermission ) {
			next( AuthError() );
		} else {
			next();
		}
	});

	Tag.observe( 'before delete', ( ctx, next ) => {
		if ( Tag.bypassPerms ) {
			Tag.bypassPerms = false;
			return next();
		}

		let offices = { offices: _.get( ctx.options, 'offices' ) };

		if ( Tag.checkPerms( 'character_tag_delete', offices ) ) {
			return next();
		}

		if ( ! ctx.where.id ) {
			return next( AuthError() );
		}

		Tag.findById( ctx.where.id )
		.then( tag => {
			if ( Tag.checkPerms( 'character_tag_delete_' + tag.venue, offices ) ) {
				return next();
			}
			return next( AuthError() );
		});
	});

	/**
	 * Sets up validation.
	 */
	Tag.validatesInclusionOf( 'type', { in: [ 'NPC', 'PC' ] } );
	Tag.validatesInclusionOf( 'venue', { in: venues } );

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

	/**
	 * Sets up a way to completely bypass permissions.
	 * @return {Tag}
	 */
	Tag.bypass = function() {
		Tag.bypassPerms = true;
		return Tag;
	}
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

function restoreWhere( args ) {
	if ( ! _.has( args, 'where' ) ) {
		return;
	}

	args.where = args.filter.where;
	delete args.filter;
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
