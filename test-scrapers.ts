import {
  makeProviders,
  makeStandardFetcher,
  targets,
  makeSimpleProxyFetcher,
} from "@p-stream/providers";

// Just a basic proxy fetcher to simulate the frontend logic
const proxyUrls = [
  "https://65304ac9-simple-proxy.reyamae14.workers.dev",
  "https://eloquent-gumdrop-637ae8.netlify.app",
  "https://simple-proxy.reyamae14.workers.dev",
];

const proxiedFetcher = makeSimpleProxyFetcher(proxyUrls[0], fetch);

const providers = makeProviders({
  fetcher: makeStandardFetcher(fetch),
  proxiedFetcher,
  target: targets.BROWSER,
});

async function testSource(sourceId: string) {
  console.log(`Testing ${sourceId}...`);
  try {
    const stream = await providers.runSourceScraper({
      id: sourceId,
      media: {
        type: "movie",
        title: "The Matrix",
        releaseYear: 1999,
        tmdbId: "603",
        imdbId: "tt0133093",
      },
    });
    console.log(`✅ ${sourceId} SUCCESS:`, stream);
  } catch (err: any) {
    console.log(`❌ ${sourceId} FAILED:`, err.message);
  }
}

async function runTests() {
  await testSource("tugaflix");
  await testSource("ee3");
  await testSource("fsmovies");
  await testSource("rgshows"); // check if this one exists too
}

runTests();
