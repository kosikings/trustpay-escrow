import { describe, it, expect } from 'vitest';
import {
  calculateBufferChecksum,
  calculateFileChecksum,
  calculateStringChecksum,
  verifyFileChecksum,
  truncateHash,
} from './checksum';

describe('checksum utilities', () => {
  it('computes expected SHA-256 for empty string (known test vector)', async () => {
    const hash = await calculateStringChecksum('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('computes expected SHA-256 for "hello world" (known test vector)', async () => {
    const hash = await calculateStringChecksum('hello world');
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes checksum from File/Blob buffer', async () => {
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    const hash = await calculateFileChecksum(blob);
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('verifies valid file checksum correctly', async () => {
    const blob = new Blob(['deliverable content'], { type: 'application/octet-stream' });
    const correctHash = await calculateFileChecksum(blob);

    const isValid = await verifyFileChecksum(blob, correctHash);
    expect(isValid).toBe(true);

    // Case-insensitive check
    const isValidUpper = await verifyFileChecksum(blob, correctHash.toUpperCase());
    expect(isValidUpper).toBe(true);
  });

  it('detects tampered file checksum', async () => {
    const blob = new Blob(['original content'], { type: 'text/plain' });
    const fakeHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

    const isValid = await verifyFileChecksum(blob, fakeHash);
    expect(isValid).toBe(false);
  });

  it('returns false for empty or whitespace expected hash', async () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    expect(await verifyFileChecksum(blob, '')).toBe(false);
    expect(await verifyFileChecksum(blob, '   ')).toBe(false);
  });

  it('truncates hash accurately for badge display', () => {
    const full = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    expect(truncateHash(full)).toBe('sha256: b94d...cde9');
    expect(truncateHash(`sha256: ${full}`)).toBe('sha256: b94d...cde9');
    expect(truncateHash('12345678', 4, 4)).toBe('sha256: 12345678');
    expect(truncateHash('')).toBe('');
  });
});
