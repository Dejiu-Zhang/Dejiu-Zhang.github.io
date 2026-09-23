import { cp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
// Deploy only the current homepage and the original downloadable documents.
// The earlier Astro pages in src/ remain in Git but are never part of this output.
await access(join(root, 'site/index.html'));
await access(join(root, 'public/cv.pdf'));
await access(join(root, 'public/resources'));
await rm(output, { recursive: true, force: true });
await cp(join(root, 'site'), output, { recursive: true });
await cp(join(root, 'public/cv.pdf'), join(output, 'cv.pdf'));
await cp(join(root, 'public/resources'), join(output, 'resources'), { recursive: true });
await writeFile(join(output, '.nojekyll'), '');

// Keep old chapter bookmarks useful without publishing the former page designs.
for (const [route, chapter] of Object.entries({
  research: 'research', contact: 'contact', resources: 'resources',
})) {
  const destination = `/#${chapter}`;
  await mkdir(join(output, route), { recursive: true });
  await writeFile(join(output, route, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Olivia Zhang</title><meta http-equiv="refresh" content="0;url=${destination}">
<link rel="canonical" href="https://dejiu-zhang.github.io/${destination.slice(1)}"></head>
<body><a href="${destination}">Continue to Olivia’s homepage</a></body></html>\n`);
}
console.log('Built the disc homepage, CV, original notes, and chapter redirects in dist/.');
