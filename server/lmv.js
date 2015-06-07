//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Node.js server workflow
// by Cyrille Fauvel - Autodesk Developer Network (ADN)
// January 2015
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
// http://blog.niftysnippets.org/2008/03/mythical-methods.html
//
var express =require ('express') ;
var request =require ('request') ;
var https =require ('https') ;
// unirest (http://unirest.io/) or SuperAgent (http://visionmedia.github.io/superagent/)
var unirest =require('unirest') ;
var events =require('events') ;
var util =require ('util') ;
//var urlmod =require ('url') ;
//var querystring =require ('querystring') ;
var fs =require ('fs') ;
var credentials =require ('./credentials') ;

if ( !Number.isInteger ) {
	Number.isInteger =function isInteger (nVal) {
		return (
			   typeof nVal === 'number'
			&& isFinite (nVal)
			&& nVal > -9007199254740992
			&& nVal < 9007199254740992
			&& Math.floor (nVal) === nVal
		) ;
	} ;
}

Object.defineProperty (global, '__stack', {
	get: function () {
		var orig =Error.prepareStackTrace ;
		Error.prepareStackTrace = function (_, stack) {
			return (stack) ;
		} ;
		var err =new Error ;
		Error.captureStackTrace (err, arguments.callee) ;
		var stack =err.stack ;
		Error.prepareStackTrace =orig ;
		return (stack);
	}
}) ;

Object.defineProperty (global, '__line', {
	get: function () {
		return (__stack [1].getLineNumber ()) ;
	}
}) ;

Object.defineProperty (global, '__function', {
	get: function () {
		return (__stack [1].getFunctionName ()) ;
	}
}) ;

function Lmv (bucketName) {
	events.EventEmitter.call (this) ;
	this.bucket =bucketName ;
}
//Lmv.prototype.__proto__ =events.EventEmitter.prototype ;
util.inherits (Lmv, events.EventEmitter) ;

// POST /authentication/v1/authenticate
/*static*/ Lmv.refreshToken =function () {
	console.log ('Refreshing Autodesk Service token') ;

	var creds =new credentials () ;
	var params ={
		client_id: creds.ClientId,
		client_secret: creds.ClientSecret,
		grant_type: 'client_credentials'
	}
	unirest.post (creds.AuthenticateUrl)
		.header ('Accept', 'application/json')
		//.type ('application/x-www-form-urlencoded')
		.send (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw 'error' ;
				var authResponse =response.body ;
				console.log ('Token: ' + JSON.stringify (authResponse)) ;
				//authResponse.expires_at =Math.floor (Date.now () / 1000) + authResponse.expires_in ;
				fs.writeFile ('data/token.json', JSON.stringify (authResponse), function (err) {
					if ( err )
						throw err ;
				}) ;
			} catch ( err ) {
				fs.unlinkSync ('data/token.json') ;
				console.log ('Token: ERROR! (' + response.statusCode + ')') ;
			}
		})
	;
} ;

/*static*/ Lmv.getToken =function () {
	try {
		var data =fs.readFileSync ('data/token.json') ;
		var authResponse =JSON.parse (data) ;
		return (authResponse.access_token) ;
	} catch ( err ) {
		console.log (err) ;
	}
	return ('') ;
} ;

// GET /oss/v1/buckets/:bucket/details
Lmv.prototype.checkBucket =function () {
	var self =this ;
	this.performRequest (
		'get',
		'/oss/v1/buckets/' + this.bucket + '/details',
		null,
		function (data) {
			if ( data.hasOwnProperty ('key') ) {
				try {
					fs.writeFile ('data/' + data.key + '.bucket.json', JSON.stringify (data), function (err) {
						if ( err )
							return (console.log ('ERROR: bucket data not saved :(')) ;
						self.emit ('success', data) ;
					}) ;
				} catch ( err ) {
					self.emit ('success', data) ;
				}
			} else {
				self.emit ('fail', data) ;
			}
		},
		function (err) {
			self.emit ('fail', err) ;
		}
	) ;
	return (this) ;
} ;

