import os
import datetime
import json
import time

import pandas as pd
import numpy as np

from plotly import express as px
from plotly import graph_objects as go

from sklearn.linear_model import LinearRegression

TERA = pow(10, 12)
GIGA = pow(10, 9)
MILJ = pow(10, 6)


def parse_unidentified(x):
    if isinstance(x, str):
        x = json.loads(x)

    a = x[""] if "" in x else 0
    b = x["__missing__"] if "__missing__" in x else 0

    return a + b


class Figures:
    def __init__(self, df, logger):
        self.df = df
        self.logger = logger

    def change_in_period_time_frame(self):
        df = self.df
        start = time.time()

        dff = df.loc[
            (df["name"].isin(["Http req", "Bytes out"]))
            & (df["request_uri"] == "")
            & (df["liikennemuoto"].isin(["tie", "rata", "meri"])),
            ["from", "liikennemuoto", "name", "value"],
        ]

        pivot = dff.pivot(
            index="from", columns=["name", "liikennemuoto"], values="value"
        )

        # last 15 months
        if len(pivot) < 15:
            return "Not enough data for year-on-year comparison"

        dates = pivot.tail(n=15).reset_index()["from"].to_list()

        # The period from a year ago
        p1_from = dates[0].strftime("%d.%m.%Y")
        p1_to = dates[2].strftime("%d.%m.%Y")
        # The latest period
        p2_from = dates[12].strftime("%d.%m.%Y")
        p2_to = dates[14].strftime("%d.%m.%Y")

        self.logger.info(
            f"method=Figures.change_in_period_time_frame took={time.time()-start}"
        )
        return (
            f"Verrataan keskenään ajanjaksoja {p1_from}–{p1_to} ja {p2_from}–{p2_to}."
        )

    def change_in_period_time_frame_12_months(self):
        df = self.df
        start = time.time()

        dff = df.loc[
            (df["name"].isin(["Http req", "Bytes out"]))
            & (df["request_uri"] == "")
            & (df["liikennemuoto"].isin(["tie", "rata", "meri"])),
            ["from", "liikennemuoto", "name", "value"],
        ]

        pivot = dff.pivot(
            index="from", columns=["name", "liikennemuoto"], values="value"
        )

        if len(pivot) < 24:
            return "Not enough data for 12-month year-on-year comparison"

        dates = pivot.tail(n=24).reset_index()["from"].to_list()

        # The period from 2 years ago
        p1_from = dates[0].strftime("%d.%m.%Y")
        p1_to = dates[11].strftime("%d.%m.%Y")
        # The latest 12 month period
        p2_from = dates[12].strftime("%d.%m.%Y")
        p2_to = dates[23].strftime("%d.%m.%Y")

        self.logger.info(
            f"method=Figures.change_in_period_time_frame_12_months took={time.time()-start}"
        )
        return (
            f"Verrataan keskenään ajanjaksoja {p1_from}–{p1_to} ja {p2_from}–{p2_to}."
        )

    def _generate_change_table(self, months):
        df = self.df
        start = time.time()

        dff = df.loc[
            (df["name"].isin(["Http req", "Bytes out"])) & (df["request_uri"] == ""),
            ["from", "liikennemuoto", "name", "value"],
        ]

        pivot = dff.pivot(
            index="from", columns=["name", "liikennemuoto"], values="value"
        )

        required_rows = 12 + months
        if len(pivot) < required_rows:
            return dict(
                columns=[
                    {
                        "name": f"<Not enough data for {months}-month year-on-year comparison>"
                    }
                ],
                data=[],
            )

        resample = pivot.resample(f"{months}ME", closed="left").sum()

        # For a 12-month comparison, we compare the last period to the one before it.
        # For shorter periods, we compare to the same period a year ago.
        periods_in_year = 12 // months
        lookback_periods = periods_in_year if months < 12 else 1

        if len(resample) < lookback_periods + 1:
            return dict(
                columns=[
                    {
                        "name": f"<Not enough data for {months}-month year-on-year comparison>"
                    }
                ],
                data=[],
            )

        latest_period = resample.iloc[-1]
        previous_period = resample.iloc[-(lookback_periods + 1)]

        # Calculate percentage change
        with np.errstate(divide="ignore", invalid="ignore"):
            change = (latest_period - previous_period) / previous_period
            change = change.replace([np.inf, -np.inf], np.nan)

        latest_values = resample.tail(n=1).stack()

        change_df = change.to_frame(name=latest_period.name).T
        latest_change = change_df.stack()

        if len(latest_values) > 0:
            latest_values["Kyselyt (Milj.)"] = latest_values["Http req"].apply(
                lambda x: round(x / MILJ, 2)
            )
            latest_values["Kyselyt (muutos-%)"] = latest_change["Http req"].apply(
                lambda x: round(x * 100, 2) if pd.notna(x) else "N/A"
            )
            latest_values["Data (Tt)"] = latest_values["Bytes out"].apply(
                lambda x: round(x / TERA, 2)
            )
            latest_values["Data (muutos-%)"] = latest_change["Bytes out"].apply(
                lambda x: round(x * 100, 2) if pd.notna(x) else "N/A"
            )

            result = (
                latest_values.reset_index()
                .drop(columns=["from", "Bytes out", "Http req"])
                .rename(columns=dict(liikennemuoto="Liikennemuoto"))
            )

            table = dict(
                columns=[dict(name=i, id=i) for i in result.columns],
                data=result.to_dict("records"),
            )

            self.logger.info(
                f"method=Figures._generate_change_table months={months} took={time.time()-start}"
            )

            return table
        else:
            return dict(columns=[{"name": "<ei tietoja valitulta ajalta>"}], data=[])

    def change_in_period(self):
        return self._generate_change_table(months=3)

    def change_in_period_12_months(self):
        return self._generate_change_table(months=12)

    def top_users_table(
        self,
        query,
        comparison_query,
        sort_by_column,
        percentage_column,
        date=None,
        liikennemuoto=None,
    ):
        df = self.df
        if date is None:
            date = df["from"].unique().max()

        if liikennemuoto is None:
            liikennemuoto = "kaikki"

        if (
            df[
                (df["from"] == date)
                & (df["name"] == query)
                & (df["liikennemuoto"] == liikennemuoto)
            ].empty
            or df[
                (df["from"] == date)
                & (df["name"] == comparison_query)
                & (df["liikennemuoto"] == liikennemuoto)
            ].empty
        ):
            return dict(columns=[{"name": "<ei tietoja valitulta ajalta>"}], data=[])

        data = df[
            (df["from"] == date)
            & (df["name"] == query)
            & (df["liikennemuoto"] == liikennemuoto)
            & (df["request_uri"] == "")
            & (df["value"] != "{}")
        ]["value"].item()

        total_amount = df[
            (df["name"] == comparison_query)
            & (df["liikennemuoto"] == liikennemuoto)
            & (df["request_uri"] == "")
            & (df["from"] == date)
        ]["value"].item()

        if isinstance(data, str):
            data = json.loads(data)
            if "" in data:
                data["__missing__"] = data.get("__missing__", 0)
                data["__missing__"] += data[""]
                del data[""]

        dt = pd.DataFrame.from_dict(data, orient="index", columns=[sort_by_column])

        dt = dt.sort_values(by=sort_by_column, ascending=False)
        dt = dt.reset_index()
        dt.index += 1
        dt = dt.reset_index()
        dt.rename(columns={"index": "Käyttäjä", "level_0": ""}, inplace=True)

        dt.loc[dt["Käyttäjä"] == "__missing__", ["Käyttäjä"]] = "<tietue puuttuu>"

        dt[percentage_column] = dt[sort_by_column].apply(
            lambda x: "{} %".format(round(x / total_amount * 100, 2))
        )

        columns = [
            "",
            "Käyttäjä",
            sort_by_column,
            percentage_column,
        ]

        return dict(dt=dt, columns=columns)

    def top_users_req(self, date=None, liikennemuoto=None):
        start = time.time()

        primary_value = "Kyselymäärä"

        table_data = self.top_users_table(
            query="Top 10 digitraffic-users",
            comparison_query="Http req",
            sort_by_column=primary_value,
            percentage_column="Kyselymäärä-%",
            date=date,
            liikennemuoto=liikennemuoto,
        )

        if "dt" not in table_data:
            return table_data

        table = dict(
            columns=[dict(name=i, id=i) for i in table_data["columns"]],
            data=table_data["dt"].loc[:, table_data["columns"]].to_dict("records"),
        )

        self.logger.info(f"method=Figures.top_users_req took={time.time()-start}")

        return table

    def top_users_data(self, date=None, liikennemuoto=None):
        start = time.time()

        primary_value = "Data (Gt)"

        table_data = self.top_users_table(
            query="Top digitraffic-users by bytes",
            comparison_query="Bytes out",
            sort_by_column=primary_value,
            percentage_column="Data-%",
            date=date,
            liikennemuoto=liikennemuoto,
        )

        if "dt" not in table_data:
            return table_data

        table_data["dt"][primary_value] = table_data["dt"][primary_value].apply(
            lambda x: "{}".format(round(x / GIGA, 2))
        )

        table = dict(
            columns=[dict(name=i, id=i) for i in table_data["columns"]],
            data=table_data["dt"].loc[:, table_data["columns"]].to_dict("records"),
        )

        self.logger.info(f"method=Figures.top_users_data took={time.time() - start}")

        return table

    def __year_on_year(self, a_type, texts, liikennemuoto=None, rounding=None):
        df = self.df
        start = time.time()

        if liikennemuoto is None:
            liikennemuoto = "kaikki"

        data = df[
            (df["name"] == a_type)
            & (df["liikennemuoto"] == liikennemuoto)
            & (df["request_uri"] == "")
        ]
        data = data.set_index("from")

        if rounding is not None:
            data["value"] = data["value"].apply(rounding)

        data[texts["values"]] = data["value"]
        data["vuosi"] = data.index.year
        data["kuukausi"] = data.index.month

        pivoted = pd.pivot_table(
            data, index="kuukausi", columns="vuosi", values=[texts["values"]]
        )

        fig = go.Figure()

        for col in pivoted.columns:
            fig.add_scatter(
                x=pivoted.index,
                y=pivoted[col],
                name=col[1],
            )

        fig.update_layout(
            title=texts["graph_title"],
            xaxis=dict(
                title="Kuukausi",
                tickvals=list(range(1, 13)),
                ticktext=[
                    datetime.date(1970, m, 1).strftime("%B") for m in range(1, 13)
                ],
            ),
            yaxis=dict(
                title=texts["yaxis_title"],
            ),
        )

        self.logger.info(
            f"method=Figures.__year_on_year type={a_type} took={time.time()-start}"
        )

        return fig

    def data_year_on_year(self, liikennemuoto=None):
        texts = {
            "values": "datamäärä",
            "graph_title": "Data year-on-year",
            "yaxis_title": "Data teratavuina (Tt)",
        }

        rounding = lambda x: round(x / TERA, 2)

        return self.__year_on_year(
            "Bytes out", texts, liikennemuoto=liikennemuoto, rounding=rounding
        )

    def requests_year_on_year(self, liikennemuoto=None):
        texts = {
            "values": "pyyntöä",
            "graph_title": "Kyselyt year-on-year",
            "yaxis_title": "Kyselyiden määrä",
        }

        return self.__year_on_year("Http req", texts, liikennemuoto=liikennemuoto)

    def identified_users(self, query, comparison_query, date=None, liikennemuoto=None):
        df = self.df
        start = time.time()

        if date is None:
            date = df["from"].unique().max()

        if liikennemuoto is None:
            liikennemuoto = "kaikki"

        if df[
            (df["from"] == date)
            & (df["name"] == query)
            & (df["liikennemuoto"] == liikennemuoto)
        ].empty:
            return {}

        # Haetaan tunnistamattomat käyttäjät
        user_data = df[
            (df["name"] == query)
            & (df["liikennemuoto"] == liikennemuoto)
            & (df["request_uri"] == "")
            & (df["value"] != "{}")
        ]
        user_data = user_data.set_index("from")
        user_data["unidentified"] = user_data["value"].apply(parse_unidentified)

        # Haetaan käsitellyn arvon määrä yhteensä
        all_requests = df[
            (df["name"] == comparison_query)
            & (df["liikennemuoto"] == liikennemuoto)
            & (df["request_uri"] == "")
        ]
        all_requests = all_requests.set_index("from")
        all_requests["all"] = all_requests["value"]
        all_requests = all_requests[["aikaleima", "all"]]

        # yhdistetään kokonaismäärä ja tunnistamattomat sekä lasketaan tunnistettujen määrä (kaikki - tunnistamattomat)
        dff = pd.concat([user_data, all_requests], axis=1)
        dff["identified"] = dff["all"] - dff["unidentified"]
        dff["identified_percentage"] = dff["identified"] / dff["all"] * 100
        dff = dff.dropna()
        dff["change_in_time"] = (
            dff["identified_percentage"].diff().apply(lambda x: round(x, 2))
        )  # Muutos edelliseen

        # haetaan viimeisimmän kuukauden tiedot piirakkaa varten
        data = dff[user_data["aikaleima"] == date].reset_index()[
            ["identified", "unidentified", "change_in_time"]
        ]
        change_in_time = data["change_in_time"].item()
        data = data[["identified", "unidentified"]]
        data = data.iloc[0].to_dict()

        fig = go.Figure(
            data=[
                go.Pie(
                    title="Tunnistettujen ja tunnistamattomien osuudet. Muutos: {prefix}{value} %-yksikköä".format(
                        prefix="+" if change_in_time >= 0 else "", value=change_in_time
                    ),
                    labels=["Tunnistetut", "Tunnistamattomat"],
                    values=list(data.values()),
                    marker=dict(colors=["#636efa", "#ef553b"]),
                )
            ]
        )
        fig.update_traces(hoverinfo="label+percent")

        self.logger.info(f"method=Figures.identified_users took={time.time()-start}")

        return fig

    def __all_time_data(
        self, a_type, texts, rounding=None, start_date=None, end_date=None
    ):
        df = self.df
        start = time.time()

        data = df[(df["name"] == a_type) & (df["request_uri"] == "")]
        data = data.sort_values(by=["from", "liikennemuoto"], ascending=True)

        if start_date and end_date:
            data = data[(start_date <= data["from"]) & (data["from"] <= end_date)]
        elif start_date:
            data = data[start_date <= data["from"]]

        data = data.set_index("from")
        data["days_from_start"] = (data.index - data.index[0]).days

        if rounding is not None:
            data["value"] = data["value"].apply(rounding)

        data[texts["values"]] = data["value"]
        graph_data = data[data["liikennemuoto"] != "kaikki"]
        fig = px.bar(
            graph_data,
            title=texts["graph_title"],
            x="aikaleima",
            y=texts["values"],
            color="liikennemuoto",
        )

        bytes_combined = data[data["liikennemuoto"] == "kaikki"]
        reg = LinearRegression().fit(
            bytes_combined["days_from_start"].values.reshape(-1, 1),
            np.log(bytes_combined[texts["values"]]),
        )
        bytes_combined["trend"] = np.exp(
            reg.predict(bytes_combined["days_from_start"].to_numpy().reshape(-1, 1))
        )
        fig.add_trace(
            go.Scatter(
                name="Logaritminen trendi",
                x=bytes_combined.index,
                y=bytes_combined["trend"],
            )
        )

        self.logger.info(
            f"method=Figures.__all_time_data type={a_type} took={time.time()-start}"
        )

        return fig

    def __all_time_agr(self, a_type, start_date=None, end_date=None):
        df = self.df
        start = time.time()

        data = df[
            (df["name"] == a_type)
            & (df["request_uri"] == "")
            & (df["liikennemuoto"] == "kaikki")
        ]
        data = data.sort_values(by=["from", "liikennemuoto"], ascending=True)

        if start_date and end_date:
            data = data[(start_date <= data["from"]) & (data["from"] <= end_date)]
        elif start_date:
            data = data[start_date <= data["from"]]

        pct_change = data["value"].pct_change() * 100

        result = round(pct_change.sum() / len(pct_change), 2)
        self.logger.info(f"method=Figures.__all_time_data_agr took={time.time()-start}")

        return result

    def all_time_data_with_trend(self, start_date=None, end_date=None):
        texts = {
            "values": "datamäärä",
            "graph_title": "Pitkän aikavälin data yhteensä (Tt) ja trendi",
        }

        rounding = lambda x: round(x / TERA, 3)

        return self.__all_time_data(
            "Bytes out",
            texts,
            rounding=rounding,
            start_date=start_date,
            end_date=end_date,
        )

    def all_time_data_agr(self, start_date=None, end_date=None):
        return self.__all_time_agr(
            "Bytes out", start_date=start_date, end_date=end_date
        )

    def all_time_requests_with_trend(self, start_date=None, end_date=None):
        texts = {
            "values": "kyselyitä",
            "graph_title": "Pitkän aikavälin kyselyt yhteensä ja trendi",
        }

        rounding = int

        return self.__all_time_data(
            "Http req",
            texts,
            rounding=rounding,
            start_date=start_date,
            end_date=end_date,
        )

    def all_time_requests_agr(self, start_date=None, end_date=None):
        return self.__all_time_agr("Http req", start_date=start_date, end_date=end_date)
