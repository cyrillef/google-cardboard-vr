/**
 * Created by tstanev on 14-11-23.
 */

//Shader that implements Oculus VR headset image warping.
WarpShader = {

	uniforms: {
		"tDiffuse": { type: "t", value: null }, //Color buffer containing the rendered 3d model

		//Stereo rendering (Oculus) uniforms. Warp and aberration constants are from DK1 Rift.
		"scale": { type: "v2", value: new THREE.Vector2(1.0,1.0) },
		"scaleIn": { type: "v2", value: new THREE.Vector2(1.0,1.0) },
		"lensCenter": { type: "v2", value: new THREE.Vector2(0.0,0.0) },
		"hmdWarpParam": { type: "v4", value: new THREE.Vector4(1.0, 0.22, 0.24, 0.0) },
		"chromAbParam": { type: "v4", value: new THREE.Vector4(0.996, -0.004, 1.014, 0.0) }
	},


	defines: {
		//"OCULUS" : 1
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",

		"uniform vec2 scale;",
		"uniform vec2 scaleIn;",
		"uniform vec2 lensCenter;",
		"uniform vec4 hmdWarpParam;",
		'uniform vec4 chromAbParam;',


		"varying vec2 vUv;",


		"vec4 sampleColor() {",

			//In our case the source texture is one eye only, so we deviate from the sample
			"vec2 uv = (vUv*2.0)-1.0;", // range from [0,1] to [-1,1]

			"vec2 theta = (uv-lensCenter)*scaleIn;",
			"float rSq = theta.x*theta.x + theta.y*theta.y;",
			"vec2 rvector = theta*(hmdWarpParam.x + hmdWarpParam.y*rSq + hmdWarpParam.z*rSq*rSq + hmdWarpParam.w*rSq*rSq*rSq);",
		     /*
		    "vec2 tc = (lensCenter + scale * rvector);",
		  	"tc = (tc+1.0)/2.0;", // range from [-1,1] to [0,1]

			"if (any(bvec2(clamp(tc, vec2(0.0,0.0), vec2(1.0,1.0))-tc)))",
			"  return vec4(0.0, 0.0, 0.0, 1.0);",

			"return texture2D( tDiffuse, tc);",
               */

			"  vec2 rBlue = rvector * (chromAbParam.z + chromAbParam.w * rSq);",
			"  vec2 tcBlue = (lensCenter + scale * rBlue);",
			"  tcBlue = (tcBlue+1.0)/2.0;", // range from [-1,1] to [0,1]

			"  if (any(bvec2(clamp(tcBlue, vec2(0.0,0.0), vec2(1.0,1.0))-tcBlue)))",
			"    return vec4(0.0, 0.0, 0.0, 1.0);",

			"  vec2 tcGreen = lensCenter + scale * rvector;",
			"  tcGreen = (tcGreen+1.0)/2.0;", // range from [-1,1] to [0,1]

			"  vec2 rRed = rvector * (chromAbParam.x + chromAbParam.y * rSq);",
			"  vec2 tcRed = lensCenter + scale * rRed;",
			"  tcRed = (tcRed+1.0)/2.0;", // range from [-1,1] to [0,1]

			"  return vec4(texture2D(tDiffuse, tcRed).r, texture2D(tDiffuse, tcGreen).g, texture2D(tDiffuse, tcBlue).b, 1);",
		"}",


		"void main() {",

			"vec4 texel = sampleColor();",

			"gl_FragColor = texel;",
		"}"

	].join("\n")

};
