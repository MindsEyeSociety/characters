const _ = require( 'lodash' );

module.exports = function( Core ) {

	/**
	 * Adds the user data to the remote context.
	 * @param {Object} ctx The remote invocation context.
	 * @return {Object}
	 */
	Core.createOptionsFromRemotingContext = ctx => {

		if ( ! _.get( ctx, 'req.accessToken.id' ) ) {
			throw new Error( 'Invalid token provided' );
		}

		return {
			currentUserId: ctx.req.accessToken.id
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
		let acls = _.get( sharedMethod, 'ctor.settings.acls', {} );

		if ( acls[ sharedMethod.name ] ) {
			callback( null, Core.checkPerms( acls[ sharedMethod.name ], token, ctx ) );
		} else if ( acls[ sharedMethod.accessType ] ) {
			callback( null, Core.checkPerms( acls[ sharedMethod.accessType ], token, ctx ) );
		} else {
			callback( null, false );
		}
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

		perms = Core.normalizePerms( perms, ctx.args );

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
	 * @param {Object}       args  Array of arguments passed to method.
	 * @return {Array}
	 */
	Core.normalizePerms = ( perms, args ) => {
		if ( _.isString( perms ) ) {
			perms = [ perms ];
		}

		let venue    = _.get( args, 'filter.where.venue', false );
		let newPerms = [];
		if ( venue ) {
			perms.forEach( perm => {
				newPerms.push( `${perm}_${venue}` );
			});
		}

		return _.concat( perms, newPerms, 'admin' );
	}
};