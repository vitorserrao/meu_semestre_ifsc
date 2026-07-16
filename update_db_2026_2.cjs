const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

// Remove all 2026.2
db.subjects = db.subjects.filter(sub => sub.calendarSemester !== '2026.2');

// Subjects 2026.2 data map - RIGOROUSLY MAPPED TO TABLE
const subjectsMap = {
  "ADM20805": { name: "Administração Geral", sem: 5, credits: 2, prof: "Keliton da Silva Ferreira", schedules: [{ day: 6, start: "18:30", end: "20:20", room: "C212" }] },
  "ALG20802": { name: "Álgebra Linear", sem: 2, credits: 3, prof: "Fabiano Carlos Cidral", schedules: [{ day: 2, start: "20:40", end: "22:30", room: "C212" }, { day: 6, start: "18:30", end: "20:20", room: "C212" }] },
  "EXT20803": { name: "Atividade Curricular de Extensão I", sem: 3, credits: 5, prof: "Fabricio Yutaka Kuwabata Takigawa", schedules: [{ day: 5, start: "18:30", end: "22:30", room: "C112" }] },
  "EXT20805": { name: "Atividade Curricular de Extensão II", sem: 5, credits: 5, prof: "Pedro Cesar Cordeiro Vieira", schedules: [{ day: 4, start: "20:40", end: "22:30", room: "G013" }, { day: 5, start: "18:30", end: "20:20", room: "C113" }] },
  "EXT20806": { name: "Atividade Curricular de Extensão III", sem: 6, credits: 1, prof: "João Vitor Nunes Leal", schedules: [{ day: 3, start: "18:30", end: "19:25", room: "G023" }] },
  "CAL20801": { name: "Cálculo Aplicado", sem: 1, credits: 6, prof: "Carlos Henrique Radavelli", schedules: [{ day: 2, start: "18:30", end: "20:20", room: "C107" }, { day: 3, start: "20:40", end: "22:30", room: "C107" }] },
  "CAA22401": { name: "Cálculo I", sem: 2, credits: 7, prof: "Greyson Alberto Rech", schedules: [{ day: 2, start: "18:30", end: "20:20", room: "C120" }, { day: 3, start: "20:40", end: "22:30", room: "C118" }, { day: 4, start: "20:40", end: "22:30", room: "C120" }, { day: 5, start: "20:40", end: "22:30", room: "C120" }] },
  "CTM20801": { name: "Ciência e Tecnologia dos Materiais", sem: 1, credits: 2, prof: "A definir", schedules: [{ day: 6, start: "20:40", end: "22:30", room: "C213" }] },
  "CEA20802": { name: "Circuitos Elétricos A", sem: 2, credits: 4, prof: "Bruno Scortegagna Dupczak", schedules: [{ day: 4, start: "18:30", end: "20:20", room: "G024" }, { day: 5, start: "20:40", end: "22:30", room: "C218" }] },
  "CEB20803": { name: "Circuitos Elétricos B", sem: 3, credits: 4, prof: "Juliano Bitencourt Padilha", schedules: [{ day: 2, start: "20:40", end: "22:30", room: "C214" }, { day: 6, start: "20:40", end: "22:30", room: "G005" }] },
  "CME20805": { name: "Comercialização de Energia", sem: 5, credits: 4, prof: "Rubipiara Cavalcante Fernandes", schedules: [{ day: 2, start: "18:30", end: "22:30", room: "C219" }] },
  "CPQ20805": { name: "Comunicação e Pesquisa", sem: 5, credits: 2, prof: "Marco Antonio Quirino Pessoa", schedules: [{ day: 6, start: "20:40", end: "22:30", room: "C113" }] },
  "DAC20801": { name: "Desenho Técnico Auxiliado por Computador", sem: 1, credits: 1, prof: "Carlos Ernani da Veiga", schedules: [{ day: 5, start: "20:40", end: "22:30", room: "C220" }] },
  "ECA20802": { name: "Economia Aplicada", sem: 2, credits: 2, prof: "Everthon Taghori Sica", schedules: [{ day: 2, start: "18:30", end: "20:20", room: "C218" }] },
  "EEA20805": { name: "Eficiência Energética Aplicada", sem: 5, credits: 4, prof: "Bruno Scortegagna Dupczak", schedules: [{ day: 3, start: "18:30", end: "22:30", room: "G031" }] },
  "EMA20805": { name: "Energia, Sociedade e Meio Ambiente", sem: 5, credits: 2, prof: "Roberto de Mattos Soldi", schedules: [{ day: 5, start: "20:40", end: "22:30", room: "C212" }] },
  "ESP20802": { name: "Estatística e Probabilidade", sem: 2, credits: 3, prof: "Letícia dos Santos Fogaça", schedules: [{ day: 3, start: "18:30", end: "20:20", room: "C212" }, { day: 6, start: "18:30", end: "20:20", room: "C212" }] },
  "FFS20801": { name: "Fenômenos Físicos", sem: 1, credits: 4, prof: "Sergio Torlai Pereira", schedules: [{ day: 2, start: "20:40", end: "22:30", room: "C107" }, { day: 3, start: "20:40", end: "22:30", room: "C107" }] },
  "FEM20802": { name: "Fundamentos de Eletromagnetismo", sem: 2, credits: 2, prof: "A definir", schedules: [{ day: 6, start: "20:40", end: "22:30", room: "C218" }] },
  "FME20804": { name: "Fundamentos de Máquinas Elétricas", sem: 4, credits: 4, prof: "Leandro de Medeiros Sebastião", schedules: [{ day: 4, start: "20:40", end: "22:30", room: "G031" }, { day: 5, start: "20:40", end: "22:30", room: "G024" }] },
  "GAN20801": { name: "Geometria Analítica", sem: 1, credits: 3, prof: "Mairon Carliel Pontarolo", schedules: [{ day: 3, start: "18:30", end: "20:20", room: "C107" }, { day: 5, start: "18:30", end: "20:20", room: "C107" }] },
  "GMT22401": { name: "Geometria Analítica (Shared)", sem: 1, credits: 3, prof: "Mairon Carliel Pontarolo", schedules: [{ day: 2, start: "20:40", end: "22:30", room: "C120" }, { day: 4, start: "20:40", end: "22:30", room: "C120" }] },
  "IEL20803": { name: "Instalações Elétricas", sem: 3, credits: 2, prof: "A definir", schedules: [{ day: 3, start: "18:30", end: "20:20", room: "LIEA/G005" }] },
  "IEE20804": { name: "Introdução à Eficiência Energética", sem: 4, credits: 2, prof: "Rafael Nilson Rodrigues", schedules: [{ day: 2, start: "20:40", end: "22:30", room: "G012" }] },
  "ISE20802": { name: "Introdução à Sistemas de Energia", sem: 2, credits: 2, prof: "Anderson Soares André", schedules: [{ day: 5, start: "18:30", end: "20:20", room: "G012" }] },
  "MAT20803": { name: "Lógica de Programação em Matlab", sem: 3, credits: 2, prof: "Leandro de Medeiros Sebastião", schedules: [{ day: 6, start: "18:30", end: "20:20", room: "G025" }] },
  "MPE20804": { name: "Macros em Planilhas Eletrônicas", sem: 4, credits: 2, prof: "Gustavo Cardoso Orsi", schedules: [{ day: 6, start: "18:30", end: "20:20", room: "G013" }] },
  "MTF20804": { name: "Matemática Financeira", sem: 4, credits: 2, prof: "João Vitor Nunes Leal", schedules: [{ day: 3, start: "20:40", end: "22:30", room: "G013" }] },
  "MEE20803": { name: "Materiais e Equipamentos Elétricos", sem: 3, credits: 2, prof: "Daniel Tenfen", schedules: [{ day: 2, start: "18:30", end: "20:20", room: "C216" }] },
  "PEA20802": { name: "Planilha Eletrônica Avançada", sem: 2, credits: 2, prof: "João Vitor Nunes Leal", schedules: [{ day: 4, start: "20:40", end: "22:30", room: "C220" }] },
  "PPT20805": { name: "Pré-projeto de TCC", sem: 5, credits: 2, prof: "João Vitor Nunes Leal / Gustavo Cardoso Orsi", schedules: [{ day: 4, start: "18:30", end: "20:20", room: "G013" }] },
  "PRE20803": { name: "Produção de Energia", sem: 3, credits: 4, prof: "Verônica Etchebehere Santiago", schedules: [{ day: 3, start: "20:40", end: "22:30", room: "C213" }, { day: 4, start: "18:30", end: "20:20", room: "G031" }] },
  "PII20801": { name: "Projeto Integrador – Iniciação Científica", sem: 1, credits: 2, prof: "Ricardo Luiz Alves / Rubipiara Cavalcante Fernandes", schedules: [{ day: 5, start: "18:30", end: "20:20", room: "C220" }] },
  "PIE20804": { name: "Projetos de Instalações Elétricas Residenciais e Prediais", sem: 4, credits: 4, prof: "Wagner Coelho Leal", schedules: [{ day: 3, start: "18:30", end: "20:20", room: "G025" }, { day: 6, start: "20:40", end: "22:30", room: "G025" }] },
  "QEE20804": { name: "Qualidade de Energia Elétrica", sem: 4, credits: 2, prof: "Márcio Silveira Ortmann", schedules: [{ day: 2, start: "18:30", end: "20:20", room: "G023" }] },
  "RTE20804": { name: "Regulação Técnica e Econômica", sem: 4, credits: 2, prof: "Pedro Cesar Cordeiro Vieira", schedules: [{ day: 4, start: "18:30", end: "20:20", room: "C220" }] },
  "SEG20802": { name: "Segurança do Trabalho", sem: 2, credits: 2, prof: "Rafael Nilson Rodrigues", schedules: [{ day: 3, start: "20:40", end: "22:30", room: "C212" }] },
  "SME20803": { name: "Sistemas de Medição Elétrica", sem: 3, credits: 2, prof: "Cesar Alberto Penz", schedules: [{ day: 4, start: "20:40", end: "22:30", room: "G023" }] },
  "SEP20804": { name: "Sistemas Elétricos de Potência", sem: 4, credits: 2, prof: "A definir", schedules: [{ day: 5, start: "18:30", end: "20:20", room: "G025" }] },
  "TCI20801": { name: "Tecnologia da Informação", sem: 1, credits: 2, prof: "João Vitor Nunes Leal / Marcelo dos Santos Coutinho", schedules: [{ day: 6, start: "18:30", end: "20:20", room: "C220" }] }
};

Object.keys(subjectsMap).sort((a, b) => {
    const subA = subjectsMap[a];
    const subB = subjectsMap[b];
    if (subA.sem !== subB.sem) return subA.sem - subB.sem;
    return subA.name.localeCompare(subB.name);
}).forEach((code, i) => {
  const sub = subjectsMap[code];
  db.subjects.push({
    id: `sub-2026-2-${i}`,
    code: code,
    name: sub.name,
    course: "Sistemas de Energia",
    semester: sub.sem,
    credits: sub.credits,
    color: "#f43f5e",
    calendarSemester: "2026.2",
    classes: [
      {
        id: `class-2026-2-${i}`,
        code: "Turma 01",
        subjectId: `sub-2026-2-${i}`,
        professor: sub.prof,
        room: sub.schedules.length > 0 ? sub.schedules[0].room : "A DEFINIR",
        vacancies: 40,
        semester: sub.sem,
        schedules: sub.schedules.map(s => ({ dayOfWeek: s.day, startTime: s.start, endTime: s.end, room: s.room || "A DEFINIR" }))
      }
    ]
  });
});

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('Updated db.json with 2026.2 subjects');
