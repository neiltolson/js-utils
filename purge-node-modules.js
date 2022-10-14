#! /usr/bin/env node

/**
 * Used to quickly cleanup node_modules directories.
 * 
 * Recurse through the current directory and look for node_modules
 *   directories and delete them.
 */
const fs = require('fs')
const cp = require('child_process')

function isNodeProject (dirpath) {
  const dir = fs.opendirSync(dirpath)
  let entry = dir.readSync()
  while (entry !== null) {
  //  console.log(entry)
    if (entry.name === 'package.json') {
      return true
    }
    entry = dir.readSync()
  }
  dir.closeSync()
  return false
}

function deleteNodeModules (dirpath) {
  const nodeModulesPath = dirpath + '/node_modules'
  const exists = fs.existsSync(nodeModulesPath)
  if (!exists) {
    console.log(nodeModulesPath + ' does not exist')
    return false
  }
  const rmresult = cp.spawnSync('rm', ['-rf', nodeModulesPath])
  if (rmresult.status) {
    console.error(nodeModulesPath + ' - error running rm -rf on this directory')
    return false
  }
  console.log(nodeModulesPath + ' deleted')
  return true
}

function recursiveDelete(dirpath) {
  console.log('checking dir ' + dirpath)
  if (isNodeProject(dirpath)) {
    deleteNodeModules(dirpath)
    return
  }
  
  const dir = fs.opendirSync(dirpath)
  let entry = dir.readSync()
  while (entry !== null) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      recursiveDelete(dirpath + '/' + entry.name)
    }
    entry = dir.readSync()
  }
  dir.closeSync()
}

function main () {
  recursiveDelete('.')
}

try {
  main()
} catch (error) {
  console.error(error.stack)
}
