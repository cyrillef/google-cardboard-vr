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
var credentials =function () {
	this.Hostname ='developer.api.autodesk.com' ;
	this.BaseUrl ='https://' + this.Hostname ;
	this.ClientId ='Replace_with_your_own_consumer_key' ;
	this.ClientSecret ='Replace_with_your_own_secret_key' ;
	this.AuthenticateUrl =this.BaseUrl + '/authentication/v1/authenticate' ;
} ;

module.exports =credentials ;