import { GenerateRequest, GenerateResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

/**
 * Make an HTTP request with retry logic and timeout
 */
async function makeRequest<T>(
  url: string,
  body: unknown,
  options: { retries?: number; timeout?: number } = {}
): Promise<T> {
  const { retries = 3, timeout = 10000 } = options
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      console.log(`Request attempt ${attempt}/${retries} to ${url}`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`Attempt ${attempt} failed:`, lastError)

      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${lastError.message}`)
      }

      // Exponential backoff with max 5s delay
      await new Promise(resolve => 
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000))
      )
    }
  }

  throw lastError || new Error('Request failed')
}

export async function generateTests(request: GenerateRequest): Promise<GenerateResponse> {
  return makeRequest<GenerateResponse>(
    `${API_BASE_URL}/generate-tests`,
    request,
    { timeout: 30000 } // Longer timeout for test generation
  )
}

export async function fetchJiraIssue(issueKey: string): Promise<{ summary: string; description: string }> {
  return makeRequest<{ summary: string; description: string }>(
    `${API_BASE_URL}/jira/fetch`,
    { issueKey }
  )
}