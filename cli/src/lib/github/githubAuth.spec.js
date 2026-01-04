const {
  isGhAuthenticated,
  fetchTreeWithAuth,
  fetchRawWithAuth,
  fetchTreeWithGh,
  fetchRawWithGh,
  fetchTreeWithAxios,
  fetchRawWithAxios,
  AuthorizationError,
} = require('./githubAuth');

// Mock dependencies
jest.mock('child_process');
jest.mock('axios');
jest.mock('../utils/toolDetector');
jest.mock('../utils/logger');

const { execSync } = require('child_process');
const axios = require('axios');
const { isCommandAvailable } = require('../utils/toolDetector');

describe('githubAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.exit to prevent tests from actually exiting
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    process.exit.mockRestore();
  });

  describe('isGhAuthenticated', () => {
    it('should return false if gh is not available', () => {
      isCommandAvailable.mockReturnValue(false);
      expect(isGhAuthenticated()).toBe(false);
    });

    it('should return true if gh is available and authenticated', () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValue('');
      expect(isGhAuthenticated()).toBe(true);
      expect(execSync).toHaveBeenCalledWith('gh auth status', { stdio: 'ignore' });
    });

    it('should return false if gh auth status fails', () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockImplementation(() => {
        throw new Error('Not authenticated');
      });
      expect(isGhAuthenticated()).toBe(false);
    });
  });

  describe('fetchTreeWithGh', () => {
    it('should fetch tree using gh CLI', async () => {
      const mockTree = [{ path: 'file.js', type: 'blob' }];
      execSync.mockReturnValue(JSON.stringify({ tree: mockTree }));

      const result = await fetchTreeWithGh('owner', 'repo', 'main');

      expect(result).toEqual(mockTree);
      expect(execSync).toHaveBeenCalledWith(
        'gh api repos/owner/repo/git/trees/main?recursive=1',
        expect.objectContaining({ encoding: 'utf-8' })
      );
    });

    it('should throw AuthorizationError on 401', async () => {
      const error = new Error('API error');
      error.stderr = 'HTTP 401: Unauthorized';
      execSync.mockImplementation(() => {
        throw error;
      });

      await expect(fetchTreeWithGh('owner', 'repo', 'main')).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError on 403', async () => {
      const error = new Error('API error');
      error.stderr = 'HTTP 403: Forbidden';
      execSync.mockImplementation(() => {
        throw error;
      });

      await expect(fetchTreeWithGh('owner', 'repo', 'main')).rejects.toThrow(AuthorizationError);
    });

    it('should throw original error for non-auth errors', async () => {
      const error = new Error('Network error');
      error.stderr = 'Connection failed';
      execSync.mockImplementation(() => {
        throw error;
      });

      await expect(fetchTreeWithGh('owner', 'repo', 'main')).rejects.toThrow('Network error');
    });
  });

  describe('fetchRawWithGh', () => {
    it('should fetch raw file using gh CLI', async () => {
      const mockContent = Buffer.from('file content');
      execSync.mockReturnValue(mockContent);

      const result = await fetchRawWithGh('owner', 'repo', 'main', 'path/to/file.js');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'gh api repos/owner/repo/contents/path/to/file.js?ref=main --jq .content | base64 -d',
        expect.objectContaining({ encoding: 'buffer' })
      );
    });

    it('should throw AuthorizationError on 401', async () => {
      const error = new Error('API error');
      error.stderr = 'HTTP 401: Unauthorized';
      execSync.mockImplementation(() => {
        throw error;
      });

      await expect(fetchRawWithGh('owner', 'repo', 'main', 'file.js')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('fetchTreeWithAxios', () => {
    it('should fetch tree using axios', async () => {
      const mockTree = [{ path: 'file.js', type: 'blob' }];
      axios.get.mockResolvedValue({ data: { tree: mockTree } });

      const result = await fetchTreeWithAxios('https://api.github.com/repos/owner/repo/git/trees/main');

      expect(result).toEqual(mockTree);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/git/trees/main',
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
    });

    it('should throw AuthorizationError on 401', async () => {
      axios.get.mockRejectedValue({ response: { status: 401 } });

      await expect(fetchTreeWithAxios('https://api.github.com/test')).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError on 403', async () => {
      axios.get.mockRejectedValue({ response: { status: 403 } });

      await expect(fetchTreeWithAxios('https://api.github.com/test')).rejects.toThrow(AuthorizationError);
    });

    it('should throw original error for non-auth errors', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(fetchTreeWithAxios('https://api.github.com/test')).rejects.toThrow('Network error');
    });
  });

  describe('fetchRawWithAxios', () => {
    it('should fetch raw file using axios', async () => {
      const mockContent = Buffer.from('file content');
      axios.get.mockResolvedValue({ data: mockContent });

      const result = await fetchRawWithAxios('https://raw.githubusercontent.com/owner/repo/main/file.js');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/owner/repo/main/file.js',
        { responseType: 'arraybuffer' }
      );
    });

    it('should throw AuthorizationError on 401', async () => {
      axios.get.mockRejectedValue({ response: { status: 401 } });

      await expect(fetchRawWithAxios('https://raw.githubusercontent.com/test')).rejects.toThrow(AuthorizationError);
    });
  });

  describe('fetchTreeWithAuth', () => {
    it('should use gh CLI when authenticated', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      const mockTree = [{ path: 'file.js' }];
      execSync.mockReturnValueOnce(JSON.stringify({ tree: mockTree })); // for fetchTreeWithGh

      const result = await fetchTreeWithAuth('owner', 'repo', 'main', 'https://api.github.com/test');

      expect(result).toEqual(mockTree);
      expect(execSync).toHaveBeenCalledWith(
        'gh api repos/owner/repo/git/trees/main?recursive=1',
        expect.any(Object)
      );
    });

    it('should fall back to axios when gh is not available', async () => {
      isCommandAvailable.mockReturnValue(false);
      const mockTree = [{ path: 'file.js' }];
      axios.get.mockResolvedValue({ data: { tree: mockTree } });

      const result = await fetchTreeWithAuth('owner', 'repo', 'main', 'https://api.github.com/test');

      expect(result).toEqual(mockTree);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should fall back to axios when gh fails for non-auth reasons', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      execSync.mockImplementationOnce(() => {
        throw new Error('Network error');
      }); // for fetchTreeWithGh
      const mockTree = [{ path: 'file.js' }];
      axios.get.mockResolvedValue({ data: { tree: mockTree } });

      const result = await fetchTreeWithAuth('owner', 'repo', 'main', 'https://api.github.com/test');

      expect(result).toEqual(mockTree);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should exit on authorization error from gh CLI', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      const error = new Error('Auth error');
      error.stderr = 'HTTP 401: Unauthorized';
      execSync.mockImplementationOnce(() => {
        throw error;
      }); // for fetchTreeWithGh

      await expect(
        fetchTreeWithAuth('owner', 'repo', 'main', 'https://api.github.com/test')
      ).rejects.toThrow('process.exit(1)');
    });

    it('should exit on authorization error from axios fallback', async () => {
      isCommandAvailable.mockReturnValue(false);
      axios.get.mockRejectedValue({ response: { status: 401 } });

      await expect(
        fetchTreeWithAuth('owner', 'repo', 'main', 'https://api.github.com/test')
      ).rejects.toThrow('process.exit(1)');
    });
  });

  describe('fetchRawWithAuth', () => {
    it('should use gh CLI when authenticated', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      const mockContent = Buffer.from('file content');
      execSync.mockReturnValueOnce(mockContent); // for fetchRawWithGh

      const result = await fetchRawWithAuth('owner', 'repo', 'main', 'file.js', 'https://raw.github.com/test');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'gh api repos/owner/repo/contents/file.js?ref=main --jq .content | base64 -d',
        expect.any(Object)
      );
    });

    it('should fall back to axios when gh is not available', async () => {
      isCommandAvailable.mockReturnValue(false);
      const mockContent = Buffer.from('file content');
      axios.get.mockResolvedValue({ data: mockContent });

      const result = await fetchRawWithAuth('owner', 'repo', 'main', 'file.js', 'https://raw.github.com/test');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should fall back to axios when gh fails for non-auth reasons', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      execSync.mockImplementationOnce(() => {
        throw new Error('Network error');
      }); // for fetchRawWithGh
      const mockContent = Buffer.from('file content');
      axios.get.mockResolvedValue({ data: mockContent });

      const result = await fetchRawWithAuth('owner', 'repo', 'main', 'file.js', 'https://raw.github.com/test');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(axios.get).toHaveBeenCalled();
    });

    it('should exit on authorization error from gh CLI', async () => {
      isCommandAvailable.mockReturnValue(true);
      execSync.mockReturnValueOnce(''); // for isGhAuthenticated
      const error = new Error('Auth error');
      error.stderr = 'HTTP 401: Unauthorized';
      execSync.mockImplementationOnce(() => {
        throw error;
      }); // for fetchRawWithGh

      await expect(
        fetchRawWithAuth('owner', 'repo', 'main', 'file.js', 'https://raw.github.com/test')
      ).rejects.toThrow('process.exit(1)');
    });

    it('should exit on authorization error from axios fallback', async () => {
      isCommandAvailable.mockReturnValue(false);
      axios.get.mockRejectedValue({ response: { status: 403 } });

      await expect(
        fetchRawWithAuth('owner', 'repo', 'main', 'file.js', 'https://raw.github.com/test')
      ).rejects.toThrow('process.exit(1)');
    });
  });
});
