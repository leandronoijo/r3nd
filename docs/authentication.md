# GitHub Authentication for Seed Repository Access

This document describes the authentication strategy implemented for accessing seed repositories in the r3nd CLI tool.

## Overview

The CLI tool needs to fetch files from seed repositories on GitHub. To support both public and private repositories, we've implemented a multi-tier authentication strategy:

1. **Primary**: Use GitHub CLI (`gh`) if available and authenticated
2. **Fallback**: Use axios for public GitHub API endpoints
3. **Error Handling**: Clear error messages and immediate exit on authorization failures

## How It Works

### Authentication Flow

```
┌─────────────────────────────────────┐
│  CLI needs to fetch from GitHub     │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Is gh CLI     │
       │ authenticated?│
       └───┬───────────┘
           │
     Yes   │   No
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐   ┌─────────┐
│ Use gh  │   │ Use     │
│ CLI     │   │ axios   │
└────┬────┘   └────┬────┘
     │             │
     │    Fails    │
     │   ┌─────────┘
     │   │
     ▼   ▼
  ┌──────────┐
  │ Auth     │
  │ Error?   │
  └────┬─────┘
       │
       ▼
  ┌──────────────────────────┐
  │ Show error message       │
  │ Exit with code 1         │
  └──────────────────────────┘
```

### Implementation Details

The authentication logic is implemented in `cli/src/lib/github/githubAuth.js`:

- **`isGhAuthenticated()`**: Checks if gh CLI is installed and authenticated
- **`fetchTreeWithAuth()`**: Fetches GitHub tree with authentication
- **`fetchRawWithAuth()`**: Fetches raw file content with authentication
- **`AuthorizationError`**: Custom error class for 401/403 responses

## Usage Scenarios

### Scenario 1: Authenticated with GitHub CLI (Recommended)

**Setup:**
```bash
gh auth login
```

**Result:**
- ✅ Private repositories work
- ✅ Public repositories work
- ✅ No rate limiting issues
- ✅ Best user experience

### Scenario 2: No Authentication

**Setup:**
- No gh CLI installed, or
- gh CLI installed but not authenticated

**Result:**
- ❌ Private repositories fail with clear error message
- ✅ Public repositories work (subject to rate limits)
- ⚠️ May hit GitHub API rate limits

**Error Message:**
```
❌ Unauthorized: Failed to access private repository.
The repository may be private. Please authenticate using GitHub CLI:
  gh auth login
  gh auth status
```

## Error Handling

### Authorization Errors (401/403)

When the CLI receives a 401 or 403 response from GitHub:

1. A clear, user-friendly error message is displayed
2. Instructions for authentication are provided
3. The process exits with code 1 (non-zero exit code)
4. No retry attempts are made (fail fast)

### Other Errors

For non-authorization errors (network issues, invalid URLs, etc.):
- Errors are propagated normally
- Stack traces may be shown for debugging
- Exit codes may vary based on error type

## Testing

### Unit Tests

Comprehensive unit tests are in `cli/src/lib/github/githubAuth.spec.js`:

```bash
cd cli
npx jest src/lib/github/githubAuth.spec.js
```

**Test Coverage:**
- ✅ gh CLI authentication check
- ✅ gh CLI fetch operations
- ✅ axios fetch operations
- ✅ Fallback behavior
- ✅ Authorization error detection
- ✅ Process exit on auth failures
- ✅ Error message formatting

### Manual Testing

Run the test script:

```bash
./test-authentication.sh
```

This script:
1. Checks gh CLI installation and authentication status
2. Runs the authentication unit tests
3. Explains expected behavior for different scenarios

## Configuration

### Seed Repository Configuration

Configure the seed repository in `.r3nd.yaml`:

```yaml
seed-repo: owner/repo@branch
```

Or via CLI:

```bash
r3nd config set seed-repo owner/repo@branch
```

### Environment Variables

- **`R3ND_DEBUG=1`**: Enable debug logging to see which authentication method is being used

Example:
```bash
R3ND_DEBUG=1 r3nd init --yes
```

Output will show:
```
Using gh CLI for tree fetch
```
or
```
Using axios for tree fetch
```

## Future Enhancements

Potential improvements for future versions:

1. **Personal Access Token Support**: Allow setting `GITHUB_TOKEN` environment variable for axios authentication
2. **Retry Logic**: Implement smart retry for transient network errors
3. **Cache**: Cache fetched files locally to reduce API calls
4. **Progress Indicators**: Show progress for large repositories

## Troubleshooting

### "Unauthorized" error for public repository

**Cause**: GitHub rate limiting for unauthenticated requests

**Solution**: Authenticate with gh CLI:
```bash
gh auth login
```

### gh CLI installed but still failing

**Check authentication status:**
```bash
gh auth status
```

**Re-authenticate if needed:**
```bash
gh auth login --web
```

### Cannot install gh CLI

**Alternatives:**
- Use only public repositories (subject to rate limits)
- Set up a GitHub Personal Access Token (future enhancement)

## References

- [GitHub CLI Documentation](https://cli.github.com/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
