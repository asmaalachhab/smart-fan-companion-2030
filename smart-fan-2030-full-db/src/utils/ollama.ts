export async function ollamaChat(prompt: string): Promise<string> {
  // ✅ IMPORTANT: on passe par le proxy Vite (voir vite.config.js)
  const res = await fetch('/ollama/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1',
      prompt,
      stream: false,
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Ollama HTTP ${res.status}: ${t}`)
  }

  const data = await res.json()
  return data?.response ?? ''
}
