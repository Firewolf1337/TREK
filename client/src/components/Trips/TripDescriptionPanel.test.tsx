// FE-COMP-TRIPDESC-001 to FE-COMP-TRIPDESC-006

import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildTrip } from '../../../tests/helpers/factories';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import TripDescriptionPanel from './TripDescriptionPanel';

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const renderPanel = (
  overrides: {
    description?: string | null;
    canEdit?: boolean;
    onSave?: (data: { description: string | null }) => Promise<void>;
  } = {}
) => {
  const onSave = overrides.onSave ?? vi.fn().mockResolvedValue(undefined);
  render(
    <TripDescriptionPanel
      trip={buildTrip({ description: overrides.description ?? null })}
      canEdit={overrides.canEdit ?? true}
      onSave={onSave}
    />
  );
  return { onSave };
};

describe('TripDescriptionPanel', () => {
  it('FE-COMP-TRIPDESC-001: renders the description as formatted markdown', () => {
    renderPanel({ description: '# Japan\n\n**Two** weeks' });
    expect(screen.getByRole('heading', { name: 'Japan' })).toBeInTheDocument();
    expect(screen.getByText('Two').tagName).toBe('STRONG');
  });

  it('FE-COMP-TRIPDESC-002: shows the empty state and an add button when there is no description', () => {
    renderPanel({ description: null });
    expect(screen.getByText('No description yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add description/ })).toBeInTheDocument();
  });

  it('FE-COMP-TRIPDESC-003: hides the edit button without the trip_edit right', () => {
    renderPanel({ description: 'text', canEdit: false });
    expect(screen.queryByRole('button', { name: /Edit/ })).toBeNull();
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('FE-COMP-TRIPDESC-004: the edit button opens the raw markdown in a textarea, cancel leaves without saving', async () => {
    const { onSave } = renderPanel({ description: '# Japan' });
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('# Japan');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'changed');
    await userEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Japan' })).toBeInTheDocument();
  });

  it('FE-COMP-TRIPDESC-005: save sends the trimmed description and leaves edit mode', async () => {
    const { onSave } = renderPanel({ description: 'old' });
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, '  **new** text  ');
    await userEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ description: '**new** text' }));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  });

  it('FE-COMP-TRIPDESC-006: an emptied description saves as null, a failed save keeps edit mode and toasts', async () => {
    const onSave = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce(undefined);
    renderPanel({ description: 'old', onSave });
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith({ description: null }));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  });
});
