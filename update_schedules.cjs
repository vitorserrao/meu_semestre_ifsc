const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// Map of subject code to schedule string (simplified)
const scheduleMap = {
  'ADM20805': { dayOfWeek: 6, startTime: '18:30', endTime: '20:20', room: 'C212' },
  'EXT20803': { dayOfWeek: 5, startTime: '18:30', endTime: '22:30', room: 'C112' },
  'ESP20802': { dayOfWeek: 3, startTime: '18:30', endTime: '20:20', room: 'C212' },
  // ... I'll need to fill this or make a better parser.
};

db.subjects.forEach(sub => {
  if (sub.calendarSemester === '2026.2') {
    const info = scheduleMap[sub.code];
    if (info && sub.classes[0]) {
      sub.classes[0].schedules = [info];
    }
  }
});

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Updated schedules for 2026.2 subjects');
