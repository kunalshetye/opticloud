# Optimizely DXP CLI

A modern command-line interface for managing Optimizely Digital Experience Platform (DXP) Cloud deployments, built with Node.js and TypeScript.

## Overview

The Optimizely DXP CLI provides a cross-platform, modern alternative to the legacy PowerShell EpiCloud module. It enables developers and DevOps teams to manage DXP Cloud projects from any platform with better performance, improved user experience, and enhanced developer tooling.

## Features

- 🔐 **Secure Authentication** - HMAC-SHA256 authentication with secure credential storage
- 📦 **Package Management** - Upload and manage deployment packages
- 🚀 **Deployment Control** - Start, monitor, complete, and reset deployments
- 🗄️ **Database Operations** - Export and manage database operations
- 🌍 **Cross-Platform** - Works on Windows, macOS, and Linux
- ⚡ **Modern Tooling** - TypeScript, interactive prompts, JSON output
- 🛡️ **Type Safety** - Full TypeScript coverage for better IDE support

## Installation

### Prerequisites

- Node.js 18 or higher
- Yarn 4.x (installed via corepack)

### Install Dependencies

```bash
# Enable corepack for Yarn 4.x
corepack enable

# Install dependencies
yarn install

# Build the project
yarn build
```

## Quick Start

### 1. Authentication

First, authenticate with your DXP Cloud credentials:

```bash
yarn node ./bin/run.js auth:login
```

You'll be prompted for:
- Client Key (from DXP Cloud portal)
- Client Secret (from DXP Cloud portal)
- Project ID (GUID of your DXP project)

### 2. Upload a Package

Upload a deployment package to your project:

```bash
yarn node ./bin/run.js package:upload ./my-app.head.app.1.0.0.zip
```

### 3. Start a Deployment

Deploy your package to an environment:

```bash
yarn node ./bin/run.js deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip
```

### 4. Monitor Deployment

Check deployment status:

```bash
yarn node ./bin/run.js deployment:list
```

## Commands

### Authentication

```bash
# Login with credentials
yarn node ./bin/run.js auth:login

# Check authentication status
yarn node ./bin/run.js auth:status

# Logout and clear credentials
yarn node ./bin/run.js auth:logout
```

### Package Management

```bash
# Upload a package
yarn node ./bin/run.js package:upload ./package.zip

# Upload to specific container
yarn node ./bin/run.js package:upload ./package.zip --container=mysitemedia

# List available packages
yarn node ./bin/run.js package:list

# Get upload URL for manual operations
yarn node ./bin/run.js package:get-upload-url
```

### Deployment Management

```bash
# Start deployment with packages
yarn node ./bin/run.js deployment:start --target=Integration --packages=app.zip

# Start deployment and watch progress in real-time
yarn node ./bin/run.js deployment:start --target=Integration --packages=app.zip --watch

# Start deployment copying from another environment
yarn node ./bin/run.js deployment:start --target=Production --source=Preproduction

# Use maintenance page during deployment
yarn node ./bin/run.js deployment:start --target=Production --packages=app.zip --maintenance-page

# List all deployments
yarn node ./bin/run.js deployment:list

# Get specific deployment details
yarn node ./bin/run.js deployment:list --deployment-id=12345678-1234-1234-1234-123456789012

# View detailed deployment logs (warnings, errors, progress)
yarn node ./bin/run.js deployment:logs 12345678-1234-1234-1234-123456789012

# View only deployment errors
yarn node ./bin/run.js deployment:logs 12345678-1234-1234-1234-123456789012 --errors-only

# Watch an existing deployment progress in real-time
yarn node ./bin/run.js deployment:watch 12345678-1234-1234-1234-123456789012

# Complete a deployment
yarn node ./bin/run.js deployment:complete 12345678-1234-1234-1234-123456789012

# Reset a failed deployment
yarn node ./bin/run.js deployment:reset 12345678-1234-1234-1234-123456789012
```

### Database Operations

```bash
# Export database
yarn node ./bin/run.js database:export --environment=Production

# List database exports
yarn node ./bin/run.js database:list
```

### Log Management

```bash
# Get edge logs location (CDN/edge server logs)
yarn node ./bin/run.js logs:edge

# List available log containers for an environment
yarn node ./bin/run.js logs:containers --environment=Production

# List only writable log containers
yarn node ./bin/run.js logs:containers --environment=Integration --writable-only

# Get SAS URL for accessing specific log container
yarn node ./bin/run.js logs:access --environment=Production --container=azure-application-logs

# Get SAS URL with longer retention and write access
yarn node ./bin/run.js logs:access --environment=Production --container=azure-web-logs --retention-hours=48 --writable
```

