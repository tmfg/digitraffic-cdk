#!/usr/bin/env bash

sam local invoke MaintenanceTrackingProcessQueue0DB4E4DC --env-vars env.json --event event.json
