var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, 
        __slice = Array.prototype.slice;

var querystring = Npm.require('querystring');
var crypto = Npm.require('crypto');
var https = Npm.require('https');
//util = require('util');
//var es = Npm.require('event-stream');

MixpanelAPI = (function() {
    
    function MixpanelAPI(options) {
        var key, val;
        this.options = {
            api_key: null,
            api_secret: null,
            default_valid_for: 60,
            log_fn: this.log
        };
        for (key in options) {
            val = options[key];
            this.options[key] = val;
        }
        if (!this.options.api_key && this.options.api_secret) {
            throw new Error('MixpanelAPI needs token and secret parameters');
        }
    }

    MixpanelAPI.prototype.export_data = function(params, valid_for, cb) {
        var params_qs, req, exportUrl;
        if (typeof params !== 'object') {
            throw new Error('export_data(params, [valid_for], cb) expects an object params');
        }
        valid_for || (valid_for = this.options.default_valid_for);

        params.api_key = this.options.api_key;
        params.expire = Math.floor(this._get_utc() / 1000) + valid_for;

        params = this._prep_params(params);
        params_qs = querystring.stringify(this._sign_params(params));

        exportUrl = 'https://data.mixpanel.com/api/2.0/export/?' + params_qs;

        try {
            var dataDump = HTTP.get(exportUrl).content;
            return dataDump;
        } catch (e) {
            console.log('An error occurred: ' + e);
            return null;
        }
    }
    
    MixpanelAPI.prototype.request = function(endpoint, params, valid_for) {
        var params_qs, req, req_opts;
        try {
            if (typeof params !== 'object') {
                throw new Error('request(endpoint, params, [valid_for], [cb]) expects an object params');
            } else if (typeof endpoint !== 'string') {
                throw new Error('endpoint must be a string, not ' + endpoint);
            }
            
            valid_for || (valid_for = this.options.default_valid_for);
            
            params.api_key = this.options.api_key;
            params.expire = Math.floor(this._get_utc() / 1000) + valid_for;

            params = this._prep_params(params);
            params_qs = querystring.stringify(this._sign_params(params));

            req_opts = 'http://mixpanel.com/api/2.0/' + endpoint + '/?' + params_qs;

            try {
            	var responseData = JSON.parse(HTTP.get(req_opts).content);
            	return responseData;
            } catch (e) {
            	console.log('An error occurred: ' + e);
            	return null;
            }
        } catch (e) {
        	console.log('An error occurred: ' + e);
            return null;
        }
    };
    
    MixpanelAPI.prototype._get_utc = function() {
        var d = new Date(),
            local_time = d.getTime(),
			// getTimezoneOffset returns diff in minutes (??? why?)
            local_offset = d.getTimezoneOffset() * 60 * 1000; 
        return local_time + local_offset;
    };
    
    MixpanelAPI.prototype._prep_params = function(params) {
        var p;
        for (p in params) {
            if (params.hasOwnProperty(p) && Array.isArray(params[p])) {
                params[p] = JSON.stringify(params[p]);
            }
        }
        return params;
    };
                
    MixpanelAPI.prototype._sign_params = function(params) {
		// This signs unicode strings differently than the mixpanel backend
        var hash, key, keys, param, to_be_hashed, _i, _len;
        if (!(params != null ? params.api_key : void 0) || !(params != null ? params.expire : void 0)) {
            throw new Error('all requests must have api_key and expire');
        }
        keys = Object.keys(params).sort();
        to_be_hashed = '';
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
            key = keys[_i];
            if (key === 'callback' || key === 'sig') {
                continue;
            }
            param = {};
            param[key] = params[key];
            to_be_hashed += key + '=' + params[key];
        }
        hash = crypto.createHash('md5');
        hash.update(to_be_hashed + this.options.api_secret);
        params.sig = hash.digest('hex');
        return params;
    };
    
    MixpanelAPI.prototype.log = function() {
        var err, other_stuff;
        err = arguments[0], other_stuff = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (err instanceof Error) {
            console.error('Error in MixpanelAPI: ' + err.message);
            return console.error(err);
        }
        return console.log.apply(console, arguments);
    };
    return MixpanelAPI;
})();
