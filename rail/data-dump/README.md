# data-dump

## Build the Python dependency layer

The Lambda dependency layer must be built with Python 3.12, matching the Lambda runtime. A virtual environment isolates packages but uses the Python interpreter that created it; it does not install or upgrade Python. A system `python3` may point to an older version, so select Python 3.12 explicitly. The build script checks the selected interpreter and stops if it is not Python 3.12.

Install Python 3.12 and make its executable available. For example, on macOS with Homebrew:

```bash
brew install python@3.12
```

Then, from this project directory, build just the layer with:

```bash
PYTHON_BIN="$(brew --prefix python@3.12)/bin/python3.12" rushx build:layer
```

To build the layer and the TypeScript project, run:

```bash
PYTHON_BIN="$(brew --prefix python@3.12)/bin/python3.12" rushx build
```

On other systems, set `PYTHON_BIN` to the Python 3.12 executable path. Poetry and `zip` must also be available locally. The script exports the main dependencies from `pyproject.toml`, installs them into the Lambda layer, and checks that the layer is not empty before creating the ZIP.
