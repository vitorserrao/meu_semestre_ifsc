async function run() {
  const payload = {
    "__gsh": "00000000",
    "gproject": "gpage",
    "gpage": "timetable",
    "control": {
      "year": 2026,
      "current_date": "2026-07-07"
    }
  };

  try {
    const res = await fetch("https://florianopolis.edupage.org/timetable/server/gettables.php?__gsh=00000000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", res.status);
    if (res.ok) {
      const text = await res.text();
      console.log("Response text length:", text.length);
      try {
        const json = JSON.parse(text);
        console.log("Is JSON:", true);
        console.log("Keys:", Object.keys(json));
        if (json.r) {
          console.log("Keys of json.r:", Object.keys(json.r));
          if (json.r.tables) {
            console.log("Tables found:", json.r.tables.map(t => ({ id: t.id, name: t.def })));
          }
        }
      } catch (err) {
        console.log("Response starts with:", text.substring(0, 500));
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
