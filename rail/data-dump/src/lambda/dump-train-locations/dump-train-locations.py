import logging
import json
import os
import boto3
import requests
from datetime import date,timedelta
import zipfile
import shutil

HEADERS = {'Digitraffic-User': 'internal-digitraffic-data-dump'}

def lambda_handler(event, context):
    logging.warn('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    dateToProcess = date.today() -  timedelta(2)
    logging.warn(f'Starting GPS archiving for day {dateToProcess}')

    writeTrainLocationsToFile(dateToProcess)

    logging.warn('GPS archiving complete')

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

def getTrainNumbers(departureDate):
    logging.warn(f'Fetching train numbers for {departureDate}')
    r = requests.get(f'https://rata.digitraffic.fi/api/v1/trains/{departureDate}', headers=HEADERS)
    logging.warn(f'Trains response: status={r.status_code}, length={len(r.content)}')
    trains = r.json()

    trainNumbers = [train['trainNumber'] for train in trains]

    logging.warn(f'Found {len(trainNumbers)} trains')
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
                logging.warn(f'Fetching train locations: {i + 1}/{total} ({recordCount} records so far)')
            trainRequest = requests.get(f'https://rata.digitraffic.fi/api/v1/train-locations/{departureDate}/{trainNumber}', headers=HEADERS)
            if trainRequest.ok and trainRequest.text:
                locations = trainRequest.json()
                for loc in locations:
                    if not first:
                        f.write(',')
                    json.dump(loc, f)
                    first = False
                    recordCount += 1
            else:
                logging.warn(f'Train {trainNumber}: status={trainRequest.status_code}, body={trainRequest.text[:100] if trainRequest.text else "empty"}')
        f.write(']')

    logging.warn(f'Wrote {recordCount} location records to {filePath}')

    s3_fileName = f'digitraffic-rata-train-locations-{departureDate}.zip'
    s3_filePath = f'/tmp/{s3_fileName}'

    logging.warn(f'Zipping {fileName}')
    with zipfile.ZipFile(s3_filePath, 'w', zipfile.ZIP_DEFLATED) as zip:
        zip.write(filePath, fileName)

    # Remove uncompressed file to free /tmp space before upload
    os.remove(filePath)

    logging.warn(f'Uploading {s3_fileName} to S3')
    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']

    s3.upload_file(s3_filePath, bucket_name, s3_fileName)

