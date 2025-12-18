import sys
import json
import urllib.request
import datetime
import os

def load_whitelist():
    """Load whitelisted packages from whitelisted_dependencies.txt file.
    Expected format: one package per line in format 'package==version'
    Lines starting with # are treated as comments.
    """
    whitelist = set()
    whitelist_file = os.path.join(os.path.dirname(__file__), 'whitelisted_dependencies.txt')

    if os.path.exists(whitelist_file):
        try:
            with open(whitelist_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    # Skip empty lines and comments
                    if line and not line.startswith('#'):
                        whitelist.add(line)
        except Exception as e:
            print(f"Warning: Could not read whitelist file: {e}")

    return whitelist

def get_package_age(package, version):
    """Gets the age of a specific package version from PyPI.
    Returns (release_date, error_message) tuple.
    If successful, error_message is None. If failed, release_date is None.
    """
    try:
        url = f"https://pypi.org/pypi/{package}/{version}/json"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            release_date_str = data["urls"][0]["upload_time_iso_8601"]
            release_date = datetime.datetime.fromisoformat(release_date_str)
            return release_date, None
    except Exception as e:
        error_msg = f"Could not fetch data for {package}=={version}: {e}"
        return None, error_msg

def check_poetry_lock_age(file_path, cooldown_days=7):
    """Parses a poetry.lock file and checks the age of each package."""
    try:
        import tomllib
    except ImportError:
        print("Error: Python 3.11+ required for tomllib")
        sys.exit(1)

    with open(file_path, 'rb') as f:
        lock_data = tomllib.load(f)

    whitelist = load_whitelist()
    violations = []
    errors = []

    for package in lock_data.get('package', []):
        name = package.get('name')
        version = package.get('version')
        if name and version:
            package_version = f"{name}=={version}"

            # Skip whitelisted packages
            if package_version in whitelist:
                print(f"⚪ Skipping whitelisted package: {package_version}")
                continue

            release_date, error_msg = get_package_age(name, version)
            if error_msg:
                errors.append(error_msg)
            elif release_date:
                age = datetime.datetime.now(datetime.timezone.utc) - release_date
                if age.days < cooldown_days:
                    violations.append(f"{name}=={version} ({age.days} days old)")

    if errors:
        print("❌ Errors occurred while checking packages:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    if violations:
        print("❌ Cooldown violations detected:")
        for v in violations:
            print(f"  - {v}")
        sys.exit(1)
    else:
        print("✅ All dependencies meet the cooldown requirement")

def check_requirements_age(file_path, cooldown_days=7):
    """
    Parses a requirements.txt file and checks the age of each package.
    """
    whitelist = load_whitelist()
    violations = []
    errors = []

    with open(file_path, 'r') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if line and not line.startswith('#'):
                # Check if line has a pinned version with ==
                if '==' not in line:
                    errors.append(f"Line {line_num}: Package is not pinned to a specific version: {line}")
                    continue

                try:
                    package, version = line.split('==', 1)
                    package = package.strip()
                    version = version.strip()
                except ValueError:
                    errors.append(f"Line {line_num}: Could not parse requirement: {line}")
                    continue

                package_version = f"{package}=={version}"

                # Skip whitelisted packages
                if package_version in whitelist:
                    print(f"⚪ Skipping whitelisted package: {package_version}")
                    continue

                release_date, error_msg = get_package_age(package, version)
                if error_msg:
                    errors.append(error_msg)
                elif release_date:
                    age = datetime.datetime.now(datetime.timezone.utc) - release_date
                    if age.days < cooldown_days:
                        violations.append(f"{package}=={version} ({age.days} days old)")

    if errors:
        print("❌ Errors occurred while checking packages:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    if violations:
        print("❌ Cooldown violations detected:")
        for v in violations:
            print(f"  - {v}")
        sys.exit(1)
    else:
        print("✅ All dependencies meet the cooldown requirement")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_dependency_age.py <path_to_requirements_file>")
        sys.exit(1)

    file_path = sys.argv[1]

    if file_path.endswith('poetry.lock'):
        print(f"Detected Poetry lock file: {file_path}")
        check_poetry_lock_age(file_path)
    elif file_path.endswith('requirements.txt'):
        print(f"Detected requirements.txt file: {file_path}")
        check_requirements_age(file_path)
    else:
        print(f"Error: Unable to determine file type for {file_path}")
        print("Expected either poetry.lock or requirements.txt")
        sys.exit(1)