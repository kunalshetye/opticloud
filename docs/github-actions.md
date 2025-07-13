# GitHub Actions Integration

This guide shows how to integrate `@kunalshetye/opticloud` into your GitHub Actions CI/CD workflows for automated Optimizely DXP Cloud deployments.

## Quick Start

Here's a minimal example that deploys to the integration environment on every push to the `main` branch:

```yaml
name: Deploy to DXP Cloud
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to DXP Cloud
        run: |
          npx @kunalshetye/opticloud ship ./dist \
            --target=integration \
            --type=head \
            --prefix=${{ github.event.repository.name }} \
            --client-key=${{ secrets.DXP_CLIENT_KEY }} \
            --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
            --project-id=${{ secrets.DXP_PROJECT_ID }}
```

## Complete Multi-Environment Workflow

This comprehensive example demonstrates deployment to different environments based on branch and release conditions:

```yaml
name: Optimizely DXP Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  DXP_PROJECT_ID: ${{ secrets.DXP_PROJECT_ID }}
  DXP_CLIENT_KEY: ${{ secrets.DXP_CLIENT_KEY }}
  DXP_CLIENT_SECRET: ${{ secrets.DXP_CLIENT_SECRET }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      build-version: ${{ steps.version.outputs.version }}
      package-path: ${{ steps.version.outputs.package-path }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Generate version
        id: version
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            VERSION="${{ github.event.release.tag_name }}"
          else
            VERSION="$(date +%Y%m%d%H%M%S)-${{ github.sha:0:7 }}"
          fi
          echo "version=${VERSION}" >> $GITHUB_OUTPUT
          echo "package-path=dist" >> $GITHUB_OUTPUT
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ steps.version.outputs.version }}
          path: dist/
          retention-days: 30

  deploy-integration:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || github.event_name == 'pull_request'
    environment: integration
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ needs.build.outputs.build-version }}
          path: dist/
          
      - name: Deploy to Integration
        run: |
          npx @kunalshetye/opticloud ship ./dist \
            --target=integration \
            --type=head \
            --prefix=${{ github.event.repository.name }} \
            --version=${{ needs.build.outputs.build-version }} \
            --client-key=${{ env.DXP_CLIENT_KEY }} \
            --client-secret=${{ env.DXP_CLIENT_SECRET }} \
            --project-id=${{ env.DXP_PROJECT_ID }} \
            --json > deployment-result.json
            
      - name: Save deployment info
        run: |
          echo "DEPLOYMENT_ID=$(jq -r '.deploymentId' deployment-result.json)" >> $GITHUB_ENV
          echo "PACKAGE_NAME=$(jq -r '.packagePath' deployment-result.json)" >> $GITHUB_ENV
          
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 **Deployed to Integration**\n\n` +
                    `- **Version**: ${{ needs.build.outputs.build-version }}\n` +
                    `- **Package**: ${process.env.PACKAGE_NAME}\n` +
                    `- **Deployment ID**: ${process.env.DEPLOYMENT_ID}\n` +
                    `- **Environment**: Integration\n\n` +
                    `✅ Ready for testing!`
            })

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ needs.build.outputs.build-version }}
          path: dist/
          
      - name: Deploy to Staging
        run: |
          npx @kunalshetye/opticloud ship ./dist \
            --target=preproduction \
            --type=head \
            --prefix=${{ github.event.repository.name }} \
            --version=${{ needs.build.outputs.build-version }} \
            --output=./packages \
            --client-key=${{ env.DXP_CLIENT_KEY }} \
            --client-secret=${{ env.DXP_CLIENT_SECRET }} \
            --project-id=${{ env.DXP_PROJECT_ID }}

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    environment: production
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ needs.build.outputs.build-version }}
          path: dist/
          
      - name: Deploy to Production
        run: |
          npx @kunalshetye/opticloud ship ./dist \
            --target=production \
            --type=head \
            --prefix=${{ github.event.repository.name }} \
            --version=${{ github.event.release.tag_name }} \
            --output=./packages \
            --poll-interval=30 \
            --client-key=${{ env.DXP_CLIENT_KEY }} \
            --client-secret=${{ env.DXP_CLIENT_SECRET }} \
            --project-id=${{ env.DXP_PROJECT_ID }}
            
      - name: Upload production package
        uses: actions/upload-artifact@v4
        with:
          name: production-package-${{ github.event.release.tag_name }}
          path: packages/
          retention-days: 90
