require("@babel/register")({extensions: ['.js', '.ts']});

const {routerFromFolder} = require("./src/express.ts");
const {buildClientBundle, buildVercelMiddleware} = require("./src/build");
module.exports = {routerFromFolder, buildClientBundle, buildVercelMiddleware};

