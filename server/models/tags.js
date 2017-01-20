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

	Tag.afterRemote( 'findById', restrictAfter );
	Tag.afterRemote( 'exists', restrictAfter );

	Tag.beforeRemote( 'create', restrictUpdateBefore );
	Tag.beforeRemote( 'updateOrCreate', restrictUpdateBefore );
	Tag.beforeRemote( 'upsertWithWhere', restrictUpdateBefore );
	Tag.beforeRemote( 'upsert', restrictUpdateBefore );

	/**
	 * Sets up validation.
	 */
	Tag.validatesInclusionOf( 'type', { in: [ 'NPC', 'PC' ] } );
	Tag.validatesInclusionOf( 'venue', { in: venues } );
};

/**
 * Restricts before a query takes place. Used when there's no ID.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictBefore( ctx, instance, next ) {
	let type = _.get( ctx.args, 'filter.where.type' );

	if ( ! type ) {
		_.set( ctx.args, 'filter.where.type', 'PC' );
		return next();
	} else if ( 'PC' !== type && 'NPC' !== type ) {
		return next( new RequestError( 'Invalid filter type' ) );
	}

	if ( 'PC' === type ) {
		return next();
	}

	let Tag = ctx.method.ctor;
	let hasPermission = Tag.checkPerms( 'npc_view', ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		next( new AuthError() );
	} else {
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
	if ( 'PC' === ctx.result.type ) {
		return next();
	}

	let Tag = ctx.method.ctor;
	let hasPermission = Tag.checkPerms( 'npc_view', ctx.req.accessToken, ctx );

	if ( ! hasPermission ) {
		next( new AuthError() );
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
		return next( new AuthError() );
	}
	next();
}
