const express = require("express");
const path = require("path");
const { pathToFileURL } = require("url");
const app = express();
const esbuild = require("esbuild");
require("@babel/register")({extensions: ['.js', '.ts']});

const {h0serve} = require("./src/server.ts");
h0serve(app, "./examples/kitchen-sink.html");

app.use(async (req, res, next) => {
    if (req.query["h0"] !== "bundle") {
        next();
        return;
    }

    const filename = path.resolve(__dirname, "." + req.path);
    const {outputFiles: [{text}]} = await esbuild.build({entryPoints: [filename], write: false, bundle: true, format: "esm"});
    res.setHeader("Content-Type", "application/javascript");
    res.send(text);
});
app.use(express.static("."));
app.listen(3000, () => {
    console.log("App running");
})