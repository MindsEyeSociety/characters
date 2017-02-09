const _ = require( 'lodash' );

const AuthError = require( '../helpers/errors' ).AuthError;
const RequestError = require( '../helpers/errors' ).RequestError;
const queries = require( '../helpers/queries' );
const venues = _.map( require( '../fixtures/venues' ), 'id' );

module.exports = function( Character ) {

	Character.beforeRemote( 'find', restrictBefore );
	Character.beforeRemote( 'findOne', restrictBefore );
	Character.beforeRemote( 'count', restrictBefore );

	Character.afterRemote( 'findById', restrictFind );

	Character.beforeRemote( 'replaceById', restrictUpdate );
	Character.beforeRemote( 'deleteById', restrictDelete );

	Character.beforeRemote( 'prototype.__get__tags', restrictRelated );
	Character.beforeRemote( 'prototype.__count__tags', restrictRelated );
	Character.beforeRemote( 'prototype.__link__tags', restrictRelated );
	Character.beforeRemote( 'prototype.__link__tags', restrictLinkTag );
	Character.beforeRemote( 'prototype.__unlink__tags', restrictRelated );

	Character.beforeRemote( 'prototype.__get__textSheets', restrictRelated );
	Character.beforeRemote( 'prototype.__findById__textSheets', restrictRelated );
	Character.beforeRemote( 'prototype.__count__textSheets', restrictRelated );
	Character.beforeRemote( 'prototype.__create__textSheets', restrictRelated );

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
	Character.disableRemoteMethodByName( 'prototype.__exists__tags' );

	Character.disableRemoteMethodByName( 'prototype.__delete__textSheets' );
	Character.disableRemoteMethodByName( 'prototype.__destroyById__textSheets' );
	Character.disableRemoteMethodByName( 'prototype.__updateById__textSheets' );


	// Sets extra permissions.
	Character.extraPerms = ( perms, token, ctx ) => {

		if ( -1 !== perms.indexOf( '$self' ) ) {
			let method = ctx.method.name;
			if ( 'replaceById' === method || 'deleteById' === method ) {
				return true;
			} else if (
				'findById' === method ||
				token.id === _.get( ctx, 'args.data.userid' )
			) {
				return true;
			}
		}
		return false;
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

	/**
	 * Overrides default remote methods.
	 */

	// Validates creation of new objects.
	Character.beforeRemote( 'create', ( ctx, instance, next ) => {
		if ( _.has( ctx.args.data, 'id' ) ) {
			return next( RequestError( 'Cannot update model' ) );
		} else if ( 'NPC' === ctx.args.data.type && ctx.args.data.userid ) {
			return next( RequestError( 'NPCs cannot have users' ) );
		}
		next();
	});

	// Sets default scope of single character.
	Character.beforeRemote( 'findById', ( ctx, instance, next ) => {
		if ( ! _.has( ctx.args, 'filter.include' ) ) {
			_.set( ctx.args, 'filter.include', [
				{ relation: 'textSheets', scope: { order: 'modifiedat DESC', limit: 1 } }
			] );
		}
		next();
	});

	// Auto-populates modified data for new sheets.
	Character.beforeRemote( 'prototype.__create__textSheets', ( ctx, instance, next ) => {
		_.set( ctx.args.data, 'modifiedby', ctx.args.options.currentUserId );
		_.unset( ctx.args.data, 'character' );
		_.unset( ctx.args.data, 'modifiedat' );
		next();
	});

	// Set characters inactive instead of deleting.
	Character.once( 'attached', () => {
		Character.deleteById = function( id, options, callback ) {
			Character.findById( id, ( err, char ) => {
				if ( err ) {
					return callback( err );
				}
				char.updateAttribute( 'active', false, callback );
			});
		}
	});
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
	let type = queries.findWhere( ctx, 'type' );

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

	Character.getTree( ctx.req.accessToken.units )
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
function restrictFind( ctx, instance, next ) {
	if ( null === ctx.result ) {
		return next();
	}

	// Check if the user is getting their own character.
	if ( _.get( ctx.result, 'userid' ) === ctx.req.accessToken.id ) {
		return next();
	}

	// Iterate through permissions again now that we have the venue.
	let perm    = 'PC' === ctx.result.type ? 'character_view' : 'npc_view';
	let orgUnit = _.get( ctx.result, 'orgunit', 1 );

	_.set( ctx, 'args.data.venue', ctx.result.venue );

	checkPerms( perm, ctx, orgUnit )
	.then( result => {
		if ( ! result ) {
			return next( AuthError() );
		} else {
			return next();
		}
	})
	.catch( err => next( err ) );
}


/**
 * Restricts before an update takes place.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictUpdate( ctx, instance, next ) {
	let data = ctx.args.data;
	let user = ctx.args.options;
	let Character = ctx.method.ctor;

	if ( _.isEmpty( data ) ) {
		return next(); // Let Loopback handler take care of this.
	}

	if ( 'PC' === data.type && ! data.userid ) {
		return next( RequestError( 'PCs require an associated user ID' ) );
	} else if ( 'NPC' === data.type && data.userid ) {
		return next( RequestError( 'NPCs cannot have an associated user ID' ) );
	}

	Character.bypass().findById( ctx.req.params.id )
	.then( char => {

		// Make sure locked data isn't changed.
		if ( data.type !== char.type ) {
			return next( RequestError( 'Cannot change character type' ) );
		} else if ( data.venue !== char.venue ) {
			return next( RequestError( 'Cannot change character venue' ) );
		} else if ( char.userid && data.userid !== char.userid ) {
			return next( RequestError( 'Cannot change character user ID' ) );
		} else if ( data.orgunit !== char.orgunit ) {
			return next( RequestError( 'Cannot change associated org unit' ) );
		}

		// Users can update their own character.
		if ( user.currentUserId === char.userid ) {
			return next();
		}

		let perm = 'character_edit';
		if ( 'NPC' === char.type ) {
			perm = 'npc_edit';
		}
		return checkPerms( perm, ctx, char.orgunit )
		.then( result => {
			if ( ! result ) {
				return next( AuthError() );
			} else {
				return next();
			}
		});
	})
	.catch( err => next( err ) );
}


/**
 * Restricts before an update takes place.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictDelete( ctx, instance, next ) {
	let user = ctx.args.options;
	let Character = ctx.method.ctor;

	Character.bypass().findById( ctx.args.id )
	.then( char => {

		// Users can delete their own character.
		if ( user.currentUserId === char.userid ) {
			return next();
		}

		let perm = 'character_edit';
		if ( 'NPC' === char.type ) {
			perm = 'npc_edit';
		}
		_.set( ctx, 'args.data.venue', char.venue );

		return checkPerms( perm, ctx, char.orgunit )
		.then( result => {
			if ( ! result ) {
				return next( AuthError() );
			} else {
				return next();
			}
		});
	})
	.catch( err => next( err ) );
}


/**
 * Restricts access to tags of a given character.
 * @param {Object}   ctx      Loopback context object.
 * @param {Object}   instance The instance object.
 * @param {Function} next     Callback.
 * @return {void}
 */
function restrictRelated( ctx, instance, next ) {
	let Character = ctx.method.ctor;

	Character.bypass().findById( ctx.req.params.id )
	.then( char => {

		// Saves a reference for the restrictLinkTag method.
		_.set( ctx.args, 'data.character', char );

		// Users can delete their own character.
		if ( ctx.args.options.currentUserId === char.userid ) {
			return next();
		}

		let perm = 'PC' === char.type ? 'character_' : 'npc_';
		if ( '__create__textSheets' === ctx.method.name ) {
			perm += 'edit';
		} else {
			perm += 'view';
		}
		_.set( ctx, 'args.data.venue', char.venue );

		return checkPerms( perm, ctx, char.orgunit )
		.then( result => {
			if ( ! result ) {
				return next( AuthError() );
			} else {
				return next();
			}
		});
	})
	.catch( err => next( err ) );
}


function restrictLinkTag( ctx, instance, next ) {
	let Tag = ctx.method.ctor.app.models.Tags;
	let char = ctx.args.data.character;

	Tag.bypass().findById( ctx.req.params.fk )
	.then( tag => {
		if ( ! tag ) {
			return next({
				statusCode: 404,
				message: 'Tag not found',
				code: 'MODEL_NOT_FOUND'
			})
		}

		if ( char.venue !== tag.venue || char.type !== tag.type ) {
			return next( RequestError() );
		}
		return next();
	})
	.catch( err => next( err ) );
}


/**
 * Checks permissions for entire tree.
 * @param {Array|String} perms Permission(s) to check.
 * @param {Object} ctx         Loopback context object.
 * @param {Number} orgunit     ID of valid org unit.
 * @return {Promise}
 */
function checkPerms( perms, ctx, orgunit ) {
	let Character = ctx.method.ctor;

	perms   = Character.normalizePerms( perms, ctx );
	orgunit = orgunit || 1;

	let units = [];
	let offices = ctx.args.options.offices;
	for ( let office in ctx.args.options.offices ) {
		if ( _.intersection( offices[ office ], perms ).length ) {
			units.push( parseInt( office ) );
		}
	}

	if ( ! units.length ) {
		return Promise.resolve( false );
	}

	if ( -1 !== units.indexOf( 1 ) ) {
		return Promise.resolve( true );
	}

	return Character.getTree( units )
	.then( ids => {
		if ( -1 !== ids.indexOf( orgunit ) ) {
			return Promise.resolve( true );
		}
		return Promise.resolve( false );
	});
}
