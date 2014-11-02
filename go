#!/bin/bash
cd /home/ubuntu/gcb/www
../node_modules/forever/bin/forever stop ../server/index.js
../node_modules/forever/bin/forever start ../server/index.js


