Package.on_use(function (api) {
	api.use('http');
	api.export('MixpanelAPI', 'server');
	api.add_files('mixpanel.js', 'server');
});