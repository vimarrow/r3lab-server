const { Server, Route, ServerError } = require('../index.js');

class PingRoute extends Route {
	constructor(...args){
		super(...args);
	}
	before() {
		this.headers = {'Content-Type': 'application/json'};
	}
	isValidPayload() {
		const keys = Object.keys(this.body);
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
	post() {
		this.status = 200;
		return {
			...this.body
		};
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
	routes: {
		'/ping/:id?': PingRoute
	}
};

const app = new Server(serverConfig);
app.listen(8080);
