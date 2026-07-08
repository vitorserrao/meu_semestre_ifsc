async function run() {
  try {
    const res = await fetch("https://florianopolis.edupage.org/timetable/server/getdatabase.php", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Length:", text.length);
    console.log("Start of response:", text.substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
}
run();
