/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const fs = require('fs-extra')
const path = require('path')
const EventEmitter = require('events')

module.exports = class CNAScript extends EventEmitter {
  constructor (config) {
    super()
    if (typeof config !== 'object') {
      throw new Error(`config is not a valid object, received ${(typeof config)}`)
    }
    this.config = config
  }

  /** Interface methods */

  async run () {
    throw new Error('Not implemented')
  }

  /** Static methods */
  static runOrExport (callerModule, CNAScriptDeclaration) {
    // for now let's ignore script execution from cmd line for unit test coverage
    /* istanbul ignore next */
    if (typeof require !== 'undefined' && require.main === callerModule) {
      // In the future this won't be needed anymore as nodejs will terminate the
      // process with a non zero exit code
      process.on('unhandledRejection', error => {
        throw error
      })
      const appDir = process.argv[2] || process.cwd()
      const config = require('./config-loader')(appDir)
      const script = new CNAScriptDeclaration(config)
      script.on('start', taskName => console.log(`${taskName}...`))
      script.on('progress', item => console.log(`  > ${item}`))
      script.on('end', taskName => console.log(`${taskName} done!`))
      script.on('warning', warning => console.warn(warning))
      script.on('resource', res => {
        console.log(res)
        require('open')(res)
      })
      script.run()
    } else {
      callerModule.exports = CNAScriptDeclaration
    }
  }

  /** Instance utilities */

  _relCwd (p) {
    return path.relative(process.cwd(), path.normalize(p))
  }

  _relApp (p) {
    return path.relative(this.config.root, path.normalize(p))
  }

  _absApp (p) {
    return path.join(this.config.root, path.normalize(p))
  }

  async _injectWebConfig () {
    // for now only action URLs
    await fs.writeFile(
      this.config.web.injectedConfig,
      JSON.stringify(this.config.actions.urls), { encoding: 'utf-8' }
    )
  }
}