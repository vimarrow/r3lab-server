const { Server, Route } = require('../index.js');

class PingRoute extends Route {
	constructor(...args){
		super(...args);
	}

	before() {
		return true;
	}

	get() {
		this.status = 200;
		console.log(this.query, this.body);
		console.log(asd);
		return {ping: true};
	}
}

const serverConfig = {
	routes: [{
			path: '/ping',
			controller: PingRoute
	}]
};

const app = new Server(serverConfig);

app.listen(8080);
