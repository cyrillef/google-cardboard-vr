/**
 * VR tool for LMV
 *
 * @author Hans Kellner (Oct 2014)
 */

AutodeskNamespace ('Autodesk.Viewing.Extensions.VR') ;

Autodesk.Viewing.Extensions.VR.VRTool =function (viewer, vrExtension) {
    var _self =this ;

	var _viewer =viewer ;
    var _navapi =viewer.navigation ;
    var _container =viewer.container ;
    var _camera =_navapi.getCamera () ;
    var _names =['vr'] ;

    var _isActive =false ;

    var _renderContext =null ; // stereo render context

    var _isXUp =false ;
    var _isYUp =true ;
    var _isZUp =false ;

    // HACK: The first two delta mouse moves are extreme jumps and need to be
    // rejected.  This is used to skip those moves.  Note, it must also be reset
    // to zero whenever switching on/off pointer lock
    var _hackMouseMoveCounter = 0;

    var _modifierState = { SHIFT: 0, ALT: 0, CONTROL: 0 };  // TODO: Use the hotkeymanager for these.
    var _keys = Autodesk.Viewing.theHotkeyManager.KEYCODES;

    var _wheelDelta = 0;

    var _moveForward = false;
    var _moveBackward = false;
    var _moveLeft = false;
    var _moveRight = false;
    var _moveUp = false;
    var _moveDown = false;

    var _touchDragging = false;

    var _clock = new THREE.Clock(true);

    var _hudMessageStartShowTime = -1;
    var _hudMessageShowTime = 5000;         // milliseconds to show HUD

    var _modelScaleFactor = 1.0;

    var _movementSpeedDefault = 16.0;       // for VR make slower (35 for 1st person tool)
	var _movementSpeed = 16.0;
	var _verticalMovementSpeed = 15.0;
	var _wheelMovementSpeed = 3.0;

    var _autoMove = false;                  // true to automatically move camera forward
    var _autoMoveDefaultSpeed = 1.75;       // Default auto-move speed
    var _autoMoveDir = 1;                   // 1 == forward, -1 == reverse (TODO: disabled for now)
    var _autoMoveStartingSpeed = 16.0;      // Save the _movementSpeed at the start of auto-move

    var _darknessThresholdAutoMove = 15;    // avg gray scale pixel value of camera image to trigger auto-move

	var _previousFov = _camera.fov;
    var _wasPerspective = _camera.isPerspective;

    //
    // Google Goggle VR
    //
    var _deviceOrientationVR = null;
    var _noSleepVR = null;
    var _videoHelper = null;

    var _deviceAutoMoveTrigger = false;   // true if device pointed down (trigger); stays true until device tilted back up

    var _toggleAutoMoveStartTime = -1;
    var _firstAutoMoveSpeedChange = true;

    //
    // WebVR Device initialization (Oculus, etc)
    //
    var _deviceWebAPIVR = null;
    var _deviceSensorVR = null;
    var _vrMode = false;

    var _toggleDeviceVRMovementActivateDistance = 0.15;  // distance in meters before active movement
    var _toggleDeviceVRMovement = false;
    var _toggleDeviceVRMovementOrigin = new THREE.Vector3(0,0,0);
    var _toggleDeviceVRMovementLast = new THREE.Vector3(0,0,0);

    //
    // Wearality HMD
    //
    var _deviceWearalityHMD = false;

    // Constants

    var PI_2 = Math.PI / 2.0;

    /////////////////////////////////////////////////////////////////////////
    // ToolInterface

    this.isActive = function()
    {
        return _isActive;
    };

    this.getNames = function()
    {
        return _names;
    };

    this.getName = function()
    {
        return _names[0];
    };

    this.activate = function(name)
    {
        if (_isActive)
            return;

        _isXUp = (_camera.worldup && _camera.worldup.x === 1);
        _isYUp = (_camera.worldup && _camera.worldup.y === 1);
        _isZUp = (_camera.worldup && _camera.worldup.z === 1);

        console.log("VRTool : camera world up = "+_camera.worldup.x+","+_camera.worldup.y+","+_camera.worldup.z);

        _clock.start();

        // First check for Oculus or similar device through Web API
        if (getWebAPIVRDevice()) {
            //showHelpVRDeviceHMD();
            showUIElements(false);
            console.log("VR Supported (Web API): Oculus, etc.");
        }
        else {
            // Next check for Google Goggle style support
            //showHelpVRDeviceOrientation();
            window.addEventListener('deviceorientation', setOrientationControls, true);
        }

        var useVR = (viewer.config && viewer.config.useVR) ? viewer.config.useVR : "";

        // Check for Wearality setting to enable by default
        _deviceWearalityHMD = (useVR.toLowerCase() === "wearality");

        // Create the custom render context for stereo and HMDs
        enableRenderContext(true);

        // NOTE: Handled in stereorendercontext
        //_previousFov = _camera.fov;
        //_navapi.setVerticalFov(75, true);

        // Calculate a movement scale factor based on the model bounds (ignore selection).
        var boundsSize = viewer.utilities.getBoundingBox(true).size();
        _modelScaleFactor = Math.max(Math.min(Math.min(boundsSize.x,boundsSize.y),boundsSize.z) / 100.0, 1.0);

        this.resetPointerTracking();

        // HACK: Attempt to place focus in canvas so we get key events.
        viewer.canvas.focus();

        //showHelpHUD();

        _isActive = true;
    };

    this.deactivate = function(name)
    {
        if (!_isActive)
            return;

        _isActive = false;

        hideHUD();

        if (_deviceOrientationVR) {

            if (_videoHelper) {
                _videoHelper.stop();
                _videoHelper = null;
            }

            _deviceOrientationVR.disconnect();
            _deviceOrientationVR = null;

            // turn off no-sleep mode
            if (_noSleepVR)
                _noSleepVR.disable();
        }

        enableRenderContext(false);

        exitFullscreen();

        _clock.stop();

		//_navapi.setVerticalFov(_previousFov, true);
        //if (!_wasPerspective)
        //    _navapi.toOrthographic();

        showUIElements(true);
    };

    this.getCursor = function()
    {
        return "url(data:image/gif;base64,R0lGODlhGAAYAMIDAAQEBH19feDg4P///////////////////yH+EUNyZWF0ZWQgd2l0aCBHSU1QACH5BAEKAAQALAAAAAAYABgAAAMqSLrc/jDKSau9OOvN8fjDNghBIITZEABAgHpr+15jeYpgp+987//AICEBADs=), wait";
    };


    /////////////////////////////////////////////////////////////////////////

    var showUIElements = function(show)
    {
        // Show/hide the toolbar
        var toolbarMenuElements = document.getElementsByClassName('toolbar-menu');
        if (toolbarMenuElements.length > 0) { // HACK: Assume only 1
            if (toolbarMenuElements[0] !== '')
                toolbarMenuElements[0].style.display = show ? 'block' : 'none';
        }
    };

    var adjustSpeed = function( direction )
    {
        if ( direction === 0 ) // reset to default
        {
        	_movementSpeed = _movementSpeedDefault;
        }
        else
        {
            _movementSpeed *= (direction > 0) ?  1.10 : 0.90;
            if ( _movementSpeed < 0.000001 )
                _movementSpeed = 0.000001;
        }
        //console.log("Move Speed = "+_movementSpeed);
    };

    var enableRenderContext = function(enable)
    {
        if ( enable === !!_renderContext )
            return; // no change

        console.log("Enable Render Context: "+enable);

        if (enable)
        {
            if ( viewer.displayViewCube ) // Cyrille
            	viewer.displayViewCube(false, false);

            _wasPerspective = viewer.navigation.isPerspective;
            if (!_wasPerspective)
                viewer.navigation.toPerspective();

            // Enable WarpShade if using an HMD like the Oculus.
			//var bUseWarpShader = !!_deviceWebAPIVR; // Cyrille
			var bUseWarpShader =true ;

            var options = null;

            // Support for Wearality HMD?
            if (_deviceWearalityHMD)
            {
                // From Wearality:
                var DEFAULT_IPD = 0.075;  // meters (this kinda depends on person, and latest device has a physical IPD of 0.069  or 69 mm)
                var DEFAULT_CAMERA_ANGLE_OFFSET = -1.5;  // degrees
                var DEFAULT_ASYMMETRY = 0.07;

                // Here is how to set Asytemtric frusum:
                //
                //var horizOblLeft = -DEFAULT_ASYMMETRY;
                //var horizOblRight = DEFAULT_ASYMMETRY;
                //SetObliqueness(horizOblLeft , horizOblRight);
                //
                //private void SetObliqueness(float horizOblLeft, float horizOblRight)
                //{
                //    Matrix4x4 mat1 = camLeft.camera.projectionMatrix;
                //    mat1[0, 2] = horizOblLeft;
                //    mat1[1, 2] = 0;
                //    camLeft.camera.projectionMatrix = mat1;
                //
                //    Matrix4x4 mat2 = camRight.camera.projectionMatrix;
                //    mat2[0, 2] = horizOblRight;
                //    mat2[1, 2] = 0;
                //    camRight.camera.projectionMatrix = mat2;
                //}

                options = {
                    useWarp: bUseWarpShader,

                    HMD: {
                        // Parameters from the Wearality HMD
                        // TODO: Set eyeToScreenDistance, distortionK, and chromaAbParameter values
                        // to match Wearality's.
                        hResolution: 1920,
                        vResolution: 1080,
                        hScreenSize: 0.12576,
                        vScreenSize: 0.07074,
                        interpupillaryDistance: DEFAULT_IPD, // Oculus == 0.0635,
                        lensSeparationDistance: DEFAULT_IPD, // Oculus == 0.0635,
                        eyeToScreenDistance: 0.041,
                        distortionK : [1.0, 0.22, 0.24, 0.0],
                        chromaAbParameter: [ 0.996, -0.004, 1.014, 0.0]
                    }
                };
            }
            else {
                // Default HMD options
                options = {
                    useWarp: bUseWarpShader
                };
            }

            _renderContext = new Autodesk.Viewing.Extensions.Oculus.StereoRenderContext( options );
            viewer.impl.setUserRenderContext(_renderContext);

            //TODO: Not sure why we need this call in order to force the
            //stereo layout to fix itself.
            viewer.resize(viewer.canvas.clientWidth, viewer.canvas.clientHeight);

            // Go fullscreen
            if (_deviceWebAPIVR) {
                launchFullscreen(viewer.impl.canvas, { vrDisplay: _deviceWebAPIVR });
            } else {
                launchFullscreen(viewer.impl.canvas);
            }
        }
        else {
            // disable
            _renderContext = null;
            viewer.impl.setUserRenderContext(null);

            // Restore screen to normal and re-enable viewcube
            viewer.getScreenModeDelegate().setMode(Autodesk.Viewing.Viewer.ScreenMode.kNormal);
            if ( viewer.displayViewCube ) // Cyrille
            	viewer.displayViewCube(viewer.prefs.get("viewCube"), false);
        }
    };

    /////////////////////////////////////////////////////////////////////////
    // Tool event handler callbacks - can use "this".

    this.handleSingleTap = function( event )
    {
        //console.log("single tap ("+ (event.pointers ? event.pointers.length : 0)+")");

        // Only interested if we are being run on a mobile device using the
        // Device Orientation api.
        if (_deviceOrientationVR) {
            if ( event.pointers ) {

                if ( event.pointers.length === 1 ) {
                    // Exit VRTool and activate default tool
                    setTimeout(function () {
                        viewer.setActiveNavigationTool(viewer.defaultNavigationToolName);
                    }, 10);
                    return true;
                }
                else if ( event.pointers.length === 2 ) {
                    toggleAutoMove();
                    return true;
                }
            }
        }

        return false;
    };

    this.handleDoubleTap = function( event )
    {
        //console.log("double tap ("+ (event.pointers ? event.pointers.length : 0)+")");
        return false;
    };

    this.handlePressHold = function( event )
    {
        //console.log("press hold ["+(event.type ? event.type : "none")+"] ("+ (event.pointers ? event.pointers.length : 0)+")");
        //if( event.type === "press" )
        //{
        //    event.clientX = event.pointers[0].clientX;
        //    event.clientY = event.pointers[0].clientY;
        //}

        return false;
    };

    this.handleGesture = function( event )
    {
        //console.log("handle gesture ["+(event.type ? event.type : "none")+"]");

        // Only interested if we are being run on a mobile device using the
        // Device Orientation api.
        if (_deviceOrientationVR)
        {
            switch( event.type )
            {
            case "dragstart":
                _touchDragging = true;
                //var x = (event.normalizedX + 1.0) * 0.5;
                //var y = (event.normalizedY + 1.0) * 0.5;
                //console.log("DragStart: "+x+","+y);
                break;

            case "dragmove":
                if (_touchDragging) {
                    //var x = (event.normalizedX + 1.0) * 0.5;
                    //var y = (event.normalizedY + 1.0) * 0.5;
                    //console.log("DragMove: "+x+","+y);
                    // TODO: Use this to adjust auto move speed
                }
                break;

            case "dragend":
                //console.log("DragEnd");
                _touchDragging = false;
                break;
            }
        }

        return false;
    };

    this.handleKeyDown = function( event, keyCode )
    {
        var isModKey = false;
        var handled = false;

        switch( keyCode )
        {
            case _keys.TAB: handled = true; break;

            case _keys.SHIFT:   _modifierState.SHIFT = 1;   isModKey = true; handled = true; break;
            case _keys.CONTROL: _modifierState.CONTROL = 1; isModKey = true; handled = true; break;
            case _keys.ALT:     _modifierState.ALT = 1;     isModKey = true; handled = true; break;

            case _keys.SPACE:
                handled = true; break;

            case _keys.EQUALS: this.adjustSpeed(1);  handled = true; break;
            case _keys.DASH:   this.adjustSpeed(-1); handled = true; break;
            case _keys.ZERO:   this.adjustSpeed(0);  handled = true; break; // Reset dolly speed to default

            case _keys.w:
                // If Ctrol+Shift+W pressed then skip move handling
                if ( _modifierState.CONTROL === 1 && _modifierState.SHIFT === 1) {
                    handled = true;
                    break;
                }
                // fall through
            case _keys.UP:
                _moveForward = true; handled = true;
                break;

			case _keys.LEFT:
			case _keys.a:
                _moveLeft = true; handled = true;
                break;

			case _keys.DOWN:
			case _keys.s:
                _moveBackward = true; handled = true;
                break;

			case _keys.RIGHT:
			case _keys.d:
                _moveRight = true; handled = true;
                break;

			case _keys.q:
                _moveDown = true; handled = true;
                break;

			case _keys.e:
                _moveUp = true; handled = true;
                break;

            case _keys.h:
                handled = true;
                break;
        }

        return handled;
    };

    this.handleKeyUp = function( event, keyCode )
    {
        var isModKey = false;
        var handled = false;

        switch( keyCode )
        {
            case _keys.SHIFT:   _modifierState.SHIFT = 0;   isModKey = true; break;
            case _keys.CONTROL: _modifierState.CONTROL = 0; isModKey = true; break;
            case _keys.ALT:     _modifierState.ALT = 0;     isModKey = true; break;

            case _keys.SPACE:
                // HMD support?
                if ( !!_deviceWebAPIVR ) {
                    // Toggle movement on/off.
                    toggleDeviceVRMovement();
                }
                handled = true;
                break;

            case _keys.w:
                // Ctrl+Shift+W pressed?
                if ( !_moveForward && _modifierState.CONTROL === 1 && _modifierState.SHIFT === 1) {
                    // Toggle Wearality HMD on/off

                    // Exit VRTool and activate default tool
                    setTimeout(function () {
                        enableRenderContext(false);
                        _deviceWearalityHMD = !_deviceWearalityHMD;
                        enableRenderContext(true);
                    }, 10);

                    handled = true;
                    break;
                }
                // fall through for movement handling
            case _keys.UP:
                _moveForward = false; handled = true;
                break;

			case _keys.LEFT:
			case _keys.a:
                _moveLeft = false; handled = true;
                break;

			case _keys.DOWN:
			case _keys.s:
                _moveBackward = false; handled = true;
                break;

			case _keys.RIGHT:
			case _keys.d:
                _moveRight = false; handled = true;
                break;

			case _keys.q:
                _moveDown = false; handled = true;
                break;

			case _keys.e:
                _moveUp = false; handled = true;
                break;

            case _keys.h:
                showHelpHUD();
                handled = true;
                break;
        }

        return handled;
    };

    this.handleBlur = function(event)
    {
        // Reset things when we lose focus...
		_moveForward = false;
		_moveBackward = false;
		_moveLeft = false;
		_moveRight = false;

        return false;
    };

	this.update = function(timeStamp)
    {
        if (!_isActive)
            return;

        var delta = _clock.getDelta();

        if (_hudMessageStartShowTime > -1) {
            var curTime = new Date().getTime();
            if (curTime - _hudMessageStartShowTime > _hudMessageShowTime) { // seconds
                hideHUD();
            }
        }

        var vrUpdatedCameraTarget = false;

        // Oculus support?
        if ( !!_deviceWebAPIVR && updateVRDevice(delta) ) {
            vrUpdatedCameraTarget = true;
        } // Controlling via a VR device?  Then use that rather than default keyboard/mouse controls.
        else if ( !!_deviceOrientationVR && updateDeviceOrientationVR(delta) ) {
            vrUpdatedCameraTarget = true;
        }

		var localCam = _camera.clone();   // Copy of camera to modify

        // Handle movement changes
		var actualMoveSpeed = delta * _movementSpeed * _modelScaleFactor * (_modifierState.SHIFT === 1 ? 4 : 1);
        //console.log("Actual speed = "+actualMoveSpeed);

        var actualVerticalMoveSpeed = delta * _verticalMovementSpeed * _modelScaleFactor * (_modifierState.SHIFT === 1 ? 4 : 1);

        if (_wheelDelta != 0)
        {
            var actualWheelMoveSpeed = _wheelDelta * _wheelMovementSpeed * _modelScaleFactor * (_modifierState.SHIFT === 1 ? 4 : 1);
			localCam.translateZ( -actualWheelMoveSpeed );
            _wheelDelta = 0;
        }

        var autoMoveF = false,
            autoMoveB = false,
            autoMoveL = false,
            autoMoveR = false;

        if (_autoMove) {
            if (0) { //_deviceOrientationVR) {
                // IMPORTANT: The screen orientation effects the direction of camera movement.
                switch(_deviceOrientationVR.screenOrientation) // 0/180 = portait, 90/-90 = landscape
                {
                case 0:
                    autoMoveL = true;
                    break;
                case 180:
                    autoMoveR = true;
                    break;
                case 90:
                    autoMoveF = true;
                    break;
                case -90:
                    autoMoveB = true;
                    break;
                }
            }
            else {
                autoMoveF = true;
            }
        }

		if ( _moveForward || autoMoveF ) {
             localCam.translateZ( -actualMoveSpeed );
        }

		if ( _moveBackward || autoMoveB ) {
		     localCam.translateZ( actualMoveSpeed );
        }

		if ( _moveLeft || autoMoveL ) {
			localCam.translateX( -actualMoveSpeed );
        }

		if ( _moveRight || autoMoveR ) {
			localCam.translateX( actualMoveSpeed );
        }

		if ( _moveUp ) {
            localCam.translateY( actualVerticalMoveSpeed );
        }

		if ( _moveDown ) {
		    localCam.translateY( -actualVerticalMoveSpeed );
        }

        var newPosition = localCam.position;
        var posChanged = (newPosition.distanceToSquared(_camera.position) !== 0);
        if (posChanged) {

    		var newTarget = localCam.target;

            var dxyz = newPosition.clone().sub(_camera.position);
            newTarget.add(dxyz);

		    _navapi.setView(newPosition, newTarget);
        }

        return _camera.dirty;
	};

    this.resetPointerTracking = function()
    {
        _moveForward = _moveBackward = false;
        _moveLeft = _moveRight = false;
        _moveUp = _moveDown = false;

        _mouseDraggingLookMode = false;
    };


    /////////////////////////////////////////////////////////////////////////
    // Auto movement support
	this._toggleAutoMove_ = function() {
		toggleAutoMove() ;
	}

    var toggleAutoMove = function()
    {
        // Toggle auto-move state
        _autoMove = !_autoMove;

        // If starting to move then save current speed so it can be restored
        if (_autoMove) {
            _autoMoveStartingSpeed = _movementSpeed;
            _movementSpeed = _autoMoveDefaultSpeed;
            _toggleAutoMoveStartTime = new Date().getTime();
        }
        else {
            // Restore speed after auto-move
            _movementSpeed = _autoMoveStartingSpeed;
        }

        showHelpVRMove(_autoMove);

        return _autoMove;
    };


    /////////////////////////////////////////////////////////////////////////
    // Web API VR Support

    var getWebAPIVRDevice = function()
    {
        var foundVRDevice = false;

        // First check for Oculus style support
        function EnumerateVRDevices(devices) {
            // First find an HMD device
            for (var i = 0; i < devices.length; ++i) {
                if (devices[i] instanceof HMDVRDevice) {
                    _deviceWebAPIVR = devices[i];
                }
            }

            // Next find a sensor that matches the HMD hardwareUnitId
            for (var i = 0; i < devices.length; ++i) {
                if (devices[i] instanceof PositionSensorVRDevice &&
                    (!_deviceWebAPIVR || devices[i].hardwareUnitId == _deviceWebAPIVR.hardwareUnitId)) {
                    _deviceSensorVR = devices[i];

                    foundVRDevice = true;
                }
            }
        }

        if (navigator.getVRDevices) {
            navigator.getVRDevices().then(EnumerateVRDevices);
        } else if (navigator.mozGetVRDevices) {
            navigator.mozGetVRDevices(EnumerateVRDevices);
        } else {
            foundVRDevice = false; // WebVR API not supported
        }

        return foundVRDevice;
    };

    var updateVRDevice = function(delta)
    {
        if (!_deviceSensorVR)
            return false;

        var vrState = _deviceSensorVR.getState();

        if (_camera)
        {
            if (_isZUp) {
                _toggleDeviceVRMovementLast.x = vrState.position.x;
                _toggleDeviceVRMovementLast.y = -vrState.position.z;
                _toggleDeviceVRMovementLast.z = vrState.position.y;
            }
            else {
                _toggleDeviceVRMovementLast.x = vrState.position.x;
                _toggleDeviceVRMovementLast.y = vrState.position.y;
                _toggleDeviceVRMovementLast.z = vrState.position.z;
            }

            if (_toggleDeviceVRMovement)
            {
                // If head movement is greater than a specific amount then start
                // applying movement to camera.  This creates a neutral zone at
                // the "center of the joystick".
                var dist = _toggleDeviceVRMovementOrigin.distanceTo(_toggleDeviceVRMovementLast);
                if (dist >= _toggleDeviceVRMovementActivateDistance)
                {
                    // Every X inches from neutral scale
                    var distMovedFromNeutralScaleFactor = (dist - _toggleDeviceVRMovementActivateDistance) / 0.0762/*3in*/;
                    var actualMoveSpeed = delta * _movementSpeed * _modelScaleFactor * distMovedFromNeutralScaleFactor;

                    var dir = _toggleDeviceVRMovementLast.clone().sub(_toggleDeviceVRMovementOrigin).normalize().multiplyScalar(actualMoveSpeed);

                    _camera.position.add(dir);
                }
            }

            if (_isZUp) {
                _camera.quaternion.x = vrState.orientation.x;
                _camera.quaternion.y = -vrState.orientation.z;
                _camera.quaternion.z = vrState.orientation.y;
                _camera.quaternion.w = vrState.orientation.w;
            }
            else {
                _camera.quaternion.x = vrState.orientation.x;
                _camera.quaternion.y = vrState.orientation.y;
                _camera.quaternion.z = vrState.orientation.z;
                _camera.quaternion.w = vrState.orientation.w;
            }

            // TODO: The LMV camera still uses the old target value which threejs no longer uses.
            // Therefore we need to set it so the view changes.

            // Apply the camera's rotation to the vector looking down the Z axis
            var lookAtDir = new THREE.Vector3( 0, 0, -1 );

            // Models can have different up vectors.  The code above defaults to Y up.
            // Check for other Up directions.
            if (_isZUp) {
                lookAtDir = new THREE.Vector3(lookAtDir.x, -lookAtDir.z, lookAtDir.y);
            }

            lookAtDir.applyQuaternion( _camera.quaternion );

            // then update the target
            _camera.target = _camera.position.clone().add(lookAtDir.clone().multiplyScalar(10));

            _camera.dirty = true;
        }

        return true;
    };

    // Toggle movement on/off.
    //
    // When toggled on the current HMD postion is the new origin.  Movements away from that
    // origin will be used as a virtual joystick.
    var toggleDeviceVRMovement = function()
    {
        // Oculus support?
        if ( !_deviceWebAPIVR )
            return;

        _toggleDeviceVRMovement = !_toggleDeviceVRMovement;

        if (_toggleDeviceVRMovement) {
            _toggleDeviceVRMovementOrigin.copy(_toggleDeviceVRMovementLast);
        }

        showHelpVRMove(_toggleDeviceVRMovement);
    };

    /////////////////////////////////////////////////////////////////////////
    // Device Orientaton VR Support
    var updateDeviceOrientationVR = function(delta)
    {
        if (!_deviceOrientationVR)
            return false;

        // Get the current device orientation quaternion.
        // The quaternion can be applied to the current camera but that will *not* update
        // the target value nor handle world UP differences.  Therefore we need to also
        // update those values.
        var qOrientation = _deviceOrientationVR.update();
        if (!qOrientation)
            return false;
        //qOrientation.rotation.reorder( "YXZ" );

        // For Z-Up models we need to re-orient YZ values.
        if (_isZUp) {
            var t = qOrientation.z;
            qOrientation.z = qOrientation.y;
            qOrientation.y = -t;
        }

        // Models can have different up vectors.  Adjust for that.
        var lookAtDir = _isZUp ? new THREE.Vector3( 0, 1, 0 ) : new THREE.Vector3( 0, 0, -1 );

        // The LMV camera still uses the old target value which threejs no longer uses.
        // Therefore we need to set it so the view changes.
        var newTargetDir = lookAtDir.clone().applyQuaternion( qOrientation );

        // Distance to current target
        var dist = _camera.target.clone().sub(_camera.position).length();

        // then update the target
        _navapi.setTarget(_camera.position.clone().add(newTargetDir.multiplyScalar(dist)));

        // Handle screen orientation?
        //_deviceOrientationVR.screenOrientation == 90 // landscape 90

        // AUTO-MOVE support using video camera
        //
        // Check for a covered video camera.  That will toggle the movement.
        if (_videoHelper)
        {
            // Check if user has allowed video and video can be acquired.
            // NOTE: If the video helper fails to start then the user will
            // not be able to move the camera's position.
            if (_videoHelper.isStarted())
            {
                // Is it ok to check for a "button" press?
                if (_toggleAutoMoveStartTime <= 0)
                {
                    // Yes, so check for a "dark" image from camera.  Use this to
                    // toggle movement on/off
                    if ( _videoHelper.checkVideoThreshold(_darknessThresholdAutoMove) ) {
                        toggleAutoMove();
                    }
                }
                else
                {
                    // We get here if auto-move has been toggled.  Check if the
                    // camera image is still "dark"?
                    var isDark = _videoHelper.checkVideoThreshold(_darknessThresholdAutoMove);

                    // If not then it was uncovered.  Reset timer so toggle can occur again
                    if (!isDark) {
                        _toggleAutoMoveStartTime = -1;
                    }
                    // Else if still covererd and auto-move enabled then increase speed
                    else if (_autoMove)
                    {
                        var curTime = new Date().getTime();
                        var dTime = curTime - _toggleAutoMoveStartTime;

                        // Every 1/4sec increase by orginal speed
                        if (dTime > 250) { // milliseconds
                            _toggleAutoMoveStartTime = curTime; // restart counter

                            _movementSpeed += _autoMoveStartingSpeed;

                            // Reshow HUD so new speed is displayed
                            showHelpVRMove(true);
                        }
                    }
                }
            }
            //console.log("AUTO_MOVE = "+(_autoMove?"TRUE":"FALSE")+" Toggled(50) = "+ (toggled?"TRUE":"FALSE"));
        }
        else // Alternate move support if not using video camera
        {
            // Auto move support.  Tilt down increases speed.
            var lookDownDir = _isZUp ? new THREE.Vector3( 0, 0, -1 ) : new THREE.Vector3( 0, -1, 0 );
            var viewAngle = THREE.Math.radToDeg(newTargetDir.angleTo(lookDownDir));
            //console.log("View angle = "+viewAngle);

            if ( viewAngle < 30 ) {

                // Is this the first time tilting and the trigger hasn't been activated?
                if ( !_deviceAutoMoveTrigger )
                {
                    // Yes, toggle auto-move.
                    toggleAutoMove();

                    _deviceAutoMoveTrigger = true;  // Stays true until device tilted level.

                    // Beginning to move?
                    if (_autoMove) {
                        _firstAutoMoveSpeedChange = true;
                    }
                }
                else
                {
                    // If the user remains tilting device while auto-move
                    // is on then increase speed
                    if (_autoMove)
                    {
                        var curTime = new Date().getTime();
                        var dTime = curTime - _toggleAutoMoveStartTime;

                        // Every X seconds delay, increase by orginal speed.  But the first
                        // delay is longer so speed doesn't increase immediately.
                        var delay = _firstAutoMoveSpeedChange ? 1500 : 1000; // milliseconds

                        if (dTime >= delay)
                        {
                            _firstAutoMoveSpeedChange = false;
                            _toggleAutoMoveStartTime = curTime; // restart counter

                            _movementSpeed += _autoMoveStartingSpeed; // increase speed

                            // Reshow HUD so new speed is displayed
                            showHelpVRMove(true);
                        }
                    }
                }
            }
            // If device tilt is leveled then clear trigger
            else if ( viewAngle >= 30 ) {
                _deviceAutoMoveTrigger = false;
                _toggleAutoMoveStartTime = -1;
            }
        }

        _camera.dirty = true;
        return true;
    };

    var setOrientationControls = function(e)
    {
        if (!e.alpha) {
            return false;
        }

        window.removeEventListener('deviceorientation', setOrientationControls, true);

        _deviceOrientationVR = new THREE.DeviceOrientationControls();
        _deviceOrientationVR.connect();

        // turn on no-sleep mode.  This plays a hidden video that will cause the
        // phone to say awake.
        if (!_noSleepVR) {
            _noSleepVR = new window.NoSleep();
            _noSleepVR.enable();
        }

        // create the video helper.  note that this will enable the video
        // camera which the user will need to allow.  If the user disallows
        // then they may use the "tilt" mode for auto-move.
// cyrille
        //_videoHelper = new VideoHelper("videoVR","videoVR-canvas", 1/*camera index*/);  // change cam index for front vs. back
        //if (!_videoHelper.start()) {
        //    _videoHelper = null;    // failed.
        //    console.log("VideoHelper : Failed to start.");
        //}

        showUIElements(false);

        console.log("VR Supported (DeviceOrientation): Google Goggles, etc.");
        return true;
    };

    /////////////////////////////////////////////////////////////////////////
    // HUD helpers

    var showHUD = function(messageSpecs, showDelay)
    {
        Autodesk.Viewing.Private.HudMessage.dismiss();  // in case it's still visible
        Autodesk.Viewing.Private.HudMessage.displayMessage(_container, messageSpecs);
        _hudMessageStartShowTime = new Date().getTime();
        if (!showDelay || showDelay <= 0)
            showDelay = 5000;
        _hudMessageShowTime = showDelay;
    };

    var hideHUD = function()
    {
        Autodesk.Viewing.Private.HudMessage.dismiss();  // in case it's still visible
        _hudMessageStartShowTime = -1;
    };

    var showHelpHUD = function()
    {
        // TODO: Sadly, the HudMessage api doesn't support html formatted messages
        var messageSpecs = {
            "msgTitleKey"   : "Virtual Reality Tool",
            "messageKey"    : "Virtual Reality Tool",
            "messageDefaultValue"  : "This is the Virtual Reality tool."
        };

        //showHUD(messageSpecs, 3000);
    };

    var showHelpVRMove = function(enable, showDelay)
    {
        if (!showDelay || showDelay <= 0)
            showDelay = 250;

        var msg = (enable ? "START Auto Move ("+Math.floor(_movementSpeed)+")" : "STOP Auto Move");

        var messageSpecs = {
            "msgTitleKey"   : "VR Toggle Move",
            "messageKey"    : "VR Toggle Move",
            "messageDefaultValue"  : msg
        };

        //showHUD(messageSpecs, showDelay);
    };

    var showHelpVRDeviceOrientation = function()
    {
        var messageSpecs = {
            "msgTitleKey"   : "VR Device Orientation",
            "messageKey"    : "VR Device Orientation",
            "messageDefaultValue"  : "VR Mode Enabled (Device Orientation)"
        };

        //showHUD(messageSpecs, 2000);
    };

    var showHelpVRDeviceHMD = function()
    {
        var messageSpecs = {
            "msgTitleKey"   : "VR Head Mounted Display",
            "messageKey"    : "VR Head Mounted Display",
            "messageDefaultValue"  : "VR Mode Enabled (Head Mounted Display) - Use SPACE key to toggle move control."
        };

        //showHUD(messageSpecs, 2000);
    };
};
