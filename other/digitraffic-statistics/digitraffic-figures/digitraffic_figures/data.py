import digitraffic_figures.secret_manager as secret_manager
import numpy as np
import os
import pandas as pd
import time
from sqlalchemy import create_engine, text

TEBI = pow(1024, 4)

SQL_QUERY = text(
    """
    SELECT *
    FROM key_figures
    WHERE filter IN ('@transport_type:*', '@transport_type:rail', '@transport_type:road', '@transport_type:marine', '@transport_type:afir')
"""
)


def transport_type_in_fi(x):
    if x == "marine":
        return "meri"
    elif x == "rail":
        return "rata"
    elif x == "road":
        return "tie"
    elif x == "afir":
        return "afir"
    elif x == "*":
        return "kaikki"
    else:
        return "tuntematon"


def extract_transport_type(x):
    return x.split(" ")[0].split(":")[1]


def extract_request_uri(x):
    arr = x.split("AND")

    if len(arr) == 2:
        y = arr[1].split(":")
        return y[1][1:-1]

    return ""


def make_adjustments(df: pd.DataFrame):
    missing_figures = {
        "Bytes out": {
            "2020-09-01": 20.26 * TEBI,
            "2020-10-01": 17.70 * TEBI,
            "2020-11-01": 18.10 * TEBI,
            "2020-12-01": 22.89 * TEBI,
            "2021-01-01": 19.90 * TEBI,
            "2021-02-01": 18.70 * TEBI,
            "2021-03-01": 20.90 * TEBI,
            "2021-04-01": 20.80 * TEBI,
        },
        "Http req": {
            "2020-09-01": 205757337,
            "2020-10-01": 253910882,
            "2020-11-01": 255370110,
            "2020-12-01": 304464476,
            "2021-01-01": 286658499,
            "2021-02-01": 265359790,
            "2021-03-01": 265622696,
            "2021-04-01": 232762615,
        },
    }

    if not df.empty:
        for name, data_points in missing_figures.items():
            for timestamp, new_road_value in data_points.items():
                filter = (
                    (df["aikaleima"] == timestamp)
                    & (df["request_uri"] == "")
                    & (df["name"] == name)
                )

                road_values = df.loc[filter & (df["liikennemuoto"] == "tie")]["value"]

                if len(road_values) == 1:
                    old_road_value = road_values.item()
                else:
                    print(f"{len(road_values)} values found for date: {timestamp}")
                    continue

                old_road_value = df.loc[filter & (df["liikennemuoto"] == "tie")][
                    "value"
                ].item()
                traffic_combined_value = df.loc[
                    filter & (df["liikennemuoto"] == "kaikki")
                ]["value"].item()

                # korjaa yksittäiset
                df.loc[filter & (df["liikennemuoto"] == "tie"), ["value"]] = (
                    new_road_value
                )

                # korjaa yhteensä arvo
                df.loc[filter & (df["liikennemuoto"] == "kaikki"), ["value"]] = (
                    traffic_combined_value - old_road_value + new_road_value
                )

    return df


def fetch_data_from_database(logger):
    if os.getenv("DB_SECRET_ARN"):
        secret = secret_manager.get_secret(os.getenv("DB_SECRET_ARN"))

    else:
        secret = dict(
            username=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )

    start = time.time()

    secret["database"] = os.getenv("DB_DATABASE")

    url = "mysql+pymysql://{username}:{password}@{host}:{port}/{database}".format(
        **secret
    )
    engine = create_engine(url)

    with engine.connect() as conn:
        df = pd.read_sql_query(
            SQL_QUERY, conn, index_col="id", parse_dates=["from", "to"]
        )

    logger.info(
        f"method=data.fetch_data_from_database took={time.time() - start} mesasage=read data from database"
    )

    return df


def create_dataframe(logger=None):
    if logger is None:
        import logging

        logger = logging.getLogger("digitraffic_figures.data")

    start = time.time()
    df = fetch_data_from_database(logger)

    has_integer_values = ["Http req", "Http req 200", "Bytes out", "Unique IPs"]
    df.loc[df["name"].isin(has_integer_values), ["value"]] = df[
        df["name"].isin(has_integer_values)
    ]["value"].apply(np.uint)

    df["aikaleima"] = df["from"]
    df = df.sort_values(by="aikaleima", ascending=True)
    df["transport_type"] = df["filter"].apply(extract_transport_type)
    df["liikennemuoto"] = df["transport_type"].apply(transport_type_in_fi)
    df["request_uri"] = df["filter"].apply(extract_request_uri)

    df = make_adjustments(df)

    logger.info(f"method=data.create_dataframe took={time.time() - start}")

    return df