// POST /oss/v1/buckets
Lmv.prototype.createBucket =function (policy) {
	policy =policy || 'transient' ;
	var self =this ;
	this.performRequest (
		'post',
		'/oss/v1/buckets',
		{ 'bucketKey': this.bucket, 'policy': policy },
		function (data) {
			if ( data.hasOwnProperty ('key') ) {
				try {
					fs.writeFile ('data/' + data.key + '.bucket.json', JSON.stringify (data), function (err) {
						if ( err )
							return (console.log ('ERROR: bucket data not saved :(')) ;
						self.emit ('success', data) ;
					}) ;
				} catch ( err ) {
					self.emit ('success', data) ;
				}
			} else {
				self.emit ('fail', data) ;
			}
		},
		function (err) {
			self.emit ('fail', err) ;
		}
	) ;
	return (this) ;
} ;

Lmv.prototype.createBucketIfNotExist =function (policy) {
	policy =policy || 'transient' ;
	var self =this ;
	this.performRequest (
		'get',
		'/oss/v1/buckets/' + this.bucket + '/details',
		null,
		function (data) {
			if ( data.hasOwnProperty ('key') ) {
				try {
					fs.writeFile ('data/' + data.key + '.bucket.json', JSON.stringify (data), function (err) {
						if ( err )
							return (console.log ('ERROR: bucket data not saved :(')) ;
						self.emit ('success', data) ;
					}) ;
				} catch ( err ) {
					self.emit ('success', data) ;
				}
			} else {
				self.emit ('fail', data) ;
			}
		},
		function (err) {
			//- We need to create one if error == 404 (404 Not Found)
			if ( Number.isInteger (err) && err == 404 ) {
				new Lmv (self.bucket).createBucket (policy)
					.on ('success', function (data) {
						console.log ('Bucket ' + JSON.stringify (data)) ;
						self.emit ('success', data) ;
					})
					.on ('fail', function (err2) {
						self.emit ('fail', err2) ;
					}
				) ;
			} else {
				self.emit ('fail', err);
			}
		}
	) ;
	return (this) ;
} ;

// PUT /oss/v1/buckets/:bucket/objects/:filename
Lmv.prototype.uploadFile =function (identifier) {
	var self =this ;
	var creds =new credentials () ;
	var idData =fs.readFileSync ('data/' + identifier + '.json') ;
	idData =JSON.parse (idData) ;
	var serverFile =__dirname + '/../tmp/flow-' + identifier + '.1' ;
	var file =fs.readFile (serverFile, function (err, data) {
		if ( err ) {
			self.emit ('fail', err) ;
			return ;
		}

		var endpoint ='/oss/v1/buckets/' + self.bucket + '/objects/' + idData.name.replace (/ /g, '+') ;
		unirest.put (creds.BaseUrl + endpoint)
			.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/octet-stream', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
			//.attach ('file', serverFile)
			.send (data)
			.end (function (response) {
				//console.log (response.body) ;
				try {
					if ( response.statusCode != 200 )
						throw response.statusCode ;
					fs.writeFile ('data/' + self.bucket + '.' + identifier + '.json', JSON.stringify (response.body), function (err) {
						if ( err )
							throw err ;
						self.emit ('success', response.body) ;
					}) ;
				} catch ( err ) {
					console.log (__function + ' ' + __line) ;
					fs.unlinkSync ('data/' + self.bucket + '.' + identifier + '.json') ;
					self.emit ('fail', err) ;
				}
			})
		;

	}) ;

	return (this) ;
} ;

Lmv.prototype.getURN =function (identifier) {
	try {
		var data =fs.readFileSync ('data/' + this.bucket + '.' + identifier + '.json') ;
		data =JSON.parse (data) ;
		return (data.objects [0].id) ;
	} catch ( err ) {
		//console.log (__function + ' ' + __line) ;
		//console.log (err) ;
	}
	return ('') ;
} ;

