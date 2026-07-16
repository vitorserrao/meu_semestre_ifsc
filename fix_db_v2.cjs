const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
db.subjects.forEach(sub => {
    if (!sub.calendarSemester) {
        sub.calendarSemester = '2026.1';
    }
});
fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Added 2026.1 to subjects without calendarSemester');
