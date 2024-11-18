# Digitraffic Swagger-joiner stack

Creates a "merged" Swagger description from multiple Swagger endpoints.

## Lambda update-api-documentation
Updates the documentation of the given API Gateway APIs by bumping the documentation version.

## Lambda update-swagger
Fetches the Swagger description from multiple sources and merges them.
The resulting description is written to a S3 bucket.

## Swagger files
After creating the stack, upload the Swagger UI files under [resources/](resources/) in the newly created bucket.
The files are a fork of Swagger UI with modifications to the curl command forming logic.
 
Note! [resources/index.html.org](resources/index.html.org) and [resources/swagger-initializer.js](resources/swagger-initializer.js)  
are only to diff changes to previous version and test Swagger UI locally. Actual deployment generates `dt-swagger.js` 
that is used instead of [resources/swagger-initializer.js](resources/swagger-initializer.js). 

