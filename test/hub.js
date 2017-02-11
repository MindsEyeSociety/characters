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
		'nst': [{ parentOrgID: 1, roles: [ 'character_edit', 'character_tag_edit', 'character_tag_delete', 'npc_view', 'npc_edit', 'character_view' ] }],
		'anst': [{ parentOrgID: 1, roles: [ 'character_edit_space', 'character_tag_edit_space', 'character_tag_delete_space', 'npc_view_space', 'npc_edit_space', 'character_view_space' ] }],
		'dst': [{ parentOrgID: 3, roles: [ 'character_edit', 'character_view', 'npc_view', 'npc_edit' ] }],
		'adst': [{ parentOrgID: 3, roles: [ 'character_view' ] }],
		'vst': [{ parentOrgID: 4, roles: [ 'npc_view_cam-anarch', 'npc_edit_cam-anarch', 'character_view_cam-anarch', 'character_edit_cam-anarch' ] }],
		'avst': [{ parentOrgID: 4, roles: [ 'npc_view_cam-anarch' ] }],
		'otherDst': [{ parentOrgID: 6, roles: [ 'character_edit', 'character_view', 'npc_view', 'npc_edit' ] }],
		'admin': [{ parentOrgID: 1, roles: [ 'admin' ] }],
		'default': []
	}
};

const tree = {
	id: 1,
	children: [
		{
			id: 2,
			children: [
				{
					id: 3,
					children: [{ id: 4, children: [] }]
				},
				{ id: 5, children: [] }
			]
		},
		{ id: 6, children: [] }
	]
};

/**
 * Fake User Hub response callback.
 * @param {String} url   URL being accessed.
 * @param {String} token Token being provided.
 * @return {Object}      Fake response.
 */
module.exports = function( url, token ) {

	debug( `Got request ${url} with token ${token}` );

	if ( 'tree' === url ) {
		return tree;
	}

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
