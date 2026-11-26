import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileChecksumBadge } from './FileChecksumBadge';

describe('FileChecksumBadge', () => {
  const testHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

  it('renders truncated hash badge properly', () => {
    render(<FileChecksumBadge hash={testHash} />);
    const hashText = screen.getByTestId('checksum-hash-text');
    expect(hashText.textContent).toContain('b94d27...efcde9');
  });

  it('handles copy button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<FileChecksumBadge hash={testHash} />);
    const copyBtn = screen.getByLabelText(/copy sha-256 hash/i);
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(testHash);
  });

  it('toggles verification panel when clicked', () => {
    render(<FileChecksumBadge hash={testHash} fileName="contract.pdf" />);

    expect(screen.queryByTestId('verification-panel')).toBeNull();

    const toggle = screen.getByTestId('verify-integrity-toggle');
    fireEvent.click(toggle);

    expect(screen.getByTestId('verification-panel')).not.toBeNull();
    expect(screen.getByText(/contract\.pdf/i)).not.toBeNull();
  });

  it('verifies matching file and displays success confirmation', async () => {
    render(<FileChecksumBadge hash={testHash} />);

    // Open panel
    fireEvent.click(screen.getByTestId('verify-integrity-toggle'));

    // Matching content "hello world" hashes to testHash
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('checksum-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('match-success-icon')).not.toBeNull();
      expect(screen.getByText(/Checksum matches!/i)).not.toBeNull();
    });
  });

  it('displays warning when uploaded file has mismatched hash', async () => {
    render(<FileChecksumBadge hash={testHash} />);

    // Open panel
    fireEvent.click(screen.getByTestId('verify-integrity-toggle'));

    // Altered content
    const file = new File(['tampered altered content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('checksum-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('mismatch-alert-icon')).not.toBeNull();
      expect(screen.getByText(/Security warning: Checksum mismatch!/i)).not.toBeNull();
    });
  });
});
