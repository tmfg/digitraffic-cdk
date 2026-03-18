import json
import os
import boto3
import requests
from datetime import date,timedelta
import zipfile
import shutil
from aws_lambda_powertools import Logger

logger = Logger(service="data-dump-train-locations")

HEADERS = {'Digitraffic-User': 'internal-digitraffic-data-dump'}

@logger.inject_lambda_context
def lambda_handler(event, context):
    logger.info('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    # Allow manual override via event: {"date": "2026-03-15"}
    if event and 'date' in event:
        dateToProcess = date.fromisoformat(event['date'])
        logger.info('Using date from event (manual run)', date=str(dateToProcess))
    else:
        dateToProcess = date.today() - timedelta(2)
        logger.info('Using default date (2 days ago)', date=str(dateToProcess))

    writeTrainLocationsToFile(dateToProcess)

    logger.info('GPS archiving complete')

    return {
        'statusCode': 200
    }

def getTrainNumbers(departureDate):
    logger.info('Fetching train numbers', departure_date=str(departureDate))
    r = requests.get(f'https://rata.digitraffic.fi/api/v1/trains/{departureDate}', headers=HEADERS)
    logger.info('Trains response', status=r.status_code, length=len(r.content))
    trains = r.json()

    trainNumbers = [train['trainNumber'] for train in trains]

    logger.info('Found trains', count=len(trainNumbers))
    return trainNumbers

def writeTrainLocationsToFile(departureDate):
    trainNumbers = getTrainNumbers(departureDate)
    total = len(trainNumbers)
    recordCount = 0

    fileName = f'train-locations-{departureDate}.json'
    filePath = f'/tmp/{fileName}'

    # Write locations incrementally — stream each train's locations directly to file
    # instead of accumulating millions of records in memory
    with open(filePath, 'w') as f:
        f.write('[')
        first = True
        for i, trainNumber in enumerate(trainNumbers):
            if (i + 1) % 50 == 0 or i == 0:
                logger.info('Fetching train locations', progress=i + 1, total=total, records_so_far=recordCount)
            trainRequest = requests.get(f'https://rata.digitraffic.fi/api/v1/train-locations/{departureDate}/{trainNumber}', headers=HEADERS)
            trainRequest.raise_for_status()
            locations = trainRequest.json()
            for loc in locations:
                if not first:
                    f.write(',')
                json.dump(loc, f)
                first = False
                recordCount += 1
        f.write(']')

    logger.info('Wrote location records', count=recordCount, file_path=filePath)

    s3_fileName = f'digitraffic-rata-train-locations-{departureDate}.zip'
    s3_filePath = f'/tmp/{s3_fileName}'

    logger.info('Zipping file', file_name=fileName)
    with zipfile.ZipFile(s3_filePath, 'w', zipfile.ZIP_DEFLATED) as zip:
        zip.write(filePath, fileName)

    # Remove uncompressed file to free /tmp space before upload
    os.remove(filePath)

    logger.info('Uploading to S3', s3_file_name=s3_fileName)
    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']

    s3.upload_file(s3_filePath, bucket_name, s3_fileName)

