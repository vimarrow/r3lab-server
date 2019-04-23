# R<sup>3</sup>lab Server

Disclaimer: For now this is just a POC and it's not (yet) indented to be used in production!

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
const { Server, Route } = require('r3lab-server');

class Ping extends Route {
	constructor(...args) {
			super(...args);
	}
	before() {
		// Before can be used as a middleware
		this.computedValue = Math.random();
		// Do stuff like checking credentials or validating this.body / this.query
		this.headers = { 'Content-Type': 'application/json' };
		return true;
		// If there is no need to go to the next method you can return false
	}
	get() {
		this.anotherValue = Math.random();
		// Do the GET logic here.
		this.status = 200;
		// set the status of the request before returning any data.
		// You can also set headers or whatever
		return { hello: 'world', random: this.computedValue + this.anotherValue };
	}

	post() {
		// Ping controller will get to the constructor, then to the before() method,
		// and depending on this.request.method continue with the corresponding method
		if(this.body && this.body.ping === true) {
			this.status = 200;
			return { response: 'pong' };
		} else {
			this.status = 400;
			return { response: 'did not get a ping :(' };
		}
	}
}

const serverConfig = {
	// can also add other configs as env
	routes: [{
		path: '/ping',
		// set the URL and assign a controller
		controller: require('./services/Ping')
	}]
};

const app = new Server(serverConfig);

app.listen(8080);
```