```

## CMS Application Deployment

For Optimizely CMS applications (.NET), use this workflow:

```yaml
name: Deploy CMS Application

on:
  push:
    branches: [main]
    paths: ['src/**', 'Views/**', '*.csproj']

jobs:
  deploy-cms:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'
          
      - name: Restore dependencies
        run: dotnet restore
        
      - name: Build application
        run: dotnet build --configuration Release --no-restore
        
      - name: Publish application
        run: dotnet publish --configuration Release --output ./publish
        
      - name: Deploy CMS to DXP Cloud
        run: |
          npx @kunalshetye/opticloud ship ./publish \
            --target=integration \
            --type=cms \
            --prefix=mysite \
            --client-key=${{ secrets.DXP_CLIENT_KEY }} \
            --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
            --project-id=${{ secrets.DXP_PROJECT_ID }}
```

## Database Deployment

Deploy database changes using the CLI:

```yaml
name: Deploy Database

on:
  push:
    branches: [main]
    paths: ['database/**']

jobs:
  deploy-database:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Database
        run: |
          npx @kunalshetye/opticloud ship ./database \
            --target=integration \
            --type=sqldb \
            --db-type=cms \
            --prefix=mysite \
            --client-key=${{ secrets.DXP_CLIENT_KEY }} \
            --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
            --project-id=${{ secrets.DXP_PROJECT_ID }}
```

## Advanced Patterns

### Conditional Deployment with Manual Approval

```yaml
deploy-production:
  needs: [build, deploy-staging]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  environment: 
    name: production
    url: https://your-site.com
  
  steps:
    - name: Download artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-${{ needs.build.outputs.build-version }}
        path: dist/
        
    - name: Deploy with confirmation
      run: |
        echo "🚀 Deploying to Production..."
        npx @kunalshetye/opticloud ship ./dist \
          --target=production \
          --type=head \
          --prefix=${{ github.event.repository.name }} \
          --version=${{ needs.build.outputs.build-version }} \
          --client-key=${{ secrets.DXP_CLIENT_KEY }} \
          --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
          --project-id=${{ secrets.DXP_PROJECT_ID }}
```

### Rollback on Failure

```yaml
deploy-with-rollback:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy new version
      id: deploy
      run: |
        npx @kunalshetye/opticloud ship ./dist \
          --target=production \
          --type=head \
          --json > deployment.json
        echo "deployment_id=$(jq -r '.deploymentId' deployment.json)" >> $GITHUB_OUTPUT
      continue-on-error: true
      
    - name: Run health checks
      id: health
      run: |
        sleep 60  # Wait for deployment
        curl -f https://your-site.com/health || exit 1
      continue-on-error: true
      
    - name: Rollback on failure
      if: steps.deploy.outcome == 'failure' || steps.health.outcome == 'failure'
      run: |
        echo "🔄 Rolling back deployment..."
        npx @kunalshetye/opticloud deployment:reset ${{ steps.deploy.outputs.deployment_id }} \
          --force \
          --client-key=${{ secrets.DXP_CLIENT_KEY }} \
          --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
          --project-id=${{ secrets.DXP_PROJECT_ID }}
```

### Matrix Deployment (Multiple Sites)

```yaml
deploy-multi-site:
  strategy:
    matrix:
      site: [site1, site2, site3]
      include:
        - site: site1
          target: production-site1
          prefix: mainsite
        - site: site2
          target: production-site2
          prefix: microsite
        - site: site3
          target: production-site3
          prefix: campaign
          
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Build ${{ matrix.site }}
      run: npm run build:${{ matrix.site }}
      
    - name: Deploy ${{ matrix.site }}
      run: |
        npx @kunalshetye/opticloud ship ./dist/${{ matrix.site }} \
          --target=${{ matrix.target }} \
          --type=head \
          --prefix=${{ matrix.prefix }} \
          --client-key=${{ secrets.DXP_CLIENT_KEY }} \
          --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
          --project-id=${{ secrets.DXP_PROJECT_ID }}
