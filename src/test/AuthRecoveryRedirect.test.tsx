import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthRecoveryRedirect } from '@/components/AuthRecoveryRedirect';

let capturedCallback: ((event: string) => void) | null = null;
const unsubscribe = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (event: string) => void) => {
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe } } };
      },
    },
  },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthRecoveryRedirect />
      <Routes>
        <Route path="*" element={<div data-testid="path-marker">{path}</div>} />
        <Route path="/reset-password" element={<div data-testid="reset-page">reset page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthRecoveryRedirect', () => {
  beforeEach(() => {
    capturedCallback = null;
    unsubscribe.mockClear();
  });

  it('redirects to /reset-password when a PASSWORD_RECOVERY event fires on another page', async () => {
    const { getByTestId } = renderAt('/');
    expect(capturedCallback).not.toBeNull();

    act(() => { capturedCallback!('PASSWORD_RECOVERY'); });

    await waitFor(() => {
      expect(getByTestId('reset-page')).toBeTruthy();
    });
  });

  it('does not redirect for unrelated auth events', async () => {
    const { queryByTestId } = renderAt('/');
    act(() => { capturedCallback!('SIGNED_IN'); });
    await new Promise((r) => setTimeout(r, 0));
    expect(queryByTestId('reset-page')).toBeNull();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderAt('/');
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
