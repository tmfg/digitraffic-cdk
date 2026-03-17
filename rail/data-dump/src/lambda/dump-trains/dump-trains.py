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

@logger.inject_lambda_context
def lambda_handler(event, context):
    logger.info('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    zipPath = createZipFile()
    uploadToS3(zipPath)

    logger.info('Train archiving complete')

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!2')
    }

def uploadToS3(zipPath):
    delta = datetime.timedelta(days=1)
    today = datetime.date.today()
    first = today.replace(day=1)
    lastMonth = (first - delta).replace(day=1)
    s3_filename = f'digitraffic-rata-trains-{lastMonth}.zip'
    s3_localFileName = zipPath

    logger.info('Uploading to S3', s3_file_name=s3_filename)
    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']
    s3.upload_file(s3_localFileName, bucket_name, s3_filename)

def createZipFile():
    delta = datetime.timedelta(days=1)
    today = datetime.date.today()
    first = today.replace(day=1)
    lastMonth = (first - delta).replace(day=1)

    start_date = lastMonth
    end_date = first

    zipPath = f'/tmp/digitraffic-rata-trains-{first}.zip'

    logger.info('Starting train archiving', start_date=str(start_date), end_date=str(end_date))

    day_count = 0
    with zipfile.ZipFile(zipPath, 'w', zipfile.ZIP_DEFLATED) as zipped_f:

        while start_date < end_date:
            url = f'https://rata.digitraffic.fi/api/v1/trains/{start_date}'
            filename = f'{start_date}_trains.json'

            logger.info('Fetching trains', url=url, file_name=filename)

            trains = requests.get(url, headers=HEADERS)
            logger.info('Trains response', status=trains.status_code, length=len(trains.content), date=str(start_date))

            zipped_f.writestr(filename, json.dumps(trains.json()))
            day_count += 1

            start_date += delta

    logger.info('Zipping complete', zip_path=zipPath, days_processed=day_count)

    return zipPath
