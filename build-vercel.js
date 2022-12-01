const {resolve} = require("path");
const commandLineArgs = require('command-line-args');
const {copySync, rmSync, mkdirSync} = require("fs-extra");
const {buildClientBundle, buildVercelMiddleware} = require("./index");
const { existsSync, writeFileSync } = require("fs");

const optionDefinition = [
    {name: 'dir', alias: 'd', defaultOption: true},
    {name: 'ssr', alias: 's', type: Boolean},
    {name: 'public', alias: 'u', multiple: true},
    {name: 'minify', alias: 'm', type: Boolean},
    {name: 'out', alias: 'o'},
    {name: 'name', alias: 'n'}
];

const runOptions = commandLineArgs(optionDefinition, process.argv);

if (!runOptions.dir?.length) {
    console.log("Required: dir");
    process.exit(0);
}

const {dir, out} = runOptions;

if (existsSync(out))
  rmSync(out, {recursive: true});
mkdirSync(out);

const indexModule = resolve(dir, "index.h0.ts");
const publicFolders = [...runOptions?.public || [], resolve(dir, "public")];
const htmlFile = resolve(dir, "template.h0.html");
if (!existsSync(htmlFile))
    throw new Error(`Template ${htmlFile} not found`);
if (!existsSync(indexModule))
    throw new Error(`Index ${indexModule} not found`);

for (const pub of publicFolders)
  copySync(pub, resolve(out, "public"));

buildClientBundle(indexModule, resolve(out, "public", ".h0"), {minify: !!runOptions.minify});
buildVercelMiddleware(dir, resolve(out, "middleware.js"), {serverSideRendering: runOptions.ssr});

writeFileSync(resolve(out, "package.json"), `{
  "name": "${runOptions.name}",
  "version": "1.0.0",
  "description": "",
  "main": "middleware.js",
  "scripts": {
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@vercel/edge": "^0.1.2",
    "linkedom": "^0.14.21"
  }
}
`);