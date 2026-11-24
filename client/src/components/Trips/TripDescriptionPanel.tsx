import { Check, Pencil, X } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useTranslation } from '../../i18n';
import type { Trip } from '../../types';
import { INPUT } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import { SafeMarkdown } from '../shared/SafeMarkdown';
import { useToast } from '../shared/Toast';

interface TripDescriptionPanelProps {
  trip: Trip | null;
  canEdit: boolean;
  onSave: (data: { description: string | null }) => Promise<void>;
}

const BTN: CSSProperties = {
  appearance: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 14px',
  borderRadius: 10,
  fontWeight: 500,
  ...fs(13, 'body'),
};

export default function TripDescriptionPanel({ trip, canEdit, onSave }: TripDescriptionPanelProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const description = trip?.description ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(description);
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const save = async () => {
    setSaving(true);
    try {
      await onSave({ description: draft.trim() || null });
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('trip.description.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[760px] py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-content" style={{ ...fs(18, 'subtitle'), fontWeight: 600, letterSpacing: '-0.01em' }}>
          {t('trip.tabs.beschreibung')}
        </h2>
        {!editing && canEdit && (
          <button type="button" onClick={startEdit} className="bg-surface-tertiary text-content" style={BTN}>
            <Pencil size={14} strokeWidth={2} />
            {description ? t('common.edit') : t('trip.description.add')}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={14}
            placeholder={t('dashboard.tripDescriptionPlaceholder')}
            className={`${INPUT} resize-y`}
            style={{ minHeight: 240, lineHeight: 1.6 }}
          />
          <p className="text-content-faint" style={{ ...fs(12, 'body'), margin: '8px 0 12px' }}>
            {t('trip.description.markdownHint')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void save();
              }}
              disabled={saving}
              className="bg-accent text-accent-text disabled:opacity-50"
              style={BTN}
            >
              <Check size={14} strokeWidth={2} />
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="bg-surface-tertiary text-content disabled:opacity-50"
              style={BTN}
            >
              <X size={14} strokeWidth={2} />
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : description ? (
        <div
          className="collab-note-md-full rounded-2xl bg-surface-card p-5 text-content"
          style={{ ...fs(14, 'body'), lineHeight: 1.7 }}
        >
          <SafeMarkdown>{description}</SafeMarkdown>
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-card p-7 text-center text-content-muted" style={fs(13, 'body')}>
          {t('trip.description.empty')}
        </div>
      )}
    </div>
  );
}
