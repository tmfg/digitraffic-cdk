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

    def test_eventbridge_trigger_uses_previous_month(self):
        """
        Given: Today is 2026-03-15 (previous month is February 2026 with 28 days),
               EventBridge triggers with empty event {},
               mock API returns train data for each day,
               and S3 bucket exists
        When:  lambda_handler is invoked with {} (EventBridge scheduled trigger)
        Then:  28 API calls are made (one per day of February),
               one zip is uploaded to S3 with key 'digitraffic-rata-trains-2026-02-01.zip'
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {}  # EventBridge scheduled trigger sends empty event
        pinned_today = date(2026, 3, 15)

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(rm.ANY, json=MOCK_RESPONSE)

                with patch.object(dump_trains.datetime, "date") as mock_date:
                    mock_date.today.return_value = pinned_today
                    mock_date.side_effect = lambda *args, **kwargs: date(*args, **kwargs)

                    with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                        # When
                        result = dump_trains.lambda_handler(event, context)

            self.assertEqual(result["statusCode"], 200)
            self.assertEqual(m.call_count, 28)  # February 2026 has 28 days

            # Verify API URLs target the correct endpoint and date range
            self.assertEqual(
                m.request_history[0].url,
                "https://rata.digitraffic.fi/api/v1/trains/2026-02-01",
            )
            self.assertEqual(
                m.request_history[-1].url,
                "https://rata.digitraffic.fi/api/v1/trains/2026-02-28",
            )

            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            key = objects["Contents"][0]["Key"]
            self.assertEqual(key, "digitraffic-rata-trains-2026-02-01.zip")

    def test_manual_trigger_with_month_parameter(self):
        """
        Given: User manually triggers with {"month": "2025-12"} (December with 31 days),
               mock API returns train data for each day,
               and S3 bucket exists
        When:  lambda_handler is invoked with {"month": "2025-12"}
        Then:  31 API calls are made (one per day of December),
               one zip is uploaded to S3 with key 'digitraffic-rata-trains-2025-12-01.zip',
               zip contains 31 JSON files named '{date}_trains.json'
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {"month": "2025-12"}

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(rm.ANY, json=MOCK_RESPONSE)

                with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                    # When
                    result = dump_trains.lambda_handler(event, context)

            self.assertEqual(result["statusCode"], 200)
            self.assertEqual(m.call_count, 31)  # December has 31 days

            # Verify API URLs target the correct endpoint and date range
            self.assertEqual(
                m.request_history[0].url,
                "https://rata.digitraffic.fi/api/v1/trains/2025-12-01",
            )
            self.assertEqual(
                m.request_history[-1].url,
                "https://rata.digitraffic.fi/api/v1/trains/2025-12-31",
            )

            for req in m.request_history:
                self.assertEqual(req.headers["Digitraffic-User"], "internal-digitraffic-data-dump")

            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects["KeyCount"], 1)

            key = objects["Contents"][0]["Key"]
            self.assertEqual(key, "digitraffic-rata-trains-2025-12-01.zip")

            response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            zip_bytes = response["Body"].read()

            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                filenames = sorted(zf.namelist())
                self.assertEqual(len(filenames), 31)
                self.assertEqual(filenames[0], "2025-12-01_trains.json")
                self.assertEqual(filenames[-1], "2025-12-31_trains.json")

                for name in filenames:
                    with zf.open(name) as f:
                        data = json.load(f)
                        self.assertIsInstance(data, list)
                        self.assertEqual(data, MOCK_RESPONSE)

    def test_fails_on_api_error(self):
        """
        Given: Event specifies month "2026-02",
               mock API returns 500 for the first day
        When:  lambda_handler is invoked
        Then:  Lambda raises HTTPError (we don't want incomplete data in dumps)
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {"month": "2026-02"}

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

                with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                    # When / Then
                    with self.assertRaises(requests.HTTPError):
                        dump_trains.lambda_handler(event, context)

            # Verify nothing was uploaded to S3
            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects.get("KeyCount", 0), 0)


if __name__ == "__main__":
    unittest.main()
