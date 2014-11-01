// (C) Copyright 2014 by Autodesk, Inc.
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

//- Written by Cyrille Fauvel, Autodesk Developer Network (ADN)
//- http://www.autodesk.com/joinadn
//- October 20th, 2014
//
var http =require ("http") ;
var url =require ("url") ;
var path =require ("path") ;
var fs =require ("fs") ;
var requestLib =require ('request') ;

var tools = require('./user-settings');

var port =process.argv [2] || 8888 ;
console.log ('Starting server @ http://localhost:' + port + '/') ;
//console.log (__dirname) ;

http.createServer (function (request, response) {

	var uri =url.parse (request.url).pathname ;
	if ( uri == '/api/token' ) {
		var params ={
			client_id: CONSUMER_KEY,
			client_secret: CONSUMER_SECRET,
			grant_type: 'client_credentials'
		} ;

		requestLib.post (BASE_URL + '/authentication/v1/authenticate',
			{ form: params },
			function (error, postResponse, body) {
				if ( !error && postResponse.statusCode == 200 ) {
					var authResponse =JSON.parse (body) ;
					response.write (authResponse.access_token) ;
					response.end () ;
					console.log ('Token:' + authResponse.access_token) ;
				}
			}
		) ;
		return ;
	}
	
	var filename =path.join (process.cwd (), uri) ;
	console.log (filename) ;

	fs.exists (filename, function (exists) {
		if ( !exists ) {
			response.writeHead (404, { "Content-Type": "text/plain" }) ;
			response.write ("404 Not Found\n") ;
			response.end () ;
			return ;
		}

		if ( fs.statSync (filename).isDirectory () )
			filename +='/index.html' ;

		fs.readFile (filename, "binary", function (err, file) {
			if ( err ) {
				response.writeHead (500, { "Content-Type": "text/plain" }) ;
				response.write (err + "\n") ;
				response.end () ;
				return ;
			}

			response.writeHead (200/*, { 'Content-Type': 'text/json', 'Access-Control-Allow-Origin': '*', 'X-Powered-By':'nodejs' }*/) ;
			response.write (file, "binary") ;
			response.end () ;
		}) ;
	}) ;
	
}).listen (parseInt (port, 10)) ;

console.log ("Server running @ http://localhost:" + port + "/\n\tCTRL + C to shutdown") ;
