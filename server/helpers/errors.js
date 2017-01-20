const inherits = require( 'util' ).inherits;

exports.RequestError = function RequestError( message ) {
	Error.captureStackTrace( this, this.constructor );
	this.name = this.constructor.name;
	this.message = message || 'There was an error with your request';
	this.status = 400;
}

inherits( exports.RequestError, Error );

exports.AuthError = function AuthError( message ) {
	Error.captureStackTrace( this, this.constructor );
	this.name = this.constructor.name;
	this.message = message || 'Access Denied';
	this.code = 'ACCESS_DENIED';
	this.statusCode = 403;
}

inherits( exports.AuthError, Error );
