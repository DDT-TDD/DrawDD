/**
 * Property-Based Tests for non-blocking file opening behavior.
 *
 * Feature: markdown-and-folder-explorer
 * Property 37: File open non-blocking
 */

import fc from 'fast-check';
import { openFile } from '../services/electron';

const unixFilePathArb = fc.array(
	fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
	{ minLength: 1, maxLength: 5 }
).chain(parts =>
	fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/).map(file =>
		'/' + parts.join('/') + '/' + file
	)
);

const windowsFilePathArb = fc.array(
	fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
	{ minLength: 1, maxLength: 5 }
).chain(parts =>
	fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/).map(file =>
		'C:\\' + parts.join('\\') + '\\' + file
	)
);

const filePathArb = fc.oneof(unixFilePathArb, windowsFilePathArb);

describe('Feature: markdown-and-folder-explorer, Property 37: File open non-blocking', () => {
	beforeEach(() => {
		delete (window as any).electronAPI;
	});

	afterEach(() => {
		delete (window as any).electronAPI;
	});

	it('should prefer openWithDefaultApp over the legacy openFile bridge', async () => {
		await fc.assert(
			fc.asyncProperty(filePathArb, async (filePath) => {
				const openWithDefaultApp = jest.fn().mockResolvedValue({ success: true });
				const legacyOpenFile = jest.fn().mockResolvedValue({ success: true, error: 'legacy' });

				(window as any).electronAPI = {
					selectFolder: jest.fn(),
					openFile: legacyOpenFile,
					openWithDefaultApp,
					scanDirectory: jest.fn(),
				};

				const result = await openFile(filePath);

				expect(openWithDefaultApp).toHaveBeenCalledTimes(1);
				expect(openWithDefaultApp).toHaveBeenCalledWith(filePath);
				expect(legacyOpenFile).not.toHaveBeenCalled();
				expect(result).toEqual({ success: true });
			}),
			{ numRuns: 75 }
		);
	});

	it('should fall back to the legacy openFile bridge when openWithDefaultApp is unavailable', async () => {
		await fc.assert(
			fc.asyncProperty(filePathArb, async (filePath) => {
				const legacyResult = { success: true };
				const legacyOpenFile = jest.fn().mockResolvedValue(legacyResult);

				(window as any).electronAPI = {
					selectFolder: jest.fn(),
					openFile: legacyOpenFile,
					scanDirectory: jest.fn(),
				};

				const result = await openFile(filePath);

				expect(legacyOpenFile).toHaveBeenCalledTimes(1);
				expect(legacyOpenFile).toHaveBeenCalledWith(filePath);
				expect(result).toBe(legacyResult);
			}),
			{ numRuns: 75 }
		);
	});

	it('should preserve a pending default-app promise instead of switching APIs mid-flight', async () => {
		await fc.assert(
			fc.asyncProperty(filePathArb, async (filePath) => {
				let resolveOpen: ((value: { success: boolean }) => void) | undefined;
				const pendingResult = new Promise<{ success: boolean }>(resolve => {
					resolveOpen = resolve;
				});
				const openWithDefaultApp = jest.fn().mockReturnValue(pendingResult);
				const legacyOpenFile = jest.fn().mockResolvedValue({ success: true });

				(window as any).electronAPI = {
					selectFolder: jest.fn(),
					openFile: legacyOpenFile,
					openWithDefaultApp,
					scanDirectory: jest.fn(),
				};

				const resultPromise = openFile(filePath);
				let settled = false;
				void resultPromise.then(() => {
					settled = true;
				});

				await Promise.resolve();

				expect(openWithDefaultApp).toHaveBeenCalledTimes(1);
				expect(openWithDefaultApp).toHaveBeenCalledWith(filePath);
				expect(legacyOpenFile).not.toHaveBeenCalled();
				expect(settled).toBe(false);

				resolveOpen?.({ success: true });
				await expect(resultPromise).resolves.toEqual({ success: true });
			}),
			{ numRuns: 40 }
		);
	});
});
