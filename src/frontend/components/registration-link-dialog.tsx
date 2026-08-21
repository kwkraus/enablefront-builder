'use client'

import { useId, useRef, useState } from 'react'
import { Dialog, FormControl, TextInput } from '@primer/react'
import { validateRegistrationUrl } from '@/lib/registration-url'

interface RegistrationLinkDialogProps {
  /** Whether the dialog is currently open. Renders nothing when false. */
  open: boolean
  /** The session's current registration URL, or null when none is set. Used to prefill the field for edits. */
  initialValue: string | null
  /** Called with the normalized URL (or null to clear) when the owner chooses Done with a valid value. */
  onSave: (value: string | null) => void
  /** Called when the owner cancels or dismisses the dialog (Escape, backdrop, Cancel button, close button). Discards unsaved changes. */
  onCancel: () => void
}

/**
 * Reusable Add/Edit Registration Link modal shared by session create and edit
 * surfaces. Provides a labeled URL field with inline validation as the value
 * changes or on blur, and explicit Done/Cancel actions instead of an
 * always-visible full-width URL textbox (FR-016, FR-017).
 *
 * Backend validation remains authoritative on the containing session save;
 * this dialog only prevents obviously invalid values from being confirmed so
 * the owner gets immediate feedback (Decision 6, research.md).
 */
export function RegistrationLinkDialog({
  open,
  initialValue,
  onSave,
  onCancel,
}: RegistrationLinkDialogProps) {
  const [value, setValue] = useState(initialValue ?? '')
  const [touched, setTouched] = useState(false)
  // Tracks whether we've already reset local state for the current "open" transition.
  // Adjusting state during render (rather than in a useEffect) avoids an extra
  // render pass and cascading-render lint warnings; see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [wasOpen, setWasOpen] = useState(open)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  if (open && !wasOpen) {
    setWasOpen(true)
    setValue(initialValue ?? '')
    setTouched(false)
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  if (!open) return null

  const { error } = validateRegistrationUrl(value)
  const showError = touched && error !== null

  function commit() {
    setTouched(true)
    const result = validateRegistrationUrl(value)
    if (result.error) return
    onSave(result.value)
  }

  return (
    <Dialog
      title={initialValue ? 'Edit Registration Link' : 'Add Registration Link'}
      subtitle="Paste the webinar registration URL from your conferencing provider (Teams, Zoom, Webex, or any other provider)."
      onClose={onCancel}
      initialFocusRef={inputRef}
      footerButtons={[
        {
          content: 'Cancel',
          onClick: onCancel,
        },
        {
          content: 'Done',
          buttonType: 'primary',
          onClick: commit,
          disabled: touched && error !== null,
        },
      ]}
    >
      <FormControl>
        <FormControl.Label>Registration URL</FormControl.Label>
        <TextInput
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder="https://teams.microsoft.com/registration/example"
          block
          aria-label="Registration URL"
          aria-describedby={showError ? errorId : undefined}
          aria-invalid={showError ? true : undefined}
          validationStatus={showError ? 'error' : undefined}
        />
        {showError && (
          <FormControl.Validation id={errorId} variant="error">
            {error}
          </FormControl.Validation>
        )}
      </FormControl>
    </Dialog>
  )
}
