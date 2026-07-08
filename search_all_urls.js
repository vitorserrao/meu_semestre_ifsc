async function run() {
  try {
    const res = await fetch("https://florianopolis.edupage.org/timetable/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    
    // Find all JS scripts
    const regexSrc = /src=["'](.*?)["']/gi;
    let match;
    const srcs = [];
    while ((match = regexSrc.exec(html)) !== null) {
      if (match[1].includes(".js") || match[1].includes(".php") || match[1].includes("timetable")) {
        srcs.push(match[1]);
      }
    }
    console.log("Found scripts/links:", srcs);

    // Let's also look for inline JavaScript variables starting with uppercase ASC or window
    const inlineMatches = html.match(/(window\.[a-zA-Z0-9_]+|ASC\.[a-zA-Z0-9_]+|EduPage\.[a-zA-Z0-9_]+|[\w]+\s*=\s*\{[^}]*\})/gi);
    console.log("Inline matches:", inlineMatches ? inlineMatches.slice(0, 50) : "none");

    // Search for timetable JSON or XML
    const jsonMatches = html.match(/\{"[\s\S]*?\}/g);
    console.log("Found JSON strings count:", jsonMatches ? jsonMatches.length : 0);
    
  } catch (err) {
    console.error(err);
  }
}
run();
