// Fails (exit 1) if any meme video in the catalog is missing on Cloudinary. Run before deploying.
import { allMemeUrls } from '../lib/memes/catalog.js';

const results = await Promise.all(
  allMemeUrls().map(async (url) => {
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null);
    return { url, status: res?.status ?? 'network error' };
  })
);

const broken = results.filter((r) => r.status !== 200);
broken.forEach((r) => console.error(`✗ ${r.status} ${r.url}`));
console.log(`${results.length - broken.length}/${results.length} meme videos OK`);
process.exit(broken.length ? 1 : 0);
