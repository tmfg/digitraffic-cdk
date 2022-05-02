import os
import datetime
import json
import time

import pandas as pd
import numpy as np

from plotly import express as px
from plotly import graph_objects as go

ALL_TIME_WITH_TREND = True if os.getenv('APP_ALL_TIME_WITH_TREND', 'DISABLE') == 'ENABLE' else False

if ALL_TIME_WITH_TREND:
    from sklearn.linear_model import LinearRegression

TERA = pow(10, 12)
MILJ = pow(10, 6)


def parse_unidentified(x):
    if isinstance(x, str):
        x = json.loads(x)

    a = x[''] if '' in x else 0
    b = x['__missing__'] if '__missing__' in x else 0

    return a + b


class Figures:
    def __init__(self, df, logger):
        self.df = df
        self.logger = logger

    def change_in_period_time_frame(self):
        df = self.df
        start = time.time()

        dff = df.loc[
            (df['name'].isin(['Http req', 'Bytes out'])) &
            (df['request_uri'] == '') &
            (df['liikennemuoto'].isin(['tie', 'rata', 'meri'])),
            ['from', 'liikennemuoto', 'name', 'value']
        ]

        pivot = dff.pivot(index='from', columns=['name', 'liikennemuoto'], values='value')
        dates = pivot.tail(n=6).reset_index()['from'].to_list()

        p1_from = dates[0].strftime('%d.%m.')
        p1_to = dates[2].strftime('%d.%m.')
        p2_from = dates[3].strftime('%d.%m.')
        p2_to = dates[5].strftime('%d.%m.')

        self.logger.info(f'method=Figures.change_in_period_time_frame took={time.time()-start}')

        return f'Verrataan keskenään ajanjaksoja {p1_from}–{p1_to} ja {p2_from}–{p2_to}.'

    def change_in_period(self):
        df = self.df
        start = time.time()

        dff = df.loc[
            (df['name'].isin(['Http req', 'Bytes out'])) &
            (df['request_uri'] == ''),
            ['from', 'liikennemuoto', 'name', 'value']
        ]

        pivot = dff.pivot(index='from', columns=['name', 'liikennemuoto'], values='value')
        resample = pivot.tail(n=6).resample('3M', closed='left').sum()
        change = resample.pct_change()

        latest_values = resample.tail(n=1).stack()
        latest_change = change.tail(n=1).stack()

        latest_values['Kyselyt (Milj.)'] = latest_values['Http req'].apply(lambda x: round(x / MILJ, 2))
        latest_values['Kyselyt (muutos-%)'] = latest_change['Http req'].apply(lambda x: round(x * 100, 2))
        latest_values['Data (Tt)'] = latest_values['Bytes out'].apply(lambda x: round(x / TERA, 2))
        latest_values['Data (muutos-%)'] = latest_change['Bytes out'].apply(lambda x: round(x * 100, 2))

        result = latest_values\
            .reset_index()\
            .drop(columns=['from', 'Bytes out', 'Http req'])\
            .rename(columns=dict(liikennemuoto='Liikennemuoto'))

        table = dict(
            columns=[dict(name=i, id=i) for i in result.columns],
            data=result.to_dict('records')
        )

        self.logger.info(f'method=Figures.change_in_period took={time.time()-start}')

        return table

    def top_users_table(self, query, comparison_query, sort_by_column, percentage_column, date=None, liikennemuoto=None):
        df = self.df

        if date is None:
            date = df['from'].unique().max()

        if liikennemuoto is None:
            liikennemuoto = 'kaikki'

        if df[(df['from'] == date) & (df['name'] == query) & (df['liikennemuoto'] == liikennemuoto)].empty or df[
            (df['from'] == date) & (df['name'] == comparison_query) & (df['liikennemuoto'] == liikennemuoto)].empty:
            return dict(
                columns=[{'name': '<ei tietoja valitulta ajalta>'}],
                data=[]
            )

        data = df[
            (df['from'] == date) &
            (df['name'] == query) &
            (df['liikennemuoto'] == liikennemuoto) &
            (df['request_uri'] == '') &
            (df['value'] != '{}')
            ]['value'].item()

        total_amount = df[
            (df['name'] == comparison_query) &
            (df['liikennemuoto'] == liikennemuoto) &
            (df['request_uri'] == '') &
            (df['from'] == date)
            ]['value'].item()

        if isinstance(data, str):
            data = json.loads(data)

        dt = pd.DataFrame.from_dict(data, orient='index', columns=[sort_by_column])

        dt = dt.sort_values(by=sort_by_column, ascending=False)
        dt = dt.reset_index()
        dt.index += 1
        dt = dt.reset_index()
        dt.rename(columns={'index': 'Käyttäjä', 'level_0': ''}, inplace=True)
        dt.loc[dt['Käyttäjä'] == '', ['Käyttäjä']] = '<tyhjä>'
        dt.loc[dt['Käyttäjä'] == '__missing__', ['Käyttäjä']] = '<tietue puuttuu>'

        dt[percentage_column] = dt[sort_by_column].apply(lambda x: "{} %".format(round(x/total_amount * 100, 2)))

        columns = [
            '',
            'Käyttäjä',
            sort_by_column,
            percentage_column,
        ]

        return dict(dt=dt, columns=columns)

    def top_users_req(self, date=None, liikennemuoto=None):
        start = time.time()

        primary_value = 'Kyselymäärä'

        table_data = self.top_users_table(query='Top 10 digitraffic-users',
                                          comparison_query='Http req',
                                          sort_by_column=primary_value,
                                          percentage_column='Kyselymäärä-%',
                                          date=date,
                                          liikennemuoto=liikennemuoto)

        if 'dt' not in table_data:
            return table_data

        table = dict(
            columns=[dict(name=i, id=i) for i in table_data['columns']],
            data=table_data['dt'].loc[:, table_data['columns']].to_dict('records')
        )

        self.logger.info(f'method=Figures.top_users_req took={time.time()-start}')

        return table

    def top_users_data(self, date=None, liikennemuoto=None):
        start = time.time()

        primary_value = 'Data (Tt)'

        table_data = self.top_users_table(query='Top digitraffic-users by bytes',
                                          comparison_query='Bytes out',
                                          sort_by_column=primary_value,
                                          percentage_column='Data-%',
                                          date=date,
                                          liikennemuoto=liikennemuoto)

        if 'dt' not in table_data:
            return table_data

        table_data['dt'][primary_value] = table_data['dt'][primary_value].apply(lambda x: "{}".format(round(x / TERA, 2)))

        table = dict(
            columns=[dict(name=i, id=i) for i in table_data['columns']],
            data=table_data['dt'].loc[:, table_data['columns']].to_dict('records')
        )

        self.logger.info(f'method=Figures.top_users_data took={time.time() - start}')

        return table

    def __year_on_year(self, a_type, texts, liikennemuoto=None, rounding=None):
        df = self.df
        start = time.time()

        if liikennemuoto is None:
            liikennemuoto = 'kaikki'

        data = df[(df['name'] == a_type) & (df['liikennemuoto'] == liikennemuoto) & (df['request_uri'] == '')]
        data = data.set_index('from')

        if rounding is not None:
            data['value'] = data['value'].apply(rounding)

        data[texts['values']] = data['value']
        data['vuosi'] = data.index.year
        data['kuukausi'] = data.index.month

        pivoted = pd.pivot_table(data, index='kuukausi', columns='vuosi', values=[texts['values']])

        fig = go.Figure()

        for col in pivoted.columns:
            fig.add_scatter(
                x=pivoted.index,
                y=pivoted[col],
                name=col[1],
            )

        fig.update_layout(
            title=texts['graph_title'],
            xaxis=dict(
                title="Kuukausi",
                tickvals=list(range(1, 13)),
                ticktext=[datetime.date(1970, m, 1).strftime('%B') for m in range(1, 13)]
            ),
            yaxis=dict(
                title=texts['yaxis_title'],
            ),
        )

        self.logger.info(f'method=Figures.__year_on_year type={a_type} took={time.time()-start}')

        return fig

    def data_year_on_year(self, liikennemuoto=None):
        texts = {
            'values': 'datamäärä',
            'graph_title': 'Data year-on-year',
            'yaxis_title': 'Data teratavuina (Tt)',
        }

        rounding = lambda x: round(x / TERA, 2)

        return self.__year_on_year('Bytes out', texts, liikennemuoto=liikennemuoto, rounding=rounding)

    def requests_year_on_year(self, liikennemuoto=None):
        texts = {
            'values': 'pyyntöä',
            'graph_title': 'Kyselyt year-on-year',
            'yaxis_title': 'Kyselyiden määrä',
        }

        return self.__year_on_year('Http req', texts, liikennemuoto=liikennemuoto)

    def identified_users(self, query, comparison_query, date=None, liikennemuoto=None):
        df = self.df
        start = time.time()

        if date is None:
            date = df['from'].unique().max()

        if liikennemuoto is None:
            liikennemuoto = 'kaikki'

        if df[(df['from'] == date) & (df['name'] == query) & (df['liikennemuoto'] == liikennemuoto)].empty:
            return {}

        # Haetaan tunnistamattomat käyttäjät
        user_data = df[(df['name'] == query) & (df['liikennemuoto'] == liikennemuoto) & (df['request_uri'] == '') & (df['value'] != '{}')]
        user_data = user_data.set_index('from')
        user_data['unidentified'] = user_data['value'].apply(parse_unidentified)

        # Haetaan käsitellyn arvon määrä yhteensä
        all_requests = df[(df['name'] == comparison_query) & (df['liikennemuoto'] == liikennemuoto) & (df['request_uri'] == '')]
        all_requests = all_requests.set_index('from')
        all_requests['all'] = all_requests['value']
        all_requests = all_requests[['aikaleima', 'all']]

        # yhdistetään kokonaismäärä ja tunnistamattomat sekä lasketaan tunnistettujen määrä (kaikki - tunnistamattomat)
        dff = pd.concat([user_data, all_requests], axis=1)
        dff['identified'] = dff['all'] - dff['unidentified']
        dff = dff.dropna()
        dff['change_in_time'] = dff['identified'].pct_change().apply(lambda x: round(x * 100, 2))  # Muutos edelliseen

        # haetaan viimeisimmän kuukauden tiedot piirakkaa varten
        data = dff[user_data['aikaleima'] == date].reset_index()[['identified', 'unidentified', 'change_in_time']]
        change_in_time = data['change_in_time'].item()
        data = data[['identified', 'unidentified']]
        data = data.iloc[0].to_dict()

        fig = go.Figure(data=[go.Pie(
            title='Tunnistettujen ja tunnistamattomien osuudet. Muutos: {} %'.format(change_in_time),
            labels=['Tunnistetut', 'Tunnistamattomat'],
            values=list(data.values()),
            marker=dict(colors=['#636efa', '#ef553b']),
        )])
        fig.update_traces(hoverinfo='label+percent')

        self.logger.info(f'method=Figures.identified_users took={time.time()-start}')

        return fig

    def __all_time_data(self, a_type, texts, rounding=None, start_date=None, end_date=None):
        df = self.df
        start = time.time()

        data = df[(df['name'] == a_type) & (df['request_uri'] == '')]
        data = data.sort_values(by=['from', 'liikennemuoto'], ascending=True)

        if start_date and end_date:
            data = data[(start_date <= data['from']) & (data['from'] <= end_date)]
        elif start_date:
            data = data[start_date <= data['from']]

        data = data.set_index('from')
        data['days_from_start'] = (data.index - data.index[0]).days

        if rounding is not None:
            data['value'] = data['value'].apply(rounding)

        data[texts['values']] = data['value']
        graph_data = data[data['liikennemuoto'] != 'kaikki']
        fig = px.bar(graph_data, title=texts['graph_title'], x='aikaleima', y=texts['values'], color='liikennemuoto')

        if ALL_TIME_WITH_TREND:
            bytes_combined = data[data['liikennemuoto'] == 'kaikki']
            reg = LinearRegression().fit(bytes_combined['days_from_start'].values.reshape(-1, 1), np.log(bytes_combined[texts['values']]))
            bytes_combined['trend'] = np.exp(reg.predict(bytes_combined['days_from_start'].to_numpy().reshape(-1, 1)))
            fig.add_trace(go.Scatter(name='Logaritminen trendi', x=bytes_combined.index, y=bytes_combined['trend']))

        self.logger.info(f'method=Figures.__all_time_data type={a_type} took={time.time()-start}')

        return fig

    def __all_time_agr(self, a_type, start_date=None, end_date=None):
        df = self.df
        start = time.time()

        data = df[(df['name'] == a_type) & (df['request_uri'] == '') & (df['liikennemuoto'] == 'kaikki')]
        data = data.sort_values(by=['from', 'liikennemuoto'], ascending=True)

        if start_date and end_date:
            data = data[(start_date <= data['from']) & (data['from'] <= end_date)]
        elif start_date:
            data = data[start_date <= data['from']]

        pct_change = data['value'].pct_change() * 100

        result = round(pct_change.sum() / len(pct_change), 2)
        self.logger.info(f'method=Figures.__all_time_data_agr took={time.time()-start}')

        return result

    def all_time_data_with_trend(self, start_date=None, end_date=None):
        texts = {
            'values': 'datamäärä',
            'graph_title': 'Pitkän aikavälin data yhteensä (Tt) ja trendi',
        }

        rounding = lambda x: round(x / TERA, 3)

        return self.__all_time_data('Bytes out', texts,
                                    rounding=rounding, start_date=start_date, end_date=end_date)

    def all_time_data_agr(self, start_date=None, end_date=None):
        return self.__all_time_agr('Bytes out', start_date=start_date, end_date=end_date)

    def all_time_requests_with_trend(self, start_date=None, end_date=None):
        texts = {
            'values': 'kyselyitä',
            'graph_title': 'Pitkän aikavälin kyselyt yhteensä ja trendi',
        }

        rounding = int

        return self.__all_time_data('Http req', texts,
                                    rounding=rounding, start_date=start_date, end_date=end_date)

    def all_time_requests_agr(self, start_date=None, end_date=None):
        return self.__all_time_agr('Http req', start_date=start_date, end_date=end_date)
