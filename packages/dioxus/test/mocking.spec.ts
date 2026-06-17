import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus Mocking', () => {
  describe('browser.dioxus.mock', () => {
    it('should mock a dioxus command', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');

      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('get_platform_info');
      });

      await mockGetPlatformInfo.update();

      expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);
    });

    it('should mock a command with arguments', async () => {
      const mockGenerateLogs = await browser.dioxus.mock('generate_test_logs');

      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('generate_test_logs', { timestamp: 'test' });
      });

      await mockGenerateLogs.update();

      expect(mockGenerateLogs).toHaveBeenCalledTimes(1);
      expect(mockGenerateLogs).toHaveBeenCalledWith({ timestamp: 'test' });
    });
  });

  describe('browser.dioxus.clearAllMocks', () => {
    it('should clear existing mocks', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      const mockGetArgs = await browser.dioxus.mock('get_command_line_args');

      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('get_platform_info');
      });
      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('get_command_line_args');
      });

      await mockGetPlatformInfo.update();
      await mockGetArgs.update();

      await browser.dioxus.clearAllMocks();

      expect(mockGetPlatformInfo.mock.calls).toStrictEqual([]);
      expect(mockGetPlatformInfo.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockGetPlatformInfo.mock.lastCall).toBeUndefined();
      expect(mockGetPlatformInfo.mock.results).toStrictEqual([]);

      expect(mockGetArgs.mock.calls).toStrictEqual([]);
      expect(mockGetArgs.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockGetArgs.mock.lastCall).toBeUndefined();
      expect(mockGetArgs.mock.results).toStrictEqual([]);
    });

    it('should not reset existing mocks', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      const mockGetArgs = await browser.dioxus.mock('get_command_line_args');

      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os', arch: 'mock_arch' });
      await mockGetArgs.mockReturnValue(['--mock-arg']);

      await browser.dioxus.clearAllMocks();

      const platformInfo = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      const args = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_command_line_args'));

      expect(platformInfo).toEqual({ os: 'mock_os', arch: 'mock_arch' });
      expect(args).toEqual(['--mock-arg']);
    });
  });

  describe('browser.dioxus.resetAllMocks', () => {
    it('should clear existing mocks', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      const mockGetArgs = await browser.dioxus.mock('get_command_line_args');

      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os', arch: 'mock_arch' });
      await mockGetArgs.mockReturnValue(['--mock-arg']);

      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('get_platform_info');
      });
      await browser.dioxus.execute(async ({ invoke }) => {
        await invoke('get_command_line_args');
      });

      await mockGetPlatformInfo.update();
      await mockGetArgs.update();

      await browser.dioxus.resetAllMocks();

      expect(mockGetPlatformInfo.mock.calls).toStrictEqual([]);
      expect(mockGetArgs.mock.calls).toStrictEqual([]);
    });

    it('should reset mock implementations', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      const mockGetArgs = await browser.dioxus.mock('get_command_line_args');

      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os', arch: 'mock_arch' });
      await mockGetArgs.mockReturnValue(['--mock-arg']);

      await browser.dioxus.resetAllMocks();

      // After reset, mocks should return undefined (not the mocked values)
      const platformInfo = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      const args = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_command_line_args'));

      expect(platformInfo).toBeUndefined();
      expect(args).toBeUndefined();
    });
  });

  describe('browser.dioxus.restoreAllMocks', () => {
    it('should restore original implementations', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mocked_os', arch: 'mocked_arch' });

      // First call should return mocked value
      const mockedResult = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      expect(mockedResult).toEqual({ os: 'mocked_os', arch: 'mocked_arch' });

      // Restore mocks
      await browser.dioxus.restoreAllMocks();

      // After restore, should return real implementation result
      const realResult = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      expect(realResult).toHaveProperty('os');
      expect(realResult).toHaveProperty('arch');
      expect(realResult).not.toEqual({ os: 'mocked_os', arch: 'mocked_arch' });
    });
  });

  describe('mock return values', () => {
    it('should return mocked value with mockReturnValue', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mocked_os', arch: 'mocked_arch' });

      const result = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      expect(result).toEqual({ os: 'mocked_os', arch: 'mocked_arch' });
    });

    it('should return mocked value with mockResolvedValue', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      await mockGetPlatformInfo.mockResolvedValue({ os: 'mocked_os', arch: 'mocked_arch' });

      const result = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      expect(result).toEqual({ os: 'mocked_os', arch: 'mocked_arch' });
    });

    it('should reject with mockRejectedValue', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      await mockGetPlatformInfo.mockRejectedValue(new Error('Mocked error'));

      await expect(
        browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info')),
      ).rejects.toThrow('Mocked error');
    });

    it('should support mockImplementation', async () => {
      const mockGetPlatformInfo = await browser.dioxus.mock('get_platform_info');
      await mockGetPlatformInfo.mockImplementation(() => ({
        os: 'custom_os',
        arch: 'custom_arch',
      }));

      const result = await browser.dioxus.execute(async ({ invoke }) => await invoke('get_platform_info'));
      expect(result.os).toBe('custom_os');
      expect(result.arch).toBe('custom_arch');
    });
  });
});
