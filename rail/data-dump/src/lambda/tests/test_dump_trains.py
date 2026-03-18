import importlib
import io
import json
import os
import sys
import unittest
import zipfile
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import boto3
import requests
import requests_mock as rm
from aws_lambda_powertools.utilities.typing import LambdaContext
from moto import mock_aws

# Add the Lambda directory to sys.path so we can import the hyphenated module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "dump-trains"))
dump_trains = importlib.import_module("dump-trains")

BUCKET_NAME = "test-bucket"
REGION = "eu-west-1"

MOCK_RESPONSE = [{"trainNumber": 1, "departureDate": "2026-02-01"}]


class TestDumpTrains(unittest.TestCase):

    def test_archives_previous_month_trains(self):
        """
        Given: Today is 2026-03-15 (previous month is February with 28 days),
               mock API returns train data for each day,
               and S3 bucket exists
        When:  lambda_handler is invoked
        Then:  28 API calls are made (one per day of February),
               one zip is uploaded to S3 with key 'digitraffic-rata-trains-2026-02-01.zip',
               zip contains 28 JSON files named '{date}_trains.json',
               and each JSON file contains the mocked response data
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        pinned_today = date(2026, 3, 15)

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(rm.ANY, json=MOCK_RESPONSE)

                with patch.object(dump_trains, "datetime") as mock_dt:
                    mock_dt.date.today.return_value = pinned_today
                    mock_dt.timedelta = timedelta

                    with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                        # When
                        result = dump_trains.lambda_handler({}, context)

            self.assertEqual(result["statusCode"], 200)
            self.assertEqual(m.call_count, 28)

            # Verify API URLs target the correct endpoint and date range
            self.assertEqual(
                m.request_history[0].url,
                "https://rata.digitraffic.fi/api/v1/trains/2026-02-01",
            )
            self.assertEqual(
                m.request_history[-1].url,
                "https://rata.digitraffic.fi/api/v1/trains/2026-02-28",
            )

            for req in m.request_history:
                self.assertEqual(req.headers["Digitraffic-User"], "internal-digitraffic-data-dump")

            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects["KeyCount"], 1)

            key = objects["Contents"][0]["Key"]
            self.assertEqual(key, "digitraffic-rata-trains-2026-02-01.zip")

            response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            zip_bytes = response["Body"].read()

            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                filenames = sorted(zf.namelist())
                self.assertEqual(len(filenames), 28)
                self.assertEqual(filenames[0], "2026-02-01_trains.json")
                self.assertEqual(filenames[-1], "2026-02-28_trains.json")

                for name in filenames:
                    with zf.open(name) as f:
                        data = json.load(f)
                        self.assertIsInstance(data, list)
                        self.assertEqual(data, MOCK_RESPONSE)

    def test_fails_on_api_error(self):
        """
        Given: Today is 2026-03-15,
               mock API returns 500 for the first day
        When:  lambda_handler is invoked
        Then:  Lambda raises HTTPError (we don't want incomplete data in dumps)
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        pinned_today = date(2026, 3, 15)

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(
                    "https://rata.digitraffic.fi/api/v1/trains/2026-02-01",
                    status_code=500,
                    text="Internal Server Error",
                )

                with patch.object(dump_trains, "datetime") as mock_dt:
                    mock_dt.date.today.return_value = pinned_today
                    mock_dt.timedelta = timedelta

                    with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                        # When / Then
                        with self.assertRaises(requests.HTTPError):
                            dump_trains.lambda_handler({}, context)

            # Verify nothing was uploaded to S3
            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects.get("KeyCount", 0), 0)


if __name__ == "__main__":
    unittest.main()
