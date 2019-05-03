const http = require('http');
const querystring = require('querystring');
const getRawBody = require('raw-body');

function parseQueryString(urlQuery) {
	const query = querystring.parse(urlQuery);
	return Object.keys(query).length ? JSON.parse(JSON.stringify(query)) : null;
}

const constants = {
	DEFAULT_HEADERS: {'Content-Type': 'application/json'}
}

async function parseBodyData(req) {
	const buf = await getRawBody(req);
	return buf.length ? JSON.parse(buf) : null;
}

class ServerError extends Error {
	constructor(status, name, ...args) {
		super(...args);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ServerError);
		}
		this.time = new Date().getTime();
		this.name = name;
		this.status = status;
	}
}

class Route {
	constructor({ req, res, body, query }) {
		this.status = 200;
		this.request = req;
		this.response = res;
		this.headers = {};
		this.body = body;
		this.query = query;
	}

	__getName() {
		const regex = /\[Function: (.{1,})\]/;
		const results = this.constructor.toString().match(/class (.{1,}) extends/);
		return results && results.length > 1 ? results[1] : "";
};

	before() {
		return true;
	}

	onError(err) {
		console.log(err);
		this.status = err.status || 500;
		this.headers = constants.DEFAULT_HEADERS;
		return {
			name: err.name,
			message: err.message
		}
	}

	destroy() {
		return Object.keys(this).forEach(key => delete this[key]);
	}
}

class Server {
	constructor(config) {
		this.routes = config.routes || [];
	}

	listen(port) {
		return http.createServer(async(req, res) => {
			try {
				const url = req.url.indexOf('?') !== -1 ? req.url.substring(0, req.url.indexOf('?')) : req.url;
				const urlQuery = req.url.indexOf('?') !== -1 ? req.url.substring(req.url.indexOf('?') + 1) : url;
				const query = parseQueryString(urlQuery);
				const body = await parseBodyData(req);
				const route = this.routes.find(route => route.path === url);
				if (typeof route === 'undefined' || typeof route.controller === 'undefined') {
					throw new ServerError(404, 'NotFound', `Route for ${req.method} ${url} was not found`);
				}
				const Controller = new route.controller({ req: {...req }, res: {...res }, query, body });
				try {
					const next = await Controller.before();
					if (typeof next !== 'boolean') {
						throw new ServerError(500, 'IllegalTypeReturn', `Invalid return of 'before()' middleware method on ${url} in ${Controller.__getName()} `);
					}
					if (!next) {
						Controller.destroy();
						return false;
					}
					const method = req.method.toLowerCase();
					if (typeof Controller[method] === 'undefined') {
						throw new ServerError(404, 'NotFound', `Route for ${req.method} ${url} was not found`);
					}
					const response = await Controller[method]();
					res.writeHead(Controller.status, Controller.headers);
					// TODO: Handle http2 SSE ?
					res.end(JSON.stringify(response));
					Controller.destroy();
				} catch (e) {
					const response = await Controller.onError(e);
					res.writeHead(Controller.status, Controller.headers);
					const strMsg = JSON.stringify(response);
					res.end(strMsg);
					Controller.destroy();
					return true;
				}
				return true;
			} catch (err) {
				console.error(err);
				res.writeHead(err.status, constants.DEFAULT_HEADERS);
				const strMsg = JSON.stringify({
					message: err.message,
					name: err.name
				});
				res.end(strMsg);
				return true;
			}
			return true;
		}).listen(port || 3000);
	}
}

module.exports = {
	Server: Server,
	Route: Route
};
