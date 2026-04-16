import React from 'react'
import styles from './Toolbar.module.css'

interface Props {
  isRunning: boolean
  isAssembling: boolean
  showAssembledPrompt: boolean
  onRun: () => void
  onAssemble: () => void
  onToggleAssembledPrompt: () => void
  onConfigure: () => void
  onProjectDescription: () => void
  onUploadProjectDescription: (content: string) => void
  totalTokens: number
  enabledLayerCount: number
}

export function Toolbar({
  isRunning,
  isAssembling,
  showAssembledPrompt,
  onRun,
  onAssemble,
  onToggleAssembledPrompt,
  onConfigure,
  onProjectDescription,
  onUploadProjectDescription,
  totalTokens: _totalTokens,
  enabledLayerCount,
}: Props): React.ReactElement {
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    onUploadProjectDescription(text)
    event.target.value = ''
  }

  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.appIcon}>[]</div>
        <div className={styles.titleGroup}>
          <span className={styles.appName}>AI Response Evaluator</span>
        </div>
      </div>

      <div className={styles.right}>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onConfigure} type="button">
          Configure
        </button>

        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onProjectDescription} type="button">
          Project Description
        </button>

        <label className={`${styles.btn} ${styles.btnSecondary} ${styles.uploadBtn}`}>
          Upload
          <input
            className={styles.hiddenInput}
            type="file"
            accept=".txt,.md,.json,.csv,.doc,.docx"
            onChange={handleUpload}
          />
        </label>

        <button
          className={`${styles.btn} ${styles.btnAccent}`}
          onClick={onToggleAssembledPrompt}
          type="button"
        >
          {showAssembledPrompt ? 'Hide Prompt' : 'View Prompt'}
        </button>

        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onAssemble}
          disabled={isAssembling}
          type="button"
        >
          {isAssembling ? 'Assembling...' : 'Assemble'}
        </button>

        <button
          className={`${styles.btn} ${styles.runBtn}`}
          onClick={onRun}
          disabled={isRunning}
          type="button"
        >
          {isRunning ? (
            <>
              <div className={styles.spinner} />
              Running...
            </>
          ) : (
            `Run with ${enabledLayerCount} Layer${enabledLayerCount !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </header>
  )
}
