'use strict';

const _ = require( 'lodash' );

/**
 * Sets up authentication for models.
 */
module.exports = function( app ) {

	let remotes = app.remotes();

	remotes.authorization = function( ctx, next ) {
		let Model = ctx.method.ctor;
		let modelId = undefined;
		let idTypes = [ 'instance', 'req.params', 'req.body', 'req.query' ];

		for ( let type of idTypes ) {
			let id = _.get( ctx, type + '.id' );
			if ( id ) {
				modelId = id;
				break;
			}
		}

		if ( Model.checkAccess ) {
			Model.checkAccess(
				ctx.req.accessToken,
				modelId,
				ctx.method,
				ctx,
				( err, allowed ) => {
					if ( err ) {
						console.log( err );
						next( err );
					} else if ( allowed ) {
						next();
					} else {
						let e = new Error( 'Access Denied' );
						e.statusCode = 403;
						e.code = 'ACCESS_DENIED';
						next( e );
					}
				}
			);
		} else {
			next();
		}
	};
};
