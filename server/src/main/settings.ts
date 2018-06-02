function env(e: string): string {
  const value = process.env[e]
  if (!value) {
    throw new Error(`environment ${e}='${value}' must be set`)
  }
  return value
}

export const settings = {
  semuxApi: {
    address: env('SEMUX_API_ADDR'),
    user: env('SEMUX_API_USER'),
    pass: env('SEMUX_API_PASS'),
  },
  semuxLight: {
    port: parseInt(env('SEMUX_LIGHT_PORT'), 10),
    hostname: env('SEMUX_LIGHT_BIND_IP'),
  },
}
