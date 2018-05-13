export async function exec<T>(method: string, path: string): Promise<T> {
  const r = await fetch(path, { method })
  const { success, message, result } = await r.json()
  return success ? result : Promise.reject(new Error(message))
}
