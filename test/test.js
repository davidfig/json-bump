const execShellCommand = require('child_process').exec
const fs = require('fs-extra')

const bump = require('../version')

/**
 * Executes a shell command and return it as a Promise.
 * from https://medium.com/@ali.dev/how-to-use-promise-with-exec-in-node-js-a39c4d7bbf77
 * @param cmd {string}
 * @param ignoreError {boolean} don't print error
 * @return {Promise<string>}
 */
function exec(cmd, ignoreError) {
    return new Promise(resolve => {
        execShellCommand(cmd, (error, stdout, stderr) => {
            if (error && !ignoreError) {
                console.warn(error)
            }
            resolve(stdout? stdout : stderr)
        })
    })
}

async function test() {
    let version = await bump('package.json', { readOnly: true })
    console.log(`\nTesting json-bump v${version.original}...`)

    await testModule()
    await testCLI()
    await testNested()
    console.log('All tests passed.\n')
}

async function testNested() {
    console.log('Testing nested entries...')
    const file = 'test/test-nested.json'
    const fail = message => {
        console.error(message)
        process.exit(1)
    }

    await fs.outputFile(file, JSON.stringify({ version: '9.9.9', expo: { version: '1.0.5' }, 'a.b': '1.0.0', a: { b: '2.0.0' } }))

    let result = await bump(file, { minor: 1, entry: 'expo.version' })
    if (result.original !== '1.0.5' || result.updated !== '1.1.0') fail('nested entry test failed')
    let json = await fs.readJSON(file)
    if (json.expo.version !== '1.1.0' || json.version !== '9.9.9' || 'expo.version' in json) fail('nested entry write test failed')

    result = await bump(file, { entry: 'expo.version', readOnly: true })
    if (result.original !== '1.1.0') fail('nested readOnly test failed')

    result = await bump(file, { entry: 'missing.path.version', readOnly: true })
    json = await fs.readJSON(file)
    if (result.original !== '' || 'missing' in json) fail('nested readOnly on a missing path test failed')

    await bump(file, { entry: 'a.b' })
    json = await fs.readJSON(file)
    if (json['a.b'] !== '1.0.1' || json.a.b !== '2.0.0') fail('exact key with a dot test failed')

    await bump(file, { entry: 'new.path.version', replace: '3.0.0' })
    json = await fs.readJSON(file)
    if (json.new.path.version !== '3.0.0') fail('missing parent test failed')

    const output = await exec(`node index.js ${file} --major --entry=expo.version`)
    json = await fs.readJSON(file)
    if (json.expo.version !== '2.0.0' || output.indexOf('expo.version from 1.1.0 to 2.0.0') === -1) fail('nested CLI test failed')

    await fs.unlink(file)
}

async function testModule() {
    console.log('Testing node.js module...')

    // clean up test file
    try {
        await fs.unlink('test/test.json')
    } catch(e) {}
    await fs.outputFile('test/test.json', '{}')

    await bump('test/test.json', { replace: '0.0.1' })
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '0.0.1') {
        console.error('options.replace test failed')
        process.exit(1)
    }

    version = await bump('test/test.json')
    if (version.updated !== '0.0.2') {
        console.error('empty options test failed')
        process.exit(1)
    }

    version = await bump('test/test.json', { major: 2 })
    if (version.updated !== '2.0.0') {
        console.error('options.major test failed')
        process.exit(1)
    }

    version = await bump('test/test.json', { minor: 3 })
    if (version.updated !== '2.3.0') {
        console.error('options.minor test failed')
        process.exit(1)
    }

    version = await bump('test/test.json', { patch: 4 })
    if (version.updated !== '2.3.4') {
        console.error('options.patch test failed')
        process.exit(1)
    }

    console.log('NOTE: warning expected during next test')
    version = await bump('test/test.json', { replace: 'just a string'} )
    if (version.updated !== 'just a string') {
        console.error('replace with a non-n.n.n string failed.')
        process.exit(1)
    }

    await bump('test/test.json')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '0.0.1') {
        console.error('reverting to 0.0.1 with a non-n.n.n string failed.')
        process.exit(1)
    }

    version = await bump('test/test.json', { entry: 'version-2', replace: '2.3.4' })
    if (version.updated !== '2.3.4') {
        console.error('options.entry test failed')
        process.exit(1)
    }

    version = await bump('test/test.json', { spaces: 0 })
    if (!(await fs.readFile('test/test.json')).includes('{"version":"0.0.2","version-2":"2.3.4"}')) {
        console.error('options.spaces test failed')
        process.exit(1)
    }
}

async function testCLI() {
    console.log('Testing CLI...')
    let result
    try {
        result = await exec('node index.js', true)
    } catch (e) {}
    if (!result.includes('Usage: json-bump FILENAME [FLAGS]')) {
        console.error('CLI display help test failed')
        process.exit(1)
    }

    // clean up test file
    try {
        await fs.unlink('test/test.json')
    } catch(e) {}
    await fs.outputFile('test/test.json', '{}')

    await exec('node index.js test/test.json --replace="0.0.1"')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '0.0.1') {
        console.error('options.replace test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '0.0.2') {
        console.error('empty options test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json --major=2')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '2.0.0') {
        console.error('options.major test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json --minor=3')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '2.3.0') {
        console.error('options.minor test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json --patch=4')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '2.3.4') {
        console.error('options.patch test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json --replace="just a string"')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== 'just a string') {
        console.error('replace with a non-n.n.n string failed.')
        process.exit(1)
    }

    await exec('node index.js test/test.json')
    version = await bump('test/test.json', { readOnly: true })
    if (version.updated !== '0.0.1') {
        console.error('reverting to 0.0.1 with a non-n.n.n string failed.')
        process.exit(1)
    }

    await exec('node index.js test/test.json --entry="version-2" --replace="2.3.4"')
    version = await fs.readJSON('test/test.json')
    if (version['version-2'] !== '2.3.4') {
        console.error('options.entry test failed')
        process.exit(1)
    }

    await exec('node index.js test/test.json --spaces=0')
    if (!(await fs.readFile('test/test.json')).includes('{"version":"0.0.2","version-2":"2.3.4"}')) {
        console.error('options.spaces test failed')
        process.exit(1)
    }
}

test()