import * as config from './open311-swagger.json';

export default Object.assign({}, config, {
    "paths": {
        "/requests": {
            "get": {
                "summary": "requests",
                "description": "Query the current status of multiple requests.",
                "parameters": [
                    {
                        "$ref": "#/parameters/response_format"
                    },
                    {
                        "$ref": "#/parameters/jurisdiction_id"
                    },
                    {
                        "name": "service_request_id",
                        "in": "query",
                        "description": "To call multiple Service Requests at once, multiple service_request_id can be declared; comma delimited.This overrides all other arguments.",
                        "required": false,
                        "type": "string",
                        "format": "uid"
                    },
                    {
                        "name": "service_code",
                        "in": "query",
                        "description": "Specify the service type by calling the unique ID of the service_code.",
                        "required": false,
                        "type": "string"
                    },
                    {
                        "name": "start_date",
                        "in": "query",
                        "description": "Earliest datetime to include in search. When provided with end_date, allows one to search for requests which have a requested_datetime that matches a given range, but may not span more than 90 days.",
                        "required": false,
                        "type": "string",
                        "format": "date-time"
                    },
                    {
                        "name": "end_date",
                        "in": "query",
                        "description": "Latest datetime to include in search. When provided with start_date, allows one to search for requests which have a requested_datetime that matches a given range, but may not span more than 90 days.",
                        "required": false,
                        "type": "string",
                        "format": "date-time"
                    },
                    {
                        "name": "status",
                        "in": "query",
                        "description": "Allows one to search for requests which have a specific status. This defaults to all statuses; can be declared multiple times, comma delimited.",
                        "required": false,
                        "type": "string",
                        "enum": [
                            "open",
                            "closed"
                        ]
                    }
                ],
                "responses": {
                    "200": {
                        "description": "List of matching requests (Default query limit is a span of 90 days or first 1000 requests returned, whichever is smallest).",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/Request"
                            }
                        },
                        "examples": {
                            "application/xml": {
                                "request": {
                                    "service_request_id": 638344,
                                    "status": "closed",
                                    "status_notes": "Duplicate request.",
                                    "service_name": "Sidewalk and Curb Issues",
                                    "service_code": 6,
                                    "description": "Some description",
                                    "agency_responsible": "Some agency",
                                    "service_notice": "Some notice",
                                    "requested_datetime": "2010-04-14T14:37:38.000Z",
                                    "updated_datetime": "2010-04-14T14:37:38.000Z",
                                    "expected_datetime": "2010-04-15T14:37:38.000Z",
                                    "address": "8TH AVE and JUDAH ST",
                                    "address_id": 545483,
                                    "zipcode": 94122,
                                    "lat": 37.762221815,
                                    "long": -122.4651145,
                                    "media_url": "http://city.gov.s3.amazonaws.com/requests/media/638344.jpg"
                                }
                            },
                            "application/json": {
                                "request": {
                                    "service_request_id": 638349,
                                    "status": "open",
                                    "status_notes": "",
                                    "service_name": "Sidewalk and Curb Issues",
                                    "service_code": 6,
                                    "description": "",
                                    "agency_responsible": "",
                                    "service_notice": "",
                                    "requested_datetime": "2010-04-19T14:37:38.000Z",
                                    "updated_datetime": "2010-04-19T14:37:38.000Z",
                                    "expected_datetime": "2010-04-19T14:37:38.000Z",
                                    "address": "8TH AVE and JUDAH ST",
                                    "address_id": 545483,
                                    "zipcode": 94122,
                                    "lat": 37.762221815,
                                    "long": -122.4651145,
                                    "media_url": "http://city.gov.s3.amazonaws.com/requests/media/638344.jpg"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "jurisdiction_id was not provided (specified in error response) or General Service error (Any failure during service query processing. Client will have to notify us)"
                    },
                    "401": {
                        "description": "jurisdiction_id not found (specified in error response)"
                    }
                }
            }
        },
        "/request/{service_request_id}": {
            "get": {
                "summary": "current status",
                "description": "Query the current status of an individual request",
                "parameters": [
                    {
                        "$ref": "#/parameters/response_format"
                    },
                    {
                        "$ref": "#/parameters/jurisdiction_id"
                    },
                    {
                        "name": "service_request_id",
                        "in": "path",
                        "description": "Is specified in the main URL path rather than an added query string parameter.",
                        "required": true,
                        "type": "string",
                        "format": "uid"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success returns request details",
                        "schema": {
                            "$ref": "#/definitions/Request"
                        },
                        "examples": {
                            "application/xml": {
                                "request": {
                                    "service_request_id": 638344,
                                    "status": "closed",
                                    "status_notes": "Duplicate request.",
                                    "service_name": "Sidewalk and Curb Issues",
                                    "service_code": 6,
                                    "description": "Description",
                                    "agency_responsible": "Some agency",
                                    "service_notice": "Some notice",
                                    "requested_datetime": "2010-04-14T14:37:38.000Z",
                                    "updated_datetime": "2010-04-14T14:37:38.000Z",
                                    "expected_datetime": "2010-04-15T14:37:38.000Z",
                                    "address": "8TH AVE and JUDAH ST",
                                    "address_id": 545483,
                                    "zipcode": 94122,
                                    "lat": 37.762221815,
                                    "long": -122.4651145,
                                    "media_url": "http://city.gov.s3.amazonaws.com/requests/media/638344.jpg"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/services": {
            "get": {
                "summary": "service types",
                "description": "List acceptable service request types and their associated service codes. These request types can be unique to the city/jurisdiction.",
                "parameters": [
                    {
                        "$ref": "#/parameters/jurisdiction_id"
                    },
                    {
                        "$ref": "#/parameters/response_format"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "ok",
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/Service"
                            }
                        },
                        "examples": {
                            "application/xml": {
                                "services": [
                                    {
                                        "service": {
                                            "service_code": 1,
                                            "service_name": "Cans left out 24x7",
                                            "description": "Garbage or recycling cans that have been left out for more than 24 hours after collection. Violators will be cited.",
                                            "metadata": true,
                                            "type": "realtime",
                                            "keywords": "lorem, ipsum, dolor",
                                            "group": "sanitation"
                                        }
                                    },
                                    {
                                        "service": {
                                            "service_code": 2,
                                            "service_name": "Construction plate shifted",
                                            "description": "Metal construction plate covering the street or sidewalk has been moved.",
                                            "metadata": true,
                                            "type": "realtime",
                                            "keywords": "lorem, ipsum, dolor",
                                            "group": "street"
                                        }
                                    },
                                    {
                                        "service": {
                                            "service_code": 3,
                                            "service_name": "Curb or curb ramp defect",
                                            "description": "Sidewalk curb or ramp has problems such as cracking, missing pieces, holes, and/or chipped curb.",
                                            "metadata": true,
                                            "type": "realtime",
                                            "keywords": "lorem, ipsum, dolor",
                                            "group": "street"
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    "400": {
                        "description": "The URL request is invalid or service is not running or reachable. Client should notify us after checking URL"
                    },
                    "404": {
                        "description": "jurisdiction_id provided was not found (specify in error response)."
                    }
                }
            }
        },
        "/services/{service_code}": {
            "get": {
                "summary": "(extended) definition of a service type",
                "description": "Define attributes associated with a service code. These attributes can be unique to the city/jurisdiction.",
                "parameters": [
                    {
                        "$ref": "#/parameters/jurisdiction_id"
                    },
                    {
                        "$ref": "#/parameters/response_format"
                    },
                    {
                        "name": "service_code",
                        "in": "path",
                        "required": true,
                        "type": "string",
                        "format": "uid"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "returns ServiceDefinition for the Service",
                        "schema": {
                            "$ref": "#/definitions/ServiceDefinition"
                        },
                        "examples": {
                            "application/xml": {
                                "service_definition": {
                                    "service_code": "DMV66",
                                    "attributes": {
                                        "attribute": {
                                            "variable": true,
                                            "code": "WHISHETN",
                                            "datatype": "singlevaluelist",
                                            "required": true,
                                            "datatype_description": "Some datatype",
                                            "order": 1,
                                            "description": "What is the ticket/tag/DL number?",
                                            "values": [
                                                {
                                                    "value": {
                                                        "key": 123,
                                                        "name": "Ford"
                                                    }
                                                },
                                                {
                                                    "value": {
                                                        "key": 124,
                                                        "name": "Chrysler"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "service_code or jurisdiction_id provided were not found (specify in erraddor response)"
                    },
                    "404": {
                        "description": "service_code or jurisdiction_id provided were not found (specify in error response)"
                    }
                }
            }
        }
    }
});