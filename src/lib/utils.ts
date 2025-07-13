import chalk from 'chalk'
import ora, {Ora} from 'ora'

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

export function isValidGuid(str: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return guidRegex.test(str)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Unknown'
  }
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    return date.toLocaleString()
  } catch {
    return dateString || 'Unknown'
  }
}

export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'blue',
  })
}

export function logSuccess(message: string): void {
  console.log(chalk.green('✓'), message)
}

export function logError(message: string): void {
  console.log(chalk.red('✗'), message)
}

export function logWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message)
}

export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message)
}

export function validateEnvironment(env: string): boolean {
  const validEnvironments = ['integration', 'preproduction', 'production', 'test1', 'test2']
  return validEnvironments.includes(env.toLowerCase())
}

export function formatDeploymentStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'inprogress': {
      return chalk.yellow('In Progress')
    }
    case 'succeeded': {
      return chalk.green('Succeeded')
    }
    case 'failed': {
      return chalk.red('Failed')
    }
    case 'awaitingverification': {
      return chalk.blue('Awaiting Verification')
    }
    default: {
      return status
    }
  }
}