## Configuration

### Environment Variables

Set these environment variables for automation:

```bash
export OPTI_PROJECT_ID="12345678-1234-1234-1234-123456789012"
export OPTI_CLIENT_KEY="your-client-key"
export OPTI_CLIENT_SECRET="your-client-secret"
```

### Package Naming Requirements

Deployment packages must follow these naming patterns:

- **CMS Apps**: `[prefix.]cms.app.<version>.nupkg` or `[prefix.]cms.app.<version>.zip`
- **Commerce Apps**: `[prefix.]commerce.app.<version>.nupkg` or `[prefix.]commerce.app.<version>.zip`
- **Head Apps**: `[prefix.]head.app.<version>.nupkg` or `[prefix.]head.app.<version>.zip`
- **Databases**: `[prefix.]cms.sqldb.<version>.bacpac` or `[prefix.]commerce.sqldb.<version>.bacpac`

Examples:
- `mysite.cms.app.1.0.0.nupkg`
- `optimizely-one.head.app.20250610.zip`
- `ecommerce.commerce.sqldb.2.1.0.bacpac`

## Development

### Project Structure

```
src/
├── commands/          # CLI command implementations
│   ├── auth/          # Authentication commands
│   ├── deployment/    # Deployment management
│   ├── package/       # Package operations
│   └── database/      # Database operations
├── lib/               # Core infrastructure
│   ├── api-client.ts  # HTTP client with HMAC auth
│   ├── auth.ts        # Credential management
│   ├── config.ts      # Configuration management
│   ├── hmac.ts        # HMAC-SHA256 signing
│   ├── types.ts       # TypeScript interfaces
│   └── utils.ts       # Utilities and formatting
└── index.ts
```

### Development Commands

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# Run in development mode
yarn node ./bin/run.js [command]

# Run tests
yarn test

# Lint code
yarn lint

# Generate oclif manifest
yarn prepack
```

### Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run with coverage
yarn test --coverage
```

## API Compatibility

This CLI is fully compatible with the Optimizely DXP Cloud REST API and maintains compatibility with deployments created by the PowerShell EpiCloud module.

### API Endpoints

- **Production**: `https://paasportal.episerver.net/api/v1.0/`
- **Development**: `https://paasportal.epimore.com/api/v1.0/`

## Migration from PowerShell

The Node.js CLI provides these improvements over the PowerShell module:

### Enhanced Features
- **Cross-platform support** - Works on Windows, macOS, Linux
- **Better error messages** - Clear, actionable error information
- **Interactive prompts** - Guided workflows for complex operations
- **JSON output** - Scriptable output format
- **Progress indicators** - Visual feedback for long-running operations
- **Modern authentication** - Secure credential storage via system keychain

### Command Mapping

| PowerShell Command | Node.js CLI Command |
|-------------------|---------------------|
| `Connect-EpiCloud` | `opti auth:login` |
| `Get-EpiDeployment` | `opti deployment:list` |
| `Start-EpiDeployment` | `opti deployment:start` |
| `Complete-EpiDeployment` | `opti deployment:complete` |
| `Reset-EpiDeployment` | `opti deployment:reset` |
| `Add-EpiDeploymentPackage` | `opti package:upload` |
| `Start-EpiDatabaseExport` | `opti database:export` |
| `Get-EpiDatabaseExport` | `opti database:list` |
| `Get-EpiEdgeLogLocation` | `opti logs:edge` |
| `Get-EpiStorageContainer` | `opti logs:containers` |
| `Get-EpiStorageContainerSasLink` | `opti logs:access` |

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Check credentials are valid
yarn node ./bin/run.js auth:status

# Re-authenticate
yarn node ./bin/run.js auth:logout
yarn node ./bin/run.js auth:login
```

**Package Upload Failed**
```bash
# Verify package naming pattern
# Ensure file exists and is not empty
# Check you have write permissions to the target container
```

**Deployment Failed**
```bash
# Check deployment details for errors
yarn node ./bin/run.js deployment:list --deployment-id=<id>

# Reset and retry
yarn node ./bin/run.js deployment:reset <deployment-id>
```

### Debug Mode

Enable verbose logging by setting the debug environment variable:

```bash
DEBUG=opti-dxp-cli* yarn node ./bin/run.js [command]
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- TypeScript strict mode enabled
- ESLint configuration enforced
- Comprehensive test coverage required
- Clear commit messages following conventional commits

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-org/opti-dxp-cli/issues) page.

For Optimizely DXP Cloud platform support, visit the [Optimizely Developer Community](https://world.optimizely.com/community/).