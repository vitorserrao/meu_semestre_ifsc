const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const mpe = db.subjects.filter(sub => sub.code === 'MPE20804');
console.log(JSON.stringify(mpe, null, 2));
