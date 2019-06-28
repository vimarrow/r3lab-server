const ServerError = require('./lib/serverError');

module.exports = {
	Server: require('./lib/server'),
	Route: require('./lib/route'),
	ServerError: (...args) => new ServerError(...args)
};
