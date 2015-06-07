//
// VR
//

'use strict' ;

AutodeskNamespace ('Autodesk.Viewing.Extensions.VR') ;

Autodesk.Viewing.Extensions.VR.VRExtension =function (viewer, options) {
    Autodesk.Viewing.Extension.call (this, viewer, options) ;
} ;

Autodesk.Viewing.Extensions.VR.VRExtension.prototype =Object.create (Autodesk.Viewing.Extension.prototype) ;
Autodesk.Viewing.Extensions.VR.VRExtension.prototype.constructor =Autodesk.Viewing.Extensions.VR.VRExtension ;

Autodesk.Viewing.Extensions.VR.VRExtension.prototype.load =function () {
	var self =this ;
	var viewer =this.viewer ;
	var toolbar =viewer.getToolbar ? viewer.getToolbar (true) : undefined;
	var avu =Autodesk.Viewing.UI ;

	// Register tool
	this.tool =new Autodesk.Viewing.Extensions.VR.VRTool (viewer, this) ;
	viewer.toolController.registerTool (this.tool) ;

	// Add the ui to the viewer.
	if ( toolbar ) {
		var navTools =toolbar.subToolbars [Autodesk.Viewing.TOOLBAR.NAVTOOLSID] ;
		if ( navTools && !jQuery.isEmptyObject (navTools.buttons) )
			onToolbarCreated () ;
		else
			viewer.addEventListener (Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onToolbarCreated);
	} else {
		viewer.addEventListener (Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onToolbarCreated);
	}

	function onToolbarCreated () {
		viewer.removeEventListener (Autodesk.Viewing.TOOLBAR_CREATED_EVENT, onToolbarCreated) ;
		self.createUI (toolbar) ;
	}

	return (true) ;
} ;

Autodesk.Viewing.Extensions.VR.VRExtension.prototype.createUI =function (toolbar) {
    var self =this ;
    var viewer =this.viewer ;
    try {
		// Create a button for the tool.
		this.vrToolButton =viewer.addMenuButton (Autodesk.Viewing.TOOLBAR.NAVTOOLSID, 'toolbar-vrTool', 'Virtual Reality Tool', function (e) {
			var state =Autodesk.Viewing.UI.SubToolbar.getToolState ('toolbar-vrTool') ;
			if ( state === Autodesk.Viewing.UI.SubToolbar.STATE_NOTACTIVE )
				viewer.setActiveNavigationTool ('vr') ;
			else if ( state === Autodesk.Viewing.UI.SubToolbar.STATE_ACTIVE )
				viewer.setActiveNavigationTool () ;
		}) ;
    } catch ( e ) {
    }
} ;

Autodesk.Viewing.Extensions.VR.VRExtension.prototype.unload =function () {
    var viewer =this.viewer ;

    // Remove hotkey
    Autodesk.Viewing.theHotkeyManager.popHotkeys (this.HOTKEYS_ID) ;

    // Remove the UI
    var toolbar =viewer.getToolbar (false) ;
    if ( toolbar )
        viewer.removeMenuButton (Autodesk.Viewing.TOOLBAR.NAVTOOLSID, 'toolbar-vrTool') ;
    this.vrToolButton =null ;

    // Deregister tool
    viewer.toolController.deregisterTool (this.tool) ;
    this.tool =null ;

    return (true) ;
} ;

Autodesk.Viewing.theExtensionManager.registerExtension ('Autodesk.VR', Autodesk.Viewing.Extensions.VR.VRExtension) ;
