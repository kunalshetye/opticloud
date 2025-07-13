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

Install the package globally to use the `opticloud` command anywhere:

```bash
# Using npm
npm install -g opticloud

# Using yarn
yarn global add opticloud

# Using pnpm
pnpm add -g opticloud

# Using bun
bun add -g opticloud
```

### Option 2: Use with npx (No Installation Required)

Run commands directly without installing using npx:

```bash
# No installation needed - npx will download and run the package
npx opticloud auth:login
npx opticloud package:create ./my-app --type=cms
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
opticloud auth:login

# Or using npx (no installation needed)
npx opticloud auth:login
```

You'll be prompted for:
- Client Key (from DXP Cloud portal)
- Client Secret (from DXP Cloud portal)
- Project ID (GUID of your DXP project)

### 2. Create a Package

Create a deployment package from your application directory:

```bash
# If installed globally
opticloud package:create ./my-app --type=head --prefix=my-app --version=1.0.0

# Or using npx
npx opticloud package:create ./my-app --type=head --prefix=my-app --version=1.0.0
```

### 3. Upload a Package

Upload a deployment package to your project:

```bash
# If installed globally
opticloud package:upload ./my-app.head.app.1.0.0.zip

# Or using npx
npx opticloud package:upload ./my-app.head.app.1.0.0.zip
```

### 4. Start a Deployment

Deploy your package to an environment:

```bash
# If installed globally
opticloud deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip

# Or using npx
npx opticloud deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip
```

### 5. Monitor Deployment

Check deployment status:

```bash
# If installed globally
opticloud deployment:list

# Or using npx
npx opticloud deployment:list
```

## Ship Command 🚀

The `ship` command is the ultimate streamlined solution for Optimizely DXP deployments. It orchestrates the complete workflow from source code to production in a single command.

### Quick Start

```bash
# Basic deployment
opticloud ship ./my-app --target=integration --type=cms

# Production deployment with all options
opticloud ship ./my-app --target=production --type=head --prefix=mysite --version=1.0.0 --output=./packages
```

### Complete Workflow

The `ship` command executes these steps automatically:

1. 📦 **Package Creation** - Creates deployment package from your source directory
2. ⬆️ **Upload** - Uploads package to DXP Cloud storage
3. 🚀 **Deployment** - Starts deployment to target environment
4. 👀 **Monitoring** - Watches progress with real-time updates
5. ✅ **Completion** - Automatically completes when deployment is ready

### Command Syntax

```bash
opticloud ship <directory> --target=<environment> --type=<package-type> [options]
```

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `directory` | Source directory to package and deploy | `./my-app`, `../frontend` |
| `--target` or `-t` | Target environment name | `integration`, `production`, `Test1` |
| `--type` | Package type | `cms`, `head`, `commerce`, `sqldb` |

### Package Types

| Type | Description | File Extension | Use Case |
|------|-------------|----------------|----------|
| `cms` | CMS/Admin applications | `.nupkg` | Optimizely CMS admin interface and APIs |
| `head` | Frontend applications | `.zip` | Frontend websites, SPAs, static sites |
| `commerce` | Commerce applications | `.nupkg` | E-commerce functionality and APIs |
| `sqldb` | Database packages | `.bacpac` | Database schema and data updates |

### Optional Parameters

#### Package Configuration
- `--version` or `-v` - Package version (defaults to current date: YYYYMMDD)
- `--prefix` or `-p` - Package name prefix for organization
- `--output` or `-o` - Save package to specific directory (instead of temp)

#### Database Options (for `--type=sqldb`)
- `--db-type` - Database type: `cms` or `commerce` (default: `cms`)

#### Authentication Overrides
- `--client-key` - Override stored client key
- `--client-secret` - Override stored client secret  
- `--project-id` - Override stored project ID
- `--api-endpoint` - Override API endpoint URL
- `--skip-validation` - Skip credential validation (faster startup)

