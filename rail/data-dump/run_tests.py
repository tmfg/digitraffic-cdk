import unittest
import sys


def main():
    loader = unittest.TestLoader()
    suite = loader.discover("src/lambda/tests", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
