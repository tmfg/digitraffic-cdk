import * as config from './open311-swagger.json';

export default Object.assign({}, config, {
    "securityDefinitions": {
        "api_key": {
            "type": "apiKey",
            "name": "x-api-key",
            "in": "header"
        }
    },
    "paths": {
        "/requests": {
            "post": {
                "summary": "Create service request",
                "description": "Submit a new request for with specific details of a single service. Must provide a location via lat/long or address_string or address_id",
                "security": [
                    {
                        "api_key": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/parameters/response_format"
                    },
                    {
                        "$ref": "#/parameters/jurisdiction_id"
                    },
                    {
                        "name": "service_code",
                        "in": "query",
                        "description": "<?>",
                        "required": true,
                        "type": "string",
                        "format": "uid"
                    },
                    {
                        "name": "lat",
                        "in": "query",
                        "description": "WGS-84 latitude",
                        "required": false,
                        "type": "number",
                        "format": "double"
                    },
                    {
                        "name": "long",
                        "in": "query",
                        "description": "WGS-84 longitude",
                        "required": false,
                        "type": "number",
                        "format": "double"
                    },
                    {
                        "name": "address_string",
                        "in": "query",
                        "required": false,
                        "type": "string"
                    },
                    {
                        "name": "address_id",
                        "in": "query",
                        "required": false,
                        "type": "string",
                        "format": "uid"
                    },
                    {
                        "name": "attribute",
                        "in": "query",
                        "description": "array of key/value responses based on Service Definitions.",
                        "required": false,
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "collectionFormat": "multi"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success returns an tracking-id",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/RequestResponse"
                            }
                        },
                        "examples": {
                            "application/xml": {
                                "service_requests": {
                                    "service_request_id": 293944,
                                    "service_notice": "The City will inspect and require the responsible party to correct within 24 hours and/or issue a Correction Notice or Notice of Violation of the Public Works Code",
                                    "account_id": "123"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});