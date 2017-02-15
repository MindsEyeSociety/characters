'use strict';

const _       = require( 'lodash' );
const request = require( 'request-promise' );
const Promise = require( 'bluebird' );

const AuthError = require( '../helpers/errors' ).AuthError;

let host;

/**
 * Handles authorizer.
 * @param {Object}   req  Request object.
 * @param {Object}   res  Response object.
 * @param {Function} next Callback.
 * @return {void}
 */
function handleAuth( req, res, next ) {

	if ( ! ( 'auth-user' in req.headers ) ) {
		return next( AuthError() );
	}

	// Grab user data.
	let user = {};
	if ( req.headers['auth-user'] ) {
		user.id = parseInt( req.headers['auth-user'] );
	}
	if ( req.headers['auth-offices'] ) {
		user.offices = JSON.parse( req.headers['auth-offices'] );
	} else {
		user.offices = [];
	}
	req.accessToken = user;
	next();
}


/**
 * Handles token authorization.
 * @param {Object}   req  Request object.
 * @param {Object}   res  Response object.
 * @param {Function} next Callback.
 * @return {void}
 */
function handleToken( req, res, next ) {

	if ( ! ( 'token' in req.query ) ) {
		return next( AuthError() );
	}
	let token = req.query.token;

	return Promise.join(
		reqHub( '/user/me', token ),
		reqHub( '/office/me', token ),
		( user, offices ) => {
			if ( ! user.id ) {
				throw new Error( 'No user id found' );
			}

			offices.forEach( office => {
				office.childrenOrgs = office.childrenOrgs || [];
			});

			return {
				id: user.id,
				offices
			}
		}
	)
	.then( user => {
		req.accessToken = user;
		next();
	})
	.catch( err => {
		return next( AuthError( _.get( err, 'response.body.message' ) ) );
	});
	next();
}

/**
 * Requests data from the User Hub.
 * @param {String} url   String to query.
 * @param {String} token Token to use.
 * @return {Promise}
 */
function reqHub( url, token ) {
	if ( 'testing' === host ) {
		return require( '../../test/hub' )( url, token );
	}
	return request({
		url: host + url,
		qs: { token, offices: true, children: true },
		json: true
	});
}

/**
 * Handles both authorizer and token.
 * @param {Object}   req  Request object.
 * @param {Object}   res  Response object.
 * @param {Function} next Callback.
 * @return {void}
 */
function handleAll( req, res, next ) {

	// Don't require authorization for the Explorer.
	if ( 1 === req.path.indexOf( 'explorer' ) ) {
		return next();
	}

	handleAuth( req, res, err => {
		if ( err ) {
			return handleToken( req, res, next );
		}
		next();
	});
}


/**
 * Main export function.
 * @param {Object} params Loopback middleware options object.
 * @return {Function}
 */
module.exports = params => {
	host = params.hubUrl;

	if ( params.authorizer && params.token ) {
		return handleAll;
	} else if ( params.authorizer ) {
		return handleAuth;
	} else if ( params.token ) {
		return handleToken;
	}
}

module.exports.handleAuth = handleAuth;
module.exports.handleToken = handleToken;
