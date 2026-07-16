const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

db.subjects.push({
  "id": "sub-adm-2026-2",
  "code": "ADM20805",
  "name": "Administração Geral",
  "course": "Sistemas de Energia",
  "semester": 1,
  "credits": 2,
  "color": "#f43f5e",
  "classes": [
    {
      "id": "class-adm-2026-2",
      "code": "Turma 01",
      "subjectId": "sub-adm-2026-2",
      "professor": "Keliton da Silva Ferreira",
      "room": "C212",
      "vacancies": 40,
      "semester": 1,
      "schedules": [
        {
          "dayOfWeek": 6,
          "startTime": "18:30",
          "endTime": "20:20",
          "room": "C212"
        }
      ]
    }
  ],
  "calendarSemester": "2026.2"
});

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Added test subject');
