#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config()

const oclif = require('@oclif/core')

oclif.run().then(require('@oclif/core/handle'), require('@oclif/core/handle'))