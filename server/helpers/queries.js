'use strict';

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


module.exports.findWhere = function( ctx, key ) {
	if ( ! _.has( ctx, 'args.filter.where' ) ) {
		return false;
	}

	let where = ctx.args.filter.where;

	if ( _.has( where, key ) ) {
		return where.key;
	} else if ( _.has( where, 'and' ) ) {

	}
}
