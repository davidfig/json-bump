#!/usr/bin/env node

const version = require('./version')

const args = process.argv

function help() {
    console.log('\nUsage: json-bump FILENAME [FLAGS]')
    console.log('Bumps the version in a json file using semver (MAJOR.MINOR.PATCH)\n')
    console.log('  --replace=semver   this replaces the entire semver with the given string\n')
    console.log('  --major=1          increment the major version (increments by 1 if not specified)')
    console.log('  --minor=1          increment the minor version (increments by 1 if not specified)')
    console.log('  --patch=1          increment the patch version (increments by 1 if not specified)')
    console.log('  --entry=name       change entry updated (defaults is "version")\n')
    console.log('  --spaces=4         number of spaces to format the .json file (set to 0 to remove spaces)')
    console.log('If no flags are specified, increments PATCH by 1\n')
}

async function run() {
    if (args.length < 3) {
        help()
        process.exit(1)
    }

    let filename, flags = {}
    for (let i = 2; i < args.length; i++) {
        const arg = args[i]
        if (arg.substr(0, 2) === '--') {
            let value = arg.substr(2)
            if (value.indexOf('=') !== -1) {
                const split = value.split('=')
                flags[split[0].toLowerCase()] = split[1]
            } else {
                value = value.toLowerCase()
                if (value === 'major' || value === 'minor' || value == 'patch') {
                    flags[value] = 1
                } else {
                    console.error('ERROR: Unknown arg: ' + arg)
                    process.exit(2)
                }
            }
        } else {
            if (!filename) {
                filename = arg
            } else {
                console.error('ERROR: Unknown arg: ' + arg)
                process.exit(2)
            }
        }
    }
    const results = await version(filename, flags)
    console.log(`Updated ${filename} ${flags['entry'] || 'version'} from ${results.original} to ${results.updated}.\n`)
}

run()