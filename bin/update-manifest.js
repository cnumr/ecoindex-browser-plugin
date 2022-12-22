const fs = require('fs');

const filename = `${__dirname}/../src/manifest.json`;
// eslint-disable-next-line import/no-dynamic-require
const manifest = require(filename);

fs.writeFileSync(
  filename,
  JSON.stringify(
    {
      ...manifest,
      version: process.env.npm_package_version,
    },
    null,
    2,
  ),
);
