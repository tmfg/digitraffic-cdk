import datetime
import time

import dash
from dash import dcc
from dash import html
from dash import dash_table
from dash.dependencies import Input, Output
import dash_bootstrap_components as dbc

import digitraffic_figures.data as data
import digitraffic_figures.figures as fig


def init_callbacks(dash_app, df, figures, logger):
    start = time.time()

    @dash_app.callback(
        Output('output-graph-all-time-requests-with-trend', 'figure'),
        [Input('input-all-time-date-picker-range', 'start_date'), Input('input-all-time-date-picker-range', 'end_date')]
    )
    def update_all_time_requests_graph(start_date, end_date):
        return figures.all_time_requests_with_trend(start_date, end_date)

    @dash_app.callback(
        Output('output-all-time-requests-agr', 'children'),
        [Input('input-all-time-date-picker-range', 'start_date'), Input('input-all-time-date-picker-range', 'end_date')]
    )
    def update_all_time_requests_agr(start_date, end_date):
        value = figures.all_time_requests_agr(start_date, end_date)
        return f'Keskimääräinen kasvuvauhti valitulla ajanjaksolla: {value} %'

    @dash_app.callback(
        Output('output-graph-all-time-data-with-trend', 'figure'),
        [Input('input-all-time-date-picker-range', 'start_date'), Input('input-all-time-date-picker-range', 'end_date')]
    )
    def update_all_time_data_graph(start_date, end_date):
        return figures.all_time_data_with_trend(start_date, end_date)

    @dash_app.callback(
        Output('output-all-time-data-agr', 'children'),
        [Input('input-all-time-date-picker-range', 'start_date'), Input('input-all-time-date-picker-range', 'end_date')]
    )
    def update_all_time_data_agr(start_date, end_date):
        value = figures.all_time_data_agr(start_date, end_date)
        return f'Keskimääräinen kasvuvauhti valitulla ajanjaksolla: {value} %'

    @dash_app.callback(
        [Output('output-table-top-10-users', 'columns'), Output('output-table-top-10-users', 'data')],
        [Input('input-table-top-10-users-date', 'value'), Input('input-table-top-10-users-liikennemuoto', 'value')]
    )
    def update_top_10_users(filter_date, liikennemuoto):
        table = figures.top_10_users(date=filter_date, liikennemuoto=liikennemuoto)
        return table['columns'], table['data']

    @dash_app.callback(
        [Output('output-table-top-10-users-by-bytes', 'columns'), Output('output-table-top-10-users-by-bytes', 'data')],
        [Input('input-table-top-10-users-date', 'value'), Input('input-table-top-10-users-liikennemuoto', 'value')]
    )
    def update_top_10_users_by_bytes(filter_date, liikennemuoto):
        table = figures.top_10_users_by_bytes(date=filter_date, liikennemuoto=liikennemuoto)
        return table['columns'], table['data']

    @dash_app.callback(
        Output('output-graph-pie-identified-users', 'figure'),
        [Input('input-table-top-10-users-date', 'value'), Input('input-table-top-10-users-liikennemuoto', 'value')]
    )
    def update_identified_users(filter_date, liikennemuoto):
        return figures.identified_users(date=filter_date, liikennemuoto=liikennemuoto)

    @dash_app.callback(
        Output('output-graph-data-year-on-year', 'figure'),
        Input('input-year-on-year-dropdown-liikennemuoto', 'value')
    )
    def update_data_year_on_year(liikennemuoto):
        return figures.data_year_on_year(liikennemuoto=liikennemuoto)

    @dash_app.callback(
        Output('output-graph-requests-year-on-year', 'figure'),
        Input('input-year-on-year-dropdown-liikennemuoto', 'value')
    )
    def update_requests_year_on_year(liikennemuoto):
        return figures.requests_year_on_year(liikennemuoto=liikennemuoto)

    logger.info(f'method=dashboard.init_callbacks took={time.time()-start}')


def create_top_10_users_date_options(df):
    nanosecond = 1e9
    dates = [datetime.datetime.utcfromtimestamp(i.astype(int) / nanosecond) for i in df['from'].unique()]

    options = [dict(label=i.strftime("%Y-%m-%d"), value=i) for i in dates]
    options.reverse()

    default_value = max(dates)

    return options, default_value


def create_liikennemuoto_options(df):
    options = [dict(label=i, value=i) for i in df['liikennemuoto'].unique()]
    default_value = 'kaikki'
    return options, default_value


