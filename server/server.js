var fs = Npm.require('fs');
var mx;

var saveOnServer = function(data, location, fileName) {
	console.log('Saving file on server');
	fs.writeFileSync(location + fileName + '.txt', data);
};

Meteor.methods({
	exportData: function(exportParams, serverSave) {
		console.log('About to make the request to Mixpanel');
		var dataDump = mx.export_data(exportParams);

		if (!dataDump) {
			console.log('We failed, sad times');
			return null;
		}
		console.log('Data exported successfully from Mixpanel!');
		if(serverSave) {
			saveOnServer(dataDump, '/Users/bennewell/mixpanel-data/old/', exportParams.from_date);
			return;
		}
		return dataDump;
	},
	sendEventToMixpanel: function(evt, mp_api_key) {
		console.log('About to send event to Mixpanel');
		var mp_import_base_url = 'http://api.mixpanel.com/import/';
		var request_url = mp_import_base_url + '?data=' + evt + '&api_key=' + mp_api_key;
		var result = HTTP.post(request_url);
		console.log(result.statusCode);
	},
	saveSplitFile: function(data, fileName, partNum) {
		newFileName = fileName + '-part' + partNum.toString();
		saveOnServer(data, '/Users/bennewell/mixpanel-data/new2/', newFileName)
	},
	initiateMixpanelAPIClient: function(apiCreds) {
		console.log('About to create new Mixpanel client');
		mx = new MixpanelAPI ({
			api_key: apiCreds.key,
			api_secret: apiCreds.secret
		});
		console.log(mx);
	}
});