# Optimizely DXP CLI

A modern command-line interface for managing Optimizely Digital Experience Platform (DXP) Cloud deployments, built with Node.js and TypeScript.

## Overview

The Optimizely DXP CLI provides a cross-platform, modern alternative to the legacy PowerShell EpiCloud module. It enables developers and DevOps teams to manage DXP Cloud projects from any platform with better performance, improved user experience, and enhanced developer tooling.

## Features

- 🔐 **Secure Authentication** - HMAC-SHA256 authentication with secure credential storage
- 📦 **Package Management** - Create, upload and manage deployment packages
- 🚀 **Deployment Control** - Start, monitor, complete, and reset deployments
- 🗄️ **Database Operations** - Export and manage database operations
- 🌍 **Cross-Platform** - Works on Windows, macOS, and Linux
- ⚡ **Modern Tooling** - TypeScript, interactive prompts, JSON output
- 🛡️ **Type Safety** - Full TypeScript coverage for better IDE support

## Installation

### Option 1: Install Globally

Install the package globally to use the `opti-dxp-cli` command anywhere:

```bash
# Using npm
npm install -g opti-dxp-cli

# Using yarn
yarn global add opti-dxp-cli

# Using pnpm
pnpm add -g opti-dxp-cli

# Using bun
bun add -g opti-dxp-cli
```

### Option 2: Use with npx (No Installation Required)

Run commands directly without installing using npx:

```bash
# No installation needed - npx will download and run the package
npx opti-dxp-cli auth:login
npx opti-dxp-cli package:create ./my-app --type=cms
```

### Option 3: Development Setup

For development and contributions:

#### Prerequisites
- Node.js 18 or higher
- Yarn 4.x (installed via corepack)

#### Install Dependencies

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
# If installed globally
opti-dxp-cli auth:login

# Or using npx (no installation needed)
npx opti-dxp-cli auth:login
```

You'll be prompted for:
- Client Key (from DXP Cloud portal)
- Client Secret (from DXP Cloud portal)
- Project ID (GUID of your DXP project)

### 2. Create a Package

Create a deployment package from your application directory:

```bash
# If installed globally
opti-dxp-cli package:create ./my-app --type=head --prefix=my-app --version=1.0.0

# Or using npx
npx opti-dxp-cli package:create ./my-app --type=head --prefix=my-app --version=1.0.0
```

### 3. Upload a Package

Upload a deployment package to your project:

```bash
# If installed globally
opti-dxp-cli package:upload ./my-app.head.app.1.0.0.zip

# Or using npx
npx opti-dxp-cli package:upload ./my-app.head.app.1.0.0.zip
```

### 4. Start a Deployment

Deploy your package to an environment:

```bash
# If installed globally
opti-dxp-cli deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip

# Or using npx
npx opti-dxp-cli deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip
```

### 5. Monitor Deployment

Check deployment status:

```bash
# If installed globally
opti-dxp-cli deployment:list

# Or using npx
npx opti-dxp-cli deployment:list
```

## Commands

### Authentication

```bash
# Login with credentials
opti-dxp-cli auth:login

# Check authentication status
opti-dxp-cli auth:status

# Logout and clear credentials
opti-dxp-cli auth:logout
```

### Package Management

```bash
# Create a package from directory
opti-dxp-cli package:create ./my-app --type=cms --prefix=mysite --version=1.0.0

# Create different package types
opti-dxp-cli package:create ./my-cms-app --type=cms
opti-dxp-cli package:create ./my-head-app --type=head --prefix=optimizely-one
opti-dxp-cli package:create ./my-commerce-app --type=commerce --output=./dist
opti-dxp-cli package:create ./database --type=sqldb --db-type=cms

# Upload a package
opti-dxp-cli package:upload ./package.zip

# Upload to specific container
opti-dxp-cli package:upload ./package.zip --container=mysitemedia

# List available packages
opti-dxp-cli package:list

# Get upload URL for manual operations
opti-dxp-cli package:get-upload-url
```

### Deployment Management

```bash
# Start deployment with packages
opti-dxp-cli deployment:start --target=Integration --packages=app.zip

# Start deployment and watch progress in real-time
opti-dxp-cli deployment:start --target=Integration --packages=app.zip --watch

# Start deployment copying from another environment
opti-dxp-cli deployment:start --target=Production --source=Preproduction

# Use maintenance page during deployment
opti-dxp-cli deployment:start --target=Production --packages=app.zip --maintenance-page

# List all deployments
opti-dxp-cli deployment:list

# Get specific deployment details
opti-dxp-cli deployment:list --deployment-id=12345678-1234-1234-1234-123456789012

# View detailed deployment logs (warnings, errors, progress)
opti-dxp-cli deployment:logs 12345678-1234-1234-1234-123456789012

# View only deployment errors
opti-dxp-cli deployment:logs 12345678-1234-1234-1234-123456789012 --errors-only

