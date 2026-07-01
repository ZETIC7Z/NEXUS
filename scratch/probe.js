async function run() {
  try {
    const res = await fetch("https://zeticuzapi.vercel.app/api/episodes/21");
    const json = await res.json();
    console.log("Success:", json.success);
    if (json.success) {
      const providers = Object.keys(json.results.providers || {});
      console.log("Providers:", providers);
      for (const prov of providers) {
        const provData = json.results.providers[prov];
        if (provData.episodes) {
          const categories = Object.keys(provData.episodes);
          console.log(`Provider ${prov} categories:`, categories);
          const firstCat = categories[0];
          if (firstCat) {
            const episodes = provData.episodes[firstCat];
            console.log(`  Category ${firstCat} has ${episodes.length} episodes.`);
            if (episodes.length > 0) {
              console.log("  First episode:", episodes[0]);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
