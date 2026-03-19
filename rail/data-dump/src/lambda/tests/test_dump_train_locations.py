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
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "dump-train-locations"))
dump_train_locations = importlib.import_module("dump-train-locations")

BUCKET_NAME = "test-bucket"
REGION = "eu-west-1"
API_BASE = "https://rata.digitraffic.fi/api/v1"

MOCK_TRAINS = [{"trainNumber": 101}, {"trainNumber": 102}]
MOCK_LOCATIONS_101 = [{"trainNumber": 101, "location": {"x": 1}}]
MOCK_LOCATIONS_102 = [{"trainNumber": 102, "location": {"x": 2}}]


class TestDumpTrainLocations(unittest.TestCase):

    def test_eventbridge_trigger_uses_two_days_ago(self):
        """
        Given: Today is 2026-03-15 (2 days ago is 2026-03-13),
               EventBridge triggers with empty event {},
               mock trains API returns 2 trains,
               mock locations API returns 1 location per train,
               and S3 bucket exists
        When:  lambda_handler is invoked with {} (EventBridge scheduled trigger)
        Then:  3 API calls are made (1 trains + 2 locations),
               one zip is uploaded to S3 with key 'digitraffic-rata-train-locations-2026-03-13.zip'
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {}  # EventBridge scheduled trigger sends empty event
        pinned_today = date(2026, 3, 15)  # 2 days ago = 2026-03-13

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(f"{API_BASE}/trains/2026-03-13", json=MOCK_TRAINS)
                m.get(f"{API_BASE}/train-locations/2026-03-13/101", json=MOCK_LOCATIONS_101)
                m.get(f"{API_BASE}/train-locations/2026-03-13/102", json=MOCK_LOCATIONS_102)

                with patch.object(dump_train_locations, "date") as mock_date:
                    mock_date.today.return_value = pinned_today
                    mock_date.fromisoformat = date.fromisoformat
                    mock_date.side_effect = lambda *args, **kwargs: date(*args, **kwargs)

                    with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                        # When
                        result = dump_train_locations.lambda_handler(event, context)

            self.assertEqual(result["statusCode"], 200)
            self.assertEqual(m.call_count, 3)

            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            key = objects["Contents"][0]["Key"]
            self.assertEqual(key, "digitraffic-rata-train-locations-2026-03-13.zip")

    def test_manual_trigger_with_date_parameter(self):
        """
        Given: User manually triggers with {"date": "2025-12-31"},
               mock trains API returns 2 trains,
               mock locations API returns 1 location per train,
               and S3 bucket exists
        When:  lambda_handler is invoked with {"date": "2025-12-31"}
        Then:  3 API calls are made (1 trains + 2 locations),
               one zip is uploaded to S3 with key 'digitraffic-rata-train-locations-2025-12-31.zip',
               zip contains 'train-locations-2025-12-31.json',
               and JSON file contains array with exactly 2 location objects
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {"date": "2025-12-31"}

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(f"{API_BASE}/trains/2025-12-31", json=MOCK_TRAINS)
                m.get(f"{API_BASE}/train-locations/2025-12-31/101", json=MOCK_LOCATIONS_101)
                m.get(f"{API_BASE}/train-locations/2025-12-31/102", json=MOCK_LOCATIONS_102)

                with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                    # When
                    result = dump_train_locations.lambda_handler(event, context)

            self.assertEqual(result["statusCode"], 200)
            self.assertEqual(m.call_count, 3)

            for req in m.request_history:
                self.assertEqual(req.headers["Digitraffic-User"], "internal-digitraffic-data-dump")

            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects["KeyCount"], 1)

            key = objects["Contents"][0]["Key"]
            self.assertEqual(key, "digitraffic-rata-train-locations-2025-12-31.zip")

            response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            zip_bytes = response["Body"].read()

            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                filenames = zf.namelist()
                self.assertEqual(len(filenames), 1)
                self.assertEqual(filenames[0], "train-locations-2025-12-31.json")

                with zf.open(filenames[0]) as f:
                    data = json.load(f)
                    self.assertIsInstance(data, list)
                    self.assertEqual(len(data), 2)
                    self.assertEqual(data[0], MOCK_LOCATIONS_101[0])
                    self.assertEqual(data[1], MOCK_LOCATIONS_102[0])

    def test_fails_on_location_fetch_error(self):
        """
        Given: Event specifies date "2026-03-13",
               mock trains API returns 2 trains,
               mock locations API returns 404 for train 101
        When:  lambda_handler is invoked
        Then:  Lambda raises HTTPError (we don't want incomplete data in dumps)
        """
        # Given
        context = MagicMock(spec=LambdaContext)
        event = {"date": "2026-03-13"}

        with mock_aws():
            s3 = boto3.client("s3", region_name=REGION)
            s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )

            with rm.Mocker() as m:
                m.get(f"{API_BASE}/trains/2026-03-13", json=MOCK_TRAINS)
                m.get(f"{API_BASE}/train-locations/2026-03-13/101", status_code=404, text="")
                m.get(f"{API_BASE}/train-locations/2026-03-13/102", json=MOCK_LOCATIONS_102)

                with patch.dict(os.environ, {"DUMP_BUCKET_NAME": BUCKET_NAME}):
                    # When / Then
                    with self.assertRaises(requests.HTTPError):
                        dump_train_locations.lambda_handler(event, context)

            # Verify nothing was uploaded to S3
            objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
            self.assertEqual(objects.get("KeyCount", 0), 0)


if __name__ == "__main__":
    unittest.main()
