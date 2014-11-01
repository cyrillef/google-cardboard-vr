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

var Models ={

	morgan: function () {
		launchViewer(
			'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1NwTTNXNy5mM2Q=',
			new THREE.Vector3 (0, 0, 1),
			function () {
				zoom (
					oViewer,
					-48722.5, -54872, 44704.8,
					10467.3, 1751.8, 1462.8
				) ;
			}
		) ;
	},

	robot_arm: function () {
		launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1JvYm90QXJtLmR3Zng=') ;
	},

	chassis: function () {
		launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0NoYXNzaXMuZjNk') ;
	},

	front_loader: function () {
		launchViewer (
			'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0Zyb250JTIwTG9hZGVyLmR3Zng=',
			new THREE.Vector3(0, 0, 1)
		) ;
	},

	suspension: function () {
		launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1N1c3BlbnNpb24uaXB0') ;
	},

	V8_engine: function () {
		launchViewer ('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1Y4RW5naW5lLnN0cA==') ;
	}
	
} ;

var views =[
	
	{
		left: 0,
		bottom: 0,
		width: 0.5,
		height: 1.0,
		background: new THREE.Color ().setRGB (0.5, 0.5, 0.7),
		eye: [ 0, 300, 1800 ],
		up: [ 0, 1, 0 ],
		fov: 30,
//		updateCamera: function (camera, scene, mouseX, mouseY) {
//			camera.position.x +=mouseX * 0.05 ;
//			camera.position.x =Math.max (Math.min (camera.position.x, 2000), -2000) ;
//			camera.lookAt (scene.position) ;
//		}
		updateCamera: function (camera, scene, mouseX, mouseY) {
			camera =scene.impl.getCamera () ;
		}
	},
	
	{ 
		left: 0.5,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		background: new THREE.Color ().setRGB (0.7, 0.5, 0.5),
		eye: [ 0, 1800, 0 ],
		up: [ 0, 0, 1 ],
		fov: 45,
//		updateCamera: function (camera, scene, mouseX, mouseY) {
//			camera.position.x -=mouseX * 0.05;
//			camera.position.x =Math.max (Math.min (camera.position.x, 2000), -2000) ;
//			camera.lookAt (camera.position.clone ().setY (0)) ;
//		}
		updateCamera: function (camera, scene, mouseX, mouseY) {
			camera =scene.impl.getCamera () ;
		}
	}
	
] ;
