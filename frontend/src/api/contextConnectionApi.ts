import { post } from './client'

export interface TestConnectionBody {
  curl_command: string
}

export interface TestConnectionResponse {
  ok: boolean
  method: string
  url: string
  status_code?: number
  message: string
  response_preview?: string
  duration_ms: number
}

export const contextConnectionApi = {
  testConnection(curlCommand: string): Promise<TestConnectionResponse> {
    const body: TestConnectionBody = { curl_command: curlCommand }
    return post<TestConnectionResponse>('/api/context/test-connection', body, 15_000)
  },
}
