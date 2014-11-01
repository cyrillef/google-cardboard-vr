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

THREE.BarrelDistortionShader = {

  uniforms: {

    texture: {
      type: 't',
      value: null
    },
    coefficients: {
      type: 'v3',
      value: new THREE.Vector3 (1.0, 0.22, 0.24)
    },

  },

  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    'vUv = uv;',
    'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
  ].join('\n'),

  fragmentShader: [
    'uniform vec3 coefficients;',
    'uniform sampler2D texture;',
    'varying vec2 vUv;',
    'vec2 distort(vec2 p)',
    '{',
    'float rSq = p.y * p.y + p.x * p.x;',
    'p = p * (coefficients.x + rSq * coefficients.y + rSq * rSq * coefficients.z);',
    'return 0.5 * (p + 1.0);',
    '}',
    'void main() {',
    'vec2 xy = 2.0 * vUv - 1.0;',
    'vec2 uv = distort(xy);',
    'float d = length(uv);',
    'if (!all(equal(clamp(uv, vec2(0.0, 0.0), vec2(1.0, 1.0)), uv))) {',
    'gl_FragColor = vec4(0.0);',
    '} else {',
    'gl_FragColor = texture2D( texture, uv );',
    '}',
    '}'
  ].join('\n')

};
