# Optimizely DXP CLI

[![npm version](https://img.shields.io/npm/v/@kunalshetye/opticloud.svg)](https://www.npmjs.com/package/@kunalshetye/opticloud)
[![npm downloads](https://img.shields.io/npm/dm/@kunalshetye/opticloud.svg)](https://www.npmjs.com/package/@kunalshetye/opticloud)
[![license](https://img.shields.io/npm/l/@kunalshetye/opticloud.svg)](https://github.com/kunalshetye/opticloud/blob/main/LICENSE)
[![Node.js version](https://img.shields.io/node/v/@kunalshetye/opticloud.svg)](https://nodejs.org)

A modern command-line interface for managing Optimizely Digital Experience Platform (DXP) Cloud deployments, built with Node.js and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
  - [Option 1: Install Globally](#option-1-install-globally)
  - [Option 2: Use with npx (No Installation Required)](#option-2-use-with-npx-no-installation-required)
  - [Option 3: Development Setup](#option-3-development-setup)
- [Quick Start](#quick-start)
- [Ship Command 🚀](#ship-command-)
  - [Quick Start](#quick-start-1)
  - [Complete Workflow](#complete-workflow)
  - [Command Syntax](#command-syntax)
  - [Required Parameters](#required-parameters)
  - [Package Types](#package-types)
  - [Optional Parameters](#optional-parameters)
  - [Usage Examples](#usage-examples)
  - [Package Storage Behavior](#package-storage-behavior)
  - [Package Naming Convention](#package-naming-convention)
  - [Deployment Monitoring](#deployment-monitoring)
  - [Environment Variables](#environment-variables)
  - [Error Handling](#error-handling)
  - [Best Practices](#best-practices)
- [Commands](#commands)
  - [Authentication](#authentication)
  - [Package Management](#package-management)
    - [Package Contents](#package-contents)
    - [Using .zipignore](#using-zipignore)
  - [Deployment Management](#deployment-management)
  - [Database Operations](#database-operations)
  - [Log Management](#log-management)
- [Configuration](#configuration)
- [Development](#development)
- [API Compatibility](#api-compatibility)
- [Migration from PowerShell](#migration-from-powershell)
- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions](#github-actions)
  - [Key CI/CD Features](#key-cicd-features)
  - [Other CI/CD Platforms](#other-cicd-platforms)
  - [Environment Variables](#environment-variables-1)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

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
npm install -g @kunalshetye/opticloud

# Using yarn
yarn global add @kunalshetye/opticloud

# Using pnpm
pnpm add -g @kunalshetye/opticloud

# Using bun
bun add -g @kunalshetye/opticloud
```

### Option 2: Use with npx (No Installation Required)

Run commands directly without installing using npx:

```bash
# No installation needed - npx will download and run the package
npx @kunalshetye/opticloud auth:login
npx @kunalshetye/opticloud package:create ./my-app --type=cms
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
npx @kunalshetye/opticloud auth:login
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
npx @kunalshetye/opticloud package:create ./my-app --type=head --prefix=my-app --version=1.0.0
```

### 3. Upload a Package

Upload a deployment package to your project:

```bash
# If installed globally
opticloud package:upload ./my-app.head.app.1.0.0.zip

# Or using npx
npx @kunalshetye/opticloud package:upload ./my-app.head.app.1.0.0.zip
```

### 4. Start a Deployment

Deploy your package to an environment:

```bash
# If installed globally
opticloud deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip

# Or using npx
npx @kunalshetye/opticloud deployment:start --target=Test1 --packages=my-app.head.app.1.0.0.zip
```

### 5. Monitor Deployment

Check deployment status:

```bash
# If installed globally
opticloud deployment:list

# Or using npx
npx @kunalshetye/opticloud deployment:list
```

## Ship Command 🚀

The `ship` command is the ultimate streamlined solution for Optimizely DXP deployments. It orchestrates the complete workflow from source code to production in a single command.

### Quick Start

```bash
# Basic deployment
opticloud ship ./my-app --target=integration --type=cms

# Production deployment with all options
opticloud ship ./my-app --target=production --type=head --prefix=mysite --version=1.0.0 --output=./packages

# Using npx (no installation needed)
npx @kunalshetye/opticloud ship ./my-app --target=integration --type=cms
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
# If installed globally
opticloud ship <directory> --target=<environment> --type=<package-type> [options]

# Using npx (no installation needed)
npx @kunalshetye/opticloud ship <directory> --target=<environment> --type=<package-type> [options]
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
- `--version` or `-v` - Package version (defaults to current timestamp: YYYYMMDDHHMMSS)
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

# Using npx (no installation needed)
npx @kunalshetye/opticloud ship ./cms-app --target=integration --type=cms
npx @kunalshetye/opticloud ship ./frontend --target=production --type=head --prefix=mysite
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
| CMS | `[prefix.]cms.app.[version].nupkg` | `mysite.cms.app.20250713092332.nupkg` |
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
  "packagePath": "mysite.head.app.20250713092332.zip"
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

# Or using npx
npx @kunalshetye/opticloud ship ./app --target=production --type=head
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

# Using npx (no installation needed)
npx @kunalshetye/opticloud auth:login
npx @kunalshetye/opticloud auth:status
npx @kunalshetye/opticloud auth:logout
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

# Using npx (no installation needed)
npx @kunalshetye/opticloud package:create ./my-app --type=cms --prefix=mysite --version=1.0.0
npx @kunalshetye/opticloud package:upload ./package.zip
npx @kunalshetye/opticloud package:list
```

### Deployment Management

```bash
# One-shot deployment (recommended) - create, upload, deploy, and complete in one command
opticloud ship ./my-app --target=Integration --type=head --prefix=mysite --version=1.0.0

# One-shot deployment with custom credentials (useful for CI/CD)
opticloud ship ./my-app --target=production --type=cms --client-key=KEY --client-secret=SECRET

# One-shot deployment to custom DXP environment
opticloud ship ./my-app --target=Test1 --type=head --api-endpoint=https://custom.dxp.com/api/v1.0/

# Using npx (no installation needed)
npx @kunalshetye/opticloud ship ./my-app --target=Integration --type=head --prefix=mysite --version=1.0.0

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

# Watch all deployments in real-time
opticloud deployment:list --watch

# Watch with custom polling interval
opticloud deployment:list --watch --poll-interval=15

# Watch and include completed deployments
opticloud deployment:list --watch --show-completed

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

# Using npx for individual commands (no installation needed)
npx @kunalshetye/opticloud deployment:list
npx @kunalshetye/opticloud deployment:start --target=Integration --packages=app.zip
npx @kunalshetye/opticloud deployment:complete 12345678-1234-1234-1234-123456789012
```

### Database Operations

```bash
# Export database
opticloud database:export --environment=Production

# List database exports
opticloud database:list

# Using npx (no installation needed)
npx @kunalshetye/opticloud database:export --environment=Production
npx @kunalshetye/opticloud database:list
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

# Using npx (no installation needed)
npx @kunalshetye/opticloud logs:edge
npx @kunalshetye/opticloud logs:containers --environment=Production
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
- Respects `.zipignore` files in the source directory for custom exclusions
- Automatically excludes common build artifacts (node_modules/, .DS_Store, .git/, etc.)
- Excludes sensitive files (.env, .env.local) but includes .env.example

#### Using .zipignore:
Create a `.zipignore` file in your source directory to control which files are included/excluded from packages. The `.zipignore` file behaves exactly like `.gitignore` with the same syntax and pattern matching, but lets you control package contents separately from git tracking:

```
# Exclude specific files
config.json
debug.log

# Exclude patterns
test*
*.tmp
*.bak

# Exclude TypeScript source files (keep compiled JS)
src/**/*.ts

# Use negation patterns (include despite other exclusions)
!important-config.json
```

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

## CI/CD Integration

The `opticloud` CLI is designed for seamless integration into CI/CD pipelines, enabling automated deployments to Optimizely DXP Cloud.

### GitHub Actions

For complete GitHub Actions integration examples, see our [GitHub Actions Guide](docs/github-actions.md).

**Quick Example:**
```yaml
- name: Deploy to DXP Cloud
  run: |
    npx @kunalshetye/opticloud ship ./dist \
      --target=production \
      --type=head \
      --prefix=mysite \
      --client-key=${{ secrets.DXP_CLIENT_KEY }} \
      --client-secret=${{ secrets.DXP_CLIENT_SECRET }} \
      --project-id=${{ secrets.DXP_PROJECT_ID }}
```

### Key CI/CD Features

- **🔐 Secure Authentication** - Use environment variables and secrets for credentials
- **📦 Automated Packaging** - The `ship` command handles package creation automatically  
- **🎯 Environment Targeting** - Deploy to different environments based on branch conditions
- **📊 JSON Output** - Machine-readable output for integration with other tools
- **⚡ Fast Deployment** - Optimized compression and upload processes
- **🔄 Error Handling** - Graceful failure handling with detailed error messages

### Other CI/CD Platforms

The CLI works with any CI/CD platform that supports Node.js:

- **GitLab CI**: Use `npx @kunalshetye/opticloud` in your `.gitlab-ci.yml`
- **Azure DevOps**: Install via npm task and run in PowerShell/Bash
- **Jenkins**: Use in Node.js build steps
- **CircleCI**: Install and run in your config.yml workflows

### Environment Variables

All CLI options can be set via environment variables for CI/CD:

```bash
export OPTI_PROJECT_ID="12345678-1234-1234-1234-123456789012"
export OPTI_CLIENT_KEY="your-client-key"
export OPTI_CLIENT_SECRET="your-client-secret"
export OPTI_API_ENDPOINT="https://paasportal.episerver.net/api/v1.0/"

# Now deploy without credentials in command
opticloud ship ./app --target=production --type=head

# Or using npx
npx @kunalshetye/opticloud ship ./app --target=production --type=head
```

## Troubleshooting

### Common Issues

**Authentication Failed**
```bash
# Check credentials are valid
opticloud auth:status

# Re-authenticate
opticloud auth:logout
opticloud auth:login

# Using npx (no installation needed)
npx @kunalshetye/opticloud auth:status
npx @kunalshetye/opticloud auth:login
```

**Package Creation Failed**
```bash
# Ensure source directory exists and is readable
# Check .zipignore syntax if using custom patterns
# Verify sufficient disk space for package creation
opticloud package:create ./my-app --type=cms --prefix=mysite

# Using npx
npx @kunalshetye/opticloud package:create ./my-app --type=cms --prefix=mysite
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

# Using npx
npx @kunalshetye/opticloud deployment:list --deployment-id=<id>
npx @kunalshetye/opticloud deployment:reset <deployment-id>
```

### Debug Mode

Enable verbose logging by setting the debug environment variable:

```bash
# With global installation
DEBUG=opticloud* opticloud [command]

# With npx
DEBUG=opticloud* npx @kunalshetye/opticloud [command]
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

For issues and feature requests, please use the [GitHub Issues](https://github.com/kunalshetye/opticloud/issues) page.

For Optimizely DXP Cloud platform support, visit the [Optimizely Developer Community](https://world.optimizely.com/community/).
