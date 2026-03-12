import logging
import json
import os
import boto3
import requests
from datetime import date,timedelta
import zipfile
import shutil

def lambda_handler(event, context):
    logging.warn('Cleaning tmp')
    shutil.rmtree('/tmp', ignore_errors=True)
    os.makedirs('/tmp', exist_ok=True)

    dateToProcess = date.today() -  timedelta(2)
    logging.warn('Starting GPS archiving for day ' + str(dateToProcess))

    writeTrainLocationsToFile(dateToProcess)

    logging.warn('GPS archiving complete')

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

def getTrainNumbers(departureDate):
    r = requests.get('https://rata.digitraffic.fi/api/v1/trains/' + str(departureDate))
    json = r.json()

    trainNumbers = []

    for train in json:
        trainNumbers.append(train['trainNumber']);

    return trainNumbers

def getTrainLocations(departureDate,trainNumbers):
    trainLocations = []
    for trainNumber in trainNumbers:
        trainRequest = requests.get('https://rata.digitraffic.fi/api/v1/train-locations/' + str(departureDate) + '/' + str(trainNumber))
        trainLocations.extend(trainRequest.json())

    return trainLocations

def writeTrainLocationsToFile(departureDate):
    trainNumbers = getTrainNumbers(departureDate)
    trainLocations = getTrainLocations(departureDate,trainNumbers)

    fileName = 'train-locations-' + str(departureDate) + '.json'
    filePath = '/tmp/' + fileName

    file = open(filePath,'w')
    file.write(json.dumps(trainLocations))
    file.close()

    s3_fileName = 'digitraffic-rata-train-locations-' + str(departureDate) + '.zip'
    s3_filePath = '/tmp/' + s3_fileName

    with zipfile.ZipFile(s3_filePath, 'w', zipfile.ZIP_DEFLATED) as zip:
        zip.write(filePath, fileName)

    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']

    s3.upload_file(s3_filePath, bucket_name, s3_fileName)