def create_layout(dash_app, df, figures, logger):
    start = time.time()

    top_10_users_date_options, top_10_users_date_default_value = create_top_10_users_date_options(df)
    liikennemuoto_options, liikennemuoto_default_value = create_liikennemuoto_options(df)

    dash_app.layout = html.Div(children=[

        html.Div(children=[

            html.H1(children='Digitrafficin avainluvut'),

            html.H2(children='Muutos 3kk ajalla', style=dict(paddingTop='1em')),

            html.Div(children=figures.change_in_period_time_frame()),

            dbc.Row(children=[
                dbc.Col(children=[
                    dash_table.DataTable(
                        id='table-change-in-period',
                        style_cell=dict(textAlign='left'),
                        css=[{"selector": ".row", "rule": "margin: 0; display: block"}],
                        style_header=dict(
                            backgroundColor='black',
                            color='white',
                            fontWeight='bold',
                        ),
                        style_data_conditional=[
                            {
                                'if': dict(
                                    filter_query='{Data (muutos-%)} > 0',
                                    column_id='Data (muutos-%)'
                                ),
                                'backgroundColor': '#00cc96',  # green
                            },
                            {
                                'if': dict(
                                    filter_query='{Data (muutos-%)} < 0',
                                    column_id='Data (muutos-%)'
                                ),
                                'backgroundColor': '#ef553b'  # red
                            },
                            {
                                'if': dict(
                                    filter_query='{Kyselyt (muutos-%)} > 0',
                                    column_id='Kyselyt (muutos-%)'
                                ),
                                'backgroundColor': '#00cc96',  # green
                            },
                            {
                                'if': dict(
                                    filter_query='{Kyselyt (muutos-%)} < 0',
                                    column_id='Kyselyt (muutos-%)'
                                ),
                                'backgroundColor': '#ef553b'  # red
                            },
                        ],
                        **figures.change_in_period(),
                    ),
                ], width=7)
            ]),

            html.H2(children="Käyttäjätiedot", style=dict(paddingTop="1em")),

            dbc.Row(children=[
                dbc.Col(children=[
                    dcc.Dropdown(
                        id='input-table-top-10-users-date',
                        options=top_10_users_date_options,
                        value=top_10_users_date_default_value,
                    ),
                ], width=3),
                dbc.Col(children=[
                    dcc.Dropdown(
                        id='input-table-top-10-users-liikennemuoto',
                        options=liikennemuoto_options,
                        value=liikennemuoto_default_value,
                    ),
                ], width=3)
            ], style=dict(marginBottom="3em")),

            dbc.Row(children=[
                dbc.Col(children=[
                    html.H4(children="Kyselyt"),
                ], width=6, align='center'),
                dbc.Col(children=[
                    html.H4(children="Data"),
                ], width=6, align='center'),
            ]),

            dbc.Row(children=[
                dbc.Col(children=[
                    dash_table.DataTable(
                        id='output-table-top-10-users',
                        style_cell=dict(textAlign='left'),
                        css=[{"selector": ".row", "rule": "margin: 0; display: block"}],
                        style_header=dict(
                            backgroundColor='black',
                            color='white',
                            fontWeight='bold',
                        ),
                        data=[]
                    )
                ], width=6, align='center'),
                dbc.Col(children=[
                    dash_table.DataTable(
                        id='output-table-top-10-users-by-bytes',
                        style_cell=dict(textAlign='left'),
                        css=[{"selector": ".row", "rule": "margin: 0; display: block"}],
                        style_header=dict(
                            backgroundColor='black',
                            color='white',
                            fontWeight='bold',
                        ),
                        data=[]
                    )
                ], width=6, align='top'),
            ]),

            dbc.Row(children=[
                dbc.Col(children=[
                    dcc.Graph(id='output-graph-pie-identified-users')
                ], width=6, align='center'),
            ]),

            html.H2(children="Year-on-year tiedot", style=dict(paddingTop="1em")),

            dbc.Row(children=[
                dbc.Col(children=[
                    dcc.Dropdown(
                        id='input-year-on-year-dropdown-liikennemuoto',
                        options=liikennemuoto_options,
                        value=liikennemuoto_default_value,
                    ),
                ], width=3)
            ]),

            dbc.Row(children=[
                dbc.Col(children=[dcc.Graph(id='output-graph-requests-year-on-year')], width=6),
                dbc.Col(children=[dcc.Graph(id='output-graph-data-year-on-year')], width=6)
            ]),

            html.H2(children="Pitkän aikavälin trendit", style=dict(paddingTop="1em")),

            dbc.Row(children=[
                dbc.Col(children=[
                    dcc.DatePickerRange(
                        id='input-all-time-date-picker-range',
                        min_date_allowed=df['from'].min(),
                        max_date_allowed=df['from'].max(),
                        initial_visible_month=df['from'].min(),
                        display_format='DD.MM.YYYY',
                        start_date=df['from'].min(),
                        end_date=df['from'].max(),
                    )
                ])
            ]),

            dbc.Row(children=[
                dbc.Col(children=[dcc.Graph(id='output-graph-all-time-requests-with-trend')], width=6),
                dbc.Col(children=[dcc.Graph(id='output-graph-all-time-data-with-trend')], width=6)
            ]),

            dbc.Row(children=[
                dbc.Col([html.Div(id='output-all-time-requests-agr')], width=6),
                dbc.Col([html.Div(id='output-all-time-data-agr')], width=6)
            ]),

            html.Div(style=dict(marginBottom='10em')),

        ], style=dict(marginLeft="10em", marginRight="10em"))
    ])

    logger.info(f'method=dashboard.create_layout took={time.time()-start}')


def init_dashboard(server, **kwargs):
    start = time.time()
    dash_app = dash.Dash(server=server, external_stylesheets=[dbc.themes.BOOTSTRAP], **kwargs)

    logger = server.logger

    df = data.create_dataframe(logger)
    figures = fig.Figures(df, logger)

    init_callbacks(dash_app, df, figures, logger)
    create_layout(dash_app, df, figures, logger)

    logger.info(f'method=dashboard.init_dashboard took={time.time()-start}')

    return dash_app.server
