const fs = require('fs-extra')

const bump = require('../version')

async function test() {
    let version = await bump('package.json', { readOnly: true })
    console.log(`Testing json-bump v${version.original}...`)

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

    console.log('All tests passed.\n')
}

test()