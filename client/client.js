var mixpanelApiCreds = {};

Router.configure({
	autoRender: false
});

Router.map(function() {
	this.route('start', {path: '/'}); 
	this.route('exportData', {path: '/export'});
	this.route('splitData', {path: '/split'});
	this.route('importData', {path: '/import'});
});

Template.apiCreds.events({
	'click button' : function() {
		console.log('Asking server to create new Mixpanel client');
		mixpanelApiCreds.key = $('#mixpanel-api-key').val();
		mixpanelApiCreds.secret = $('#mixpanel-api-secret').val();
		mixpanelApiCreds.token = $('#mixpanel-api-token').val();
		Meteor.call('initiateMixpanelAPIClient', mixpanelApiCreds);
	}
});

Template.exportData.rendered = function() {
	$('.datepicker').each(function(){
		$(this).datepicker({
			format: 'yyyy-mm-dd',
			autoclose: true,
			endDate: new Date()
		});
	});
	$('#start-date').datepicker().on('changeDate', function(e) {
		$('#end-date').datepicker('setStartDate', e.date);
	});
}

Template.exportData.today = function() {
	return Date.today().toString('yyyy-MM-dd');
}

Template.exportData.oneWeekAgo = function() {
	return Date.today().addDays(-6).toString('yyyy-MM-dd');
}

Template.exportData.events({
	'click button' : function () {
		console.log('About to call the server to get data');

		// Dates are inclusive!
		var exportParams = {
			from_date: $('#start-date').val(),
			to_date: $('#end-date').val()
		};

		Meteor.call('exportData', exportParams, true, function(err, res){
			/*if(!err) {
				var blob = new Blob([res], {type: 'text/plain;charset=utf-8'});
				saveAs(blob, $('#start-date').val() + '.txt');
			}*/
			console.log('File saved on server');
		});
	}
});

var parseTheFile = function() {
	console.log('File loaded');
	fileContent = fr.result;

	var arrayOfEventsAsStrings = fileContent.split(/\n/);
	// TO JSON
	var arrayOfEventsAsJSON = _.map(arrayOfEventsAsStrings, function(eventString) {
		return eventString ? JSON.parse(eventString) : null
	});
	// APPEND TOKEN TO PROPERTIES
	var mp_token = mixpanelApiCreds.token;
	_.each(arrayOfEventsAsJSON, function(eventObject) {
		if(eventObject) {
			eventObject.properties.token = mp_token;
			eventObject.properties['$username'] && delete eventObject.properties['$username'];
			eventObject.properties['_page_title'] && delete eventObject.properties['_page_title'];
		}
	});
	// TO STRING
	arrayOfEventsAsStrings = _.map(arrayOfEventsAsJSON, function(eventObject) {
		return eventObject ? JSON.stringify(eventObject) : null;
	});
	// TO BASE64
	var arrayOfEventsInBase64 = _.map(arrayOfEventsAsStrings, function(eventString) {
		//console.log(eventString);
		return eventString ? btoa(eventString) : null;
	});
	console.log(atob(arrayOfEventsInBase64[0]));
	console.log('Preparing to import ' + arrayOfEventsInBase64.length + ' events to Mixpanel');

	// SHOULD VALIDATE EACH ELEMENT IS A VALID JSON BLOB AT SOME POINT

	_.each(arrayOfEventsInBase64, function(e) {
		if(e) {
			Meteor.call('sendEventToMixpanel', e, mixpanelApiCreds.key, function(err, res) {
				if (!err) {
					console.log('Sent event to Mixpanel');
				} else {
					console.log('Failed to send event to Mixpanel: ' + JSON.stringify(e));
				}
			})
		}
	});
};

Template.importData.events({
	'click button': function() {
		var file = $('#filepicker')[0].files[0];
		if(file) {
			console.log('Got a file');
			fr = new FileReader();
			fr.onload = parseTheFile;
			fr.readAsText(file);
		} else {
			console.log('No file found, yo');
		}
	}
});

var splitTheFile = function(fileName) {
	fileName = fileName.split('.')[0];
	console.log('File loaded: ' + fileName);
	fileContent = fr.result;

	var events = fileContent.split(/\n/);
	var maxLength = parseInt($('#size').val());
	
	var counter = 0;
	var dataset = '';
	var partNum = 1;

	_.each(events, function(e) {
		dataset += e + '\n';
		counter += 1;

		if (counter === maxLength) {

			var blob = new Blob([dataset], {type: "text/plain;charset=utf-8"});
			saveAs(blob, fileName + '-part' + partNum.toString() + '.txt');

			counter = 0;
			dataset = '';
			partNum += 1;
		}
	});

	// save the leftovers!

	var blob = new Blob([dataset], {type: "text/plain;charset=utf-8"});
	saveAs(blob, fileName + '-part' + partNum.toString() + '.txt');

};

Template.splitData.events({
	'click button': function() {
		var file = $('#filepicker')[0].files[0];
		if(file) {
			console.log('Got a file');
			fr = new FileReader();
			fr.onload = function(){splitTheFile(file.name);};
			fr.readAsText(file);
		} else {
			console.log('No file found, yo');
		}
	}
});