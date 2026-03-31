# Python Testing Quick Reference

## Installation

```bash
cd scripts
pip install -r requirements-test.txt
```

## Run Tests

```bash
# All tests
pytest -v

# Specific file
pytest test_api_integration.py -v

# Specific test
pytest test_api_integration.py::TestWooCommerceAPI::test_fetch_all_products -v

# With pattern
pytest -k "workflow" -v

# With coverage
pytest --cov=. --cov-report=html
```

## File Structure

```
scripts/
├── test_api_integration.py      # WordPress & WooCommerce API tests (28 tests)
├── test_api_workflows.py        # Full workflow integration tests (16+ tests)
├── requirements-test.txt        # Python dependencies
└── TESTING_GUIDE.md            # Full documentation
```

## Test Coverage

### test_api_integration.py
- **TestWordPressAPI** (6 tests)
  - Pages endpoint
  - Posts endpoint
  - Error handling (404, network)
  - Pagination

- **TestWooCommerceAPI** (8 tests)
  - Products listing
  - Product details
  - Order creation
  - Pricing & stock
  - Error handling

### test_api_workflows.py
- **TestAPIWorkflows** (16+ tests)
  - Complete shopping workflow
  - Product discovery
  - Authentication flow
  - Error recovery
  - Concurrent requests
  - Custom endpoints

## Common Commands

```bash
# Run all tests with verbose output
pytest -v

# Run tests matching pattern
pytest -k "product" -v

# Run with timeout (5 seconds)
pytest --timeout=5

# Stop after first failure
pytest -x

# Show print statements
pytest -s

# Detailed traceback
pytest --tb=long

# Coverage report
pytest --cov=. --cov-report=html

# Generate coverage badge
pip install coverage-badge
coverage-badge -o coverage.svg
```

## Using Mocks

```python
from unittest.mock import patch

# Mock GET request
with patch("requests.get") as mock_get:
    mock_get.return_value.json.return_value = {"id": 1}
    mock_get.return_value.status_code = 200
    response = requests.get("http://api.example.com/endpoint")
```

## Test Results

```bash
$ pytest -v

test_api_integration.py::TestWordPressAPI::test_fetch_all_pages PASSED
test_api_integration.py::TestWooCommerceAPI::test_fetch_all_products PASSED
test_api_workflows.py::TestAPIWorkflows::test_complete_shopping_workflow PASSED
...

====== 50+ passed in 0.42s ======
```

## Adding Tests

1. Create new method in appropriate class
2. Use `@pytest.fixture` for reusable data
3. Use `patch()` to mock requests
4. Add assertions

```python
def test_new_feature(self):
    with patch("requests.get") as mock_get:
        mock_get.return_value.json.return_value = {"status": "ok"}
        mock_get.return_value.status_code = 200
        
        response = requests.get("http://api/endpoint")
        assert response.status_code == 200
```

## Dependencies

- `pytest` — Test framework
- `pytest-cov` — Coverage reporting
- `requests` — HTTP library
- `unittest.mock` — Request mocking (stdlib)

## Next Steps

1. ✅ Install: `pip install -r requirements-test.txt`
2. ✅ Run: `pytest -v`
3. ✅ Extend: Add tests to existing files
4. ✅ CI/CD: Add to GitHub Actions

See `TESTING_GUIDE.md` for full documentation.
