# Digitraffic Swagger-joiner stack

Creates a "merged" Swagger description from multiple Swagger endpoints.

## Lambda update-api-documentation
Updates the documentation of the given API Gateway APIs by bumping the documentation version.

## Lambda update-swagger
Fetches the Swagger description from multiple sources and merges them.
The resulting description is written to a S3 bucket.

## Swagger files
After creating the stack, upload the files under *resources* in the newly created bucket.
