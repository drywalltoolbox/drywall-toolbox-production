#!/usr/bin/env python3
"""
Verification Script for Python API Testing Migration

This script verifies that all Python test files are properly set up
and can be imported without errors.
"""

import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Verify Python 3.9 or higher"""
    if sys.version_info < (3, 9):
        print(f"❌ Python 3.9+ required. Found: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version_info.major}.{sys.version_info.minor}")
    return True


def check_test_files():
    """Verify test files exist"""
    test_dir = Path(__file__).parent
    test_files = [
        "test_api_integration.py",
        "test_api_workflows.py",
        "requirements-test.txt",
    ]
    
    all_exist = True
    for test_file in test_files:
        test_path = test_dir / test_file
        if test_path.exists():
            print(f"✅ Found: {test_file}")
        else:
            print(f"❌ Missing: {test_file}")
            all_exist = False
    
    return all_exist


def check_dependencies():
    """Verify required dependencies"""
    try:
        import pytest
        print(f"✅ pytest {pytest.__version__}")
        return True
    except ImportError:
        print("❌ pytest not installed. Run: pip install -r requirements-test.txt")
        return False


def check_imports():
    """Verify test modules can be imported"""
    try:
        import test_api_integration
        print("✅ test_api_integration imports successfully")
    except ImportError as e:
        print(f"❌ test_api_integration import failed: {e}")
        return False
    
    try:
        import test_api_workflows
        print("✅ test_api_workflows imports successfully")
    except ImportError as e:
        print(f"❌ test_api_workflows import failed: {e}")
        return False
    
    return True


def run_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("Running Tests")
    print("="*60)
    
    result = subprocess.run(
        ["pytest", "-v", "--tb=short"],
        cwd=Path(__file__).parent
    )
    
    return result.returncode == 0


def main():
    """Run all verification checks"""
    print("="*60)
    print("Python API Testing Setup Verification")
    print("="*60)
    print()
    
    checks = [
        ("Python Version", check_python_version),
        ("Test Files", check_test_files),
        ("Dependencies", check_dependencies),
        ("Module Imports", check_imports),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\nChecking {check_name}...")
        if not check_func():
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("✅ All checks passed!")
        print("\nNext steps:")
        print("1. Run tests: pytest -v")
        print("2. Run with coverage: pytest --cov=. --cov-report=html")
        print("3. Run specific test: pytest test_api_integration.py -v")
        
        # Optional: run tests
        response = input("\nWould you like to run tests now? (y/n): ")
        if response.lower() == 'y':
            run_tests()
    else:
        print("❌ Some checks failed. Please review the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
