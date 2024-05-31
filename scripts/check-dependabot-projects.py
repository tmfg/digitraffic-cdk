# Check that all directories listed for "projects" in rush.json are listed as separate projects in dependabot.yml.

import yaml
import json
import re
import sys

with open("rush.json") as rush_json:
    file_content = rush_json.read()

json_without_comments = re.sub(
    r"/\*\*.*?\*/|^\s*//.*?\n", "", file_content, flags=re.DOTALL | re.MULTILINE
)

rush_data = json.loads(json_without_comments)

rush_directories = [project["projectFolder"] for project in rush_data["projects"]]

with open("dependabot.yml") as dependabot_file:
    dependabot_data = yaml.safe_load(dependabot_file)

dependabot_directories = [update["directory"] for update in dependabot_data["updates"]]

missing_directories = set(rush_directories) - set(dependabot_directories)

if len(missing_directories) > 0:
    print(
        f"The following projects are missing from dependabot.yml: {missing_directories}"
    )
    sys.exit(len(missing_directories))
else:
    print("All projects in rush.json were found in dependabot.yml")
