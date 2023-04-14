import os
import time
from logging import config

from flask import Flask
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()

if os.getenv("DEV"):
    from dotenv import load_dotenv

    load_dotenv()


def create_app(kwargs_flask=None, kwargs_dash=None):
    start = time.time()

    if kwargs_flask is None:
        kwargs_flask = dict()

    if kwargs_dash is None:
        kwargs_dash = dict()

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = log_level if log_level in ["DEBUG", "INFO"] else "INFO"

    config.dictConfig(
        {
            "version": 1,
            "formatters": {
                "default": {
                    "format": "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
                }
            },
            "handlers": {
                "wsgi": {
                    "class": "logging.StreamHandler",
                    "level": log_level,
                    "formatter": "default",
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {
                "level": log_level,
                "handlers": ["wsgi"],
            },
        }
    )

    start_flask = time.time()

    app = Flask(__name__, instance_relative_config=False, **kwargs_flask)
    # https://github.com/plotly/dash/issues/308#issuecomment-412653680
    csrf._exempt_views.add("dash.dash.dispatch")
    csrf.init_app(app)

    end_flask = time.time() - start_flask

    start_dashboard = time.time()
    with app.app_context():
        import digitraffic_figures.dashboard as dash

        app = dash.init_dashboard(app, **kwargs_dash)

    end_dashboard = time.time() - start_dashboard

    app.logger.info(
        f"method=digitraffic_figures.create_app took={end_flask} message=initialize flask"
    )
    app.logger.info(
        f"method=digitraffic_figures.create_app took={end_dashboard} message=initialize dashboard"
    )
    app.logger.info(f"method=digitraffic_figures.create_app took={time.time()-start}")

    return app
