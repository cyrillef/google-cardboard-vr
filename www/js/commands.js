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

// https://www.talater.com/annyang/
var commands ={
	'kitchen': function () {
		oNavigation.setView (hotSpots ['kitchen'].position, hotSpots ['kitchen'].target) ;
	},
	'carport': function () {
		oNavigation.setView (hotSpots ['carport'].position, hotSpots ['carport'].target) ;
	},
	'family room': function () {
		oNavigation.setView (hotSpots ['family room'].position, hotSpots ['family room'].target) ;
	},
	'master bedroom': function () {
		oNavigation.setView (hotSpots ['master bedroom'].position, hotSpots ['master bedroom'].target) ;
	},
	'dressing': function () {
		oNavigation.setView (hotSpots ['dressing'].position, hotSpots ['dressing'].target) ;
	},
	'second bedroom': function () {
		oNavigation.setView (hotSpots ['second bedroom'].position, hotSpots ['second bedroom'].target) ;
	},
	'bathroom': function () {
		oNavigation.setView (hotSpots ['bathroom'].position, hotSpots ['bathroom'].target) ;
	},
	'deck': function () {
		oNavigation.setView (hotSpots ['deck'].position, hotSpots ['deck'].target) ;
	},
	'under deck': function () {
		oNavigation.setView (hotSpots ['under deck'].position, hotSpots ['under deck'].target) ;
	},
	'basement': function () {
		oNavigation.setView (hotSpots ['basement'].position, hotSpots ['basement'].target) ;
	},
	'upstairs': function () {
		oNavigation.setView (hotSpots ['upstairs'].position, hotSpots ['upstairs'].target) ;
	},
	'attic': function () {
		oNavigation.setView (hotSpots ['attic'].position, hotSpots ['attic'].target) ;
	},
		
	'view': function (term) {
		oNavigation.setView (hotSpots ['view'].position, hotSpots ['view'].target) ;
	},
	
	'show me *term': function (term) {
		try {
			oNavigation.setView (hotSpots [term].position, hotSpots [term].target) ;
		} catch ( e ) {
		}
	},
/*	'explode': function () {
		explode (true) ;
	},
	'combine': function () {
		if ( expFac > 0 ) {
			expFac =expFac - 1 ;
			explode (false) ;
		}
	},
	'in': function () {
		zoomInwards (-zfac) ;
	},
	'out': function () {
		zoomInwards(zfac) ;
	},
	'reset': function () {
		expFac =0 ;
		explode (false) ;
		if ( initLeftPos ) {
			var trg =viewerLeft.navigation.getTarget () ;
			var up =viewerLeft.navigation.getCameraUpVector () ;

			leftPos =initLeftPos.clone () ;
			zoom (viewerLeft, initLeftPos, trg, up) ;
		}
	},
	'reload': function () {
		location.reload () ;
	},
	'front': function () {
		zoomToCube ('front') ;
	},
	'back': function () {
		zoomToCube ('back') ;
	},
	'top': function () {
		zoomToCube ('top') ;
	},
	'bottom': function () {
		zoomToCube ('bottom') ;
	},
	'left': function () {
		zoomToCube ('left') ;
	},
	'right': function () {
		zoomToCube ('right') ;
	}*/
	
} ;

var faces = {
	'front': new THREE.Vector3 (0,0,1),
	'back': new THREE.Vector3 (0,0,-1),
	'top': new THREE.Vector3 (0,1,0),
	'bottom': new THREE.Vector3 (0,-1,0),
	'left': new THREE.Vector3 (-1,0,0),
	'right': new THREE.Vector3 (1,0,0)
} ;

var faceUps = {
	'top': new THREE.Vector3 (0, 1, 0),
	'bottom': new THREE.Vector3 (0, 1, 0)
} ;
