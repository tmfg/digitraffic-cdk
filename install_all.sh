#!/usr/bin/env bash

cd common
cd api && npm install && cd ..
cd db && npm install && cd ..
cd model && npm install && cd ..
cd postgres && npm install && cd ..
cd stack && npm install && cd ..
cd ..
