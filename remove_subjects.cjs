const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

db.subjects = db.subjects.filter(sub => sub.calendarSemester !== '2026.2');

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Removed 2026.2 subjects');
