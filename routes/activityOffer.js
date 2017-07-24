'use strict';
var https = require( 'https' );
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
	console.log('Serena: EmailAddress=' + EmailAddress);
	console.log('Serena: Name=' + Name);
	console.log('Serena: muid=' + muid);
	console.log('Serena: SubscriberKey=' + SubscriberKey);

	// these values come from the custom activity form inputs
	var pushMessage = oArgs.pushMessage;
	console.log('Serena: pushMessage=' + pushMessage);
	
	
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
	console.log('Serena: pushMessageText=' + pushMessageText);
	
	// Prepare post data for remote API
	var pushInfo = JSON.stringify({ 
    "pushInfo": [{"muid": muid, msg: pushMessageText}]
	});

	//var endpoint = "https://jsonplaceholder.typicode.com/posts";
	var endpoint = "http://push-api-dev.hkmpcl.com.hk:8001/api/sf_push";
	var remoteHost = "jsonplaceholder.typicode.com";
	var remotePort = "443";
	var remotePath = "/posts";
	var secret = process.env.API_Secret;
	var signature = endpoint + pushInfo + secret;
	var hash_signature = crypto.createHash('md5').update(signature).digest('hex');
	console.log('Serena: pushInfo=' + pushInfo);
	console.log('Serena: signature=' + signature);
	console.log('Serena: hash_signature=' + hash_signature);

	var post_data = JSON.stringify({ 
    	"pushInfo": [{"muid": muid, msg: pushMessageText}],
    	"s": hash_signature
	});
	
	console.log('post_data=' + post_data);

	var options = {
		'hostname': remoteHost,
		'port': remotePort,
		'path': remotePath,
		'method': 'POST',
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json, charset=\"utf-16\"',
			//'Authorization':'Basic '+activityUtils.endpOintcreds.token,
			'Content-Length': Buffer.byteLength(post_data)
		},
	};				
	
	console.log('options=' + options);

	var httpsCall = https.request(options, function(response) {
		var data = '';
		var error = '';
			
		response.on( 'data' , function( chunk ) {
			data += chunk;
		});

		response.on( 'end' , function() {
			console.log("data:",data);
			console.log("response code:", response.statusCode);
			console.log("serena: SubscriberKey:",SubscriberKey);

			if (response.statusCode == 201) {
				data = JSON.parse(data);
				console.log('onEND PushResponse:', response.statusCode, data);
				res.send(200, {"pushId": data.id});
			} else {
				console.log('onEND fail:', response.statusCode);
				res.send(response.statusCode);
			}		
		});								
	});

	httpsCall.on( 'error', function( e ) {
		console.error(e);
		res.send(500, 'createCase', {}, { error: e });
	});				
	
	httpsCall.write(post_data);
	httpsCall.end();

};