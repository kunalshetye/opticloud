#!/usr/bin/env node

const oclif = require('@oclif/core')

oclif.run().then(require('@oclif/core/handle'), require('@oclif/core/handle'))