
var config = require("nconf").argv().file({file:__dirname+"/../config.json"});
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connection URL
var url = config.get("mongodb");
assert.notEqual(null, url);
assert.notEqual(undefined, url);

MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);

    var shortcodes = db.collection("shortcodes");

    exports.find = function(q, cb) {
	return shortcodes.findOne(q,cb) 
    }

    exports.insert = function(q) {
	return shortcodes.insert(q, function(e,d) {
	    if (e) console.log(e);
	}) 
    }
});