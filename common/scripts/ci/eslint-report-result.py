import os
import sys
import os.path
import json

reports_file = os.path.join(os.environ["GITHUB_REF_NAME"], "reports.json")
reports_created = json.loads(open(reports_file).read())
count_errors = 0

for report_path, _, status_line in reports_created:
    if "0 errors" in status_line:
        print(f"No error in {report_path}. Continue")
        continue

    print(f"Found error in {report_path}.")
    count_errors = count_errors + 1

sys.exit(count_errors)