#### Deployment Monitoring
- `--poll-interval` - Polling frequency in seconds (default: 10, range: 5-300)
- `--continue-on-errors` - Continue watching even when errors are detected
- `--json` - Output results in JSON format for scripting

### Usage Examples

#### Basic Deployments
```bash
# Simple CMS deployment
opticloud ship ./cms-app --target=integration --type=cms

# Frontend deployment with prefix
opticloud ship ./frontend --target=production --type=head --prefix=mysite

# Commerce deployment with custom version
opticloud ship ./commerce --target=Test1 --type=commerce --version=2.1.0
```

#### Advanced Deployments
```bash
# Complete deployment with all options
opticloud ship ./my-app \
  --target=production \
  --type=head \
  --prefix=optimizely-one \
  --version=1.0.0 \
  --output=./packages \
  --poll-interval=30

# CI/CD deployment with credential override
opticloud ship ./app \
  --target=production \
  --type=cms \
  --client-key=$CI_CLIENT_KEY \
  --client-secret=$CI_CLIENT_SECRET \
  --project-id=$CI_PROJECT_ID \
  --skip-validation

# Database deployment
opticloud ship ./database \
  --target=integration \
  --type=sqldb \
  --db-type=cms \
  --prefix=mysite
```

#### Custom Environment Deployments
```bash
# Deploy to custom DXP environment
opticloud ship ./app \
  --target=staging \
  --type=head \
  --api-endpoint=https://custom.dxp.com/api/v1.0/ \
  --client-key=CUSTOM_KEY \
  --client-secret=CUSTOM_SECRET

# Multiple environment deployment script
opticloud ship ./app --target=Test1 --type=head --prefix=mysite --version=1.0.0
opticloud ship ./app --target=Test2 --type=head --prefix=mysite --version=1.0.0  
opticloud ship ./app --target=production --type=head --prefix=mysite --version=1.0.0
```

### Package Storage Behavior

#### Default Storage (Recommended)
- **Location**: System temporary directory (e.g., `/tmp` on macOS/Linux, `%TEMP%` on Windows)
- **Cleanup**: Automatically deleted after successful deployment
- **Benefits**: Keeps workspace clean, no manual cleanup needed
- **Use Case**: Most deployments, CI/CD pipelines

#### Custom Storage
- **Usage**: `--output=./packages` or `--output=/path/to/artifacts`
- **Cleanup**: Packages are **not** automatically deleted
- **Benefits**: Package preservation for auditing, rollback, or reuse
- **Use Case**: Production deployments, compliance requirements, debugging

### Package Naming Convention

Packages are automatically named using DXP Cloud standards:

| Package Type | Naming Pattern | Example |
|--------------|----------------|---------|
| CMS | `[prefix.]cms.app.[version].nupkg` | `mysite.cms.app.20250713.nupkg` |
| Head | `[prefix.]head.app.[version].zip` | `mysite.head.app.1.0.0.zip` |
| Commerce | `[prefix.]commerce.app.[version].nupkg` | `store.commerce.app.2.1.0.nupkg` |
| SQL Database | `[prefix.][db-type.]sqldb.[version].bacpac` | `mysite.cms.sqldb.1.0.0.bacpac` |

### Deployment Monitoring

The `ship` command provides real-time deployment monitoring:

#### Status Updates
- **Status Changes**: `InProgress` → `AwaitingVerification` → `Succeeded`
- **Progress Tracking**: Percentage completion updates
- **Error Detection**: Automatic error reporting and optional continuation
- **Timestamps**: All updates include precise timing information

#### Monitoring Options
```bash
# Default monitoring (10-second intervals)
opticloud ship ./app --target=production --type=head

# Faster monitoring for quick deployments
opticloud ship ./app --target=integration --type=head --poll-interval=5

# Slower monitoring for large deployments  
opticloud ship ./app --target=production --type=cms --poll-interval=60

# Continue monitoring even with errors
opticloud ship ./app --target=Test1 --type=head --continue-on-errors
```

