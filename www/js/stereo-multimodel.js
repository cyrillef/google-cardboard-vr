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

var oViewer =null ;
var bModelLoaded =false, cleanedModel =false ;
var upVector ;
var initZoom =null ;
var oNavigation =null ;
var FORCE_USE_LOCAL_WORKER_SCRIPT =true ;
var ENABLE_INLINE_WORKER =false ;
var RESOURCE_ROOT_CYRILLE ='http://' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/' ;
//console.log (RESOURCE_ROOT_CYRILLE) ;

function initialize () {
	if ( annyang ) {
		// Add our commands to annyang
		annyang.addCommands (commands) ;
		/*annyang.addCallback ('error', function () { console.log ('annyang error') ; }) ;
		annyang.addCallback ('end', function () { console.log ('annyang end') ; }) ;
		annyang.addCallback ('result', function () { console.log ('annyang result') ; }) ;
		annyang.addCallback ('resultMatch', function () { console.log ('annyang resultMatch') ; }) ;
		annyang.addCallback ('resultNoMatch', function () { console.log ('annyang resultNoMatch') ; }) ;
		annyang.addCallback ('errorNetwork', function () { console.log ('annyang errorNetwork') ; }) ;
		annyang.addCallback ('errorPermissionBlocked', function () { console.log ('annyang errorPermissionBlocked') ; }) ;
		annyang.addCallback ('errorPermissionDenied', function () { console.log ('annyang errorPermissionDenied') ; }) ;
		annyang.addCallback ('start', function () { console.log ('annyang start') ; }) ;
		// Start listening
		annyang.debug () ;*/
		annyang.start ({ autoRestart: true }) ;
	}
	
	//launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6YWRuLTEwLjA3LjIwMTQtMTkuMDEuMzkvU2VhdC5kd2Y=') ;
	launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6a2l0Y2hlbi8xNDAzLmR3Zng=') ;
	return ;

	// Populate our initial UI with a set of buttons, one for each function in the Models object
	var panel =$('#control') ;
	for ( var fn in Models ) {
		var button =document.createElement ('div') ;
		button.classList.add ('cmd-btn') ;

		// Replace any underscores with spaces before setting the visible name
		button.innerHTML =fn.replace ('_', ' ') ;
		button.onclick =(function (fn) {
			return (function () { fn () ; }) ;
		}) (Models [fn]) ;

		// Add the button with a space under it
		panel.append (button) ;
		panel.append (document.createTextNode ('\u00a0')) ;
	}
}

function launchViewer (docId, upVec, zoomFunc) {
	// Assume the default "world up vector" of the Y-axis (only atypical models such
	// as Morgan and Front Loader require the Z-axis to be set as up)
	upVec =typeof upVec !== 'undefined' ? upVec : new THREE.Vector3 (0, 1, 0) ;

	// Ask for the page to be fullscreen (can only happen in a function called from a
	// button-click handler or some other UI event)
	//requestFullscreen () ;

	// Bring the layer with the viewers to the front (important so they also receive any UI events)
	var layer1 =$('#layer1') ;
	var layer2 =$('#layer2') ;
	layer1.css ('zIndex', 1) ;
	layer2.css ('zIndex', 2) ;

	// Store the up vector in a global for later use
	upVector =new THREE.Vector3 ().copy (upVec) ;

	// The same for the optional Initial Zoom function
	if ( zoomFunc )
		initZoom =zoomFunc ;
	
	// Get our access token from the internal web-service API
	$.get ('http://' + window.location.host + '/api/token',
		function (accessToken) {
			// Specify our options, including the provided document ID
			var options ={} ;
			options.env ='AutodeskProduction' ;
			options.accessToken =accessToken ;
			options.document =docId ;

			// Create and initialize our two 3D viewers
			oViewer =new Autodesk.Viewing.Viewer3D ($('#viewer') [0], {}) ;
			Autodesk.Viewing.Initializer (options, function () {
				oViewer.initialize () ;
				loadDocument (oViewer, options.document) ;
			}) ;

		}
	) ;
}

function loadDocument (viewer, docId) {
	// Let's zoom in and out of the pivot - the screen real estate is fairly limited
	// and reverse the zoom direction
	viewer.navigation.setZoomTowardsPivot (true) ;
	viewer.navigation.setReverseZoomDirection (true) ;

	if ( docId.substring (0, 4) !== 'urn:' )
		docId ='urn:' + docId ;

	Autodesk.Viewing.Document.load (docId,
		function (document) {
			// Boilerplate code to load the contents
			var geometryItems =[] ;
			if ( geometryItems.length == 0 ) {
				geometryItems =Autodesk.Viewing.Document.getSubItemsWithProperties (
					document.getRootItem (),
					{ 'type': 'geometry', 'role': '3d' },
					true
				) ;
			}
			if ( geometryItems.length > 0 )
				viewer.load (document.getViewablePath (geometryItems [0])) ;

			// Add our custom progress listener and set the loaded flags to false
			viewer.addEventListener ('progress', progressListener) ;
			bModelLoaded =false ;
		},
		function (errorMsg, httpErrorCode) {
			var container =$('#viewer') ;
			if ( container )
				alert ('Load error ' + errorMsg) ;
		}
	) ;
}

// Progress listener to set the view once the data has started loading properly
// (we get a 5% notification early on that we need to ignore - it comes too soon)
function progressListener (e) {
	// If we haven't cleaned this model's materials and set the view
	// and both viewers are sufficiently ready, then go ahead
	if ( !cleanedModel && ((e.percent > 0.1 && e.percent < 5) || e.percent > 5) ) {
		if ( e.target.clientContainer.id === 'viewer' )
			bModelLoaded =true ;
		if ( bModelLoaded && !cleanedModel ) {
			// Iterate the materials to change any red ones to grey
			//for ( var p in oViewer.impl.matman ().materials ) {
			//	var m =oViewer.impl.matman ().materials [p] ;
			//	if ( m.color.r >= 0.5 && m.color.g == 0 && m.color.b == 0 ) {
			//		m.color.r =m.color.g =m.color.b =0.5 ;
			//		m.needsUpdate =true ;
			//	}
			//}
			// If provided, use the "initial zoom" function
			if ( initZoom )
				initZoom () ;

			cleanedModel =true ;
		}
	} else if ( cleanedModel && e.percent > 10 ) {
		// If we have already cleaned and are even further loaded,
		// remove the progress listeners from the viewer
		oViewer.removeEventListener ('progress', progressListener) ;
		oNavigation =new viewer3DControls (oViewer) ;
	}
}
