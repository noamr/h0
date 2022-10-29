require("@babel/register")({extensions: ['.js', '.ts']});

const {routerFromFolder} = require("./src/server.ts");
module.exports = routerFromFolder;
