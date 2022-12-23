import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import webExt from 'web-ext';

const args = process.argv.slice(2);
const f = fileURLToPath(import.meta.url);
const dirname = path.dirname(f);

args.forEach((browser) => {
  if (['firefox', 'google'].includes(browser)) {
    fs.mkdirSync(`${dirname}/../dist/${browser}`, { recursive: true });
    fs.copySync(`${dirname}/../src/manifest-${browser}.json`, `${dirname}/../dist/${browser}/manifest.json`);
    fs.copySync(`${dirname}/../src/popup`, `${dirname}/../dist/${browser}/popup`);
    fs.copySync(`${dirname}/../src/images`, `${dirname}/../dist/${browser}/images`);

    webExt.cmd.build({
      sourceDir: `${dirname}/../dist/${browser}`,
      artifactsDir: `${dirname}/../web-ext-artifacts`,
      overwriteDest: true,
      filename: `ecoindex.fr-${browser}.zip`,
    }, {
      shouldExitProgram: false,
    }).then(() => {
      // eslint-disable-next-line no-console
      console.log('Build complete');
    });
  }
});
