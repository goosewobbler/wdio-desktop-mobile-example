import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Mocking', () => {
  describe('browser.tauri.mock', () => {
    it('should mock a tauri command', async () => {
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');

      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('get_platform_info');
      });

      await mockGetPlatformInfo.update();

      expect(mockGetPlatformInfo).toHaveBeenCalledTimes(1);
    });

    it('should mock a command with arguments', async () => {
      const mockWriteClipboard = await browser.tauri.mock('write_clipboard');

      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('write_clipboard', { content: 'test content' });
      });

      await mockWriteClipboard.update();

      expect(mockWriteClipboard).toHaveBeenCalledTimes(1);
      expect(mockWriteClipboard).toHaveBeenCalledWith({ content: 'test content' });
    });
  });

  describe('browser.tauri.clearAllMocks', () => {
    it('should clear existing mocks', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      const mockWriteClipboard = await browser.tauri.mock('write_clipboard');

      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('read_clipboard');
      });
      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('write_clipboard', { content: 'test content' });
      });

      await mockReadClipboard.update();
      await mockWriteClipboard.update();

      await browser.tauri.clearAllMocks();

      expect(mockReadClipboard.mock.calls).toStrictEqual([]);
      expect(mockReadClipboard.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockReadClipboard.mock.lastCall).toBeUndefined();
      expect(mockReadClipboard.mock.results).toStrictEqual([]);

      expect(mockWriteClipboard.mock.calls).toStrictEqual([]);
      expect(mockWriteClipboard.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockWriteClipboard.mock.lastCall).toBeUndefined();
      expect(mockWriteClipboard.mock.results).toStrictEqual([]);
    });

    it('should not reset existing mocks', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');

      await mockReadClipboard.mockReturnValue('mocked clipboard content');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os', arch: 'mock_arch' });

      await browser.tauri.clearAllMocks();

      const clipboardContent = await browser.tauri.execute(async ({ core }) => await core.invoke('read_clipboard'));
      const platformInfo = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));

      expect(clipboardContent).toBe('mocked clipboard content');
      expect(platformInfo).toEqual({ os: 'mock_os', arch: 'mock_arch' });
    });
  });

  describe('browser.tauri.resetAllMocks', () => {
    it('should clear existing mocks', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');

      await mockReadClipboard.mockReturnValue('mocked clipboard');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os' });

      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('read_clipboard');
      });
      await browser.tauri.execute(async ({ core }) => {
        await core.invoke('get_platform_info');
      });

      await mockReadClipboard.update();
      await mockGetPlatformInfo.update();

      await browser.tauri.resetAllMocks();

      expect(mockReadClipboard.mock.calls).toStrictEqual([]);
      expect(mockReadClipboard.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockReadClipboard.mock.lastCall).toBeUndefined();
      expect(mockReadClipboard.mock.results).toStrictEqual([]);

      expect(mockGetPlatformInfo.mock.calls).toStrictEqual([]);
      expect(mockGetPlatformInfo.mock.invocationCallOrder).toStrictEqual([]);
      expect(mockGetPlatformInfo.mock.lastCall).toBeUndefined();
      expect(mockGetPlatformInfo.mock.results).toStrictEqual([]);
    });

    it('should reset mock implementations', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');

      await mockReadClipboard.mockReturnValue('mocked clipboard');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mock_os' });

      await browser.tauri.resetAllMocks();

      // After reset, mocks should return undefined (not the mocked values)
      const clipboardContent = await browser.tauri.execute(async ({ core }) => await core.invoke('read_clipboard'));
      const platformInfo = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));

      expect(clipboardContent).toBeUndefined();
      expect(platformInfo).toBeUndefined();
    });
  });

  describe('browser.tauri.restoreAllMocks', () => {
    it('should restore original implementations', async () => {
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');
      await mockGetPlatformInfo.mockReturnValue({ os: 'mocked_os', arch: 'mocked_arch' });

      // First call should return mocked value
      const mockedResult = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));
      expect(mockedResult).toEqual({ os: 'mocked_os', arch: 'mocked_arch' });

      // Restore mocks
      await browser.tauri.restoreAllMocks();

      // After restore, should return real implementation result
      const realResult = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));
      expect(realResult).toHaveProperty('os');
      expect(realResult).toHaveProperty('arch');
      expect(realResult).not.toEqual({ os: 'mocked_os', arch: 'mocked_arch' });
    });
  });

  describe('mock return values', () => {
    it('should return mocked value with mockReturnValue', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      await mockReadClipboard.mockReturnValue('mocked clipboard content');

      const result = await browser.tauri.execute(async ({ core }) => await core.invoke('read_clipboard'));
      expect(result).toBe('mocked clipboard content');
    });

    it('should return mocked value with mockResolvedValue', async () => {
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');
      await mockGetPlatformInfo.mockResolvedValue({ os: 'mocked_os', arch: 'mocked_arch' });

      const result = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));
      expect(result).toEqual({ os: 'mocked_os', arch: 'mocked_arch' });
    });

    it('should reject with mockRejectedValue', async () => {
      const mockReadClipboard = await browser.tauri.mock('read_clipboard');
      await mockReadClipboard.mockRejectedValue(new Error('Mocked error'));

      await expect(browser.tauri.execute(async ({ core }) => await core.invoke('read_clipboard'))).rejects.toThrow(
        'Mocked error',
      );
    });

    it('should support mockImplementation', async () => {
      const mockGetPlatformInfo = await browser.tauri.mock('get_platform_info');
      await mockGetPlatformInfo.mockImplementation(() => ({
        os: 'custom_os',
        arch: 'custom_arch',
        version: '1.0.0',
        hostname: 'custom-host',
        memory: { total: 1000, free: 500 },
        cpu: { cores: 4, frequency: 2000 },
        disk: { total: 10000, free: 5000 },
      }));

      const result = await browser.tauri.execute(async ({ core }) => await core.invoke('get_platform_info'));
      expect(result.os).toBe('custom_os');
      expect(result.arch).toBe('custom_arch');
      expect(result.version).toBe('1.0.0');
    });
  });
});
