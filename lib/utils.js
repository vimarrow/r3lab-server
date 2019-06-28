const querystring = require('querystring');
const getRawBody = require('raw-body');

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

async function errorHandler(err) {
	console.error(err);
	return {
		message: err.message,
		name: err.name
	};
}

module.exports = {
	parseQueryString, 
	constants, 
	parseBodyData, 
	errorHandler
};