#### JSON Output for Automation
```bash
# Get machine-readable output
opticloud ship ./app --target=production --type=head --json

# Example JSON output:
{
  "success": true,
  "deploymentId": "12345678-1234-1234-1234-123456789012",
  "packagePath": "mysite.head.app.20250713.zip"
}
```

### Environment Variables

Override any parameter using environment variables:

```bash
export OPTI_PROJECT_ID="12345678-1234-1234-1234-123456789012"
export OPTI_CLIENT_KEY="your-client-key"
export OPTI_CLIENT_SECRET="your-client-secret"
export OPTI_API_ENDPOINT="https://paasportal.episerver.net/api/v1.0/"

# Now you can deploy without credentials in command
opticloud ship ./app --target=production --type=head
```

### Error Handling

The `ship` command includes comprehensive error handling:

#### Common Scenarios
- **Invalid Directory**: Clear error if source directory doesn't exist
- **Authentication Failures**: Detailed credential validation errors
- **Upload Failures**: Network and storage-related error reporting
- **Deployment Errors**: Real-time error detection with detailed messages
- **Permission Issues**: Clear guidance on access requirements

#### Recovery Options
```bash
# Skip credential validation for faster retries
opticloud ship ./app --target=production --type=head --skip-validation

# Continue deployment monitoring despite errors
opticloud ship ./app --target=production --type=head --continue-on-errors

# Use custom output directory to preserve packages for debugging
opticloud ship ./app --target=production --type=head --output=./debug-packages
```

### Best Practices

#### Development Workflow
```bash
# Development/testing deployments
opticloud ship ./app --target=integration --type=head --prefix=dev

# Staging deployments with package preservation
opticloud ship ./app --target=preproduction --type=head --prefix=staging --output=./packages

# Production deployments with full specification
opticloud ship ./app --target=production --type=head --prefix=mysite --version=1.0.0 --output=./production-packages
```

#### CI/CD Integration
```bash
# GitLab CI / GitHub Actions
opticloud ship $CI_PROJECT_DIR \
  --target=production \
  --type=head \
  --prefix=$CI_PROJECT_NAME \
  --version=$CI_COMMIT_TAG \
  --client-key=$DXP_CLIENT_KEY \
  --client-secret=$DXP_CLIENT_SECRET \
  --project-id=$DXP_PROJECT_ID \
  --json
```

#### Multi-Environment Deployments
```bash
# Deploy to multiple environments with version consistency
VERSION=$(date +%Y%m%d)
opticloud ship ./app --target=Test1 --type=head --version=$VERSION --prefix=mysite
opticloud ship ./app --target=Test2 --type=head --version=$VERSION --prefix=mysite
opticloud ship ./app --target=production --type=head --version=$VERSION --prefix=mysite
```

## Commands

### Authentication

```bash
# Login with credentials
opticloud auth:login

# Check authentication status
opticloud auth:status

# Logout and clear credentials
opticloud auth:logout
```

### Package Management

```bash
# Create a package from directory
opticloud package:create ./my-app --type=cms --prefix=mysite --version=1.0.0

# Create different package types
opticloud package:create ./my-cms-app --type=cms
opticloud package:create ./my-head-app --type=head --prefix=optimizely-one
opticloud package:create ./my-commerce-app --type=commerce --output=./dist
opticloud package:create ./database --type=sqldb --db-type=cms

# Upload a package
opticloud package:upload ./package.zip

# Upload to specific container
opticloud package:upload ./package.zip --container=mysitemedia

# List available packages
opticloud package:list

# Get upload URL for manual operations
opticloud package:get-upload-url
```

### Deployment Management

