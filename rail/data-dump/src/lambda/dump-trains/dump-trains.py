import json
import datetime
import os

import boto3
import zipfile
import shutil
import requests
from aws_lambda_powertools import Logger

logger = Logger(service="data-dump-trains")

HEADERS = {'Digitraffic-User': 'internal-digitraffic-data-dump'}

def get_month_range(year: int, month: int) -> tuple[datetime.date, datetime.date]:
    """Return (first_day_of_month, first_day_of_next_month)."""
    start_date = datetime.date(year, month, 1)
    # Calculate first day of next month
    if month == 12:
        end_date = datetime.date(year + 1, 1, 1)
    else:
        end_date = datetime.date(year, month + 1, 1)
    return start_date, end_date

@logger.inject_lambda_context
def lambda_handler(event, context):
    logger.info('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    # Allow manual override via event: {"month": "2026-02"}
    if event and 'month' in event:
        year, month = map(int, event['month'].split('-'))
        start_date, end_date = get_month_range(year, month)
        logger.info('Using month from event (manual run)', month=event['month'])
    else:
        # Default: previous month
        today = datetime.date.today()
        first_of_this_month = today.replace(day=1)
        last_month = (first_of_this_month - datetime.timedelta(days=1))
        start_date, end_date = get_month_range(last_month.year, last_month.month)
        logger.info('Using default month (previous month)', month=f"{start_date.year}-{start_date.month:02d}")

    zipPath = createZipFile(start_date, end_date)
    uploadToS3(zipPath, start_date)

    logger.info('Train archiving complete')

    return {
        'statusCode': 200
    }

def uploadToS3(zipPath, month_start: datetime.date):
    s3_filename = f'digitraffic-rata-trains-{month_start}.zip'

    logger.info('Uploading to S3', s3_file_name=s3_filename)
    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']
    s3.upload_file(zipPath, bucket_name, s3_filename)

def createZipFile(start_date: datetime.date, end_date: datetime.date):
    delta = datetime.timedelta(days=1)

    zipPath = f'/tmp/digitraffic-rata-trains-{start_date}.zip'

    logger.info('Starting train archiving', start_date=str(start_date), end_date=str(end_date))

    day_count = 0
    with zipfile.ZipFile(zipPath, 'w', zipfile.ZIP_DEFLATED) as zipped_f:

        while start_date < end_date:
            url = f'https://rata.digitraffic.fi/api/v1/trains/{start_date}'
            filename = f'{start_date}_trains.json'

            logger.info('Fetching trains', url=url, file_name=filename)

            trains = requests.get(url, headers=HEADERS)
            trains.raise_for_status()
            logger.info('Trains response', status=trains.status_code, length=len(trains.content), date=str(start_date))

            zipped_f.writestr(filename, json.dumps(trains.json()))
            day_count += 1

            start_date += delta

    logger.info('Zipping complete', zip_path=zipPath, days_processed=day_count)

    return zipPath
