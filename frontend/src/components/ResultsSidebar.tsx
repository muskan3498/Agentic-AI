import React, { useEffect, useState } from 'react'
import { useProjectDescriptionStore } from '../store/projectDescriptionStore'
import type { RunResult } from '../types'
import { ScoreGauge } from './ScoreGauge'
import { ScoreDimensionBar } from './ScoreDimensionBar'
import styles from './ResultsSidebar.module.css'

interface Props {
  result: RunResult | null
  isRunning: boolean
}

const DIMENSION_LABELS: Record<string, string> = {
  persona:         'Persona Adherence',
  policy:          'Policy Accuracy',
  empathy:         'Empathy & Tone',
  context:         'Context Awareness',
  actionability:   'Actionability',
  personalization: 'Personalization',
  hallucination:   'No Hallucination',
  completeness:    'Completeness',
}

interface EditableDimension {
  id: string
  key: string
  label: string
  score: number
}

interface DimensionTemplate {
  key: string
  label: string
}

function getProjectDrivenTemplates(projectDescription: string): DimensionTemplate[] {
  const text = projectDescription.trim().toLowerCase()

  if (!text) {
    return [
      { key: 'persona', label: 'Persona Adherence' },
      { key: 'policy', label: 'Policy Accuracy' },
      { key: 'empathy', label: 'Empathy & Tone' },
      { key: 'context', label: 'Context Awareness' },
      { key: 'actionability', label: 'Actionability' },
      { key: 'personalization', label: 'Personalization' },
      { key: 'hallucination', label: 'No Hallucination' },
      { key: 'completeness', label: 'Completeness' },
    ]
  }

  if (/(chatbot|assistant|support|customer|service|conversation|helpdesk)/.test(text)) {
    return [
      { key: 'persona', label: 'Brand Voice Fit' },
      { key: 'policy', label: 'Resolution Accuracy' },
      { key: 'empathy', label: 'Empathy & Tone' },
      { key: 'context', label: 'Conversation Continuity' },
      { key: 'actionability', label: 'Next-Step Clarity' },
      { key: 'personalization', label: 'Customer Personalization' },
      { key: 'hallucination', label: 'Policy Safety' },
      { key: 'completeness', label: 'Resolution Completeness' },
    ]
  }

  if (/(dashboard|analytics|report|bi|insight|metrics|data visualization|visualization)/.test(text)) {
    return [
      { key: 'persona', label: 'Goal Alignment' },
      { key: 'policy', label: 'Data Accuracy' },
      { key: 'empathy', label: 'Narrative Clarity' },
      { key: 'context', label: 'Context Coverage' },
      { key: 'actionability', label: 'Insight Actionability' },
      { key: 'personalization', label: 'Audience Relevance' },
      { key: 'hallucination', label: 'Trustworthiness' },
      { key: 'completeness', label: 'Reporting Completeness' },
    ]
  }

  if (/(api|developer|sdk|documentation|agent|workflow|automation|platform)/.test(text)) {
    return [
      { key: 'persona', label: 'Developer Experience' },
      { key: 'policy', label: 'API Correctness' },
      { key: 'empathy', label: 'Instruction Clarity' },
      { key: 'context', label: 'Workflow Awareness' },
      { key: 'actionability', label: 'Implementation Guidance' },
      { key: 'personalization', label: 'Use-Case Fit' },
      { key: 'hallucination', label: 'Technical Reliability' },
      { key: 'completeness', label: 'Integration Completeness' },
    ]
  }

  if (/(commerce|ecommerce|checkout|store|shopping|cart|payment|product)/.test(text)) {
    return [
      { key: 'persona', label: 'Brand Confidence' },
      { key: 'policy', label: 'Product Accuracy' },
      { key: 'empathy', label: 'Message Clarity' },
      { key: 'context', label: 'Shopping Context' },
      { key: 'actionability', label: 'Conversion Guidance' },
      { key: 'personalization', label: 'Recommendation Fit' },
      { key: 'hallucination', label: 'Trust & Safety' },
      { key: 'completeness', label: 'Journey Completeness' },
    ]
  }

  if (/(education|learning|course|tutor|student|teach|lesson)/.test(text)) {
    return [
      { key: 'persona', label: 'Teaching Style Fit' },
      { key: 'policy', label: 'Concept Accuracy' },
      { key: 'empathy', label: 'Explanation Clarity' },
      { key: 'context', label: 'Learner Context' },
      { key: 'actionability', label: 'Practice Guidance' },
      { key: 'personalization', label: 'Learner Personalization' },
      { key: 'hallucination', label: 'Factual Safety' },
      { key: 'completeness', label: 'Lesson Completeness' },
    ]
  }

  return [
    { key: 'persona', label: 'Goal Alignment' },
    { key: 'policy', label: 'Accuracy' },
    { key: 'empathy', label: 'Clarity' },
    { key: 'context', label: 'Context Fit' },
    { key: 'actionability', label: 'Actionability' },
    { key: 'personalization', label: 'Audience Fit' },
    { key: 'hallucination', label: 'Reliability' },
    { key: 'completeness', label: 'Completeness' },
  ]
}

