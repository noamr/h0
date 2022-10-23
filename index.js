const express = require("express");
const path = require("path");
const app = express();
const esbuild = require("esbuild");
require("@babel/register")({extensions: ['.js', '.ts']});

const {h0router} = require("./src/server.ts");
const { readFileSync } = require("fs");
app.use(h0router("examples/rates"));
app.use(h0router("examples/todo-mvc"));

app.use(express.static("."));

app.listen(3000, () => {
    console.log("App running");
})