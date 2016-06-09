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

var HOUSE_MODEL ='dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6a2l0Y2hlbi8xNDAzLmR3Zng=' ;
var oVR =null ;
var biOS =/iPhone|iPad|iPod/i.test (navigator.userAgent) ; // /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/
var bMobileDevice =/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test (navigator.userAgent.toLowerCase ()) ;

// Initialization
$(document).ready (function () {
	if ( annyang ) {
		// Voice commands
		annyang.addCommands (commands) ;
		annyang.addCallback ('resultNoMatch', function () {
			var messageSpecs ={
				"msgTitleKey": 'Voice command error',
				"messageKey": 'Virtual Reality Tool',
				"messageDefaultValue": 'No command match!'
			} ;
			if ( oVR )
				oVR.showHUD (messageSpecs, 1200) ;
			else
				alert ('No command match!') ;
		}) ;
		annyang.start ({ autoRestart: true }) ;
	}

	$('#start').on ('click', function (evt) {
		//VRController.launchFullscreen (/*oVR._viewer.impl.canvas*/) ;
		VRController.startHouse () ;
	}) ;

}) ;

// myVR
var VRController =function (viewer, model, upVector, config3d) {
	this._model =model ;
	this._viewer =viewer ;
	this._upVector =upVector || new THREE.Vector3 (0, 1, 0) ;
	this._nav =null ;
	this._camera =null ;
	this._baseDir =null ;
	this._controls =null ;
	this._hudMessageStartShowTime =null ;
	this._hudMessageShowTime =null ;

	this.initialize (config3d) ;
} ;

VRController.prototype.initialize =function (config3d) {
	var _self =this ;
	// Get our access token from the internal web-service API
	$.get (window.location.protocol + '//' + window.location.host + '/api/token',
		function (accessToken) {
			// Specify our options, including the provided document ID
			var options ={
				document: _self._model,
		   		'accessToken': accessToken,
		   		'useVR': 'wearality',
		   		env: '' // 'AutodeskProduction'
		   	} ;
			options.config3d =config3d ;

			// Create and initialize our two 3D viewers
			Autodesk.Viewing.Initializer (options, function () {
				_self._viewer.initialize () ;
				_self._viewer.loadExtension ('Autodesk.VR', null) ;

				// Let's zoom in and out of the pivot - the screen real estate is fairly limited
				// and reverse the zoom direction
				_self._viewer.navigation.setZoomTowardsPivot (true) ;
				_self._viewer.navigation.setReverseZoomDirection (true) ;

				if ( options.document.substring (0, 4) === 'urn:' )
					options.document =options.document.substring (4) ;
				Autodesk.Viewing.Document.load ('urn:' + options.document, //options.accessToken,
					function (doc) { // onLoadCallback
						var geometryItems =[] ;
						geometryItems =Autodesk.Viewing.Document.getSubItemsWithProperties (doc.getRootItem (), { 'type' : 'geometry', 'role' : '3d' }, true) ;
						if ( geometryItems.length > 0 ) {
							_self._viewer.load (doc.getViewablePath (geometryItems [0])) ;
							_self._viewer.addEventListener ('progress', function (evt) {
								if ( evt.percent >= 100 ) {
									_self._viewer.removeEventListener ('progress', arguments.callee) ;

									_self._nav =_self._viewer.navigation ;
									_self._camera =_self._nav.getCamera () ;
									_self._baseDir =new THREE.Vector3 ().subVectors (_self._camera.target, _self._camera.position) ;

									_self._nav.setVerticalFov (75, true) ;
									//_self._nav.toPerspective () ; // Switch to perspective is done in the toolS
									_self.setView (hotSpots ['kitchen'].position, hotSpots ['kitchen'].target) ;

									//_self._viewer.loadedExtensions ['Autodesk.VR'].tool.activate () ;
									_self._viewer.setActiveNavigationTool ('vr') ;
								}
							}) ;
						}
					},
					function (errorMsg) { // onErrorCallback
						alert ("Load Error: " + errorMsg) ;
					}
				) ;
			}) ;
		}
	) ;
} ;

VRController.prototype.setView =function (pos, target, up, resetBaseDir) {
	this._viewer.navigation.setView (pos, target) ;
	if ( up )
		this._nav.setCameraUpVector (up) ;
	if ( resetBaseDir )
		this._baseDir =new THREE.Vector3 ().subVectors (this._camera.target, this._camera.position) ;
} ;

VRController.prototype.toggleAutoMove =function () {
	this._viewer.loadedExtensions ['Autodesk.VR'].tool._toggleAutoMove_ () ;
} ;

VRController.prototype.showHUD =function (messageSpecs, showDelay) {
	var _self =this ;
	Autodesk.Viewing.Private.HudMessage.displayMessage (this._viewer.container, messageSpecs) ;
	this._hudMessageStartShowTime =new Date ().getTime () ;
	if ( !showDelay || showDelay <= 0 )
		showDelay =5000 ;
	this._hudMessageShowTime =showDelay ;
	window.setTimeout (function () { _self.hideHUD () ; }, showDelay) ;
} ;

VRController.prototype.hideHUD =function () {
	Autodesk.Viewing.Private.HudMessage.dismiss () ; // In case it's still visible
	this._hudMessageStartShowTime =-1 ;
} ;

VRController.startHouse =function () {
	VRController.launchViewer (HOUSE_MODEL) ;
} ;

VRController.launchViewer =function (urn, upVec) {
	// Assume the default "world up vector" of the Y-axis (only atypical models such
	// as Morgan and Front Loader require the Z-axis to be set as up)
	var upVec =upVec || new THREE.Vector3 (0, 1, 0) ;

	// Bring the layer with the viewers to the front (important so they also receive any UI events)
	$('#layer1').css ('zIndex', 1) ;
	$('#layer2').css ('zIndex', 2) ;
	$('#help').css ('visibility', 'hidden') ;

	var config3d ={} ;
	config3d.screenModeDelegate =Autodesk.Viewing.ApplicationScreenModeDelegate ;
	config3d.extensions =[ 'Autodesk.Viewing.Oculus' ] ;

	oVR =new VRController (
		new Autodesk.Viewing.Viewer3D ($('#viewer') [0], config3d),
		//new Autodesk.Viewing.Private.GuiViewer3D ($('#viewer') [0], config3d),
		urn,
		new THREE.Vector3 ().copy (upVec),
		config3d
	) ;
} ;

// Launch full screen on the given element with the available method
// from https://developer.api.autodesk.com/viewingservice/v1/viewers/lmvworker.js
VRController.launchFullscreen =function (element, options) {
	element =element || document.documentElement ;
	if ( element.requestFullscreen )
		element.requestFullscreen (options) ;
	else if ( element.mozRequestFullScreen )
		element.mozRequestFullScreen (options) ;
	else if ( element.webkitRequestFullscreen )
		element.webkitRequestFullscreen (options) ;
	else if ( element.msRequestFullscreen )
		element.msRequestFullscreen (options) ;
} ;
