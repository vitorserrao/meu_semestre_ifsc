const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
db.subjects.forEach(sub => {
    if (typeof sub.calendarSemester === 'string' && sub.calendarSemester.startsWith('2026.2')) {
        sub.calendarSemester = '2026.2';
    }
});
fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Fixed db.json calendarSemester fields');
