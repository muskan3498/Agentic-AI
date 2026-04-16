import React, { useEffect, useState } from 'react'
import { contextConnectionApi } from '../api/contextConnectionApi'
import type {
  ActualDataConfig,
  ActualDataConnection,
  ActualDataInputMode,
  DataSource,
  LLMConfig,
  LLMProvider,
} from '../store/llmConfigStore'
import { Modal } from './Modal'
import styles from './ConfigureModal.module.css'

interface Props {
  isOpen: boolean
  config: LLMConfig
  onSave: (config: LLMConfig) => void
  onUpdateConfig: (config: LLMConfig) => void
  onClose: () => void
}

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'mock', label: 'Mock Provider' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'nvidia', label: 'NVIDIA' },
]

const DATA_SOURCES: { value: DataSource; label: string }[] = [
  { value: 'dummy', label: 'Dummy' },
  { value: 'actual', label: 'Actual Data' },
]

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro']
const OPENAI_MODELS = ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o']
const NVIDIA_MODELS = [
  'meta/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x7b-instruct-v0.1',
  'google/gemma-3-27b-it',
  'openai/gpt-oss-120b',
]

const ACTUAL_DATA_FIELDS: { key: keyof ActualDataConfig; label: string; placeholder: string }[] = [
  {
    key: 'system',
    label: 'System Instructions',
    placeholder: 'Paste the input for System Instructions...',
  },
  {
    key: 'history',
    label: 'Conversation History',
    placeholder: 'Paste the input for Conversation History...',
  },
  {
    key: 'knowledge',
    label: 'Retrieved Knowledge',
    placeholder: 'Paste the input for Retrieved Knowledge...',
  },
  {
    key: 'tools',
    label: 'Tool Definitions',
    placeholder: 'Paste the input for Tool Definitions...',
  },
  {
    key: 'state',
    label: 'State & Memory',
    placeholder: 'Paste the input for State & Memory...',
  },
]

function createConnection(): ActualDataConnection {
  return {
    id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    curlCommand: '',
    lastStatus: 'idle',
    lastMessage: 'No connection test run yet.',
  }
}

function ApiKeyField({
  label,
  value,
  placeholder,
  helper,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  helper?: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  const masked = value ? '*'.repeat(Math.min(value.length, 20)) : ''

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          type={show ? 'text' : 'password'}
          className={styles.input}
          value={show ? value : (value ? masked : '')}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide key' : 'Show key'}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {helper && <div className={styles.helper}>{helper}</div>}
    </div>
  )
}

function ModelSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export function ConfigureModal({
  isOpen,
  config,
  onSave,
  onUpdateConfig,
  onClose,
}: Props): React.ReactElement | null {
  const [draft, setDraft] = useState<LLMConfig>({ ...config })
  const [testingIds, setTestingIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setDraft({ ...config })
  }, [config])

  const update = <K extends keyof LLMConfig>(key: K, value: LLMConfig[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const updateActualData = (key: keyof ActualDataConfig, value: string) =>
    setDraft((prev) => ({
      ...prev,
      actualData: {
        ...prev.actualData,
        [key]: value,
      },
    }))

  const updateConnection = (
    layerKey: keyof ActualDataConfig,
    connectionId: string,
    updater: (connection: ActualDataConnection) => ActualDataConnection,
  ) => {
    setDraft((prev) => ({
      ...prev,
      actualDataConnections: {
        ...prev.actualDataConnections,
        [layerKey]: prev.actualDataConnections[layerKey].map((connection) =>
          connection.id === connectionId ? updater(connection) : connection,
        ),
      },
    }))
  }

  const setInputMode = (key: keyof ActualDataConfig, mode: ActualDataInputMode) =>
    setDraft((prev) => ({
      ...prev,
      actualDataInputMode: {
        ...prev.actualDataInputMode,
        [key]: prev.actualDataInputMode[key] === mode ? null : mode,
      },
    }))

  const persistConfig = (nextDraft: LLMConfig) => {
    setDraft(nextDraft)
    onUpdateConfig(nextDraft)
  }

  const handleManualSave = (key: keyof ActualDataConfig) => {
    const nextDraft = {
      ...draft,
      dataSource: 'actual' as const,
      actualDataInputMode: {
        ...draft.actualDataInputMode,
        [key]: 'manual' as const,
      },
      actualData: {
        ...draft.actualData,
        [key]: draft.actualData[key],
      },
    }
    persistConfig(nextDraft)
  }

  const addConnection = (key: keyof ActualDataConfig) => {
    setDraft((prev) => ({
      ...prev,
      actualDataInputMode: {
        ...prev.actualDataInputMode,
        [key]: 'api',
      },
      actualDataConnections: {
        ...prev.actualDataConnections,
        [key]: [...prev.actualDataConnections[key], createConnection()],
      },
    }))
  }

  const removeConnection = (key: keyof ActualDataConfig, connectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      actualDataConnections: {
        ...prev.actualDataConnections,
        [key]: prev.actualDataConnections[key].filter((connection) => connection.id !== connectionId),
      },
    }))
  }

  const handleSaveConnections = (key: keyof ActualDataConfig) => {
    const nextDraft = {
      ...draft,
      actualDataInputMode: {
        ...draft.actualDataInputMode,
        [key]: 'api' as const,
      },
      actualDataConnections: {
        ...draft.actualDataConnections,
        [key]: [...draft.actualDataConnections[key]],
      },
    }
    persistConfig(nextDraft)
  }

  const handleTestConnection = async (key: keyof ActualDataConfig, connection: ActualDataConnection) => {
    const trimmed = connection.curlCommand.trim()
    if (!trimmed) {
      updateConnection(key, connection.id, (current) => ({
        ...current,
        lastStatus: 'error',
        lastMessage: 'Paste a curl command before testing.',
        lastStatusCode: undefined,
        lastResponsePreview: undefined,
      }))
      return
    }

    setTestingIds((prev) => ({ ...prev, [connection.id]: true }))

    try {
      const result = await contextConnectionApi.testConnection(trimmed)
      updateConnection(key, connection.id, (current) => ({
        ...current,
        lastStatus: result.ok ? 'success' : 'error',
        lastMessage: result.message,
        lastStatusCode: result.status_code,
        lastResponsePreview: result.response_preview,
      }))
    } catch (error) {
      updateConnection(key, connection.id, (current) => ({
        ...current,
        lastStatus: 'error',
        lastMessage: error instanceof Error ? error.message : 'Unable to test the endpoint.',
        lastStatusCode: undefined,
        lastResponsePreview: undefined,
      }))
    } finally {
      setTestingIds((prev) => ({ ...prev, [connection.id]: false }))
    }
  }

  const handleSave = () => onSave(draft)

  const p = draft.provider
  const dataSource = draft.dataSource

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="760px">
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Configure LLM</div>
          <div className={styles.subtitle}>
            Set API keys and choose the provider and model for response generation and scoring.
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.selectorGrid}>
            <div>
              <div className={styles.sectionLabel}>Provider</div>
              <div className={styles.providerRow}>
                {PROVIDERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.providerBtn}${p === value ? ` ${styles.providerBtnActive}` : ''}`}
                    onClick={() => update('provider', value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.sectionLabel}>Data</div>
              <div className={styles.providerRow}>
                {DATA_SOURCES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.providerBtn}${dataSource === value ? ` ${styles.providerBtnActive}` : ''}`}
                    onClick={() => update('dataSource', value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.statusLine}>
            Currently using: <strong>{PROVIDERS.find((x) => x.value === p)?.label ?? p}</strong>
            <span className={styles.statusDivider}>|</span>
            Data: <strong>{DATA_SOURCES.find((x) => x.value === dataSource)?.label ?? dataSource}</strong>
            {draft.enableLiveProvider && p !== 'mock' && (
              <span className={styles.liveChip}>live</span>
            )}
          </div>
        </div>

        {p === 'gemini' && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Gemini Configuration</div>
            <ApiKeyField
              label="Gemini API Key"
              value={draft.geminiApiKey}
              placeholder="Enter Gemini API key"
              helper="Required only if Gemini is selected and live provider is enabled."
              onChange={(v) => update('geminiApiKey', v)}
            />
            <ModelSelect
              label="Model"
              value={draft.geminiModel}
              options={GEMINI_MODELS}
              onChange={(v) => update('geminiModel', v)}
            />
          </div>
        )}

        {p === 'openai' && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>OpenAI Configuration</div>
            <ApiKeyField
              label="OpenAI API Key"
              value={draft.openaiApiKey}
              placeholder="sk-..."
              helper="Required only if OpenAI is selected and live provider is enabled."
              onChange={(v) => update('openaiApiKey', v)}
            />
            <ModelSelect
              label="Model"
              value={draft.openaiModel}
              options={OPENAI_MODELS}
              onChange={(v) => update('openaiModel', v)}
            />
          </div>
        )}

        {p === 'nvidia' && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>NVIDIA Configuration</div>
            <ApiKeyField
              label="NVIDIA API Key"
              value={draft.nvidiaApiKey}
              placeholder="Enter NVIDIA API key"
              helper="Required only if NVIDIA is selected and live provider is enabled."
              onChange={(v) => update('nvidiaApiKey', v)}
            />
            <ModelSelect
              label="Model"
              value={draft.nvidiaModel}
              options={NVIDIA_MODELS}
              onChange={(v) => update('nvidiaModel', v)}
            />
          </div>
        )}

        {dataSource === 'actual' && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Actual Data Inputs</div>
            <div className={styles.actualDataIntro}>
              Use the handwritten action to save layer text into the left-side context layer cards.
              Use <strong>connect api</strong> to keep curl commands for external endpoints and test them.
            </div>
            <div className={styles.actualDataGrid}>
              {ACTUAL_DATA_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className={styles.actualDataPanel}>
                  <div className={styles.actualDataPanelHeader}>
                    <span className={styles.actualDataPanelTitleWrap}>
                      <span className={styles.actualDataPanelTitle}>{label}</span>
                    </span>

                    <div className={styles.actualDataActions}>
                      <button
                        type="button"
                        className={`${styles.handwrittenAction}${draft.actualDataInputMode[key] === 'manual' ? ` ${styles.actionActive}` : ''}`}
                        onClick={() => setInputMode(key, 'manual')}
                        aria-label={`Open handwritten input for ${label}`}
                      >
                        <svg viewBox="0 0 24 24" className={styles.handwrittenIconSvg}>
                          <path
                            d="M5 16.5c1.8-1.5 3.4-4.4 5.9-5.6 1.5-.7 2.7 1.1 4 .8 1.5-.4 2.6-2.8 4.1-2.1 1.1.6-.2 2.5-.8 3.4-1.3 1.9-2.7 3.8-4 5.7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M4.5 18.7c2.5.5 4.9.9 7.5.8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={`${styles.connectApiPill} ${draft.actualDataInputMode[key] === 'api' ? styles.actionActive : ''}`}
                        onClick={() => setInputMode(key, 'api')}
                      >
                        connect api
                      </button>
                    </div>
                  </div>

                  <div className={styles.actualDataPanelBody}>
                      {draft.actualDataInputMode[key] === 'manual' && (
                        <div className={styles.actionPanel}>
                          <div className={styles.actionPanelHeader}>
                            <div className={styles.actionPanelTitle}>Handwritten Input</div>
                            <button
                              type="button"
                              className={styles.inlineSaveBtn}
                              onClick={() => handleManualSave(key)}
                            >
                              save text
                            </button>
                          </div>
                          <textarea
                            className={styles.textarea}
                            value={draft.actualData[key]}
                            placeholder={placeholder}
                            onChange={(e) => updateActualData(key, e.target.value)}
                            spellCheck={false}
                          />
                          <div className={styles.helper}>
                            Saved text updates the matching context layer card on the left immediately.
                          </div>
                        </div>
                      )}

                      {draft.actualDataInputMode[key] === 'api' && (
                        <div className={styles.actionPanel}>
                          <div className={styles.actionPanelHeader}>
                            <div className={styles.actionPanelTitle}>Connect API</div>
                            <div className={styles.apiHeaderActions}>
                              <button
                                type="button"
                                className={styles.addConnectionBtn}
                                onClick={() => addConnection(key)}
                                aria-label={`Add another endpoint for ${label}`}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                className={styles.inlineSaveBtn}
                                onClick={() => handleSaveConnections(key)}
                              >
                                save endpoints
                              </button>
                            </div>
                          </div>

                          {draft.actualDataConnections[key].length === 0 && (
                            <div className={styles.emptyConnectionState}>
                              No endpoints added yet. Click + to add a curl command.
                            </div>
                          )}

                          {draft.actualDataConnections[key].map((connection, index) => (
                            <div key={connection.id} className={styles.connectionCard}>
                              <div className={styles.connectionCardHeader}>
                                <div className={styles.connectionLabel}>Endpoint {index + 1}</div>
                                <button
                                  type="button"
                                  className={styles.removeConnectionBtn}
                                  onClick={() => removeConnection(key, connection.id)}
                                >
                                  remove
                                </button>
                              </div>
                              <textarea
                                className={`${styles.textarea} ${styles.connectionTextarea}`}
                                value={connection.curlCommand}
                                placeholder={'curl https://api.example.com/context -X POST -H "Authorization: Bearer ..." -d "{\\"query\\":\\"hello\\"}"'}
                                onChange={(e) => updateConnection(key, connection.id, (current) => ({
                                  ...current,
                                  curlCommand: e.target.value,
                                  lastStatus: 'idle',
                                  lastMessage: 'Connection changed. Run test connection again.',
                                  lastStatusCode: undefined,
                                  lastResponsePreview: undefined,
                                }))}
                                spellCheck={false}
                              />
                              <div className={styles.connectionActions}>
                                <button
                                  type="button"
                                  className={styles.testConnectionBtn}
                                  onClick={() => void handleTestConnection(key, connection)}
                                  disabled={testingIds[connection.id]}
                                >
                                  {testingIds[connection.id] ? 'testing...' : 'test connection'}
                                </button>
                              </div>
                              <div className={`${styles.connectionStatus} ${styles[`status${connection.lastStatus.charAt(0).toUpperCase()}${connection.lastStatus.slice(1)}`]}`}>
                                <div className={styles.connectionStatusText}>
                                  {connection.lastStatusCode ? `[${connection.lastStatusCode}] ` : ''}
                                  {connection.lastMessage}
                                </div>
                                {connection.lastResponsePreview && (
                                  <pre className={styles.connectionPreview}>{connection.lastResponsePreview}</pre>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {draft.actualDataInputMode[key] === null && (
                        <div className={styles.helper}>
                          Pick one source for this layer: handwritten input or connect api.
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Generation Settings</div>
          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.label}>Temperature</label>
              <input
                type="number"
                className={styles.input}
                value={draft.temperature}
                min={0}
                max={2}
                step={0.1}
                onChange={(e) => update('temperature', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max Output Tokens</label>
              <input
                type="number"
                className={styles.input}
                value={draft.maxOutputTokens}
                min={100}
                max={8000}
                step={100}
                onChange={(e) => update('maxOutputTokens', parseInt(e.target.value, 10) || 1200)}
              />
            </div>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Enable live provider use</div>
              <div className={styles.toggleHelper}>
                When disabled, the app uses mock/demo responses even if keys are saved.
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={draft.enableLiveProvider}
                onChange={(e) => update('enableLiveProvider', e.target.checked)}
              />
              <span className={`${styles.toggleTrack}${draft.enableLiveProvider ? ` ${styles.toggleOn}` : ''}`}>
                <span className={styles.toggleThumb} />
              </span>
            </label>
          </div>
        </div>

        <div className={styles.notice}>
          <span className={styles.noticeIcon}>i</span>
          <span className={styles.noticeText}>
            Curl testing uses the local backend as a proxy, so saved endpoints are for validation only right now.
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
        <button className={styles.saveBtn} onClick={handleSave} type="button">Save Keys</button>
      </div>
    </Modal>
  )
}
