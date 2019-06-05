const { Server, Route, ServerError } = require('../index.js');

class PingRoute extends Route {
	constructor(...args){
		super(...args);
	}

	before() {
		// nothing to do here
	}

	isValidPayload() { 
		// just a custom validation method. 
		// not part of r3lab
		return typeof this.body.showPing === 'boolean';
	}

	beforePOST() {
		if(this.isValidPayload()){
			return "is doesn't really matter what";
		} else {
			throw ServerError(400, 'Bad Request', 'invalid Payload. showPing needs to be boolean.');
		};
	}

	get() {
		this.status = 200;
		console.log(this.query, this.body, this.params);
		return {
			ping: true,
			id: this.params.id
		};
	}

	post() {
		this.status = 200;
		return {
			showPing: this.body.showPing
		};
	}

	onError(error) {
		// error is instance of ServerError
		// internally I do this:
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
