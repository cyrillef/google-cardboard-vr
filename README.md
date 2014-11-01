google-cardboard-vr
===================

Research project for a google carboard and Oculus Rift VR experience (presented at AU 2014)


INSTRUCTIONS - Setting up
-------------------
  1)  Install node.js:  http://nodejs.org/download/
  
  2)  Download or clone this project to your local machine
  
  3)  Install project node.js dependencies, start a node.js command prompt, go to the project directory
          command:  npm install
       
  4)  Copy the server/user-settings-.js into server/user-settings.js
  
  5)  Edit the file server/user-settings.js and change the placeholder keys with the keys you received from the Developer Portal:  https://developer.autodesk.com
  
  6)  Edit the file www/js/stereo-multimodel.js line #28, and change the RESOURCE_ROOT_CYRILLE placeholder value with the address, you'll be using at step 8)

  7)  From a Terminal or node command prompt window, go in the www directory and type the following command:
          command: node ../server/index.js
          
  8)  Test by going to the Chrome browser and type in the following URL:  http://127.0.0.1:8888 (or http://localhost:8888)
          you should get a response and the viewer tolaunch
          