/*static*/ Lmv.getFilename =function (identifier) {
	try {
		var data =fs.readFileSync ('data/' + identifier + '.json') ;
		data =JSON.parse (data) ;
		return (data.name) ;
	} catch ( err ) {
		console.log (__function + ' ' + __line) ;
		console.log (err) ;
	}
	return ('') ;
} ;

// POST /references/v1/setreference
Lmv.prototype.setDependencies =function (connections) {
	var self =this ;
	if ( connections == null ) {
		setTimeout (function () { self.emit ('success', { 'status': 'ok', 'statusCode': 200 }) ; }, 100) ;
		return (this) ;
	}
	var creds =new credentials () ;

	var desc ={ 'dependencies': [] } ;
	var master ='' ;
	for ( var key in connections ) {
		if ( key == 'lmv-root' ) {
			master =connections [key] [0] ;
			desc.master =this.getURN (master) ;
		} else { //if ( !data [key].hasOwnProperty (children) )
			for ( var subkey in connections [key] ) {
				var obj = {
					'file': this.getURN (connections [key] [subkey]),
					'metadata': {
						'childPath': Lmv.getFilename (connections [key] [subkey]),
						'parentPath': Lmv.getFilename (key)
					}
				} ;
				desc.dependencies.push (obj) ;
			}
		}
	}
	console.log (__function + ' ' + __line) ;
	fs.writeFile ('data/' + this.bucket + '.' + master + '.connections.json', JSON.stringify (desc), function (err) {
		if ( err )
			console.log ('ERROR: bucket project connections not saved :(') ;
	}) ;

	var endpoint ='/references/v1/setreference' ;
	unirest.post (creds.BaseUrl + endpoint)
		.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.send (desc)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', { 'status': 'ok', 'statusCode': 200 }) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// POST /viewingservice/v1/register
Lmv.prototype.register =function (connections) {
	var self =this ;
	var creds =new credentials () ;
	var urn =this.getURN (connections ['lmv-root'] [0]) ;
	var desc ={ 'urn': new Buffer (urn).toString ('base64') } ;

	var endpoint ='/viewingservice/v1/register' ;
	unirest.post (creds.BaseUrl + endpoint)
		.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.send (desc)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 && response.statusCode != 201 )
					throw response.statusCode ;
				self.emit ('success', { 'status': 'ok', 'statusCode': response.statusCode }) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// GET /viewingservice/v1/:encodedURN/status
// status/all/bubbles params { guid : '067e6162-3b6f-4ae2-a171-2470b63dff12' }
Lmv.prototype.status =function (urn, params) {
	var self =this ;
	var creds =new credentials () ;
	var encodedURN =new Buffer (urn).toString ('base64') ;
	params =params || {} ;

	var endpoint ='/viewingservice/v1/' + encodedURN + '/status' ;
	unirest.get (creds.BaseUrl + endpoint)
		.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', response.body) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// GET /viewingservice/v1/:encodedURN/all
Lmv.prototype.all =function (urn, params) {
	var self =this ;
	var creds =new credentials () ;
	var encodedURN =new Buffer (urn).toString ('base64') ;
	params =params || {} ;

	var endpoint ='/viewingservice/v1/' + encodedURN + '/all' ;
	unirest.get (creds.BaseUrl + endpoint)
		.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', response.body) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// GET /viewingservice/v1/:encodedURN
Lmv.prototype.bubbles =function (urn, params) {
	var self =this ;
	var creds =new credentials () ;
	var encodedURN =new Buffer (urn).toString ('base64') ;
	params =params || {} ;

	//unirest.get (creds.BaseUrl + '/viewingservice/v1/' + encodeURIComponent (urn))
	var endpoint ='/viewingservice/v1/' + encodedURN ;
	unirest.get (creds.BaseUrl + endpoint)
		.headers ({ 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.query (params)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', response.body) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// GET /oss/v1/buckets/:bucket/objects/:filename
Lmv.prototype.download =function (identifier) {
	var self =this ;
	var creds =new credentials () ;

	var endpoint ='' ;
	var filename ='default.bin'
	var accept ='application/octet-stream' ;
	try {
		var data =fs.readFileSync ('data/' + this.bucket + '.' + identifier + '.json') ;
		data =JSON.parse (data) ;
		endpoint =data.objects [0].location ;
		filename =data.objects [0].key ;
		accept =data.objects [0] ['content-type'] ;
	} catch ( err ) {
		// Try to rebuild it ourself
		filename =lmv.Lmv.getFilename (identifier) ;
		if ( filename == '' ) {
			self.emit ('fail', err) ;
			return (this) ;
		}
		endpoint =creds.BaseUrl + '/oss/v1/buckets/' + this.bucket + '/objects/' + filename.replace (/ /g, '+') ;
	}

	unirest.get (endpoint)
		.headers ({ 'Accept': accept, 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', { body: response.body, 'content-type': accept, 'filename': filename }) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
}

// GET /viewingservice/v1/items/:encodedURN
Lmv.prototype.downloadItem =function (urn) { // TODO: range header?
	var self =this ;
	var creds =new credentials () ;
	var encodedURN =encodeURIComponent (urn) ;
	console.log ('Downloading: ' + urn) ;

	unirest.get (creds.BaseUrl + '/viewingservice/v1/items/' + encodedURN)
		.headers ({ 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.encoding (null)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', response.raw_body) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;
	return (this) ;
} ;

// GET /viewingservice/v1/thumbnails/:encodedURN
Lmv.prototype.thumbnail =function (urn, width, height) {
	var self =this ;
	var creds =new credentials () ;
	var encodedURN =new Buffer (urn).toString ('base64') ;

	var endpoint ='/viewingservice/v1/thumbnails/' + encodedURN ;
	var query ={} ;
	if ( width !== undefined )
		query.width =width ;
	if ( height !== undefined )
		query.height =height ;
	//endpoint =urlmod.format ({ 'query': query, pathname: endpoint }) ;

	unirest.get (creds.BaseUrl + endpoint)
		.headers ({ 'Authorization': ('Bearer ' + Lmv.getToken ()) })
		.query (query)
		.encoding (null)
		.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				self.emit ('success', response.raw_body) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		})
	;

	/*var xhr =new XMLHttpRequest () ;
	xhr.open ('GET', creds.BaseUrl + endpoint, true) ;
	xhr.setRequestHeader ('Authorization', 'Bearer ' + Lmv.getToken ()) ;
	xhr.responseType ='arraybuffer' ;
	xhr.onload =function (e) {
		if ( this.status == 200 ) {
			try {
				var byteArray =new Uint8Array (this.response) ;
				var buffer =new Buffer (byteArray.length) ;
				for ( var i =0 ; i < byteArray.length ; i++)
					buffer.writeUInt8 (byteArray [i], i) ;
				self.emit ('success', buffer) ;
			} catch ( err ) {
				self.emit ('fail', err) ;
			}
		}
	} ;
	try {
		xhr.send () ;
	} catch ( err ) {
		self.emit ('fail', err) ;
	}*/

	return (this) ;
} ;

Lmv.prototype.performRequest =function (method, endpoint, data, success, fail) {
	var creds =new credentials () ;
	method =method.toLowerCase () ;
	var req =unirest (method, creds.BaseUrl + endpoint)
		.header ('Accept', 'application/json')
		.header ('Content-Type', 'application/json')
		//.header ('Content-Length', 0)
		//.header ('Accept', 'application/json')
		.header ('Authorization', 'Bearer ' + Lmv.getToken ())
		//.header ('Connection', 'keep-alive')
		//.options ({ 'strictSSL': false })
		//.strictSSL (false)
		//.proxy ('127.0.0.1:8888')
		//.query (data)
	;

	if ( data != null && method == 'get' )
		req.query (data) ;
	if ( data != null && method == 'post' )
		req.send (data) ;

	req.end (function (response) {
			try {
				if ( response.statusCode != 200 )
					throw response.statusCode ;
				success (response.body) ;
			} catch ( err ) {
				fail (err) ;
			}
		}
	) ;

} ;

var router =express.Router () ;
router.Lmv =Lmv ;

module.exports =router ;
