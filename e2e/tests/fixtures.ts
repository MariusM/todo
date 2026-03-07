export const API_URL = 'http://localhost:3001/api/todos'

export async function deleteAllTodos() {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`Cleanup GET failed: ${res.status} ${res.statusText}`)
  const todos = await res.json()
  for (const todo of todos) {
    const delRes = await fetch(`${API_URL}/${todo.id}`, { method: 'DELETE' })
    if (!delRes.ok && delRes.status !== 404) {
      throw new Error(`Cleanup DELETE failed for ${todo.id}: ${delRes.status}`)
    }
  }
}
