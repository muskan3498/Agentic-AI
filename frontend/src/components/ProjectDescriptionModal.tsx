import React, { useEffect, useState } from 'react'
import { Modal } from './Modal'
import styles from './ProjectDescriptionModal.module.css'

interface Props {
  isOpen: boolean
  description: string
  onSave: (description: string) => void
  onClose: () => void
}

export function ProjectDescriptionModal({
  isOpen,
  description,
  onSave,
  onClose,
}: Props): React.ReactElement | null {
  const [draft, setDraft] = useState(description)

  useEffect(() => {
    setDraft(description)
  }, [description, isOpen])

  const handleSave = () => onSave(draft)

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="760px">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Project Description</div>
          <div className={styles.subtitle}>
            Describe your project here and save it for later.
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
      </div>

      <div className={styles.body}>
        <label className={styles.label} htmlFor="project-description-input">
          Description
        </label>
        <textarea
          id="project-description-input"
          className={styles.textarea}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Enter your project description here..."
          spellCheck={false}
        />
        <div className={styles.helper}>
          This is saved locally for now and can be updated anytime.
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.charCount}>{draft.length} characters</span>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} type="button">Save</button>
        </div>
      </div>
    </Modal>
  )
}
