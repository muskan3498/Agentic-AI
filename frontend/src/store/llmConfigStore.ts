import { create } from 'zustand'

export type LLMProvider = 'mock' | 'gemini' | 'openai' | 'nvidia'
export type DataSource = 'dummy' | 'actual'
export type CodingMode = 'vibe' | 'agentic'

export interface ActualDataConfig {
  system: string
  history: string
  knowledge: string
  tools: string
  state: string
}

export interface ActualDataConnection {
  id: string
  curlCommand: string
  lastStatus: 'idle' | 'success' | 'error'
  lastMessage: string
  lastStatusCode?: number
  lastResponsePreview?: string
}

export type ActualDataConnectionMap = Record<keyof ActualDataConfig, ActualDataConnection[]>
export type ActualDataInputMode = 'manual' | 'api' | null
export type ActualDataInputModeMap = Record<keyof ActualDataConfig, ActualDataInputMode>

export interface LLMConfig {
  provider: LLMProvider
  dataSource: DataSource
  actualData: ActualDataConfig
  actualDataConnections: ActualDataConnectionMap
  actualDataInputMode: ActualDataInputModeMap
  geminiApiKey: string
  geminiModel: string
  openaiApiKey: string
  openaiModel: string
  nvidiaApiKey: string
  nvidiaModel: string
  temperature: number
  maxOutputTokens: number
  enableLiveProvider: boolean
}

interface LLMConfigStore {
  config: LLMConfig
  isConfigureOpen: boolean
  codingMode: CodingMode
  openConfigure: () => void
  closeConfigure: () => void
  saveConfig: (config: LLMConfig) => void
  updateConfig: (config: LLMConfig) => void
  setCodingMode: (mode: CodingMode) => void
}

const STORAGE_KEY = 'ai-response-evaluator:llm-config'
const MODE_KEY = 'ai-response-evaluator:coding-mode'

function loadMode(): CodingMode {
  try {
    const raw = localStorage.getItem(MODE_KEY)
    if (raw === 'agentic') return 'agentic'
    return 'vibe'
  } catch {
    return 'vibe'
  }
}

function saveMode(mode: CodingMode): void {
  try { localStorage.setItem(MODE_KEY, mode) } catch { /* ignore */ }
}

function createEmptyActualData(): ActualDataConfig {
  return {
    system: '',
    history: '',
    knowledge: '',
    tools: '',
    state: '',
  }
}

function createEmptyActualDataConnections(): ActualDataConnectionMap {
  return {
    system: [],
    history: [],
    knowledge: [],
    tools: [],
    state: [],
  }
}

function createEmptyActualDataInputMode(): ActualDataInputModeMap {
  return {
    system: 'manual',
    history: null,
    knowledge: null,
    tools: null,
    state: null,
  }
}

const DEFAULT_CONFIG: LLMConfig = {
  provider: 'mock',
  dataSource: 'dummy',
  actualData: createEmptyActualData(),
  actualDataConnections: createEmptyActualDataConnections(),
  actualDataInputMode: createEmptyActualDataInputMode(),
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4.1-mini',
  nvidiaApiKey: '',
  nvidiaModel: 'meta/llama-3.1-70b-instruct',
  temperature: 0.2,
  maxOutputTokens: 1200,
  enableLiveProvider: false,
}

function loadFromStorage(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<LLMConfig>
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      actualData: {
        ...createEmptyActualData(),
        ...parsed.actualData,
      },
      actualDataConnections: {
        ...createEmptyActualDataConnections(),
        ...parsed.actualDataConnections,
      },
      actualDataInputMode: {
        ...createEmptyActualDataInputMode(),
        ...parsed.actualDataInputMode,
      },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveToStorage(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore storage errors
  }
}

export const useLLMConfigStore = create<LLMConfigStore>((set) => ({
  config: loadFromStorage(),
  isConfigureOpen: false,
  codingMode: loadMode(),

  openConfigure: () => set({ isConfigureOpen: true }),
  closeConfigure: () => set({ isConfigureOpen: false }),

  saveConfig: (config) => {
    saveToStorage(config)
    set({ config, isConfigureOpen: false })
  },

  updateConfig: (config) => {
    saveToStorage(config)
    set({ config })
  },

  setCodingMode: (mode) => {
    saveMode(mode)
    set({ codingMode: mode })
  },
}))

/**
 * Future integration hook.
 * Wire this to real provider calls once API keys are available.
 */
export async function generateModelResponse(
  _config: LLMConfig,
  _assembledPrompt: string,
): Promise<string> {
  // TODO: dispatch to gemini / openai / nvidia based on config.provider
  // For now, always returns empty to fall through to mock behavior
  return ''
}

export async function evaluateScoreBreakdown(
  _config: LLMConfig,
  _assembledPrompt: string,
  _response: string,
): Promise<null> {
  // TODO: implement real scoring via LLM judge
  return null
}
