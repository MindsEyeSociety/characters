'use strict';

const _         = require( 'lodash' );
const request   = require( 'request-promise' );
const Promise   = require( 'bluebird' );

const cache     = require( '../helpers/cache' ).async;
const AuthError = require( '../helpers/errors' ).AuthError;

/**
 * Gets a tree of org units and cache it.
 * @param {String} token Valid token.
 * @param {String} host  URL of user hub.
 * @return {Array}
 */
function getOrgTree( token, host ) {

	const walkUnits = ( memo, unit ) => {
		let map = { id: unit.id, children: [] };
		if ( unit.children.length ) {
			map.children = unit.children.reduce( walkUnits, [] );
		}
		memo.push( map );
		return memo;
	};

	let server = require( '../server' );

	if ( 'testing' === server.get( 'env' ) ) {
		return require( '../../test/hub' )( 'tree' );
	}

	return cache.get( 'org-tree' )
	.then( tree => {
		if ( tree ) {
			return tree;
		}
		return request({
			url: host + '/org-unit/1',
			qs: { token },
			json: true
		})
		.then( resp => ({
			id: resp.unit.id,
			children: resp.children.reduce( walkUnits, [] )
		}) )
		.then( tree => cache.set( 'org-tree', tree ) );
	});
}

module.exports = function( Token ) {

	const host = Token.settings.hub;

	Token.findForRequest = ( req, options, cb ) => {

		let token;

		if ( 'token' in req.cookies ) {
			token = req.cookies.token;
		} else if ( 'token' in req.query ) {
			token = req.query.token;
		}

		if ( ! token ) {
			return cb( AuthError() );
		}

		const reqHub = url => {
			if ( 'testing' === Token.app.get( 'env' ) ) {
				return require( '../../test/hub' )( url, token );
			}
			return request({
				url: host + url,
				qs: { token },
				json: true
			});
		};

		return Promise.join(
			reqHub( '/user/me' ),
			reqHub( '/office/me' ),
			getOrgTree( req.query.token, host ),
			( user, offices ) => {
				if ( ! user.id ) {
					return cb( new Error( 'No user id found' ) );
				}
				offices = _.chain( offices )
				.keyBy( 'parentOrgID' )
				.mapValues( 'roles' )
				.value();

				return {
					id: user.id,
					offices
				}
			}
		)
		.then( user => cb( null, user ) )
		.catch( err => {
			console.log( 'Error:', err );
			return cb( AuthError( _.get( err, 'response.body.message' ) ) );
		});
	};
};
