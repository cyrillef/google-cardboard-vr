
AutodeskNamespace('Autodesk.Viewing.Extensions.Oculus');


Autodesk.Viewing.Extensions.Oculus.StereoRenderContext = function(options) {

    var _leftCamera, _rightCamera;
    var _leftContext, _rightContext;
    var _renderer;
    var _w, _h, _dpr;
    var _warpPassLeft, _warpPassRight;
    var _useWarp = options ? options.useWarp : true;

	// Specific HMD parameters
	var HMD = (options && options.HMD) ? options.HMD: {
		// Parameters from the Oculus Rift DK2
		hResolution: 1920,
		vResolution: 1080,
		hScreenSize: 0.12576,
		vScreenSize: 0.07074,
		interpupillaryDistance: 0.0635,
		lensSeparationDistance: 0.0635,
		eyeToScreenDistance: 0.041,
		distortionK : [1.0, 0.22, 0.24, 0.0],
		chromaAbParameter: [ 0.996, -0.004, 1.014, 0.0]
	};


    var left = {}, right = {};
    var distScale = 1.0;
    var offsetProjection = 0.0;
    var fov = 100;
    var aspect = 1;

//See three.js OculusRiftEffect
	function computeCameraParams(HMD) {

		// Compute aspect ratio and FOV
		aspect = HMD.hResolution / (2*HMD.vResolution);

		// Fov is normally computed with:
		//   THREE.Math.radToDeg( 2*Math.atan2(HMD.vScreenSize,2*HMD.eyeToScreenDistance) );
		// But with lens distortion it is increased (see Oculus SDK Documentation)
		var r = -1.0 - (4 * (HMD.hScreenSize/4 - HMD.lensSeparationDistance/2) / HMD.hScreenSize);
		distScale = (HMD.distortionK[0] + HMD.distortionK[1] * Math.pow(r,2) + HMD.distortionK[2] * Math.pow(r,4) + HMD.distortionK[3] * Math.pow(r,6));
		fov = THREE.Math.radToDeg(2*Math.atan2(HMD.vScreenSize*distScale, 2*HMD.eyeToScreenDistance));

		// Compute camera projection matrices
		offsetProjection = 4 * (HMD.hScreenSize/4 - HMD.interpupillaryDistance/2) / HMD.hScreenSize;

		// Distortion shader parameters
		var lensShift = 4 * (HMD.hScreenSize/4 - HMD.lensSeparationDistance/2) / HMD.hScreenSize;
		left.lensCenter = new THREE.Vector2(lensShift, 0.0);
		right.lensCenter = new THREE.Vector2(-lensShift, 0.0);
	}


    this.init = function (glrenderer, width, height) {

        _renderer = glrenderer;

        //For Oculus targets, we want to cancel out the DPR
        //scale applied by the underlying render context
        _w = width;
        _h = height;
        _dpr = _renderer.devicePixelRatio;

        computeCameraParams(HMD);

        _leftContext = new RenderContext();
        _rightContext = new RenderContext();

        _leftContext.settings.sao = _rightContext.settings.sao = false;
        _leftContext.settings.antialias = _rightContext.settings.antialias = false;
        _leftContext.settings.customPresentPass = _rightContext.settings.customPresentPass = _useWarp;

        _leftContext.init(_renderer, _w/2 * distScale / _dpr, _h * distScale / _dpr);
        _rightContext.init(_renderer, _h/2 * distScale / _dpr, _h * distScale / _dpr);

        this.settings = _leftContext.settings;

        if (_useWarp) {
            _warpPassLeft = new THREE.ShaderPass(WarpShader);
            _warpPassRight = new THREE.ShaderPass(WarpShader);

            var bpasses = [_warpPassLeft, _warpPassRight];
            for (var i=0; i<2; i++) {
                bpasses[i].material.blending = THREE.NoBlending;
                bpasses[i].material.depthWrite = false;
                bpasses[i].material.depthTest = false;

                bpasses[i].uniforms['hmdWarpParam'].value.set(HMD.distortionK[0], HMD.distortionK[1], HMD.distortionK[2], HMD.distortionK[3]);
                bpasses[i].uniforms['chromAbParam'].value.set(HMD.chromaAbParameter[0], HMD.chromaAbParameter[1], HMD.chromaAbParameter[2], HMD.chromaAbParameter[3]);
                bpasses[i].uniforms['scaleIn'].value.set(1.0,1.0/aspect);
                bpasses[i].uniforms['scale'].value.set(1.0/distScale, 1.0*aspect/distScale);
            }

            bpasses[0].uniforms['lensCenter'].value.copy(left.lensCenter);
            bpasses[1].uniforms['lensCenter'].value.copy(right.lensCenter);
        }
    };

	function applyCameraChanges(camera) {

		//Correct aspect ration. Stereo rendering cuts horizontal
		//size in half.
		_leftCamera.aspect = _rightCamera.aspect = aspect;

		//Apply field of view correction
		_leftCamera.fov = _rightCamera.fov = fov;

		//Offset real world camera position for each eye
		var unitsPerM = 1.0 / _leftContext.getUnitScale();
		var right = camera.target.clone().sub(camera.position).cross(camera.up).normalize();
		right.multiplyScalar(0.5 * HMD.interpupillaryDistance * unitsPerM);
		_leftCamera.position.sub(right);
		_rightCamera.position.add(right);
		_leftCamera.target.sub(right);
		_rightCamera.target.add(right);

		_leftCamera.toPerspective();
		_rightCamera.toPerspective();

		_leftCamera.projectionMatrix.elements[12] += offsetProjection;
		_rightCamera.projectionMatrix.elements[12] -= offsetProjection;
	}

    this.beginScene = function (prototypeScene, camera, customLights, needClear) {

		_leftCamera = camera.clone();
		_rightCamera = camera.clone();

		applyCameraChanges(camera);

        _leftContext.beginScene(prototypeScene, _leftCamera, customLights, needClear);
        _rightContext.beginScene(prototypeScene, _rightCamera, customLights, needClear);
    };


    this.renderScenePart = function (scene, colorTarget, saoTarget, idTarget) {
        _leftContext.renderScenePart(scene, colorTarget, saoTarget, idTarget);
        _rightContext.renderScenePart(scene, colorTarget, saoTarget, idTarget);
    };

    this.sceneDirty = function(camera, bbox) {
        _leftContext.sceneDirty(camera, bbox);
        _rightContext.sceneDirty(camera, bbox);
    };

    //TODO: get rid of this and combine it with composeFinalFrame
    this.endScene = function() {
        _leftContext.endScene();
        _rightContext.endScene();
    };

    this.clearAllOverlays = function () {
        _leftContext.clearAllOverlays();
        _rightContext.clearAllOverlays();
    };

    this.renderOverlays = function (overlays) {
        _leftContext.renderOverlays(overlays);
        _rightContext.renderOverlays(overlays);
    };


    this.composeFinalFrame = function (skipAOPass, progressiveDone) {

        //Make the final frame but skip presenting it
        //to the screen. We will do custom stuff
        _leftContext.composeFinalFrame(skipAOPass, progressiveDone, true);
        _rightContext.composeFinalFrame(skipAOPass, progressiveDone, true);

        //Compose the per-eye frames using viewports per eye
        _renderer.setViewport(0,0,_w/2,_h);
        _leftContext.presentBuffer(_warpPassLeft);

        _renderer.setViewport(_w/2,0,_w/2,_h);
        _rightContext.presentBuffer(_warpPassRight);

        _renderer.setViewport(0,0,_w,_h);
    };

    this.cleanup = function() {
        _leftContext.cleanup();
        _rightContext.cleanup();
    };

    this.setSize = function (w, h, force) {
        _w = w;
        _h = h;

        _leftContext.setSize(_w/2 * distScale / _dpr, _h * distScale / _dpr, force);
        _rightContext.setSize(_w/2 * distScale / _dpr, _h * distScale / _dpr, force);

        _renderer.setSize(w,h);
    };

    this.getMaxAnisotropy = function () {
        return _leftContext.getMaxAnisotropy();
    };

    this.hasMRT = function () {
        return _leftContext.hasMRT();
    };

    this.initPostPipeline = function (useSAO, useFXAA, useIDBuffer) {

        //override these
        useSAO = false; useFXAA = false; useIDBuffer = false;

        _leftContext.initPostPipeline(useSAO, useFXAA, useIDBuffer);
        _rightContext.initPostPipeline(useSAO, useFXAA, useIDBuffer);
    };

    this.setClearColors = function (colorTop, colorBot) {
        _leftContext.setClearColors(colorTop, colorBot);
        _rightContext.setClearColors(colorTop, colorBot);
    };


    this.setAOOptions = function (radius, intensity) {
        _leftContext.setAOOptions(radius, intensity);
        _rightContext.setAOOptions(radius, intensity);
    };

    this.getAORadius = function () {
        return _leftContext.getAORadius();
    };

    this.getAOIntensity = function() {
        return _leftContext.getAOIntensity();
    };

    this.setTonemapExposureBias = function (bias) {
        _leftContext.setTonemapExposureBias(bias);
        _rightContext.setTonemapExposureBias(bias);
    };

    this.getExposureBias = function () {
        return _leftContext.getExposureBias();
    };

    this.setTonemapMethod = function (value) {
        _leftContext.setTonemapMethod(value);
        _rightContext.setTonemapMethod(value);
    };

    this.getToneMapMethod = function () {
        return _leftContext.getToneMapMethod();
    };

    this.toggleTwoSided = function (isTwoSided) {
        _leftContext.toggleTwoSided(isTwoSided);
        _rightContext.toggleTwoSided(isTwoSided);
    };

    this.enter2DMode = function(idMaterial) {
        _leftContext.enter2DMode(idMaterial);
        _rightContext.enter2DMode(idMaterial);
    };

    //Returns the value of the ID buffer at the given
    //viewport location. Note that the viewport location is in
    //OpenGL-style coordinates [-1, 1] range.
    this.idAtPixel = function (vpx, vpy) {
        console.warn("idAtPixel not implemented in stereo context.");
        return 0;
    };


    this.rolloverObjectViewport = function (vpx, vpy) {
        console.warn("rolloverObjectViewport not implemented in stereo context");
    };


    this.screenCapture = function() {
        console.warn("Screen capture not implemented by stereo render context");
        return null;
    };

	this.setUnitScale = function(metersPerUnit) {
		_leftContext.setUnitScale(metersPerUnit);
		_rightContext.setUnitScale(metersPerUnit);
	};

	this.getUnitScale = function() {
		return _leftContext.getUnitScale();
	}


};