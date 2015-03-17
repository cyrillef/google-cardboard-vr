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
	'kitchen': function () { commands.navigateTo ('kitchen') ; },
	'carport': function () { commands.navigateTo ('carport') ; },
	'family room': function () { commands.navigateTo ('family room') ; },
	'master bedroom': function () { commands.navigateTo ('master bedroom') ; },
	'dressing': function () { commands.navigateTo ('dressing') ; },
	'second bedroom': function () { commands.navigateTo ('second bedroom') ; },
	'bathroom': function () { commands.navigateTo ('bathroom') ; },
	'deck': function () { commands.navigateTo ('deck') ; },
	'under deck': function () { commands.navigateTo ('under deck') ; },
	'basement': function () { commands.navigateTo ('basement') ; },
	'upstairs': function () { commands.navigateTo ('upstairs') ; },
	'attic': function () { commands.navigateTo ('attic') ; },
	'view': function () { commands.navigateTo ('view') ; },
	'show me *term': function (term) { commands.navigateTo (term) ; },
	'start': function () { oVR.startHouse () ; }
} ;

commands.navigateTo =function (term) {
	try {
		oVR.setView (hotSpots [term].position, hotSpots [term].target) ;
	} catch ( err ) {
	}
}

var hotSpots ={
	'kitchen': {
		position: { 'x': -30.480723724787087, 'y': 5.5, 'z': -24.235822650931027 },
		target: { 'x': 8.01956927196871, 'y': 5.5, 'z': -95.96920575394927 },
		alpha: 30,
	},
	'carport': {
		position: { 'x': 12.350167765256202, 'y': 5.5, 'z': -14.22899935714554 },
		target: { 'x': -69.02291079973693, 'y': 5.5, 'z': -11.704539593971049 },
		alpha: 150,
	},
	'family room': {
		position: { 'x': -23.304378354699182, 'y': 5.5, 'z': -13.715248792308666 },
		target: { 'x': -61.80467135145496, 'y': 5.5, 'z': 58.01813431070957 },
		alpha: -150,
	},
	'master bedroom': {
		position: { 'x': -6.784930211561964, 'y': 5.5, 'z': 2.7804425556221837 },
		target: { 'x': -75.99385355140572, 'y': 5.5, 'z': 45.65322812385948 },
		alpha: 180,
	},
	'dressing': {
		position: { 'x': -5.32530443907937, 'y': 5.5, 'z': -9.967577462795028 },
		target: { 'x': 75.24990205566608, 'y': 5.5, 'z': 1.6766017942223694 },
		alpha: -40,
	},
	'second bedroom': {
		positiom: { 'x': -6.955041865696995, 'y': 5.298867392839059, 'z': -20.62917005610052 },
		target: { 'x': 10.078089020308937, 'y': 3.9510444064032457, 'z': -100.2282067189764 },
		alpha: 50,
	},
	'bathroom': {
		position: {'x': -17.033412606060377, 'y': 4.751886224572082, 'z': -22.118410122351634 },
		target: {'x': -33.64980695696097, 'y': 4.751886224572082, 'z': -101.81688094215963 },
		alpha: 70,
	},
	'deck': {
		position: { 'x': -46.685425331132926, 'y': 4.751886224572082, 'z': -2.6567005018651337 },
		target: { 'x': -28.062963722566845, 'y': 4.751886224572082, 'z': -81.91043691774591 },
		alpha: 45,
	},
	'under deck': {
		position: { 'x': -47.14291094832529, 'y': -5.248113775427918, 'z': -0.7097267192830156 },
		target: { 'x': -28.520449339759207, 'y': -5.248113775427918, 'z': -79.96346313516379 },
		alpha: 45,
	},
	'basement': {
		position: { 'x': -27.382475882211352, 'y': -5.705331538629613, 'z': -1.351298284635841 },
		target: { 'x': -15.738296625193954, 'y': -5.705331538629613, 'z': -81.9265047793813 },
		alpha: 50,
	},
	'upstairs': {
		position: { 'x': -33.12236123958074, 'y': 13.5, 'z': -14.95329364317222 },
		target: { 'x': 48.25071732541237, 'y': 13.5, 'z': -17.47775340634671 },
		alpha: -30,
	},
	'attic': {
		position: { 'x': -2.1372683600291476, 'y': 13.5, 'z': -15.914552841079765 },
		target: { 'x': -83.51034692502226, 'y': 13.5, 'z': -13.390093077905274 },
		alpha: 150,
	},

	'view': {
		position: { 'x': -72.51577446348941, 'y': 22.5, 'z': 37.231480502122515 },
		target: { 'x': -16.761381421530345, 'y': 22.5, 'z': -22.09303777458307 },
		alpha: 15,
	}

} ;
