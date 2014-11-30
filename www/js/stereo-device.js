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

var viewer3DControls =function (viewer) {
	var _self =this ;
	var _accelerometer =new Accelerometer () ;
					
	var _viewer =viewer ;
	var _nav =viewer.navigation ;
	var _camera =_nav.getCamera () ;
	var _baseDir =new THREE.Vector3 ().subVectors (_camera.target, _camera.position) ;
	var _basePos =_camera.position.clone () ;
	var _tempPos =_camera.position.clone () ;
		
	var _modelScaleFactor =1.0 ;
	var _movementSpeed =1.0 ; // for VR make slower (35 for example)
	var _lookSpeed =0.004 ;
	var _toggleVRMotion =false ;
	var _toggleVRMotionStartTime =-1 ;
    var _toggleVRMotionTimer ;
	
	var _hudMessageStartShowTime =-1 ;
	var _hudMessageShowTime =5000 ; // milliseconds to show HUD

	var _previousFov =_camera.fov ;
	_nav.setVerticalFov (75, true) ;
	var _wasPerspective =_camera.isPerspective ;
	_nav.toPerspective () ; // Switch to perspective
		
	// Calculate a movement scale factor based on the model bounds.
	var boundsSize =_viewer.utilities.getBoundingBox ().size () ;
	_modelScaleFactor =Math.max (Math.min (Math.min (boundsSize.x, boundsSize.y), boundsSize.z) / 100.0, 1.0) ;
	
	_self.getAccelerometer =function () { return (_accelerometer) ; }
	_self.getViewer =function () { return (_viewer) ; }
	_self.getBaseDir =function () { return (_baseDir) ; }
	_self.getMovementSpeed =function () { return (_movementSpeed) ; }
    
    var _walk0, _walk, _stop ;
    _self.createSign =function (name) {
        var img =new THREE.MeshBasicMaterial ({
            map: THREE.ImageUtils.loadTexture ('css/' + name + '.png'),
            side: THREE.FrontSide
        }) ;
        img.map.needsUpdate =true ;
        var plane =new THREE.Mesh (new THREE.PlaneGeometry (2, 2), img) ;
        plane.overdraw =true ;
        plane.name =name ;
        plane.rotation.x =THREE.Math.degToRad (-90) ;
        //_viewer.impl.scene.add (plane) ;
        var pos =_camera.position ;
        plane.position.set (pos.x, pos.y - 3, pos.z) ;
        //_viewer.impl.invalidate (true) ;
        return (plane) ;
    }
    
    _self.activate =function () {
        //_walk0 =_self.createSign ('walk0') ;
        _walk =_self.createSign ('walk') ;
        _stop =_self.createSign ('stop') ;
        
        _viewer.impl.scene.add (_stop) ;
        _viewer.impl.invalidate (true) ;
    }
    _self.activate () ;

	_accelerometer.on ("gyroscope", function (accelerometer, event) {
		var qs =_self.getOrientQuaternions () ;
		
		var pos =_camera.position ;
		//var target =_camera.target ;
		var vector =_baseDir.clone () ;
		
		vector.applyQuaternion (qs.full) ;
		var newTarget =vector.add (pos) ;
        
        var gamma =_accelerometer.getGamma () ;
        if ( gamma <= 0 && gamma >= -10 ) {
            _toggleVRMotion =!_toggleVRMotion ;
            if ( _toggleVRMotion == false ) {
                window.clearInterval (_toggleVRMotionTimer) ;

                _viewer.impl.scene.remove (_viewer.impl.scene.getChildByName ('walk')) ;
                _viewer.impl.scene.add (_stop) ;
            } else {
                _viewer.impl.scene.remove (_viewer.impl.scene.getChildByName ('stop')) ;
                _viewer.impl.scene.add (_walk) ;
                
                _toggleVRMotionStartTime =new Date ().getTime () ;
                _toggleVRMotionTimer =window.setInterval (function () {
                        var t0 =new Date ().getTime () ;
                        var diff =(t0 - _toggleVRMotionStartTime) / 1000.0 ;
                        _toggleVRMotionStartTime =t0 ;
                    
                        updateMvt (new THREE.Vector3 (0, 0, diff * _movementSpeed), true) ;
                    },
                    250
                ) ;
            }
        }
        
        _walk.position.set (pos.x, pos.y - 3, pos.z) ;
        _stop.position.set (pos.x, pos.y - 3, pos.z) ;
		_self.setView (pos, newTarget, qs.up) ;
	}) ;
	
	_self.setView =function (pos, target, up, alpha) {
		_viewer.navigation.setView (pos, target) ;
		if ( up )
			_viewer.navigation.setCameraUpVector (up) ;
		if ( alpha )
			_baseDir =new THREE.Vector3 ().subVectors (_camera.target, _camera.position) ;
	}
	
	_self.getOrientQuaternions =function () {
		//var alpha =_accelerometer.getGamma () ? THREE.Math.degToRad (_accelerometer.getAlpha ()) : 0 ;
		var alpha =THREE.Math.degToRad (_accelerometer.getAlpha ()) ;
		var beta =THREE.Math.degToRad (_accelerometer.getBeta ()) ;
		var gamma =THREE.Math.degToRad (_accelerometer.getGamma ()) ;
		var orient =THREE.Math.degToRad (_accelerometer.getScreenOrientation ()) ;
		/*console.log (  ' alpha:' + _accelerometer.getAlpha ()
					 + ' beta:' + _accelerometer.getBeta ()
					 + ' gamma:' + _accelerometer.getGamma ()
					 + ' orient:' + _accelerometer.getScreenOrientation ()
					) ;*/
		
		//var q =_accelerometer.createQuaternion () (alpha, beta, gamma, orient) ;
		// alpha is the compass direction the device is facing in degrees. This equates to the left-right
		// rotation in landscape orientation (with 0-360 degrees)
		var q1 =new THREE.Quaternion () ;
		q1.setFromAxisAngle (upVector, alpha) ;
		
		// gamma is the front-to-back in degrees (with this screen orientation) with +90/-90 being vertical and
		// negative numbers being 'downwards' with positive being 'upwards'
		gamma =-(gamma + (gamma <= 0 ? Math.PI / 2 : -Math.PI / 2)) ;
		var axis =_baseDir.clone ().normalize () ;
		axis.applyQuaternion (q1) ;
		axis.cross (upVector) ;
		var q2 =new THREE.Quaternion () ;
		q2.setFromAxisAngle (axis, gamma) ;

		up =upVector.clone () ;
		up.applyQuaternion (q2) ;
		up.normalize () ;

		var qs =q1.clone () ;
		qs.multiply (q2) ;
		
		//return ({ "full": qs, "lefToRight": q1, "backToFront": q2, "up": up }) ;
		
		
		var tt =new THREE.Quaternion () ;
		var a =new THREE.Euler (0, alpha, gamma, 'XYZ') ;
		tt.setFromEuler (a) ;
		
		up2 =upVector.clone () ;
		up2.applyEuler (a) ;
		up2.normalize () ;
		
		return ({ "full": tt, "lefToRight": q1, "backToFront": q2, "up": up2 }) ;
	}
	
	_self.getMoveQuaternions =function () {
		//var alpha =_accelerometer.getGamma () ? THREE.Math.degToRad (_accelerometer.getAlpha ()) : 0 ;
		var alpha =THREE.Math.degToRad (_accelerometer.getAlpha ()) ;
		var beta =THREE.Math.degToRad (_accelerometer.getBeta ()) ;
		var gamma =THREE.Math.degToRad (_accelerometer.getGamma ()) ;
		var orient =THREE.Math.degToRad (_accelerometer.getScreenOrientation ()) ;
		
		//var q =_accelerometer.createQuaternion () (alpha, beta, gamma, orient) ;
		// alpha is the compass direction the device is facing in degrees. This equates to the left-right
		// rotation in landscape orientation (with 0-360 degrees)
		var q1 =new THREE.Quaternion () ;
		q1.setFromAxisAngle (upVector, alpha) ;
		
		// Z axis is the camera vector, and our orign is _baseDir
		var zee =new THREE.Vector3 (0, 0, 1) ;
		var vector =_baseDir.clone () ;
		vector.y =0 ;
		vector.normalize () ;
		var q2 =new THREE.Quaternion () ;
		q2.setFromUnitVectors  (zee, vector) ;

		var qs =q1.clone () ;
		qs.multiply (q2) ;
		return ({ "full": qs, "lefToRight": q1, "alignToBase": q2 }) ;
	}
	
	_self.showHUD =function (messageSpecs, showDelay) {
		Autodesk.Viewing.Private.HudMessage.displayMessage (oViewer.container, messageSpecs) ;
		_hudMessageStartShowTime =new Date ().getTime () ;
		if ( !showDelay || showDelay <= 0 )
			showDelay =5000 ;
		_hudMessageShowTime =showDelay ;
		window.setTimeout (function () { _self.hideHUD () ; }, showDelay) ;
	}

	_self.hideHUD =function () {
		Autodesk.Viewing.Private.HudMessage.dismiss () ; // in case it's still visible
		_hudMessageStartShowTime =-1 ;
	}

	
} ;
