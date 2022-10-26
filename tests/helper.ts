import fp from "find-free-port";

require("@babel/register")({extensions: ['.js', '.ts']});

export async function serveFolder(folder: string) {
    const [port] = await fp(3000);
    const express = require("express");
    const app = express();
    const {routerFromFolder} = require("../src/server.ts");
    app.use(routerFromFolder(folder));
    await new Promise(resolve => app.listen(port, resolve));
    return port;
}
