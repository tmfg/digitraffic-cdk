import json
import logging
import datetime
import os

import boto3
import zipfile
import shutil
import requests

def lambda_handler(event, context):
    logging.warn('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    zipPath = createZipFile()
    uploadToS3(zipPath)

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!2')
    }

def uploadToS3(zipPath):
    delta = datetime.timedelta(days=1)
    today = datetime.date.today()
    first = today.replace(day=1)
    lastMonth = (first - delta).replace(day=1)
    s3_filename = 'digitraffic-rata-trains-' + str(lastMonth) + '.zip'
    s3_localFileName = zipPath

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

    zipPath = '/tmp/digitraffic-rata-trains-' + str(first) + '.zip'

    with zipfile.ZipFile(zipPath, 'w', zipfile.ZIP_DEFLATED) as zipped_f:

        while start_date < end_date:
            # logging.warn(start_date.strftime("%Y-%m-%d"))

            url = 'https://rata.digitraffic.fi/api/v1/trains/' + str(start_date)
            filename = str(start_date) + '_trains.json'

            logging.warn(url + ' -> ' + filename)

            trains = requests.get(url)

            zipped_f.writestr(filename, json.dumps(trains.json()))

            start_date += delta

    return zipPath
