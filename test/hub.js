'use strict';

const _       = require( 'lodash' );
const inspect = require( 'util' ).inspect;
const debug   = require( 'debug' )( 'characters:testing' );

const responses = {
	'/user/me': {
		'user1': { id: 1 },
		'user2': { id: 2 },
		'default': { id: 10 },
		'invalid': false
	},
	'/office/me': {
		'nst': [{ parentOrgID: 1, roles: [ 'character_edit', 'character_tag_edit', 'character_tag_delete', 'npc_view', 'npc_edit', 'character_view' ], childrenOrgs: child( 1 ) }],
		'anst': [{ parentOrgID: 1, roles: [ 'character_edit_space', 'character_tag_edit_space', 'character_tag_delete_space', 'npc_view_space', 'npc_edit_space', 'character_view_space' ], childrenOrgs: child( 1 ) }],
		'dst': [{ parentOrgID: 3, roles: [ 'character_edit', 'character_view', 'npc_view', 'npc_edit' ], childrenOrgs: child( 3 ) }],
		'adst': [{ parentOrgID: 3, roles: [ 'character_view' ], childrenOrgs: child( 3 ) }],
		'vst': [{ parentOrgID: 4, roles: [ 'npc_view_cam-anarch', 'npc_edit_cam-anarch', 'character_view_cam-anarch', 'character_edit_cam-anarch' ], childrenOrgs: child( 4 ) }],
		'avst': [{ parentOrgID: 4, roles: [ 'npc_view_cam-anarch' ], childrenOrgs: child( 4 ) }],
		'otherDst': [{ parentOrgID: 6, roles: [ 'character_edit', 'character_view', 'npc_view', 'npc_edit' ], childrenOrgs: child( 6 ) }],
		'admin': [{ parentOrgID: 1, roles: [ 'admin' ], childrenOrgs: child( 1 ) }],
		'default': []
	}
};

/**
 * Fake User Hub response callback.
 * @param {String} url   URL being accessed.
 * @param {String} token Token being provided.
 * @return {Object}      Fake response.
 */
module.exports = function( url, token ) {

	debug( `Got request ${url} with token ${token}` );

	if ( '/office/me' === url && '_' === token.substr( 0, 1 ) ) {
		let org = 1;
		let role = '';
		if ( '_' === token.substr( -2, 1 ) ) {
			org = parseInt( token.substr( -1 ) );
			role = token.substring( 1, token.length - 2 );
		} else {
			role = token.substring( 1, token.length );
		}
		let resp = [{ parentOrgID: org, roles: [ role ] }];
		debug( 'Returning ' + inspect( resp ) );
		return resp;
	}

	if ( responses[ url ] ) {
		let resp = _.get( responses, `${url}.${token}`, responses[ url ].default );

		debug( 'Returning ' + inspect( resp ) );

		if ( false === resp ) {
			return Promise.reject( resp );
		} else {
			return resp;
		}
	}
	return {};
}


/**
 * Helper function to return array of units under org tree.
 * @param {Number} parent ID of parent org unit.
 * @return {Array}
 */
function child( parent ) {
	switch ( parent ) {
		case 1:
			return [ 2, 3, 4, 5, 6 ];
		case 2:
			return [ 3, 4, 5 ]
		case 3:
			return [ 4 ];
		default:
			return [];
	}
}
