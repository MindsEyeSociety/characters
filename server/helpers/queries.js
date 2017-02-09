'use strict';

const _ = require( 'lodash' );

/**
 * Parsers for filter queries.
 */

/**
 * Adds a where conditional to a query.
 * @param {Object} ctx   The context object.
 * @param {Object} where Where object to add.
 * @return {Object}
 */
module.exports.addWhere = function( ctx, where ) {
	if ( _.has( ctx, 'args.filter.where' ) ) {
		ctx.args.filter.where = {
			and: [ ctx.args.filter.where, where ]
		};
	} else if ( _.has( ctx, 'args.where' ) ) {
		ctx.args.where = {
			and: [ ctx.args.where, where ]
		};
	} else {
		_.set( ctx, 'args.filter.where', where );
	}
	return ctx;
}


/**
 * Returns a key within the filter context.
 * @param {Object} ctx Context object.
 * @param {String} key Key to look for.
 * @return {mixed}
 */
module.exports.findWhere = function ( ctx, key ) {
	if (
		! _.has( ctx.args, 'filter.where' ) &&
		! _.has( ctx.args, 'where' )
	) {
		return false;
	}

	let where = _.get( ctx.args, 'filter.where', ctx.args.where );
	let found;

	if ( _.has( where, key ) ) {
		return where[ key ];
	} else if ( _.has( where, 'and' ) ) {
		found = _.filter( where.and, o => _.has( o, key ) );
	} else if ( _.has( where, 'or' ) ) {
		found = _.filter( where.or, o => _.has( o, key ) );
	}

	if ( _.isArray( found ) && found.length ) {
		return found[0][ key ];
	}
	return false;
}


/**
 * Restores the default where query. For counts.
 * @param {Object} args Argument object.
 * @return {void}
 */
module.exports.restoreWhere = function( args ) {
	if ( ! _.has( args, 'where' ) ) {
		return;
	}

	args.where = args.filter.where;
	delete args.filter;
}
