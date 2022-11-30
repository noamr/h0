require("@babel/register")({extensions: ['.js', '.ts']});

const {routerFromFolder} = require("./src/server.ts");
const {buildClientBundle, buildServerBundle} = require("./src/build");
module.exports = {routerFromFolder, buildClientBundle, buildServerBundle};

