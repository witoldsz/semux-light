export async function exec<T>(method: string, path: string): Promise<T> {
  const r = await fetch(path, { method })
  try {
    const { success, message, result } = await r.json()
    return success ? result : Promise.reject(new Error(message))
  } catch (e) {
    return Promise.reject(new Error(`Error: ${r.status} ${r.statusText}`))
  }
}
