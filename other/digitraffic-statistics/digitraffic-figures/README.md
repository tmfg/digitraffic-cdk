# digitraffic-figures

This is a Python application for visualizing Digitraffic API user statistics.

## Running the application locally

The project uses `make`. Command definitions are located in [./Makefile](./Makefile)

1. `make install`
    Builds and starts the database, runs Flyway and creates a Python venv and installs requirements for the application
2. `make insert_test_data` Insert test data for convenience, not a required step if you have other data or have already done this
3. `make dev` Runs the application

The database user etc. is configured in the `.env` file. Using the default configuration, you can connect to `jdbc:mysql://localhost:33306/dtfigures` with the credentials `dtfigures:dtfigures` once the database container is running.

## Importing data to the database

Put your `.csv` files in the directory `dbfigures/data` and run `make csv_to_db`

    
