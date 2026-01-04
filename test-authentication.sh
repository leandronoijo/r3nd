#!/bin/bash
# Manual Test Script for GitHub Authentication
# This script demonstrates the different authentication scenarios

echo "=== GitHub CLI Authentication Test Scenarios ==="
echo ""

# Check if gh is available
if command -v gh &> /dev/null; then
    echo "✓ gh CLI is installed"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo "✓ gh CLI is authenticated"
        echo ""
        echo "Scenario: gh CLI will be used for private repositories"
    else
        echo "✗ gh CLI is NOT authenticated"
        echo ""
        echo "Scenario: Will fall back to axios (public repos only)"
        echo "To authenticate: gh auth login"
    fi
else
    echo "✗ gh CLI is NOT installed"
    echo ""
    echo "Scenario: Will use axios (public repos only)"
    echo "To install: https://cli.github.com/"
fi

echo ""
echo "=== Testing Authentication Module ==="
echo ""

cd "$(dirname "$0")"/../cli

# Run the authentication tests
echo "Running authentication tests..."
npx jest src/lib/github/githubAuth.spec.js --silent

if [ $? -eq 0 ]; then
    echo "✓ All authentication tests passed"
else
    echo "✗ Some tests failed"
    exit 1
fi

echo ""
echo "=== Expected Behavior ==="
echo ""
echo "1. When gh CLI is authenticated:"
echo "   - Private repos: ✓ Works"
echo "   - Public repos: ✓ Works"
echo ""
echo "2. When gh CLI is NOT authenticated (or not installed):"
echo "   - Private repos: ✗ Shows error message and exits with code 1"
echo "   - Public repos: ✓ Works (via axios)"
echo ""
echo "   Error message example:"
echo "   '❌ Unauthorized: Failed to access private repository.'"
echo "   'Please authenticate using GitHub CLI: gh auth login'"
echo ""
echo "3. Rate limiting:"
echo "   - GitHub API has rate limits for unauthenticated requests"
echo "   - Using gh CLI authentication avoids rate limits"
echo ""
