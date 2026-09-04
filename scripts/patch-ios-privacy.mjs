// Puts PrivacyInfo.xcprivacy where xcodegen will emit it exactly once.
//
// NOT into gen/apple/<app>_iOS/ — that directory is scanned wholesale by the
// target's `sources`, so the file gets a build phase inferred from an extension
// xcodegen does not know, and an explicit entry on top of that produces
// "Multiple commands produce ...". gen/apple/ root is scanned by nothing.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const gen = join(root, 'src-tauri/gen/apple')
const projectYml = join(gen, 'project.yml')

if (!existsSync(projectYml)) {
  console.error(`no ${projectYml} — run \`npx tauri ios init\` first`)
  process.exit(1)
}

copyFileSync(join(root, 'src-tauri/PrivacyInfo.xcprivacy'), join(gen, 'PrivacyInfo.xcprivacy'))

const yml = readFileSync(projectYml, 'utf8')
if (yml.includes('PrivacyInfo.xcprivacy')) {
  console.log('project.yml already references PrivacyInfo.xcprivacy — nothing to do')
  process.exit(0)
}

// Anchored on a line the template has always had; fail loudly if it changes
// rather than silently producing a project without the file.
const anchor = yml.split('\n').find((l) => l.includes('- path: LaunchScreen.storyboard'))
if (!anchor) {
  console.error('anchor "- path: LaunchScreen.storyboard" not found in project.yml — template changed')
  process.exit(1)
}
const indent = anchor.match(/^\s*/)[0]
const insert = `${indent}- path: PrivacyInfo.xcprivacy\n${indent}  buildPhase: resources`
writeFileSync(projectYml, yml.replace(anchor, `${anchor}\n${insert}`))
console.log('project.yml: added PrivacyInfo.xcprivacy as a resource')
