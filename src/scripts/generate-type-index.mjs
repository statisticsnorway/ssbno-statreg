import ts from 'typescript'
import fs from 'fs'
import path from 'path'

const apiTypesFile = path.resolve('src/types/api-types.ts')
const indexFile = path.resolve('src/types/index.ts')

const source = ts.createSourceFile(apiTypesFile, fs.readFileSync(apiTypesFile, 'utf8'), ts.ScriptTarget.Latest, true)

let schemas = null

// Find the components interface, then the schemas property
ts.forEachChild(source, (node) => {
  if (ts.isInterfaceDeclaration(node) && node.name.text === 'components') {
    for (const member of node.members) {
      if (ts.isPropertySignature(member) && member.name.getText() === 'schemas' && ts.isTypeLiteralNode(member.type)) {
        schemas = member.type
      }
    }
  }
})

if (!schemas) process.exit(1)

const types = []

for (const type of schemas.members) {
  if (!ts.isPropertySignature(type) || !type.name) continue
  const name = type.name.getText().replace(/"/g, '')
  types.push(name)
}

let out = `import type { components } from './api-types'\n\n`

for (const name of types) {
  out += `export type ${name} = components['schemas']['${name}']`
  out += name.length + 1 !== types.length ? '\n' : ''
}

fs.writeFileSync(indexFile, out, 'utf8')
console.log(`Generated ${indexFile} with ${types.length} types`)
