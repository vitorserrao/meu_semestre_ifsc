async function run() {
  try {
    const urls = [
      "https://unpkg.com/node-edupage@latest/dist/index.js",
      "https://unpkg.com/node-edupage@latest/dist/index.cjs",
      "https://unpkg.com/node-edupage@latest/dist/timetable.js",
      "https://unpkg.com/node-edupage@latest/index.js"
    ];

    for (const url of urls) {
      console.log("Fetching:", url);
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        console.log(`Success! Length: ${text.length}`);
        
        // Let's find occurrences of "php" or "server" or "get" or "table"
        const regex = /server\/[a-zA-Z0-9_\.]+/gi;
        const matches = text.match(regex);
        console.log("Matches for server/ :", matches);

        const phpRegex = /[a-zA-Z0-9_\.]+\.php/gi;
        const phpMatches = text.match(phpRegex);
        console.log("Matches for .php :", phpMatches);

        const urlRegex = /https?:\/\/[^\s"'`]+/gi;
        const urlMatches = text.match(urlRegex);
        console.log("Matches for http(s) URLs :", urlMatches ? urlMatches.slice(0, 10) : "none");
        
        break; // stop at first success
      } else {
        console.log(`Status: ${res.status}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
run();
