const fs = require('fs-extra')

/**
 * @typedef {object} VersionReturn
 * @property {string} original version
 * @property {string} updated version
 * @property {number} [major] (n._._) not sent if replace is not in n.n.n format
 * @property {number} [minor] {_.n._} not sent if replace is not in n.n.n format
 * @property {number} [patch] {_._.n} not sent if replace is not in n.n.n format
 */

 /**
 * bumps the "version" entry for a .json file
 * defaults to incrementing PATCH by 1 if no options are provided
 * @param {string} filename
 * @param {object} [options]
 * @param {string="version"} [entry] name of entry to change
 * @param {boolean} [readOnly] return the original version without changing
 * @param {number} [major] increment major by number (resetting MINOR and PATCH to 0)
 * @param {number} [minor] increment minor by number (resetting PATCH to 0)
 * @param {number} [patch] increment patch by number
 * @param {string} [replace] replace entry with this string
 * @param {number=4} [spaces] number of spaces to format jsonfile (set to 0 to remove all spaces)
 * @return {VersionReturn}
 */
module.exports = async function version(filename, options={}) {
    if (!options.replace && !options.major && !options.minor && !options.patch && !options.readOnly) {
        options.patch = 1
    }
    options.spaces = typeof options.spaces === 'undefined' ? 4 : parseInt(options.spaces)
    let json
    try {
        if (filename.indexOf('/') === -1 && filename.indexOf('\\') === -1) {
            filename = `${process.cwd()}/${filename}`
        }
        json = await fs.readJSON(filename)
    } catch (e) {
        console.error(`ERROR opening file ${filename} (${e.error})`)
        process.exit(1)
    }
    options.entry = options.entry || 'version'
    const current = json[options.entry] || ''
    let updated, split
    if (options.replace) {
        json[options.entry] = options.replace
        split = current.split('.')
    } else if (options.readOnly) {
        split = current.split('.')
    } else {
        split = current.split('.')
        if (split.length !== 3) {
            console.error(`WARNING version in ${filename} was not in MAJOR.MINOR.PATCH format, reverting to 0.0.1`)
            split = ['0', '0', '0']
        }
        if (options.major) {
            split[0] = parseInt(split[0]) + options.major
            split[1] = '0'
            split[2] = '0'
        } else if (options.minor) {
            split[1] = parseInt(split[1]) + options.minor
            split[2] = '0'
        } else if (options.patch) {
            split[2] = parseInt(split[2]) + options.patch
        }
        json[options.entry] = parseInt(split[0]) + '.' + parseInt(split[1]) + '.' + parseInt(split[2])
    }
    updated = json[options.entry]
    await fs.writeJSON(filename, json, { spaces: options.spaces })
    if (split.length === 3) {
        return { original: current, updated, major: split[0], minor: split[1], patch: split[2] }
    } else {
        return { original: current, updated }
    }
}