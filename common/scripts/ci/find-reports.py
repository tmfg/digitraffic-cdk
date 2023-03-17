import os
import os.path
import json
from glob import glob
from html.parser import HTMLParser


class ReportParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.data = ""
        self.state = ""

    def handle_starttag(self, tag, attrs):
        if self.state == "stop":
            return
        if tag == "div":
            for attr_name, attr_value in attrs:
                if attr_name == "id" and attr_value == "overview":
                    self.state = "div-id-overview"
        if self.state == "div-id-overview" and tag == "span":
            self.state = "div-id-overview-span"

    def handle_data(self, data):
        if self.state == "div-id-overview-span":
            self.data = data
            self.state = "stop"


ref = os.environ["GITHUB_REF_NAME"]
reports = [_ for _ in glob("*/*/report.html") if "node_modules" not in _]
reports_created = []

for report_path in reports:
    parser = ReportParser()
    parser.feed(open(report_path).read())
    report_destination = os.path.join(ref, report_path)
    reports_created.append([report_path, report_destination, parser.data])
    os.makedirs(os.path.dirname(report_destination))
    print(f"moving file from: {report_path} to {report_destination}")
    os.rename(report_path, report_destination)

open(os.path.join(ref, "reports.json"), "a").write(json.dumps(reports_created))
