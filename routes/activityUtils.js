var util = require( 'util' );

exports.logExecuteData = [];

exports.logData = function ( req ) {
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
    
	console.log( "body: " + util.inspect( req.body ) );
	console.log( "headers: " + req.headers );
	console.log( "trailers: " + req.trailers );
	console.log( "method: " + req.method );
	console.log( "url: " + req.url );
	console.log( "params: " + util.inspect( req.params ) );
	console.log( "query: " + util.inspect( req.query ) );
	console.log( "route: " + req.route );
	console.log( "cookies: " + req.cookies );
	console.log( "ip: " + req.ip );
	console.log( "path: " + req.path );
	console.log( "host: " + req.host );
	console.log( "fresh: " + req.fresh );
	console.log( "stale: " + req.stale );
	console.log( "protocol: " + req.protocol );
	console.log( "secure: " + req.secure );
	console.log( "originalUrl: " + req.originalUrl );
};

exports.endpOintcreds = {
	username: '6c9cc8e6e76e6e167293cbb42c24e88bf6c4c196',
	userpw: ''
};

exports.endpOintcreds.host = 'api.carnivalmobile.com'; 
exports.endpOintcreds.token = new Buffer(exports.endpOintcreds.username + ':' + exports.endpOintcreds.userpw).toString('base64');
