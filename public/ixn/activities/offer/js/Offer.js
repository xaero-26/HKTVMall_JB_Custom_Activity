define( function( require ) {

    'use strict';
    
	var Postmonger = require( 'postmonger' );
	var $ = require( 'vendor/jquery.min' );

    var connection = new Postmonger.Session();
    var toJbPayload = {};
    var step = 1; 
	var endpoints;
	
    $(window).ready(onRender);

    connection.on('initActivity', function(payload) {
        var valuePushMessage;

        if (payload) {
            toJbPayload = payload;
            console.log('payload',payload);
            
			//merge the array of objects.
			var aArgs = toJbPayload['arguments'].execute.inArguments;
			var oArgs = {};
			for (var i=0; i<aArgs.length; i++) {  
				for (var key in aArgs[i]) { 
					oArgs[key] = aArgs[i][key]; 
				}
			}
			//oArgs.pushMessage will contain a value if this activity has already been configured:
			valuePushMessage = oArgs.pushMessage || toJbPayload['configurationArguments'].defaults.pushMessage;            
        }
        
		$.get( "/version", function( data ) {
			$('#version').html('Version: ' + data.version);
		});                

        // If there is no valuePushMessage selected, disable the next button
        if (!valuePushMessage) {
            connection.trigger('updateButton', { button: 'next', enabled: false });
        }

		//$('#selectAmount').find('option[value='+ amount +']').attr('selected', 'selected');
		
		
		$('#pushMessage').val(valuePushMessage);
		
			
		gotoStep(step);
        
    });

    connection.on('requestedEndpoints', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			endpoints = data;
            console.log("endpoints",data);
		}        
    });

    connection.on('clickedNext', function() {
        step++;
        gotoStep(step);
        connection.trigger('ready');
    });

    connection.on('clickedBack', function() {
        step--;
        gotoStep(step);
        connection.trigger('ready');
    });

    function onRender() {
        connection.trigger('ready');
        connection.trigger('requestEndpoints');
        
        // Disable the next button if a value isn't selected
        /*
        $('#selectValueTier').change(function() {
            var valueTier = getValueTier();
            var type = getType();
            var bonus = getBonus();
            var valid = Boolean(valueTier) && Boolean(bonus) && Boolean(type);
            connection.trigger('updateButton', { button: 'next', enabled: valid });
        });

        $('#selectType').change(function() {
            var valueTier = getValueTier();
            var type = getType();
            var bonus = getBonus();
            var valid = Boolean(valueTier) && Boolean(bonus) && Boolean(type);
            connection.trigger('updateButton', { button: 'next', enabled: valid });
        });

        $('#selectBonus').change(function() {
            var valueTier = getValueTier();
            var type = getType();
            var bonus = getBonus();
            var valid = Boolean(valueTier) && Boolean(bonus) && Boolean(type);
            connection.trigger('updateButton', { button: 'next', enabled: valid });
        });
        */
        
        $('#pushMessage').keyup(function() {
            var pushMessage = getPushMessage();
            var valid = Boolean(pushMessage);
            connection.trigger('updateButton', { button: 'next', enabled: valid });
            //alert(valid);
        });


    };

    function gotoStep(step) {
        $('.step').hide();
        switch(step) {
            case 1:
                $('#step1').show();
                var valueTier = getValueTier();
                var type = getType();
                var bonus = getBonus();
                var valid = Boolean(valueTier) && Boolean(bonus) && Boolean(type);
                connection.trigger('updateButton', { button: 'next', text: 'next', enabled: valid });
                connection.trigger('updateButton', { button: 'back', visible: false });
                break;
            case 2:
                $('#step2').show();
                
                /*
                $('#showValueTier').html(getValueTierText());
                $('#showType').html(getTypeText());
                $('#showBonus').html(getBonusText());
                */
                
                $('#showPushMessage').html(getPushMessage());
                
                connection.trigger('updateButton', { button: 'back', visible: true });
                connection.trigger('updateButton', { button: 'next', text: 'done', visible: true });
                break;
            case 3: // Only 2 steps, so the equivalent of 'done' - send off the payload
                save();
                break;
        }
    };

    /*function getValueTier() {
        return $('#selectValueTier').find('option:selected').attr('value').trim();
    };
    function getType() {
        return $('#selectType').find('option:selected').attr('value').trim();
    };
    function getBonus() {
        return $('#selectBonus').find('option:selected').attr('value').trim();
    };

    function getValueTierText() {
        return $('#selectValueTier').find('option:selected').text().trim();
    };
    function getTypeText() {
        return $('#selectType').find('option:selected').text().trim();
    };
    function getBonusText() {
        return $('#selectBonus').find('option:selected').text().trim();
    };*/
    
    function getPushMessage() {
        return $('#pushMessage').val().trim();
    };
    
    
    

    function save() {
		/*
        var valueTier = getValueTier();
        var type = getType();
        var bonus = getBonus();
        */
        
        var pushMessage = getPushMessage();
 

        // toJbPayload is initialized on populateFields above.  Journey Builder sends an initial payload with defaults
        // set by this activity's config.json file.  Any property may be overridden as desired.
        //toJbPayload.name = "my activity";

        //this will be sent into the custom activity body within the inArguments array.
        /*
        toJbPayload['arguments'].execute.inArguments.push({"valueTier": valueTier});
        toJbPayload['arguments'].execute.inArguments.push({"type": type});
        toJbPayload['arguments'].execute.inArguments.push({"bonus": bonus});
        */
        toJbPayload['arguments'].execute.inArguments.push({"pushMessage": pushMessage});

		/*
        toJbPayload['metaData'].things = 'stuff';
        toJbPayload['metaData'].icon = 'path/to/icon/set/from/iframe/icon.png';
        toJbPayload['configurationArguments'].version = '1.1'; // optional - for 3rd party to track their customActivity.js version
        toJbPayload['configurationArguments'].partnerActivityId = '49198498';
        toJbPayload['configurationArguments'].myConfiguration = 'configuration coming from iframe';
		*/
		
		toJbPayload.metaData.isConfigured = true;  //this is required by JB to set the activity as Configured.
        connection.trigger('updateActivity', toJbPayload);
    }; 
    	 
});
			
