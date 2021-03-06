'use strict';
var https = require( 'https' );
var http = require('http');
var crypto = require('crypto');
var activityUtils = require('./activityUtils');

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    activityUtils.logData( req );
    res.send( 200, 'Edit' );
};

/*
 * POST Handler for /save/ route of Activity.
 * This gets called when the journey is activated in the JB UI (and before /validate/ and /publish/)
 */
exports.save = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );

    activityUtils.logData( req );
    res.send( 200, 'Save' );
};

/*
 * POST Handler for /publish/ route of Activity.
 * Run any code here that you need to run to prepare the activity for execution.
 * This gets called when the journey is activated in JB (and after /save/ and /validate/)
 */
exports.publish = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );

    activityUtils.logData( req );
    res.send( 200, 'Publish' );
};

/*
 * POST Handler for /validate/ route of Activity.
 * This method should validate the configuration inputs.  
 * This gets called when the journey is activated in the JB UI (and after /save/ but before /publish/)
 * Respond with 200 for valid, 500 for invalid
 */
exports.validate = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    //console.log( req.body );
    activityUtils.logData( req );
    res.send( 200, 'Validate' );

    /* 
    If validation passes then call
    res.send( 200, 'Validate' );

    If validation fails then call
    res.send( 500, 'Validate' );
    */
};

/*
 * POST Handler for /execute/ route of Activity.
 * Runs each time the activity executes.  This is the main workhorse of the custom activity
 * Caller expects a 200 response back.  Can return any custom data also.
 */
exports.execute = function( req, res ) {
    // Data from the req and put it in an array accessible to the main app.
    activityUtils.logData( req );
    remote_call(req,res);
};

function remote_call(req,res) {
	//merge the array of objects for easy access in code.
	var aArgs = req.body.inArguments;
	console.log( aArgs );
	var oArgs = {};
	for (var i=0; i<aArgs.length; i++) {  
		for (var key in aArgs[i]) { 
			oArgs[key] = aArgs[i][key]; 
		}
	}
		
	var contactKey = req.body.keyValue;

	// these values come from the config.json
	var EmailAddress = oArgs.EmailAddress;
	var Name = oArgs.Name;
	var muid = oArgs.muid;
	var SubscriberKey = oArgs.SubscriberKey;

	// these values come from the custom activity form inputs
	var pushMessage = oArgs.pushMessage;
	
	
	// Template Engine for personalisation
	var SFMCTemplateEngine = function(tpl, data) {
    var re = /<%([^%>]+)?%>/g, match;
    while(match = re.exec(tpl)) {
        tpl = tpl.replace(match[0], data[match[1]])
    }
    return tpl;
	}
	var template = pushMessage;
	
	var pushMessageText = SFMCTemplateEngine(template, {Name: Name});
	console.log('pushMessageText=' + pushMessageText);
	
	// Prepare post data for remote API
	var pushInfo = JSON.stringify([{"muid": muid, "msg": pushMessageText}]);
	console.log('pushInfo=' + pushInfo);

	//var endpoint = "https://jsonplaceholder.typicode.com/posts";
	var endpoint = process.env.Remote_Endpoint;
	var secret = process.env.API_Secret;
	var signature = endpoint + pushInfo + secret;
	var hash_signature = crypto.createHash('md5').update(signature, 'utf8').digest('hex');

	var post_data = "pushInfo=" + encodeURIComponent(pushInfo) + "&s=" + encodeURIComponent(hash_signature);
	
	console.log('post_data=' + post_data);

	function controller(status, msg, data, err){
		if (msg == 'log_status') {
			console.log('controller log_status', data);
			log_status(SubscriberKey, data.status, data.statusCode, data.statusdesc, controller);
		}
		if (msg == 'end_call') {
			console.log('controller end_call', data);
			res.send(200, {"pushId": data.status});
		}
			
	};
	call_api(post_data, controller); 
};

function call_api(post_data, next) {
	var remoteHost = process.env.Remote_Host;
	var remotePort = process.env.Remote_Port;
	var remotePath = process.env.Remote_Path;
	var options = {
		'hostname': remoteHost,
		'port': remotePort,
		'path': remotePath,
		'method': 'POST',
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
			//'Authorization':'Basic '+activityUtils.endpOintcreds.token,
			'Content-Length': Buffer.byteLength(post_data)
		},
	};				
	

	var httpsCall = http.request(options, function(response) {
		var data = '';
		var error = '';
			
		response.on( 'data' , function( chunk ) {
			data += chunk;
		});

		response.on( 'end' , function() {
			console.log("call_api data:",data);
			console.log("call_api response code:", response.statusCode);

			if (response.statusCode == 200) {
				data = JSON.parse(data);
				console.log('onEND PushResponse:', response.statusCode, data);
				//res.send(200, {"pushId": 200});
				if (data.result == 'success')
					next(response.statusCode, 'log_status', {status: data.result, statusCode: response.statusCode, statusdesc: data.result});
				else
					next(response.statusCode, 'log_status', {status: data.result, statusCode: data.error.code, statusdesc: data.error.msg});
			} else {
				console.log('onEND fail:', response.statusCode);
				next(response.statusCode, 'log_status', {status: 'API error', statusCode: response.statusCode, statusdesc: ''});
				//res.send(response.statusCode, {"pushId": response.statusCode});
			}
					
		});								
	});

	httpsCall.on( 'error', function( e ) {
		console.error(e);
		next(500, 'log_status', {status: 'API error', statusCode: 'N.A.', statusdesc: e});
		//res.send(500, 'createCase', {}, { error: e });
	});				
	
	httpsCall.write(post_data);
	httpsCall.end();
};

function log_status(subkey, status, statuscode, statusdesc, next) {
	console.log('log_status', subkey, status, statusdesc);	

	var remoteHost = process.env.Cloudpage_Host;
	var remotePort = process.env.Cloudpage_Port;
	var remotePath = process.env.Cloudpage_Path + "?subkey=" + encodeURIComponent(subkey) + "&status=" + encodeURIComponent(status) + "&statuscode=" + encodeURIComponent(statuscode) + "&statusdesc=" + encodeURIComponent(statusdesc);
	console.log('log_status remotePath=', remotePath);
	var options = {
		'hostname': remoteHost,
		'port': remotePort,
		'path': remotePath,
		'method': 'GET',
	};				
	
	//var httpsCall = https.request(options, function(response) {
	var httpsCall = http.request(options, function(response) {
		var data = ''
			,redirect = ''
			,error = ''
			;
		response.on( 'data' , function( chunk ) {
			data += chunk;
		} );	

		response.on( 'end' , function() {
			console.log("log_status call response code:", response.statusCode);
			next(response.statusCode, 'end_call', {status: response.statusCode});	
		});												

	});
	httpsCall.on( 'error', function( e ) {
		console.log('log_status call has error');
		console.error(e);
		next(500, 'end_call', {status: 'unknown error'});
	});				
	
	httpsCall.end();
};