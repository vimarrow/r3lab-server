# R<sup>3</sup>lab Server

Disclaimer: For now this is just a POC and it's not (yet) intended to be used in production!

R<sup>3</sup>lab Server aims to be an alternate web framework that will help you write server apps fast by:
 - offering a set of predefined methods to organise your logic into multiple lifecycles
 - making use of async functions and providing ways to improve error-handling,
 - yes, lifecycles
 - will provide a CLI to create-r3lab-server template in no-time!
 - best suited for REST apis

## Installation

R<sup>3</sup>lab Server requires __node v7.6.0__ or higher for ES2015 and async function support.

```
$ npm install r3lab-server
```
## Hello R<sup>3</sup>lab

```js
const { Server, Route, ServerError } = require('r3lab-server');

class PingRoute extends Route {
	constructor(...args){
		super(...args);
		// If it got here a request for /ping/:id? was received.
	}

	before() {
		// you can place anything that needs to be run regardless of request method
		// setting CORS for ex.
	}

	async isValidPayload() { 
		// just a custom validation method. 
		// not part of r3lab
		const isValid = await externalAsyncValidationFunction(this.body);
		return typeof this.body.showPing === 'boolean' && isValid;
	}

	async beforePOST() {
		// just like before but only runs for POST methods
		// can be used for validations
		if(await this.isValidPayload()){
			return "is doesn't really matter what";
		} else {
			throw ServerError(400, 'Bad Request', 'Invalid Payload. showPing needs to be boolean.');
		};
	}

	get() {
		// route logic like getting data from a db
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
		// I strongly recommend to use it
	}

}

const serverConfig = {
	routes: {
		// supports path params like /api/:foo/:bar?
		'/ping/:id?': PingRoute
	}
};

const app = new Server(serverConfig);

app.listen(8080);
```