# Watch an existing deployment progress in real-time
opti-dxp-cli deployment:watch 12345678-1234-1234-1234-123456789012

# Complete a deployment
opti-dxp-cli deployment:complete 12345678-1234-1234-1234-123456789012

# Complete a deployment and watch progress
opti-dxp-cli deployment:complete 12345678-1234-1234-1234-123456789012 --watch

# Reset a failed deployment
opti-dxp-cli deployment:reset 12345678-1234-1234-1234-123456789012
```

### Database Operations

```bash
# Export database
opti-dxp-cli database:export --environment=Production

# List database exports
opti-dxp-cli database:list
```

### Log Management

```bash
# Get edge logs location (CDN/edge server logs)
opti-dxp-cli logs:edge

# List available log containers for an environment
opti-dxp-cli logs:containers --environment=Production

# List only writable log containers
opti-dxp-cli logs:containers --environment=Integration --writable-only

# Get SAS URL for accessing specific log container
opti-dxp-cli logs:access --environment=Production --container=azure-application-logs

# Get SAS URL with longer retention and write access
opti-dxp-cli logs:access --environment=Production --container=azure-web-logs --retention-hours=48 --writable
```

## Configuration

### Environment Variables

Set these environment variables for automation:

```bash
export OPTI_PROJECT_ID="12345678-1234-1234-1234-123456789012"
export OPTI_CLIENT_KEY="your-client-key"
export OPTI_CLIENT_SECRET="your-client-secret"
```

### Package Creation and Naming

The CLI automatically creates packages with the correct naming patterns and file extensions:

#### Package Types and Extensions:
- **CMS Apps**: `[prefix.]cms.app.<version>.nupkg` (NuGet package format)
- **Commerce Apps**: `[prefix.]commerce.app.<version>.nupkg` (NuGet package format)
- **Head Apps**: `[prefix.]head.app.<version>.zip` (ZIP format)
- **Databases**: `[prefix.]cms.sqldb.<version>.bacpac` or `[prefix.]commerce.sqldb.<version>.bacpac`

#### Creating Packages:
Use the `package:create` command to automatically create properly named packages:

```bash
# Creates mysite.cms.app.1.0.0.nupkg
opti-dxp-cli package:create ./my-cms-app --type=cms --prefix=mysite --version=1.0.0

# Creates optimizely-one.head.app.20250712.zip (uses current date if no version)
opti-dxp-cli package:create ./my-head-app --type=head --prefix=optimizely-one

# Creates commerce.app.1.0.0.nupkg (no prefix)
opti-dxp-cli package:create ./my-commerce-app --type=commerce --version=1.0.0
```

#### Package Contents:
- Packages the **contents** of the directory recursively (not the directory itself)
- Respects `.gitignore` files in the source directory
- Excludes common build artifacts (node_modules/, .DS_Store, etc.)

#### Manual Package Examples:
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
- **Package creation** - Create packages directly from source directories
- **Better error messages** - Clear, actionable error information
- **Interactive prompts** - Guided workflows for complex operations
- **JSON output** - Scriptable output format
- **Progress indicators** - Visual feedback for long-running operations
- **Modern authentication** - Secure credential storage via system keychain

### Command Mapping

| PowerShell Command | Node.js CLI Command |
|-------------------|---------------------|
| `Connect-EpiCloud` | `opti-dxp-cli auth:login` |
| `Get-EpiDeployment` | `opti-dxp-cli deployment:list` |
| `Start-EpiDeployment` | `opti-dxp-cli deployment:start` |
| `Complete-EpiDeployment` | `opti-dxp-cli deployment:complete` |
| `Reset-EpiDeployment` | `opti-dxp-cli deployment:reset` |
| `Add-EpiDeploymentPackage` | `opti-dxp-cli package:upload` |
| Package Creation | `opti-dxp-cli package:create` |
| `Start-EpiDatabaseExport` | `opti-dxp-cli database:export` |
| `Get-EpiDatabaseExport` | `opti-dxp-cli database:list` |
| `Get-EpiEdgeLogLocation` | `opti-dxp-cli logs:edge` |
| `Get-EpiStorageContainer` | `opti-dxp-cli logs:containers` |
| `Get-EpiStorageContainerSasLink` | `opti-dxp-cli logs:access` |

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Check credentials are valid
opti-dxp-cli auth:status

# Re-authenticate
opti-dxp-cli auth:logout
opti-dxp-cli auth:login
```

**Package Creation Failed**
```bash
# Ensure source directory exists and is readable
# Check .gitignore syntax if using custom patterns
# Verify sufficient disk space for package creation
opti-dxp-cli package:create ./my-app --type=cms --prefix=mysite
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
opti-dxp-cli deployment:list --deployment-id=<id>

# Reset and retry
opti-dxp-cli deployment:reset <deployment-id>
```

### Debug Mode

Enable verbose logging by setting the debug environment variable:

```bash
DEBUG=opti-dxp-cli* opti-dxp-cli [command]
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