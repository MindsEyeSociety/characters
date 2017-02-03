'use strict';

const _ = require( 'lodash' );

const findWhere = require( '../helpers/queries' ).findWhere;

module.exports = function( Model ) {

	/**
	 * Adds the user data to the remote context.
	 * @param {Object} ctx The remote invocation context.
	 * @return {Object}
	 */
	Model.createOptionsFromRemotingContext = ctx => {

		if ( ! _.get( ctx, 'req.accessToken.id' ) ) {
			return {};
		}

		return {
			currentUserId: ctx.req.accessToken.id,
			offices: ctx.req.accessToken.offices,
		}
	};

	/**
	 * Check if the given access token can invoke the specified method.
	 *
	 * This method only checks if a user has the correct roles,
	 * but doesn't check specific inheritance for a given office.
	 *
	 * @param {AccessToken} token The access token.
	 * @param {*} modelId The model ID.
	 * @param {SharedMethod} sharedMethod The method in question.
	 * @param {Object} ctx The remote invocation context.
	 * @callback {Function} callback The callback function.
	 * @param {String|Error} err The error object.
	 * @param {Boolean} allowed True if the request is allowed; false otherwise.
	 */
	Model.checkAccess = ( token, modelId, sharedMethod, ctx, callback ) => {

		// Exit if we don't have a token.
		if ( ! token ) {
			return callback( null, false );
		}

		let acls = _.get( sharedMethod, 'ctor.settings.acls', {} );
		let perm = false;

		if ( acls[ sharedMethod.name ] ) {
			perm = Model.checkPerms( acls[ sharedMethod.name ], token, ctx );
		} else if ( acls[ sharedMethod.accessType ] ) {
			perm = Model.checkPerms( acls[ sharedMethod.accessType ], token, ctx );
		}

		callback( null, perm );
	};


	/**
	 * Checks the permissions for a given type of read.
	 * @param {Array|String} perms Array or string of permissions.
	 * @param {Object}       token Object of user data.
	 * @param {Object}       ctx   Context object.
	 * @return {boolean}
	 */
	Model.checkPerms = ( perms, token, ctx ) => {
		// Universal bypass.
		if ( '*' === perms ) {
			return true;
		}

		// Adds hook for models to do additional checks.
		if (
			'function' === typeof Model.extraPerms &&
			Model.extraPerms( perms, token, ctx )
		) {
			return true;
		}

		perms = Model.normalizePerms( perms, ctx );

		let units = [];
		for ( let office in token.offices ) {
			if ( _.intersection( token.offices[ office ], perms ).length ) {
				units.push( parseInt( office ) );
			}
		}

		token.units = units;

		return !! units.length;
	}


	/**
	 * Normalizes permissions.
	 * @param {Array|String} perms List of permissions to normalize.
	 * @param {Object}       ctx   Context object.
	 * @return {Array}
	 */
	Model.normalizePerms = ( perms, ctx = {} ) => {
		if ( _.isString( perms ) ) {
			perms = [ perms ];
		}

		let newPerms = [];
		let venue = _.get( ctx, 'args.data.venue', findWhere( ctx, 'venue' ) );
		if ( venue ) {
			perms.forEach( perm => {
				newPerms.push( `${perm}_${venue}` );
			});
		} else if ( 'deleteById' === ctx.method.name ) {
			let venues = _.map( require( '../fixtures/venues' ), 'id' );
			perms.forEach( perm => {
				venues.forEach( venue => {
					newPerms.push( `${perm}_${venue}` );
				});
			});
		}

		return _.concat( perms, newPerms, 'admin' );
	}

	/**
	 * Sets up a way to completely bypass permissions.
	 * @return {Model}
	 */
	Model.bypass = function() {
		Model.bypassPerms = true;
		return Model;
	}
}
