import { supabase } from './supabase'

interface ClaudeRequest {
  model: string
  system: string
  messages: { role: string; content: string }[]
  max_tokens?: number
}

export async function callClaude(request: ClaudeRequest): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await supabase.functions.invoke('claude-proxy', {
    body: request,
  })

  if (response.error) throw new Error(response.error.message)

  const data = response.data
  if (data.error) throw new Error(data.error.message || data.error)

  return data.content[0].text
}
