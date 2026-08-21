'use client'

import { useState } from 'react'
import { PencilIcon, PlusIcon } from '@primer/octicons-react'
import { Button, IconButton } from '@primer/react'
import { SeriesDetailsEditor } from '@/components/series-details-editor'
import { hasSeriesDetails, renderSeriesDetailsHtml } from '@/lib/series-details-html'

export interface SeriesDetailsProps {
  /** Sanitized details HTML from the server, or `null` when none are saved. */
  value: string | null
  /**
   * Whether the current user may add/edit details. The backend's
   * GET/PUT `/api/v1/series/{id}` only ever returns a series to its owner
   * (see specs/001-series-details/research.md Decision 4) -- there is no
   * separate non-owner "viewer" role today, so every caller that can load
   * this page can also edit it. This flag is threaded through explicitly
   * (rather than assumed inline) so a future access model only needs to
   * change the single call site that computes it.
   */
  canEdit: boolean
  onSave: (nextValue: string) => Promise<void>
  saving?: boolean
  disabled?: boolean
}

/**
 * Series Details section: sanitized read-only rendering for any viewer, plus
 * an accessible add/edit affordance and headless editor for users who can
 * edit the series. Read-only, non-editing users never see an empty "add
 * details" prompt when no details exist (FR-008 / series-details-ui.md).
 */
export function SeriesDetails({
  value,
  canEdit,
  onSave,
  saving = false,
  disabled = false,
}: SeriesDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const hasDetails = hasSeriesDetails(value)

  if (!canEdit && !hasDetails) {
    return null
  }

  async function handleEditorSave(nextValueHtml: string) {
    try {
      await onSave(nextValueHtml)
      setIsEditing(false)
    } catch {
      // The parent (series-detail-view.tsx) surfaces the failure via an error
      // banner and keeps `saving` false; staying in edit mode here retains the
      // in-progress draft rather than discarding it.
    }
  }

  return (
    <section aria-label="Series details">
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--fgColor-muted)' }}
        >
          Details
        </h2>
        {canEdit && !isEditing && hasDetails && (
          <IconButton
            icon={PencilIcon}
            aria-label="Edit series details"
            variant="invisible"
            size="small"
            disabled={disabled}
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>

      {isEditing ? (
        <SeriesDetailsEditor
          initialValue={value ?? ''}
          onSave={handleEditorSave}
          onCancel={() => setIsEditing(false)}
          disabled={disabled}
          saving={saving}
        />
      ) : hasDetails ? (
        <div
          className="max-w-none text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_li]:mb-1"
        >
          {renderSeriesDetailsHtml(value as string)}
        </div>
      ) : (
        <Button
          variant="invisible"
          size="small"
          leadingVisual={PlusIcon}
          disabled={disabled}
          onClick={() => setIsEditing(true)}
          className="px-0"
        >
          Add details
        </Button>
      )}
    </section>
  )
}
