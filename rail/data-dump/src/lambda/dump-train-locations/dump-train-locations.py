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

def getDictionaryValueIfKeyExists(dictionaryKey, oldJsonRow):
  if dictionaryKey in oldJsonRow.keys():
    return oldJsonRow[dictionaryKey]
  else:
    return None

def checkThatJsonHasValuesRequiredByGeoJson(oldJsonRow):
  if 'location' in oldJsonRow.keys():
    if not 'type' in oldJsonRow['location'].keys():
      return False
    if not 'coordinates' in oldJsonRow['location'].keys():
      return False
    if not len(oldJsonRow['location']['coordinates']) == 2:
      return False

    return True
  else:
    return False

def createGeoJsonFeaturePart(oldJsonRow):
    return {
        "type": "Feature",
        "geometry":
            {
                "type": oldJsonRow["location"]["type"],
                "coordinates": [oldJsonRow["location"]["coordinates"][0],
                                oldJsonRow["location"]["coordinates"][1]]
            },
        "properties":
        {
            "accuracy": getDictionaryValueIfKeyExists("accuracy", oldJsonRow),
            "speed": getDictionaryValueIfKeyExists("speed", oldJsonRow),
            "trainNumber": getDictionaryValueIfKeyExists("trainNumber", oldJsonRow),
            "departureDate": getDictionaryValueIfKeyExists("departureDate", oldJsonRow),
            "timestamp": getDictionaryValueIfKeyExists("timestamp", oldJsonRow),
        }
    }

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

    if writeTrainLocationsToFile(dateToProcess):
      logger.info('GPS archiving complete')

      return {
          'statusCode': 200
      }
    else:
      raise ValueError('A train location record is missing required GeoJSON values')

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

    fileNameForGeoJson = f'train-locations-{departureDate}-geojson.json'
    filePathForGeoJson = f'/tmp/{fileNameForGeoJson}'

    # Write locations incrementally — stream each train's locations directly to files
    # instead of accumulating millions of records in memory
    with open(filePath, 'w') as f, open(filePathForGeoJson, 'w') as fileForGeoJson:
        f.write('[')

        fileForGeoJson.write('{')
        fileForGeoJson.write('"type": "FeatureCollection",')
        fileForGeoJson.write('"features": [')

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
                    fileForGeoJson.write(',')
                if checkThatJsonHasValuesRequiredByGeoJson(loc):
                    locationGeoJson = createGeoJsonFeaturePart(loc)
                    json.dump(locationGeoJson, fileForGeoJson)
                else:
                    return False

                json.dump(loc, f)
                first = False
                recordCount += 1
        f.write(']')
        fileForGeoJson.write(']')
        fileForGeoJson.write('}')

    logger.info('Wrote location records', count=recordCount, file_path=filePath)

    s3_fileName = f'digitraffic-rata-train-locations-{departureDate}.zip'
    s3_filePath = f'/tmp/{s3_fileName}'

    logger.info('Zipping file', file_name=fileName)
    with zipfile.ZipFile(s3_filePath, 'w', zipfile.ZIP_DEFLATED) as zip:
        zip.write(filePath, fileName)

    s3_fileNameForGeoJson = f'digitraffic-rata-train-locations-{departureDate}.zip'
    s3_filePathForGeoJson = f'/tmp/{s3_fileNameForGeoJson}'

    with zipfile.ZipFile(s3_filePathForGeoJson, 'w', zipfile.ZIP_DEFLATED) as zipForGeoJson:
        zipForGeoJson.write(filePathForGeoJson, fileNameForGeoJson)

    # Remove uncompressed file to free /tmp space before upload
    os.remove(filePath)
    os.remove(filePathForGeoJson)

    logger.info('Uploading to S3', s3_file_name=s3_fileName)
    s3 = boto3.client('s3')
    bucket_name = os.environ['DUMP_BUCKET_NAME']

    s3.upload_file(s3_filePath, bucket_name, s3_fileName)
    s3.upload_file(s3_filePathForGeoJson, bucket_name, s3_fileNameForGeoJson)

    return True
