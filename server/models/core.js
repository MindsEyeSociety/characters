const _ = require( 'lodash' );

const venues = _.map( require( '../fixtures/venues' ), 'id' );

module.exports = function( Core ) {

	/**
	 * Adds the user data to the remote context.
	 * @param {Object} ctx The remote invocation context.
	 * @return {Object}
	 */
	Core.createOptionsFromRemotingContext = ctx => {

		if ( ! _.get( ctx, 'req.accessToken.id' ) ) {
			return {};
		}

		return {
			currentUserId: ctx.req.accessToken.id,
			offices: ctx.req.accessToken.offices
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
	Core.checkAccess = ( token, modelId, sharedMethod, ctx, callback ) => {

		// Exit if we don't have a token.
		if ( ! token ) {
			return callback( null, false );
		}

		let acls = _.get( sharedMethod, 'ctor.settings.acls', {} );

		Core.looseCheck = true;
		let perm = false;

		if ( acls[ sharedMethod.name ] ) {
			perm = Core.checkPerms( acls[ sharedMethod.name ], token, ctx );
		} else if ( acls[ sharedMethod.accessType ] ) {
			perm = Core.checkPerms( acls[ sharedMethod.accessType ], token, ctx );
		}

		Core.looseCheck = false;
		callback( null, perm );
	};

	/**
	 * Gets an array of valid org units under a given office.
	 * @param {Object} token The user token object.
	 * @return {Array}
	 */
	Core.getTree = token => {

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
	};


	/**
	 * Checks the permissions for a given type of read.
	 * @param {Array|String} perms Array or string of permissions.
	 * @param {Object}       token Object of user data.
	 * @param {Object}       ctx   Context object.
	 * @return {boolean}
	 */
	Core.checkPerms = ( perms, token, ctx ) => {
		if ( '*' === perms ) {
			return true;
		}

		perms = Core.normalizePerms( perms, ctx );

		Core.looseCheck = false;

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
	Core.normalizePerms = ( perms, ctx = {} ) => {
		if ( _.isString( perms ) ) {
			perms = [ perms ];
		}

		let newPerms = [];
		if ( Core.looseCheck ) {
			perms.forEach( perm => {
				venues.forEach( venue => {
					newPerms.push( `${perm}_${venue}` );
				});
			});
		} else {
			let venue = _.get( ctx.args, 'filter.where.venue', false );
			if ( venue ) {
				perms.forEach( perm => {
					newPerms.push( `${perm}_${venue}` );
				});
			}
		}

		return _.concat( perms, newPerms, 'admin' );
	}
};
