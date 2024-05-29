import base64
import os
import io
import time
import json

from urllib.parse import unquote

from digitraffic_figures import create_app


class Response(object):
    def __init__(self):
        self.status = None
        self.headers = None

    def start_response(self, status, response_headers):
        self.status = int(status[:3])
        self.headers = dict(response_headers)


def make_wsgi_env(event):
    headers = {
        "HTTP_{}".format(name.replace("-", "_").upper()): val
        for name, val in event.get("headers", {}).items()
    }

    path_info = event.get("path", "")
    stage_name = os.getenv("API_GATEWAY_STAGE_PATH", "")

    path_info = "{}{}".format(stage_name, path_info)
    request_context = event.get("requestContext", dict())

    query_string = event.get("queryStringParameters", None)
    if isinstance(query_string, dict):
        query_string = json.dumps(query_string)
    if query_string is None:
        query_string = ""

    body = event.get("body", "")

    if body is None:
        body = ""
    if event.get("isBase64Encoded", False):
        body = base64.b64decode(body)
    if isinstance(body, str):
        body = body.encode("utf-8")

    env = {
        "REQUEST_METHOD": event.get("httpMethod", "GET"),
        "PATH_INFO": unquote(path_info),
        "SCRIPT_NAME": "",
        "QUERY_STRING": query_string,
        "SERVER_NAME": request_context.get("domainName", "localhost"),
        "SERVER_PORT": "80",
        "CONTENT_TYPE": headers.get("HTTP_CONTENT_TYPE", ""),
        "CONTENT_LENGTH": str(len(body.decode("utf-8"))),
        "wsgi.input": io.BytesIO(body),
        "wsgi.input_terminated": True,
        "wsgi.url_scheme": headers.get("HTTP_X_FORWARDED_PROTO", "http"),
        "wsgi.multithread": False,
        "wsgi.run_once": True,
        "wsgi.multiprocess": False,
    }

    return headers | env


def handler(event, context):
    start = time.time()
    app = create_app(kwargs_dash=dict(serve_locally=False))
    response = Response()

    env = make_wsgi_env(event)

    app.logger.info(f"method=app.handler message=lambda event {event}")
    app.logger.info(f"method=app.handler message=wsgi env {env}")

    body = next(app.wsgi_app(env, response.start_response))

    result = {"statusCode": response.status, "headers": response.headers, "body": body}

    method = env["REQUEST_METHOD"]
    path = env["PATH_INFO"]

    app.logger.info(
        f"method=app.handler httpMethod={method} path={path} took={time.time()-start} message={result}"
    )

    return result
