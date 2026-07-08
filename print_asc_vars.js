async function run() {
  try {
    const res = await fetch("https://florianopolis.edupage.org/timetable/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    
    // Find lines containing "ASC."
    const lines = html.split("\n");
    for (const line of lines) {
      if (line.includes("ASC.") || line.includes("gsechash") || line.includes("req_props")) {
        console.log(line.trim());
      }
    }
  } catch (err) {
    console.error(err);
  }
}
run();
