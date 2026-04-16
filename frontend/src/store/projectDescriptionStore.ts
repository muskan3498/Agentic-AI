import { create } from 'zustand'

interface ProjectDescriptionStore {
  description: string
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
  saveDescription: (description: string) => void
}

const STORAGE_KEY = 'ai-response-evaluator:project-description'

function loadDescription(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistDescription(description: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, description)
  } catch {
    // ignore storage errors
  }
}

export const useProjectDescriptionStore = create<ProjectDescriptionStore>((set) => ({
  description: loadDescription(),
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  saveDescription: (description) => {
    persistDescription(description)
    set({ description, isOpen: false })
  },
}))
