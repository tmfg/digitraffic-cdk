#!/usr/bin/env bash

cd common
cd api && rm -rf node_modules && npm install && cd ..
cd db && rm -rf node_modules && npm install && cd ..
cd model && rm -rf node_modules && npm install && cd ..
cd postgres && rm -rf node_modules && npm install && cd ..
cd stack && rm -rf node_modules && npm install && cd ..
cd ..
