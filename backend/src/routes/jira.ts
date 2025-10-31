import express from 'express'
import fetch from 'node-fetch'
import { z } from 'zod'

// Validation schema for Jira request
const JiraFetchRequestSchema = z.object({
  issueKey: z.string().min(1, 'Issue key is required')
})

export const jiraRouter = express.Router()

function extractPlainTextFromADF(node: any): string {
  // Simple recursive extractor for Atlassian Document Format (ADF)
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractPlainTextFromADF).join('')
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  if (node.content) return extractPlainTextFromADF(node.content)
  if (node.type === 'paragraph' && node.content) return extractPlainTextFromADF(node.content) + '\n'
  return ''
}

jiraRouter.post('/fetch', async (req: express.Request, res: express.Response) => {
  console.log('Received Jira fetch request:', req.body)
  
  try {
    // Validate request body
    const validationResult = JiraFetchRequestSchema.safeParse(req.body)
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error)
      res.status(400).json({ 
        error: `Invalid request: ${validationResult.error.message}`,
        details: validationResult.error.errors
      })
      return
    }
    
    const { issueKey } = validationResult.data

    const JIRA_BASE_URL = process.env.JIRA_BASE_URL
    const JIRA_EMAIL = process.env.JIRA_EMAIL
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      res.status(500).json({ error: 'JIRA credentials not configured on server' })
      return
    }

    const endpoint = `${JIRA_BASE_URL.replace(/\/+$/, '')}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description`

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      res.status(response.status).json({ error: `Failed to fetch JIRA issue: ${response.status} ${response.statusText}`, body: text })
      return
    }

  const data = await response.json().catch(() => ({} as any)) as any
    const fields = data.fields || {}
    const summary = fields.summary || ''
    let description = ''

    // description can be a string or Atlassian Document Format (ADF)
    if (typeof fields.description === 'string') {
      description = fields.description
    } else if (fields.description) {
      description = extractPlainTextFromADF(fields.description)
    }

    res.json({ summary, description })
  } catch (error) {
    console.error('Error fetching JIRA issue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
