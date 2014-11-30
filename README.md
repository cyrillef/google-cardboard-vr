google-cardboard-vr
===================

Research project for a google carboard and Oculus Rift VR experience (presented at AU 2014)<br />
SD8417 - An unexpected journey in 3D with the Autodesk 360 Viewer Cloud Service <br/>
https://events.au.autodesk.com/connect/sessionDetail.ww?SESSION_ID=8417

Dependencies
--------------------
  * Node.js and the following Node.js modules
    * body-parser
    * express
    * request

  * The Autodesk View and Data API - http://developer.autodesk.com
  * JQuery version 1.11.0
  * RobertWHurst KeyboardJS (Keyboard controls) - https://github.com/RobertWHurst/KeyboardJS
  * Backbone.js (RESTful JSON interface) - http://backbonejs.org/
    * Underscore.js (Backbone dependency) - http://underscorejs.org
  * Three.js (WEBGL) - http://threejs.org
  * Annyang (Voice recognition) - https://www.talater.com/annyang/


INSTRUCTIONS - Setting up on your web site or local machine
-------------------
The sample assumes you are using the house sample from ./examples/1403.dwfx which should be already uploaded & translated on your account. To upload & translate the file, please follow instructions from one of the workflow examples from https://github.com/Developer-Autodesk/autodesk-view-and-data-api-samples. I.e. https://github.com/Developer-Autodesk/workflow-curl-view.and.data.api
Once you got your urn key on the translated file, use it at step 6)


  1)  Install node.js:  http://nodejs.org/download/
  
  2)  Download or clone this project to your local machine
  
  3)  Install project node.js dependencies, start a node.js command prompt, go to the project directory
          command:  npm install
       
  4)  Copy the server/user-settings-.js into server/user-settings.js
  
  5)  Edit the file server/user-settings.js and change the placeholder keys with the keys you received from the Developer Portal:  https://developer.autodesk.com

  6)  Edit the file www/js/stereo-multimodel.js and edit line #21 by replacing the MODEL_HOUSE urn by your urn
  
  7)  From a Terminal or node command prompt window, go in the www directory and type the following command:
          command: node ../server/index.js
          or use the ./go script on OSX and Linux, or  Launch.bat on Windows.
          
  8)  Test by going to the Chrome browser and type in the following URL:  http://127.0.0.1:8888 (or http://localhost:8888)
          you should get a response and the viewer to launch
          
Testing live
-------------------------
This is a development site, so it may break from time to time. I'll post a note when it is final and stable. The house sample is already uploaded & translated.

http://vr.autodesk.io/

  1) If you test on a computer, you can use the keyboard to navigate. All movement are relative to the view direction.
     * w: move forward
     * s: move backward
     * d: step on right
     * a: step on left
     * r: go up
     * f: go down
  Note that you will need to use the google chome developer tools, phone emulation for gyroscope. Put gamma to 90 degrees when you start.
  
  2) When using the phone or a computer, you can also use the voice commands. Commands are:
     * kitchen
     * basement
     * attic
     * family room
     * master bedroom
     * second bedroom
     * bathroom
     * upstairs
     * deck
     * dressing
     * carport
     * under deck
     * view

  3) Last, on the phone, if you look at your feet, you can toggle on and off the walking mode, and navigate inside the house. Again, you are walking in the camera direction.
  
  
--------

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.


## Written by

Autodesk Developer Network <br />
Cyrille Fauvel - October 2014 <br />
http://www.autodesk.com/adn <br />
