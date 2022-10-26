const express = require("express");
const app = express();
require("@babel/register")({extensions: ['.js', '.ts']});

const {routerFromFolder} = require("./src/server.ts");
app.use(routerFromFolder("examples/rates"));
app.use(routerFromFolder("examples/todo-mvc"));

app.listen(3000, () => {
    console.log("App running");
})