export function ResultsSidebar({ result, isRunning }: Props): React.ReactElement {
  const [isEditingBreakdown, setIsEditingBreakdown] = useState(false)
  const [editableDimensions, setEditableDimensions] = useState<EditableDimension[]>([])
  const projectDescription = useProjectDescriptionStore((state) => state.description)

  const buildDimensions = (nextResult: RunResult): EditableDimension[] =>
    getProjectDrivenTemplates(projectDescription).map(({ key, label }) => ({
      id: key,
      key,
      label: label || DIMENSION_LABELS[key] || key,
      score: nextResult.score_breakdown[key as keyof typeof nextResult.score_breakdown],
    }))

  useEffect(() => {
    if (!result) {
      setEditableDimensions([])
      setIsEditingBreakdown(false)
      return
    }

    setEditableDimensions(buildDimensions(result))
    setIsEditingBreakdown(false)
  }, [result, projectDescription])

  const addDimension = () => {
    setEditableDimensions((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        key: '',
        label: 'New Parameter',
        score: 3,
      },
    ])
  }

  const updateDimension = (id: string, patch: Partial<EditableDimension>) => {
    setEditableDimensions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeDimension = (id: string) => {
    setEditableDimensions((prev) => prev.filter((item) => item.id !== id))
  }

  const handleCancelEdit = () => {
    if (result) {
      setEditableDimensions(buildDimensions(result))
    }
    setIsEditingBreakdown(false)
  }

  return (
    <div className={styles.sidebar}>
      {/* Panel header */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Results</span>
      </div>

      {isRunning && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Running evaluation…</span>
        </div>
      )}

      {!isRunning && !result && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyText}>
            Configure layers and click <strong>Run</strong> to evaluate.
          </p>
        </div>
      )}

      {!isRunning && result && (
        <>
          {/* Score gauge + meta */}
          <div className={styles.scoreCard}>
            <ScoreGauge score={result.quality_score} max={result.score_max} />
            <div className={styles.scoreMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Run</span>
                <span className={styles.metaValue}>#{result.run_number}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tokens</span>
                <span className={styles.metaValue}>{result.total_tokens.toLocaleString()}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Layers</span>
                <span className={styles.metaValue}>{result.active_layers.length}</span>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Score Breakdown</span>
              <div className={styles.cardActions}>
                {!isEditingBreakdown ? (
                  <button
                    type="button"
                    className={styles.cardActionBtn}
                    onClick={() => setIsEditingBreakdown(true)}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button type="button" className={styles.cardIconBtn} onClick={addDimension} aria-label="Add parameter">
                      +
                    </button>
                    <button
                      type="button"
                      className={styles.cardActionBtn}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles.cardActionBtn} ${styles.cardActionBtnPrimary}`}
                      onClick={() => setIsEditingBreakdown(false)}
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.dimensions}>
                {isEditingBreakdown ? (
                  editableDimensions.map((item) => (
                    <div key={item.id} className={styles.editRow}>
                      <input
                        className={styles.dimensionInput}
                        value={item.label}
                        onChange={(event) => updateDimension(item.id, { label: event.target.value })}
                        placeholder="Parameter name"
                      />
                      <input
                        type="number"
                        min={0}
                        max={5}
                        className={styles.scoreInput}
                        value={item.score}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10)
                          updateDimension(item.id, { score: Number.isNaN(next) ? 0 : Math.max(0, Math.min(5, next)) })
                        }}
                      />
                      <span className={styles.scoreSuffix}>/5</span>
                      <button
                        type="button"
                        className={styles.cardIconBtn}
                        onClick={() => removeDimension(item.id)}
                        aria-label={`Remove ${item.label || 'parameter'}`}
                      >
                        -
                      </button>
                    </div>
                  ))
                ) : (
                  editableDimensions.map((item) => (
                    <ScoreDimensionBar
                      key={item.id}
                      label={item.label}
                      score={item.score}
                      max={5}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className={styles.insightBox}>
            <div className={styles.insightHeader}>
              <span className={styles.insightIcon}>💡</span>
              <span className={styles.insightTitle}>Insight</span>
            </div>
            <p className={styles.insight}>{result.insight}</p>
          </div>
        </>
      )}
    </div>
  )
}
