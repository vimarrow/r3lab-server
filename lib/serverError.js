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

module.exports = ServerError;