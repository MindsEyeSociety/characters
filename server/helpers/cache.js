'use strict';

/**
 * Simple memcache system.
 */
const NodeCache = require( 'node-cache' );
const promisify = require( 'bluebird' ).promisify;

const cache = new NodeCache({ stdTTL: 900 });

module.exports = {
	get: cache.get,
	set: cache.set,
	async: {
		get: promisify( cache.get ),
		set: promisify( cache.set ),
	}
};
