const http = require('http');
const pathToRegexp = require('path-to-regexp');
const ServerError = require('./serverError');
const { errorHandler, constants, parseQueryString, parseBodyData } = require('./utils');

class Server {
	constructor(config) {
		this.routes = config.routes || {};
		this.db = config.db;
		this.basePath = config.basePath || null;
		if(typeof config.errorHandler === 'function') {
			this.errorHandler = config.errorHandler.bind(this);
		} else {
			this.errorHandler = errorHandler.bind(this);
		}
	}

	getRouteAndParams(url) {
		let finalResult = {
			route: undefined,
			params: {}
		};
		let base = '';

		if(this.basePath && (typeof this.basePath === 'string') && this.basePath.length > 0) {
			base = this.basePath;
			if(!url.startsWith(this.basePath)) {
				return finalResult;
			}
		}

		Object.keys(this.routes).find(confUrl => {
			const keys = [];
			const urlRegexp = pathToRegexp(base + confUrl, keys);
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
				const Controller = new route({ req: {...req }, res: {...res }, query, body, params, db: this.db });
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
				const response = await this.errorHandler(err);
				res.writeHead(this.status || 500, this.headers || constants.DEFAULT_HEADERS);
				const strMsg = JSON.stringify(response);
				res.end(strMsg);
				return true;
			}
		}).listen(port || 3000);
	}
}

module.exports = Server;