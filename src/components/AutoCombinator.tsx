import React from "react";
import { 
  Trophy, Check, Clock, Flame
} from "lucide-react";
import { Subject, Class, SavedGrade } from "../types";
import { doClassesOverlap, analyzeSchedules } from "../utils/scheduleSolver";

interface AutoCombinatorProps {
  selectedSubjects?: Subject[];
  allSubjects: Subject[];
  onApplyCombination?: (classIds: string[]) => void;
  activeClassIds?: string[];
  grades: SavedGrade[];
  activeGradeId: string;
  onSelectGrade: (id: string) => void;
}

interface GradeAnalysis {
  gradeId: string;
  name: string;
  classes: Class[];
  subjectCount: number;
  totalCredits: number;
  idleTimeMinutes: number;
  conflictsCount: number;
  daysPresenciais: number;
}

export default function AutoCombinator({ 
  allSubjects, 
  grades = [],
  activeGradeId,
  onSelectGrade
}: AutoCombinatorProps) {

  // Analyze all custom grades
  const analyzeGrade = (grade: SavedGrade): GradeAnalysis => {
    const classes: Class[] = [];
    grade.classIds.forEach(id => {
      allSubjects.forEach(sub => {
        const cls = sub.classes.find(c => c.id === id);
        if (cls) {
          classes.push(cls);
        }
      });
    });

    let totalCredits = 0;
    const uniqueSubjectIds = new Set<string>();
    classes.forEach(cls => {
      uniqueSubjectIds.add(cls.subjectId);
      const sub = allSubjects.find(s => s.id === cls.subjectId);
      if (sub) {
        totalCredits += sub.credits;
      }
    });

    let conflictsCount = 0;
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        if (doClassesOverlap(classes[i], classes[j])) {
          conflictsCount++;
        }
      }
    }

    const scheduleAnalysis = analyzeSchedules(classes);

    return {
      gradeId: grade.id,
      name: grade.name,
      classes,
      subjectCount: uniqueSubjectIds.size,
      totalCredits,
      idleTimeMinutes: scheduleAnalysis.idleTimeMinutes,
      conflictsCount,
      daysPresenciais: scheduleAnalysis.daysOccupied.length
    };
  };

  const analyzedGrades = grades.map(analyzeGrade);

  // Determine winners for each requested metric
  // Only consider grades with at least 1 subject to avoid empty grades winning
  const activeGrades = analyzedGrades.filter(g => g.subjectCount > 0);

  // A. Number of subjects
  const maxSubjects = activeGrades.length > 0 ? Math.max(...activeGrades.map(g => g.subjectCount)) : 0;
  const bestSubjectGradeIds = maxSubjects > 0 
    ? activeGrades.filter(g => g.subjectCount === maxSubjects).map(g => g.gradeId)
    : [];

  // B. Workload (totalCredits)
  const maxCredits = activeGrades.length > 0 ? Math.max(...activeGrades.map(g => g.totalCredits)) : 0;
  const bestCreditsGradeIds = maxCredits > 0 
    ? activeGrades.filter(g => g.totalCredits === maxCredits).map(g => g.gradeId)
    : [];

  // C. Lowest idle time (menor tempo ocioso)
  const minIdleMinutes = activeGrades.length > 0 ? Math.min(...activeGrades.map(g => g.idleTimeMinutes)) : 0;
  const bestIdleGradeIds = activeGrades.length > 0 
    ? activeGrades.filter(g => g.idleTimeMinutes === minIdleMinutes).map(g => g.gradeId)
    : [];

  // Champions Display Helpers
  const championSubjects = activeGrades.find(g => bestSubjectGradeIds.includes(g.gradeId));
  const championCredits = activeGrades.find(g => bestCreditsGradeIds.includes(g.gradeId));
  const championIdle = activeGrades.find(g => bestIdleGradeIds.includes(g.gradeId));

  return (
    <div className="space-y-8 animate-fade-in" id="auto-combinator-panel">
      
      {/* CUSTOM GRADES COMPARISON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Comparativo de Suas Grades Criadas
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Aqui você acompanha os detalhes de todas as suas grades salvas e vê qual delas se destaca nas principais categorias de desempenho.
          </p>
        </div>

        {grades.length === 0 ? (
          <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
            Nenhuma grade criada ainda neste semestre.
          </div>
        ) : (
          <>
            {/* Champions Summary Widget Cards */}
            {activeGrades.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Winner 1: Matérias */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Mais Matérias</span>
                    {championSubjects ? (
                      <>
                        <span className="text-sm font-extrabold text-slate-800">{championSubjects.name}</span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">({championSubjects.subjectCount} disc.)</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Nenhum</span>
                    )}
                  </div>
                </div>

                {/* Winner 2: Carga Horária */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Maior Carga Horária</span>
                    {championCredits ? (
                      <>
                        <span className="text-sm font-extrabold text-slate-800">{championCredits.name}</span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">({championCredits.totalCredits} créd.)</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Nenhum</span>
                    )}
                  </div>
                </div>

                {/* Winner 3: Tempo Ocioso */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Menor Tempo Ocioso</span>
                    {championIdle ? (
                      <>
                        <span className="text-sm font-extrabold text-slate-800">{championIdle.name}</span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">
                          ({championIdle.idleTimeMinutes === 0 ? "0h" : `${Math.floor(championIdle.idleTimeMinutes / 60)}h${championIdle.idleTimeMinutes % 60}m`})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Nenhum</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side Detailed Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyzedGrades.map((grade) => {
                const isActive = grade.gradeId === activeGradeId;
                const isBestSubject = bestSubjectGradeIds.includes(grade.gradeId);
                const isBestCredits = bestCreditsGradeIds.includes(grade.gradeId);
                const isBestIdle = bestIdleGradeIds.includes(grade.gradeId);
                const hasNoSubjects = grade.subjectCount === 0;

                return (
                  <div 
                    key={grade.gradeId}
                    className={`bg-white border rounded-xl p-5 shadow-xs transition-all relative flex flex-col justify-between gap-4 ${
                      isActive 
                        ? "ring-2 ring-emerald-500 border-emerald-100 bg-emerald-50/10" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Card Header & Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-base text-slate-800">
                            {grade.name}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full select-none">
                              <Check className="w-3 h-3" /> Ativa
                            </span>
                          )}
                        </div>

                        {!isActive && (
                          <button
                            onClick={() => onSelectGrade(grade.gradeId)}
                            className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Visualizar Grade
                          </button>
                        )}
                      </div>

                      {/* Performance Highlights Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {isBestSubject && !hasNoSubjects && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                            🏆 Mais Matérias
                          </span>
                        )}
                        {isBestCredits && !hasNoSubjects && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                            ⚡ Maior Carga Horária
                          </span>
                        )}
                        {isBestIdle && !hasNoSubjects && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                            ⏱️ Menor Tempo Ocioso
                          </span>
                        )}
                        {hasNoSubjects && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            Vazia
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Values */}
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase select-none">Matérias</span>
                        <span className="font-extrabold text-slate-700">{grade.subjectCount} disciplinas</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase select-none">Carga Horária</span>
                        <span className="font-extrabold text-slate-700">{grade.totalCredits} créditos</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase select-none">Tempo Ocioso</span>
                        <span className="font-extrabold text-slate-700">
                          {grade.idleTimeMinutes === 0 ? "Nenhum" : `${Math.floor(grade.idleTimeMinutes / 60)}h e ${grade.idleTimeMinutes % 60}m`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase select-none">Conflitos</span>
                        <span className={`font-extrabold ${grade.conflictsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {grade.conflictsCount === 0 ? "Nenhum" : `${grade.conflictsCount} conflito(s)`}
                        </span>
                      </div>
                    </div>

                    {/* Disciplines and Classes List */}
                    {grade.classes.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase select-none">Disciplinas Selecionadas:</span>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {grade.classes.map((cls) => {
                            const sub = allSubjects.find(s => s.id === cls.subjectId);
                            const color = sub?.color || "#cbd5e1";
                            const name = sub?.name || "Disciplina Desconhecida";
                            return (
                              <div 
                                key={cls.id}
                                className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/60 rounded-lg p-2 font-medium"
                                style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
                              >
                                <span className="text-slate-700 truncate mr-2" title={name}>
                                  {name}
                                </span>
                                <span className="shrink-0 font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  {cls.code}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
