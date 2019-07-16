const { Server, Route, ServerError } = require('../index.js');
const Redis = require('ioredis');

class PingRoute extends Route {
	constructor(...args){
		super(...args);
	}
	before() {
		this.headers = {'Content-Type': 'application/json'};
	}
	isValidPayload() {
		const keys = this.body ? Object.keys(this.body) : [];
		for(let i=0; i<keys.length; i++) {
			if(typeof this.body[keys[i]] !== 'boolean') {
				return false;
			}
		}
		return true;
	}
	beforePOST() {
		if(!this.isValidPayload()){
			throw ServerError(400, 'validation', 'All items must have boolean type');
		};
	}
	async post() {
		this.status = 200;
		await this.db.set('pingStatus', this.body.pingStatus);
		return {
			...this.body
		};
	}
	async get() {
		try {
			const pingStatus = await this.db.get('pingStatus');
			this.status = 200;
			return {pingStatus};
		} catch (err) {
			throw ServerError(500, ...err);
		}
	}
	onError(error) {
		console.error(error);
		this.status = error.status || 500;
		return {
			name: error.name,
			message: error.message,
			in: this.__getName()
		};
	}
}
const serverConfig = {
	db: new Redis(),
	routes: {
		'/ping/:id?': PingRoute
	}
};

const app = new Server(serverConfig);
app.listen(8080);
