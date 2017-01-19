const _ = require( 'lodash' );

const venues = _.map( require( '../fixtures/venues.json' ), 'id' );

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
			callback( null, checkPerms( acls[ sharedMethod.name ], token ) );
		} else if ( acls[ sharedMethod.accessType ] ) {
			callback( null, checkPerms( acls[ sharedMethod.accessType ], token ) );
		} else {
			callback( null, false );
		}
	};
};


/**
 * Checks the permissions for a given type of read.
 * @param {Array|String} perms Array or string of permissions.
 * @param {Object}       token Object of user data.
 * @return {boolean}
 */
function checkPerms( perms, token ) {
	if ( '*' === perms ) {
		return true;
	}

	if ( _.isString( perms ) ) {
		perms = [ perms ];
	}

	_.flatMap( perms, perm => {
		venues.forEach( venue => {
			perms.push( perm + '_' + venue );
		});
	});
	perms.push( 'admin' );

	let userPerm = _.flatMap( token.offices );

	return !! _.intersection( perms, userPerm ).length;
}
