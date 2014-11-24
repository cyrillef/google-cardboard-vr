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

// An accelerometer object for detecting device orientation and motion (if supported)
// The DeviceOrientationEvent.alpha value represents the motion of the device around the z axis,
// represented in degrees with values ranging from 0 to 360.
//    
// The DeviceOrientationEvent.beta value represents the motion of the device around the x axis,
// represented in degrees with values ranging from -180 to 180. 
// This represents a front to back motion of the device.
//    
// The DeviceOrientationEvent.gamma value represents the motion of the device around the y axis,
// represented in degrees with values ranging from -90 to 90. 
// This represents a left to right motion of the device.
//
// Events
//   motion, gyroscope, compassneedscalibration, orientation
//

var Accelerometer =function () {
	var _self =this ;
	_.extend (_self, Backbone.Events) ;
	
	var _absolute =null,
		_alpha =null, _oldAlpha =0, _fixAlpha =0,
		_beta =null,
		_gamma =null, _oldGamma =0,
		_acceleration =null,
		_accelerationIncludingGravity =null,
		_rotationRate =null,
		_interval =null,
		_screenOrientation =window.orientation || 90 ;
	
	_self.activate =function () {
		/*if ( !!window.DeviceMotionEvent ) {
			window.addEventListener ("devicemotion",
				function handleMotion (event) {
					_acceleration =accelerationIncludingGravity =rotationRate ={} ;
					_acceleration.x =event.acceleration.x ;
					_acceleration.y =event.acceleration.y ;
					_acceleration.z =event.acceleration.z ;
					_accelerationIncludingGravity.x =event.accelerationIncludingGravity.x ;
					_accelerationIncludingGravity.y =event.accelerationIncludingGravity.y ;
					_accelerationIncludingGravity.z =event.accelerationIncludingGravity.z ;
					_rotationRate.alpha =event.rotationRate.alpha ;
					_rotationRate.beta =event.rotationRate.beta ;
					_rotationRate.gamma =event.rotationRate.gamma ;
					_interval =event.interval ;
					_self.trigger ("motion", { "_self": _self, "event": event }) ;
				},
				false
			) ;
		}*/
		if ( !!window.DeviceOrientationEvent ) {
			window.addEventListener ("deviceorientation",
				function (event) {
					_absolute =event.absolute ; // true - in reference to the Earth's coordinate frame / false - using some arbitrary frame determined by the device
					if ( _alpha == null )
						_oldAlpha =event.alpha ;
					_alpha =event.alpha ; // alpha is the compass direction the device is facing in degrees (around z) [0 / 360]
					_beta =event.beta ; // beta is the front-to-back tilt in degrees, where front is positive (around x) [-180 / +180]
					if ( _gamma == null )
						_oldGamma =event.gamma ;
					_gamma =event.gamma ; // gamma is the left-to-right tilt in degrees, where right is positive (around y) [-90 - +90]
				
					// In landscape mode on Android, the alpha angle switch by 180 degress when the gamma flip from -90->+90 (and vice et versa)
					if (   (_screenOrientation == 90 || _screenOrientation == -90)
						&& Math.cos (THREE.Math.degToRad (_alpha - _oldAlpha)) < -0.85
					) {
						_fixAlpha +=180 ;
						_fixAlpha =(_fixAlpha % 360) ;
					}
					_oldAlpha =_alpha ;
					_oldGamma =_gamma ;
					_alpha +=_fixAlpha ;
				
					_self.trigger ("gyroscope", { "_self": _self, "event": event }) ;
				},
				false
			) ;
		}

		window.addEventListener ("orientationchange",
			function (event) {
				switch ( window.screen.orientation || window.screen.mozOrientation ) {
					case 'landscape-primary': _screenOrientation =90 ; break ;
					case 'landscape-secondary': _screenOrientation =-90 ; break ;
					case 'portrait-secondary': _screenOrientation =180 ; break ;
					case 'portrait-primary': _screenOrientation =0 ; break ;
					default: _screenOrientation =window.orientation || 0 ; break ;
				}
				_self.trigger ("orientation", { "_self": _self, "event": event }) ;
			},
			false
		) ;

		/*window.addEventListener ("compassneedscalibration",
			function (event) {
				//alert ('Your compass needs calibrating!') ;
				event.preventDefault () ;
				_self.trigger ("compassneedscalibration", { "_self": _self, "event": event }) ;
			},
			true
		) ;*/		
	}
	_self.activate () ;
	
	_self.getScreenOrientation =function () { return (_screenOrientation) ; }
	_self.getAlpha =function () { return ((_alpha !== null) ? _alpha : 0) ; }
	_self.getBeta =function () { return ((_beta !== null) ? _beta : 0) ; }
	_self.getGamma =function () { return ((_gamma !== null) ? _gamma : 0) ; }
	_self.getAcceleration =function () { return ((_acceleration !== null) ? _acceleration : 0) ; }
	_self.getAccelerationIncludingGravity =function () { return ((_accelerationIncludingGravity !== null) ? _accelerationIncludingGravity : 0) ; }
	_self.getRotationRate =function () { return ((_rotationRate !== null) ? _rotationRate : 0) ; }
	_self.getInterval =function () { return ((_interval !== null) ? _interval : 0) ; }

	_self.createQuaternion =function () {
		var finalQuaternion =new THREE.Quaternion () ;
		var deviceEuler =new THREE.Euler () ;
		var screenTransform =new THREE.Quaternion () ;
		var worldTransform =new THREE.Quaternion (-Math.sqrt (0.5), 0, 0, Math.sqrt (0.5)) ; // -PI/2 around the x-axis
		var minusHalfAngle =0 ;

		return (function (alpha, beta, gamma, screenOrientation) {
			deviceEuler.set (beta, alpha, -gamma, 'YXZ') ;
			finalQuaternion.setFromEuler (deviceEuler) ;
			//minusHalfAngle =-screenOrientation / 2 ;
			//screenTransform.set (0, Math.sin (minusHalfAngle), 0, Math.cos (minusHalfAngle)) ;
			finalQuaternion.multiply (screenTransform) ;
			finalQuaternion.multiply (worldTransform) ; // camera looks out the back of the device, not the top
			return (finalQuaternion) ;
		}) ;
	}
	
	/*_self.createRotationMatrix =function () {
		var finalMatrix =new THREE.Matrix4 () ;
		var deviceEuler =new THREE.Euler () ;
		var screenEuler =new THREE.Euler () ;
		var worldEuler =new THREE.Euler (-Math.PI / 2, 0, 0, 'YXZ') ; // -PI/2 around the x-axis
		var screenTransform =new THREE.Matrix4 () ;
		var worldTransform =new THREE.Matrix4 () ;
		worldTransform.makeRotationFromEuler (worldEuler) ;
		
		return (function (alpha, beta, gamma, screenOrientation) {
			deviceEuler.set (beta, alpha, -gamma, 'YXZ') ;
			finalMatrix.identity () ;
			finalMatrix.makeRotationFromEuler (deviceEuler) ;
			screenEuler.set (0, -screenOrientation, 0, 'YXZ') ;
			screenTransform.identity () ;
			screenTransform.makeRotationFromEuler (screenEuler) ;
			finalMatrix.multiply (screenTransform) ;
			finalMatrix.multiply (worldTransform) ;
			return (finalMatrix) ;
		}) ;
	}*/
	
} ;
