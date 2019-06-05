const http = require('http');
const querystring = require('querystring');
const getRawBody = require('raw-body');
const pathToRegexp = require('path-to-regexp');

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
		this.isServerError = true;
	}
}

class Route {
	constructor({ req, res, body, query, params }) {
		this.status = 200;
		this.request = req;
		this.response = res;
		this.headers = {};
		this.params = params;
		this.body = body;
		this.query = query;
	}

	__getName() {
		const results = this.constructor.toString().match(/class (.{1,}) extends/);
		return results && results.length > 1 ? results[1] : "";
	};

	before() {return true;}
	beforeGET() {return true;}
	beforeHEAD() {return true;}
	beforePOST() {return true;}
	beforePUT() {return true;}
	beforeDELETE() {return true;}
	beforeOPTIONS() {return true;}
	beforePATCH() {return true;}

	onError(err) {
		console.error(error);
		this.status = err.status || 500;
		this.headers = constants.DEFAULT_HEADERS;
		return {
			name: err.name,
			message: err.message,
			in: this.__getName()
		}
	}

	destroy() {
		return Object.keys(this).forEach(key => delete this[key]);
	}
}

class Server {
	constructor(config) {
		this.routes = config.routes || {};
	}

	getRouteAndParams(url) {
		let finalResult = {
			route: undefined,
			params: {}
		};

		Object.keys(this.routes).find(confUrl => {
			const keys = [];
			const urlRegexp = pathToRegexp(confUrl, keys);
			const result = urlRegexp.exec(url);
			if(result && result.length){
				finalResult.route = this.routes[confUrl];
				for(let i = 0; i < keys.length; i++) {
					finalResult.params[keys[i].name] = result[i + 1];
				}
			}
		});

		return finalResult;
	}

	listen(port) {
		return http.createServer(async(req, res) => {
			try {
				const url = req.url.indexOf('?') !== -1 ? req.url.substring(0, req.url.indexOf('?')) : req.url;
				const urlQuery = req.url.indexOf('?') !== -1 ? req.url.substring(req.url.indexOf('?') + 1) : url;
				const query = parseQueryString(urlQuery);
				const body = await parseBodyData(req);
				
				const { route, params } = this.getRouteAndParams(url);
				if (typeof route === 'undefined') {
					throw new ServerError(404, 'NotFound', `Route for ${req.method} ${url} was not found`);
				}
				const Controller = new route({ req: {...req }, res: {...res }, query, body, params });
				try {
					const method = req.method;
					await Controller.before();
					await Controller[`before${method.toUpperCase()}`]();
					if (typeof Controller[method.toLowerCase()] === 'undefined') {
						throw new ServerError(404, 'NotFound', `Route for ${req.method} ${url} was not found`);
					}
					const response = await Controller[method.toLowerCase()]();
					res.writeHead(Controller.status, Controller.headers);
					// TODO: Handle http2 SSE ?
					res.end(JSON.stringify(response));
					Controller.destroy();
				} catch (e) {
					const response = await Controller.onError(e);
					res.writeHead(Controller.status || 500, Controller.headers || constants.DEFAULT_HEADERS);
					const strMsg = JSON.stringify(response);
					res.end(strMsg);
					Controller.destroy();
				}
				return true;
			} catch (err) {
				console.error(error);
				res.writeHead(err.status || 500, constants.DEFAULT_HEADERS);
				const strMsg = JSON.stringify({
					message: err.message,
					name: err.name
				});
				res.end(strMsg);
				return true;
			}
		}).listen(port || 3000);
	}
}

module.exports = {
	Server: Server,
	Route: Route,
	ServerError: (...args) => new ServerError(...args)
};
