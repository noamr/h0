const express = require("express");
const app = express();
require("@babel/register")({extensions: ['.js', '.ts']});

const {h0serve} = require("./src/server.ts");
h0serve(app, "./examples/kitchen-sink.html");

app.listen(3000, () => {
    console.log("App running");
})