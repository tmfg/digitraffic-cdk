import os
import time
from logging import config

from flask import Flask


def create_app(kwargs_flask=None, kwargs_dash=None):
    start = time.time()

    if kwargs_flask is None:
        kwargs_flask = dict()

    if kwargs_dash is None:
        kwargs_dash = dict()

    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

    config.dictConfig({
        'version': 1,
        'formatters': {'default': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        }},
        'handlers': {'wsgi': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/tmp/wsgi.log',
            'formatter': 'default',
            'maxBytes': 1024*1024
        }},
        'root': {
            'level': log_level,
            'handlers': ['wsgi']
        }
    })

    start_flask = time.time()
    app = Flask(__name__, instance_relative_config=False, **kwargs_flask)
    end_flask = time.time() - start_flask

    start_dashboard = time.time()
    with app.app_context():
        import digitraffic_figures.dashboard as dash
        app = dash.init_dashboard(app, **kwargs_dash)

    end_dashboard = time.time() - start_dashboard

    app.logger.info(f'method=digitraffic_figures.create_app took={end_flask} message=initialize flask')
    app.logger.info(f'method=digitraffic_figures.create_app took={end_dashboard} message=initialize dashboard')
    app.logger.info(f'method=digitraffic_figures.create_app took={time.time()-start}')

    return app
