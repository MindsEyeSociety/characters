'use strict';

const _       = require( 'lodash' );
const inspect = require( 'util' ).inspect;
const debug   = require( 'debug' )( 'characters:testing' );

const responses = {
	'/user/me': {
		'user1': { id: 1 },
		'user2': { id: 2 },
		'default': { id: 3 },
		'invalid': new Error()
	},
	'/office/me': {
		'nst': [{ parentOrgID: 1, roles: [ 'character_tag_edit', 'npc_view' ] }],
		'dst': [{ parentOrgID: 3, roles: [ 'character_view', 'npc_view' ] }],
		'vst': [{ parentOrgID: 4, roles: [ 'npc_view_cam-anarch' ] }],
		'otherDst': [{ parentOrgID: 6, roles: [ 'npc_view' ] }],
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

	console.log( 'Still here', responses[ url ][ token ] );

	if ( responses[ url ] ) {
		let resp = _.get( responses, `${url}.${token}`, responses[ url ].default );

		debug( 'Returning ' + inspect( resp ) );

		if ( _.isError( resp ) ) {
			console.log( 'hub returning an error' );
			return Promise.reject( resp );
		} else {
			return resp;
		}
	}
	return {};
}
