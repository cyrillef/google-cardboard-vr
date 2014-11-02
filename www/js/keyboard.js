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

KeyboardJS.on ('a', function () { // move left
    updateMvt (new THREE.Vector3 (1, 0, 0), true) ;
}) ;
KeyboardJS.on ('d', function () { // move right
    updateMvt (new THREE.Vector3 (-1, 0, 0), true) ;
}) ;
KeyboardJS.on ('w', function () { // move forward
    updateMvt (new THREE.Vector3 (0, 0, 1), true) ;
}) ;
KeyboardJS.on ('s', function () { // move backward
    updateMvt (new THREE.Vector3 (0, 0, -1), true) ;
}) ;
KeyboardJS.on ('r', function () { // up
    updateMvt (new THREE.Vector3 (0, 1, 0), false) ;
}) ;
KeyboardJS.on ('f', function () { // down
    updateMvt (new THREE.Vector3 (0, -1, 0), false) ;
}) ;

/*
KeyboardJS.on ('q', function () { // rotate left
    console.log('you pressed a!') ;
}) ;
KeyboardJS.on ('e', function () { // rotate right
    console.log('you pressed a!') ;
}) ;
*/

function updateMvt (mvt, trsf) {
	var pos =oNavigation.getViewer ().navigation.getCamera ().position ;
	var target =oNavigation.getViewer ().navigation.getCamera ().target ;

	//mvt.multiplyScalar (oNavigation.getMovementSpeed ()) ;

	var qs =oNavigation.getMoveQuaternions () ;

	if ( trsf == true ) {
		//mvt.applyQuaternion (q2) ;
		mvt.applyQuaternion (qs.full) ;

//		var quaternion = new THREE.Quaternion();
//		oNavigation.getViewer ().navigation.getCamera ().quaternion.copy( quaternion );
//		mvt.applyQuaternion (quaternion) ;
	}

	var newPos =pos.clone ().add (mvt) ;
	var newTarget =target.clone ().add (mvt) ;

//	oNavigation.getViewer ().navigation.setView (newPos, newTarget) ;

	//console.log ('position: ' + JSON.stringify (pos) + " -> " + JSON.stringify (newPos)) ;
	//console.log ('target: ' + JSON.stringify (target) + " -> " + JSON.stringify (newTarget)) ;
	console.log ('position: ' + JSON.stringify (newPos) + ",") ;
	console.log ('target: ' + JSON.stringify (newTarget) + ",") ;
	console.log ('alpha: ' + oNavigation.getAccelerometer ().getAlpha () + ",") ;

	var up =upVector.clone () ;
	if ( trsf == true ) {
		//up.applyQuaternion (q2) ;
		//up.applyQuaternion (q1) ;
	}
//	oNavigation.getViewer ().navigation.setCameraUpVector (up) ;

	oNavigation.setView (newPos, newTarget) ;
}

/*	function updateMvt (mvt, trsf) {
		var pos =oNavigation.getViewer ().navigation.getCamera ().position ;
		var target =oNavigation.getViewer ().navigation.getCamera ().target ;
		
		//mvt.multiplyScalar (oNavigation.getMovementSpeed ()) ;
		
		var q1 =new THREE.Quaternion () ;
		q1.setFromAxisAngle (upVector, oNavigation.getAccelerometer ().getAlpha ()) ;

		// gamma is the front-to-back in degrees (with this screen orientation) with +90/-90 being vertical and
		// negative numbers being 'downwards' with positive being 'upwards'
		var gamma =-(oNavigation.getAccelerometer ().getGamma () + (oNavigation.getAccelerometer ().getGamma () <= 0 ? Math.PI / 2 : -Math.PI / 2)) ;
		var axis =oNavigation.getBaseDir ().clone ().normalize () ;
		axis.cross (upVector) ;
		var q2 =new THREE.Quaternion () ;
		q2.setFromAxisAngle (axis, gamma) ;
		
		if ( trsf == true ) {
			//mvt.applyQuaternion (q2) ;
			mvt.applyQuaternion (q1) ;
			
			var quaternion = new THREE.Quaternion();
			oNavigation.getViewer ().navigation.getCamera ().quaternion.copy( quaternion );
			mvt.applyQuaternion (quaternion) ;
		}
		
		var newPos =pos.clone ().add (mvt) ;
		var newTarget =target.clone ().add (mvt) ;
		
		oNavigation.getViewer ().navigation.setView (newPos, newTarget) ;
		
		console.log (JSON.stringify (pos) + " -> " + JSON.stringify (newPos)) ;
		console.log (JSON.stringify (target) + " -> " + JSON.stringify (newTarget)) ;
		
		var up =upVector.clone () ;
		if ( trsf == true ) {
			//up.applyQuaternion (q2) ;
			//up.applyQuaternion (q1) ;
		}
		oNavigation.getViewer ().navigation.setCameraUpVector (up) ;
		
	}
*/