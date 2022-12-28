import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const f = fileURLToPath(import.meta.url);
const dirname = path.dirname(f);

function updateManifest(browser) {
  const filename = `${dirname}/../src/manifest-${browser}.json`;
  const manifest = readFileSync(filename, 'utf8');
  const data = {
    ...JSON.parse(manifest),
    version: process.env.npm_package_version,
  };

  if (browser === 'firefox' && process.env.AMO_GECKO_ID !== undefined) {
    data.browser_specific_settings = {
      gecko: {
        id: `{${process.env.AMO_GECKO_ID}}`,
      },
    };
  }

  writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
}

['firefox', 'chrome'].forEach((browser) => updateManifest(browser));
