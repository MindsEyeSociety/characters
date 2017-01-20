exports.RequestError = message => ({
	statusCode: 400,
	message: message || 'There was an error with your request',
	code: 'REQUEST_ERROR'
});

exports.AuthError = message => ({
	statusCode: 403,
	message: message || 'Access Denied',
	code: 'ACCESS_DENIED'
});
