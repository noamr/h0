const {resolve} = require("path");
const commandLineArgs = require('command-line-args');
const {copySync, rmSync, mkdirSync} = require("fs-extra");
const {buildClientBundle, buildServerBundle} = require("./index");
const { existsSync } = require("fs");

const optionDefinition = [
    {name: 'dir', alias: 'd', defaultOption: true},
    {name: 'ssr', alias: 's', type: Boolean},
    {name: 'public', alias: 'u', multiple: true},
    {name: 'minify', alias: 'm', type: Boolean},
    {name: 'out', alias: 'o'}
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

console.log(runOptions)
buildClientBundle(indexModule, resolve(out, "public", ".h0"), {minify: !!runOptions.minify});
buildServerBundle(dir, resolve(out, "api"), {serverSideRendering: runOptions.ssr});