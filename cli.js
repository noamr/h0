const express = require("express");
const {routerFromFolder} = require("./index");
const app = express();
const path = require("path");
const commandLineArgs = require('command-line-args');
const optionDefinition = [
    {name: 'port', alias: 'p', type: Number },
    {name: 'dir', alias: 'd', multiple: true, defaultOption: true},
    {name: 'ssr', alias: 's', type: Boolean},
    {name: 'stream', type: Boolean},
    {name: 'public', alias: 'u', multiple: true},
    {name: 'watch', alias: 'w', type: Boolean},
    {name: 'minify', alias: 'm', type: Boolean}
];

const runOptions = commandLineArgs(optionDefinition, process.argv);
const port = runOptions.port || process.env.PORT || 3000;
if (!runOptions.dir?.length) {
    console.log("Required: dir");
    process.exit(0);
}

for (const dir of runOptions.dir) {
    const options = {watch: runOptions.watch, esbuild: {}};
    if (runOptions.ssr)
        options.serverSideRendering = true;
    if (runOptions.stream)
        options.stream = true;
    if (runOptions.minify)
        options.esbuild.minify = true;
    app.use(routerFromFolder(dir, options));
    const {scope} = require(`${path.resolve(dir)}/index.h0.ts`);
    console.log(`H0: serving ${dir} at http://localhost:${port}${scope}`);
}

for (const p of runOptions.public || []) {
    console.log(`H0: serving ${p} as public folder`);
    app.use(express.static(p));
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})