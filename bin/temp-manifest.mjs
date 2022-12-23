import { fileURLToPath } from 'url';
import path from 'path';
import { access, link, F_OK } from 'fs';

const f = fileURLToPath(import.meta.url);
const dirname = path.dirname(f);

const manifest = `${dirname}/../src/manifest.json`;

access(manifest, F_OK, (err) => {
  if (err) {
    link(`${dirname}/../src/manifest-firefox.json`, manifest, (e) => {
      if (e) {
        console.log(e);
      }
    });
  }
});
