const { constants } = require('./utils');

class Route {
	constructor({ req, res, body, query, params, db }) {
		this.status = 200;
		this.request = req;
		this.db = db;
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

module.exports = Route;