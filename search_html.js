async function run() {
  try {
    const res = await fetch("https://florianopolis.edupage.org/timetable/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Find all script tags
    const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let index = 0;
    while ((match = regex.exec(html)) !== null) {
      const scriptContent = match[1];
      if (scriptContent.includes("window.EduPage") || scriptContent.includes("gpage") || scriptContent.includes("timetable") || scriptContent.includes("gproject")) {
        console.log(`\n--- Script ${index++} (length ${scriptContent.length}) ---`);
        console.log(scriptContent.substring(0, 1000));
        if (scriptContent.length > 1000) {
          console.log("...truncated...");
          console.log(scriptContent.substring(scriptContent.length - 1000));
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
run();
