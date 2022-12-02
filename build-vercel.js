const {resolve} = require("path");
const commandLineArgs = require('command-line-args');
const {copySync, rmSync, mkdirSync} = require("fs-extra");
const {buildClientBundle, buildVercelMiddleware} = require("./index");
const { existsSync, writeFileSync, write, rm, rmdirSync } = require("fs");

const optionDefinition = [
    {name: 'dir', alias: 'd', defaultOption: true},
    {name: 'ssr', alias: 's', type: Boolean},
    {name: 'stream', type: Boolean},
    {name: 'public', alias: 'u', multiple: true},
    {name: 'minify', alias: 'm', type: Boolean},
];

const runOptions = commandLineArgs(optionDefinition, process.argv);

if (!runOptions.dir?.length) {
    console.log("Required: dir");
    process.exit(0);
}

const {dir, ssr, public, minify} = runOptions;

const indexModule = resolve(dir, "index.h0.ts");
const publicFolders = [...public || [], resolve(dir, "public")];
const htmlFile = resolve(dir, "template.h0.html");
if (!existsSync(htmlFile))
    throw new Error(`Template ${htmlFile} not found`);
if (!existsSync(indexModule))
    throw new Error(`Index ${indexModule} not found`);

if (existsSync(".vercel/output"))
  rmSync(".vercel/output", {recursive: true});

mkdirSync(".vercel/output");
mkdirSync(".vercel/output/functions");
mkdirSync(".vercel/output/functions/_middleware.func");
mkdirSync(".vercel/output/functions/_middleware.func/node_modules");
mkdirSync(".vercel/output/static");

for (const pub of publicFolders)
  copySync(pub, ".vercel/output/static");

copySync("node_modules", ".vercel/output/functions/_middleware.func/node_modules");

  writeFileSync(".vercel/output/config.json", JSON.stringify({
  "version": 3,
  "routes": [
    {
      "src": "/(.*)",
      "middlewarePath": "_middleware",
      "continue": true
    }
  ]
}));

writeFileSync(".vercel/output/functions/_middleware.func/.vc-config.json", JSON.stringify({
  "runtime": "edge",
  "entrypoint": "index.js"
}));
buildClientBundle(indexModule, resolve(".vercel/output/static/.h0"), {minify: !!minify});
buildVercelMiddleware(dir, ".vercel/output/functions/_middleware.func/index.js", {serverSideRendering: ssr, stream: !!runOptions.stream});
