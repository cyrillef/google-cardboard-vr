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

// To avoid the EXDEV rename error, see http://stackoverflow.com/q/21071303/76173
//process.env.TMPDIR ='tmp' ;
//process.env ['NODE_TLS_REJECT_UNAUTHORIZED'] ='0' ; // Ignore 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' authorization error
console.log ('Working directory: ' + __dirname) ;

var express =require ('express') ;
var request =require ('request') ;
var bodyParser =require ('body-parser') ;
var fs =require ('fs') ;

var lmvToken =require ('./lmv-token') ;

var app =express () ;
app.use (bodyParser.json ()) ;
app.use (express.static (__dirname + '/../www')) ;
app.use ('/api', lmvToken) ;

app.set ('port', process.env.PORT || 8000) ;
var server =app.listen (app.get ('port'), function () {
	console.log ('Server listening on port ' + server.address ().port) ;
}) ;
