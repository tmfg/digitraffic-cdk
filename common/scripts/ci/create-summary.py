import os
import os.path
import json


def get_project(x):
    return "/".join(x.split()[-1:])


def get_status_light(eslint_report_status):
    if eslint_report_status == "0 problems":
        return "🟢"
    elif "0 errors" in eslint_report_status:
        return "🟠"

    return "🔴"


def create_summary(org, repo, report_path, report_destination, status_line):
    return f"{get_status_light(status_line)} ESLint report for [{get_project(report_path)}](https://{org}.github.io/{repo}/{report_destination}) ({status_line})"


reports_file = os.path.join(os.environ["GITHUB_REF_NAME"], "reports.json")
reports_created = json.loads(open(reports_file).read())
(org, repo) = os.environ["GITHUB_REPOSITORY"].split("/")


summary = [create_summary(org, repo, *i) for i in reports_created]

open(os.environ["GITHUB_STEP_SUMMARY"], "a").write("\n".join(summary))
