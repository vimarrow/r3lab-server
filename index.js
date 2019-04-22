const http = require('http');
const querystring = require('querystring');
const getRawBody = require('raw-body');

function parseQueryString(urlQuery) {
    const query = querystring.parse(urlQuery);
    return Object.keys(query).length ? JSON.parse(JSON.stringify(query)) : null;
}

async function parseBodyData(req) {
    const buf = await getRawBody(req);
    return buf.length ? JSON.parse(JSON.stringify(buf)) : null;
}

function serverCrash(code, err, req, res) {
    console.error(err);
    res.writeHead(code, { 'Content-Type': 'application/json' });
    const strMsg = JSON.stringify({
        error: err
    });
    res.write(strMsg);
    res.end();
}

class Route {
    constructor({ req, res }) {
        this.status = 200;
        this.request = req;
        this.response = res;
        this.headers = {}
    }

    setHeader(prop, value) {
        this.headers[prop] = value;
    }

    async before() {
        return true;
    }

    _destroy() {
        return Object.keys(this).forEach(key => delete this[key]);
    }
}

class Server {
    constructor(config) {
        this.routes = config.routes || [];
    }

    listen(port) {
        return http.createServer(async(req, res) => {
            try {
                const url = req.url.indexOf('?') !== -1 ? req.url.substring(0, req.url.indexOf('?')) : req.url;
                const urlQuery = req.url.indexOf('?') !== -1 ? req.url.substring(req.url.indexOf('?') + 1) : url;
                req.query = parseQueryString(urlQuery);
                req.body = await parseBodyData(req);
                const route = this.routes.find(route => route.path === url);
                if (typeof route === 'undefined' || typeof route.controller === 'undefined') {
                    throw '404';
                }
                const Controller = new route.controller({ req: {...req }, res: {...res } });
                const next = await Controller.before();
                if (typeof next !== 'boolean') {
                    throw `Invalid return of 'before()' middleware method on ${url}`;
                }
                if (!next) {
                    Controller._destroy();
                    return false;
                }
                const method = req.method.toLowerCase();
                if (typeof Controller[method] === 'undefined') {
                    throw '404'
                }
                const response = await Controller[method]();
                res.writeHead(Controller.status, Controller.headers);
                // TODO: Handle http2 SSE ?
                res.end(JSON.stringify(response));
                Controller._destroy();
                return true;
            } catch (err) {
                switch (err) {
                    case '404':
                        serverCrash(404, `Route '${req.method}: ${req.url}' not found`, req, res);
                        break;
                    default:
                        serverCrash(500, err, req, res);
                        break;
                }
            }
        }).listen(port || 3000);
    }
}

module.exports = {
    Server: Server,
    Route: Route
};