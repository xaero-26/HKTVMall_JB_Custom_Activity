'use strict';
var https = require( 'https' );
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
	var Email = oArgs.emailAddress;
	var FirstName = oArgs.firstName;
	var LastName = oArgs.lastName;
	var deviceid = "serena_deviceid";//"oArgs.deviceID";
	activityUtils.logData('Serena: Email=' + Email );
	activityUtils.logData('Serena: FirstName=' + FirstName );
	activityUtils.logData('Serena: LastName=' + LastName );

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
	
	var pushMessageText = SFMCTemplateEngine(template, {FirstName: FirstName, LastName: LastName});
	

	
	// Prepare post data for Carnival API
	var post_data = JSON.stringify({ 
    "notification": {   
    "to": [{ "name": "device_id", "criteria": [deviceid]}],
    "payload": {
        "alert": pushMessageText,
        "badge": 1,
        "sound": "Default.caf",    
        "category": "TEST_CATEGORY",    
        "any_key": "any_value"
        }  
    	}
	});
	
	console.log(post_data);	

	var options = {
		'hostname': activityUtils.endpOintcreds.host,
		'path': '/v3/notifications',
		'method': 'POST',
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json, charset=\"utf-16\"',
			'Authorization':'Basic '+activityUtils.endpOintcreds.token,
			'Content-Length': Buffer.byteLength(post_data)
		},
	};				
	
	console.log(options);

	var httpsCall = https.request(options, function(response) {
		var data = '';
		var error = '';
			
		response.on( 'data' , function( chunk ) {
			data += chunk;
		});

		response.on( 'end' , function() {
			console.log("data:",data);

			if (response.statusCode == 201) {
				data = JSON.parse(data);
				console.log('onEND PushResponse:', response.statusCode, data);
				res.send( 200, {"pushId": data.id} );
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