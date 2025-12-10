#!/usr/bin/env -S node --loader ts-node/esm --no-warnings

// Load environment variables from .env file
import 'dotenv/config'

async function main() {
  const {execute} = await import('@oclif/core')
  await execute({development: true, dir: import.meta.url})
}

await main()