```bash
# One-shot deployment (recommended) - create, upload, deploy, and complete in one command
opticloud ship ./my-app --target=Integration --type=head --prefix=mysite --version=1.0.0

# One-shot deployment with custom credentials (useful for CI/CD)
opticloud ship ./my-app --target=production --type=cms --client-key=KEY --client-secret=SECRET

# One-shot deployment to custom DXP environment
opticloud ship ./my-app --target=Test1 --type=head --api-endpoint=https://custom.dxp.com/api/v1.0/

# Individual deployment steps (for granular control):

# Start deployment with packages
opticloud deployment:start --target=Integration --packages=app.zip

# Start deployment and watch progress in real-time
opticloud deployment:start --target=Integration --packages=app.zip --watch

# Start deployment copying from another environment
opticloud deployment:start --target=Production --source=Preproduction

# Use maintenance page during deployment
opticloud deployment:start --target=Production --packages=app.zip --maintenance-page

# List all deployments
opticloud deployment:list

# Get specific deployment details
opticloud deployment:list --deployment-id=12345678-1234-1234-1234-123456789012

# View detailed deployment logs (warnings, errors, progress)
opticloud deployment:logs 12345678-1234-1234-1234-123456789012

# View only deployment errors
opticloud deployment:logs 12345678-1234-1234-1234-123456789012 --errors-only

# Watch an existing deployment progress in real-time
opticloud deployment:watch 12345678-1234-1234-1234-123456789012

# Complete a deployment
opticloud deployment:complete 12345678-1234-1234-1234-123456789012

# Complete a deployment and watch progress
opticloud deployment:complete 12345678-1234-1234-1234-123456789012 --watch

# Reset a failed deployment
opticloud deployment:reset 12345678-1234-1234-1234-123456789012
```

### Database Operations

```bash
# Export database
opticloud database:export --environment=Production

# List database exports
opticloud database:list
```

### Log Management

```bash
# Get edge logs location (CDN/edge server logs)
opticloud logs:edge

# List available log containers for an environment
opticloud logs:containers --environment=Production

# List only writable log containers
opticloud logs:containers --environment=Integration --writable-only

# Get SAS URL for accessing specific log container
opticloud logs:access --environment=Production --container=azure-application-logs

# Get SAS URL with longer retention and write access
opticloud logs:access --environment=Production --container=azure-web-logs --retention-hours=48 --writable
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
opticloud package:create ./my-cms-app --type=cms --prefix=mysite --version=1.0.0

# Creates optimizely-one.head.app.20250712.zip (uses current date if no version)
opticloud package:create ./my-head-app --type=head --prefix=optimizely-one

# Creates commerce.app.1.0.0.nupkg (no prefix)
opticloud package:create ./my-commerce-app --type=commerce --version=1.0.0
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
| `Connect-EpiCloud` | `opticloud auth:login` |
| `Get-EpiDeployment` | `opticloud deployment:list` |
| `Start-EpiDeployment` | `opticloud deployment:start` |
| `Complete-EpiDeployment` | `opticloud deployment:complete` |
| `Reset-EpiDeployment` | `opticloud deployment:reset` |
| `Add-EpiDeploymentPackage` | `opticloud package:upload` |
| Package Creation | `opticloud package:create` |
| **Full Deployment Workflow** | **`opticloud ship`** ⭐ |
| `Start-EpiDatabaseExport` | `opticloud database:export` |
| `Get-EpiDatabaseExport` | `opticloud database:list` |
| `Get-EpiEdgeLogLocation` | `opticloud logs:edge` |
| `Get-EpiStorageContainer` | `opticloud logs:containers` |
| `Get-EpiStorageContainerSasLink` | `opticloud logs:access` |

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Check credentials are valid
opticloud auth:status

# Re-authenticate
opticloud auth:logout
opticloud auth:login
```

**Package Creation Failed**
```bash
# Ensure source directory exists and is readable
# Check .gitignore syntax if using custom patterns
# Verify sufficient disk space for package creation
opticloud package:create ./my-app --type=cms --prefix=mysite
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
opticloud deployment:list --deployment-id=<id>

# Reset and retry
opticloud deployment:reset <deployment-id>
```

### Debug Mode

Enable verbose logging by setting the debug environment variable:

```bash
DEBUG=opticloud* opticloud [command]
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

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-org/opticloud/issues) page.

For Optimizely DXP Cloud platform support, visit the [Optimizely Developer Community](https://world.optimizely.com/community/).