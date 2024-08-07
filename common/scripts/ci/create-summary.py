import json
import os
import os.path
import sys

GITHUB_PAGES = os.environ["GITHUB_PAGES"]
GITHUB_REF_NAME = os.environ["GITHUB_REF_NAME"]
GITHUB_STEP_SUMMARY = os.environ["GITHUB_STEP_SUMMARY"]


def get_project(x):
    return "/".join(x.split()[-1:])


def get_status_light(eslint_report_status):
    if eslint_report_status == "0 problems":
        return "🟢"
    elif "0 errors" in eslint_report_status:
        return "🟠"

    return "🔴"


def create_summary(report_path, report_destination, status_line):
    return f"{get_status_light(status_line)} ESLint report for [{get_project(report_path)}]({GITHUB_PAGES}{report_destination}) ({status_line})"


reports_file = os.path.join("reports", GITHUB_REF_NAME, "reports.json")
reports_created = json.loads(open(reports_file).read())

summary = [create_summary(*i) for i in reports_created]

open(GITHUB_STEP_SUMMARY, "a").write("\n".join(summary))

count_errors = 0

for report_path, _, status_line in reports_created:
    if "0 problems" in status_line or "0 errors" in status_line:
        print(f"No error in {report_path}. Continue")
        continue

    print(f"Found error in {report_path}.")
    count_errors = count_errors + 1

# fail github action run if errors found
sys.exit(count_errors)
