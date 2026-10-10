export function scopedEnv(env, scope = "normal") {
  if (scope !== "hidden" || !env.BOARD) return env;
  const board = env.BOARD, prefix = "hidden:";
  return { ...env, BOARD: {
    get: (key, ...options) => board.get(prefix + key, ...options),
    put: (key, value, ...options) => board.put(prefix + key, value, ...options),
    delete: key => board.delete(prefix + key),
    list: async options => {
      const result = await board.list({ ...options, prefix: prefix + (options?.prefix || "") });
      return { ...result, keys: result.keys.map(key => ({ ...key, name: key.name.slice(prefix.length) })) };
    },
  } };
}
