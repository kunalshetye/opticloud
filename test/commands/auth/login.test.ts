import {expect, test} from '@oclif/test'

describe('auth:login', () => {
  test
    .stdout()
    .command(['auth:login', '--help'])
    .it('runs auth:login --help', ctx => {
      expect(ctx.stdout).to.contain('Authenticate with Optimizely DXP Cloud')
    })

  test
    .stdout()
    .command(['auth:login', '--client-key=test', '--client-secret=dGVzdA==', '--force'])
    .it('accepts client credentials via flags', ctx => {
      expect(ctx.stdout).to.contain('Authentication successful')
    })
})