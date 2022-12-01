import { ServerOptions } from "../src/express";

require("@babel/register")({extensions: ['.js', '.ts']});
const getPort = require("find-free-port");
export async function serveFolder(folder: string, options?: Partial<ServerOptions>) {
    const [port] = await getPort(3000);
    const express = require("express");
    const app = express();
    const {routerFromFolder} = require("../src/express.ts");
    app.use(routerFromFolder(folder, options));
    let server: any = null;
    await new Promise(resolve => { server = app.listen(port, resolve) });
    return {close: () => server.close(), port};
}
