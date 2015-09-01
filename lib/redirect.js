var http = require('http');
var database = require("./database.js");
var config = require("nconf").argv().file({file:__dirname+"/../config.json"});
var crypto = require('crypto');

var LogWriter = require('log-writer');
var writer = new LogWriter('tracking-log-%s.log');

// module.exports is a middleware
module.exports = function (redirects, port) {
    return http.createServer(function (req, res) {
	var requestHost = null;
	if (req.headers.host)
	    requestHost = req.headers.host.split(':')[0];
	var redirect = redirects[requestHost];
	
	//if the host is not found in the configuration, we default to the catch all
	if(!redirect){
	    redirect = redirects['*'];
	}
	
	if(redirect){
	    var isInsert = false;	   
	    var sig = null;
	    var url = null;
	    if (redirect.insert) {
		var a = redirect.insert.url.split('/');
		var b = req.url.split('/');
		if (a.length+1 == b.length) {
		    isInsert = true; // speculative
		    sig = b.pop();
		    for (var i in a)
			if (a[i] != b[i])
			    isInsert = false;
		}		
	    }
	    if (isInsert) {
		// We should really use a POST here, but we don't have a bodyparse (yet) so just fake it with a get and a custom header for the data.

		var data = req.headers["x-msg"];
		if (sig[0] == "/")
		    sig = sig.slice(1);
		// verify the sig
		var shasum = crypto.createHash('sha1');
		shasum.update(data +redirect.insert.sharedsalt)
		var mysig = shasum.digest('hex');
		
		try {
		    var obj = JSON.parse(data);		    
		} catch(e) { 
		    console.log("When parsing payload",e, data);
    		    res.statusCode = 403;
		    res.setHeader('Content-Type', 'text/plain');
		    return res.end('Bad');
		}
		if (obj.shortcode && obj.shortcode[0] == "/")
		    obj.shortcode = obj.shortcode.slice(1);
		if (
		    sig==mysig && 
		    obj.shortcode && 
		    obj.shortcode.length >= 6 && 
		    obj.shortcode.split('/').length == 1 && 
		    obj.desturl
		   ) 
		{
		    database.insert({shortcode: "/" + obj.shortcode, user: obj.user, prodid: obj.prodid, position: obj.position, senderid: obj.senderid, campaign: obj.campaign, desturl: obj.desturl, created: new Date()});
    		    res.statusCode = 201;
		    res.setHeader('Content-Type', 'text/plain');
		    return res.end();
		} else {
		    console.log("OBJ", obj);		    
		    console.log("SIG", sig, mysig, sig==mysig);		    
		    console.log("SCD",obj.shortcode, obj.shortcode.length, obj.shortcode.split('/').length);
    		    res.statusCode = 403;
		    res.setHeader('Content-Type', 'text/plain');
		    return res.end('Huh?');
		}
	    } else if (redirect.lookup) {
		database.find({shortcode:req.url}, function(e,shortcode) {

		    if (e || ! shortcode) {
			if (e) console.log(e);

    			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/plain');
			res.end('Shortcode not found');
			return;
		    }

		    var url = shortcode.desturl || null;
		    var campaign = shortcode.campaign || null;
		    var user = shortcode.user || null;
		    var senderid = shortcode.senderid || null;
		    var prodid = shortcode.prodid || null;
		    var position = shortcode.position || null;

		    writer.writeln(JSON.stringify({
			error: e,
			shortcode: req.url,
			desturl: url,
			prodid: prodid,
			position: position,
			senderid: senderid,
			campaign: campaign,
			user: user,
			ts: new Date(),
			remoteIp: req.connection.remoteAddress,
			headers: req.headers
		    }));

		    if (!url) {
    			res.statusCode = 404;
			res.setHeader('Content-Type', 'text/plain');
			res.end('Shortcode not found');
			return;
		    }
		    res.statusCode = redirect.code || 302;
		    res.setHeader('Content-Type', 'text/plain');
		    if (url) {
			res.setHeader('Location', url);
			res.end('Redirecting to '+url);
		    } else {
			res.end('Thanks.');
		    }			
		});
		return;
	    } else {		
		if (redirect.keepurl)
		    url = redirect.host + req.url;
		else 
		    url = redirect.host;
	    }

	    res.statusCode = redirect.code || 302;
	    res.setHeader('Content-Type', 'text/plain');
	    if (url) {
		res.setHeader('Location', url);
		res.end('Redirecting to '+url);
	    } else {
		res.end('Thanks.');
	    }
	}else{
    	    //their is no catch all, we will just show an error message
    	    res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not found');
	}
	
    }).listen(port);
}