```

## Environment Configuration

### Required Secrets

Set these secrets in your GitHub repository settings:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DXP_CLIENT_KEY` | Your DXP Cloud client key | `your-client-key` |
| `DXP_CLIENT_SECRET` | Your DXP Cloud client secret | `your-client-secret` |
| `DXP_PROJECT_ID` | Your DXP project GUID | `12345678-1234-1234-1234-123456789012` |

### Environment-Specific Variables

Use GitHub Environments to manage different deployment targets:

```yaml
# .github/environments/production.yml
environment:
  name: production
  url: https://your-production-site.com
  protection_rules:
    - type: required_reviewers
      required_reviewers: ['devops-team']
```

## Best Practices

### 1. Use Descriptive Package Names
```yaml
--prefix=${{ github.event.repository.name }}
--version=${{ github.sha:0:7 }}-$(date +%Y%m%d)
```

### 2. Save Deployment Artifacts
```yaml
- name: Save deployment package
  uses: actions/upload-artifact@v4
  with:
    name: deployment-${{ github.run_number }}
    path: packages/
    retention-days: 30
```

### 3. Handle Errors Gracefully
```yaml
- name: Deploy with error handling
  run: |
    if ! npx @kunalshetye/opticloud ship ./dist --target=production; then
      echo "❌ Deployment failed"
      # Send notification
      curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
        -d '{"text": "🚨 Production deployment failed for ${{ github.sha }}"}'
      exit 1
    fi
```

### 4. Monitor Deployment Progress
```yaml
- name: Deploy and monitor
  run: |
    npx @kunalshetye/opticloud ship ./dist \
      --target=production \
      --type=head \
      --poll-interval=15 \
      --continue-on-errors \
      --json > deployment.json
    
    # Extract deployment ID for monitoring
    DEPLOYMENT_ID=$(jq -r '.deploymentId' deployment.json)
    echo "Monitoring deployment: $DEPLOYMENT_ID"
```

### 5. Use Different Polling for Different Environments
```yaml
# Fast polling for dev/test
--poll-interval=5

# Standard polling for staging  
--poll-interval=10

# Slower polling for production (less API load)
--poll-interval=30
```

## Troubleshooting

### Common Issues

**Authentication Errors**
```yaml
- name: Validate credentials
  run: |
    npx @kunalshetye/opticloud auth:test \
      --client-key=${{ secrets.DXP_CLIENT_KEY }} \
      --client-secret=${{ secrets.DXP_CLIENT_SECRET }}
```

**Package Creation Failures**
```yaml
- name: Debug package creation
  run: |
    ls -la ./dist/
    npx @kunalshetye/opticloud package:create ./dist \
      --type=head \
      --prefix=debug \
      --output=./debug-packages
```

**Deployment Monitoring**
```yaml
- name: Watch deployment
  run: |
    npx @kunalshetye/opticloud deployment:watch $DEPLOYMENT_ID \
      --poll-interval=10 \
      --show-initial \
      --project-id=${{ secrets.DXP_PROJECT_ID }}
```

### Debug Mode

Enable verbose logging for troubleshooting:

```yaml
- name: Deploy with debug logging
  env:
    DEBUG: opticloud*
  run: |
    npx @kunalshetye/opticloud ship ./dist \
      --target=integration \
      --type=head
```

## Security Considerations

1. **Never expose credentials in logs**
2. **Use GitHub Environments for production**
3. **Restrict secret access to specific branches**
4. **Regular rotation of DXP Cloud credentials**
5. **Use least-privilege principle for service accounts**

## Example Repositories

For complete working examples, see:
- [Frontend SPA Deployment](https://github.com/example/spa-deployment)
- [CMS Application CI/CD](https://github.com/example/cms-deployment)
- [Multi-Environment Pipeline](https://github.com/example/multi-env-deployment)