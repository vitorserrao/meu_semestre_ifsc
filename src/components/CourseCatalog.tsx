import React, { useState, useMemo } from "react";
import { 
  BookOpen, Users, Clock, MapPin, User, Plus, Check, Search, Filter, 
  Layers, AlertTriangle, ChevronDown, ChevronRight, Bookmark
} from "lucide-react";
import { Subject, Class, Schedule } from "../types";
import { doSchedulesOverlap } from "../utils/scheduleSolver";

interface CourseCatalogProps {
  subjects: Subject[];
  selectedClassIds: string[];
  onSelectClass: (subjectId: string, classId: string) => void;
  onRemoveSubject: (subjectId: string) => void;
}

const DAY_NAMES = ["", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function CourseCatalog({ 
  subjects, 
  selectedClassIds, 
  onSelectClass, 
  onRemoveSubject
}: CourseCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("Todos");
  const [selectedSemester, setSelectedSemester] = useState<string>("Todos");
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({});

  // Extract all unique courses
  const allCourses = useMemo(() => {
    const courses = new Set<string>();
    subjects.forEach(s => {
      if (s.course) courses.add(s.course);
    });
    return ["Todos", ...Array.from(courses)];
  }, [subjects]);

  // Extract all unique semesters
  const allSemesters = useMemo(() => {
    const semesters = new Set<number>();
    subjects.forEach(s => {
      if (s.semester) semesters.add(s.semester);
    });
    return ["Todos", ...Array.from(semesters).sort((a, b) => a - b).map(String)];
  }, [subjects]);

  // Toggle subject expansion
  const toggleSubject = (id: string) => {
    setExpandedSubjectIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Derive active classes currently selected
  const activeClasses = useMemo(() => {
    const list: Class[] = [];
    selectedClassIds.forEach(id => {
      subjects.forEach(sub => {
        const found = sub.classes.find(c => c.id === id);
        if (found) list.push(found);
      });
    });
    return list;
  }, [selectedClassIds, subjects]);

  // Check if a class conflicts with currently selected classes (excluding other classes of the same subject)
  const getClassConflict = (cls: Class) => {
    const conflictsWith: string[] = [];
    
    // Compare schedules of this class with other active classes
    cls.schedules.forEach(s1 => {
      activeClasses.forEach(activeCls => {
        // Skip comparing with same subject
        if (activeCls.subjectId === cls.subjectId) return;

        activeCls.schedules.forEach(s2 => {
          if (doSchedulesOverlap(s1, s2)) {
            const activeSub = subjects.find(s => s.id === activeCls.subjectId);
            if (activeSub && !conflictsWith.includes(activeSub.name)) {
              conflictsWith.push(`${activeSub.name} (${activeCls.code})`);
            }
          }
        });
      });
    });

    return conflictsWith.length > 0 ? conflictsWith : null;
  };

  // Filter subjects based on course, semester, and search query
  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      // Course filter
      if (selectedCourse !== "Todos" && sub.course !== selectedCourse) return false;

      // Semester filter
      if (selectedSemester !== "Todos" && String(sub.semester) !== selectedSemester) return false;

      // Search query filter (fuzzy search on name, code, teacher, classroom)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = sub.name.toLowerCase().includes(query);
        const codeMatch = sub.code.toLowerCase().includes(query);
        const courseMatch = sub.course.toLowerCase().includes(query);
        
        const classMatch = sub.classes.some(cls => 
          cls.code.toLowerCase().includes(query) ||
          cls.professor.toLowerCase().includes(query) ||
          cls.room.toLowerCase().includes(query)
        );

        return nameMatch || codeMatch || courseMatch || classMatch;
      }

      return true;
    });
  }, [subjects, selectedCourse, selectedSemester, searchQuery]);

  // Format schedule text nicely
  const formatSchedules = (schedules: Schedule[]) => {
    return schedules.map(s => {
      const day = DAY_NAMES[s.dayOfWeek]?.replace("-feira", "") || "";
      return `${day} (${s.startTime}-${s.endTime})`;
    }).join(", ");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[80vh]">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col gap-5 select-none shrink-0 overflow-y-auto">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
            Filtrar por Curso
          </label>
          <div className="space-y-1">
            {allCourses.map(course => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCourse === course
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="truncate pr-2">{course === "Todos" ? "Todos os Cursos" : course}</span>
                {selectedCourse === course && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
            Filtro de Semestre
          </label>
          <div className="grid grid-cols-3 gap-1">
            {allSemesters.map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  selectedSemester === sem
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {sem === "Todos" ? "Todos" : `${sem}º`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200/80 pt-4">
          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1 mb-1">
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              Legenda do Catálogo
            </h4>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Visualize todas as turmas disponíveis, horários, professores e vagas. Conflitos com sua grade atual são destacados automaticamente em vermelho.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Live Search Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar por disciplina, código, professor, sala ou turma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-400 font-bold shrink-0">
            {filteredSubjects.length} disciplinas encontradas
          </div>
        </div>

        {/* Subjects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {filteredSubjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
              <Layers className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-display font-bold text-slate-700 mb-1">Nenhuma disciplina encontrada</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Tente ajustar os filtros do menu lateral ou digite outros termos no campo de pesquisa.
              </p>
            </div>
          ) : (
            filteredSubjects.map(sub => {
              const selectedClassOfSubject = sub.classes.find(cls => selectedClassIds.includes(cls.id));
              const isAnyClassSelected = !!selectedClassOfSubject;
              const isExpanded = expandedSubjectIds[sub.id] ?? false;

              return (
                <div 
                  key={sub.id} 
                  className={`bg-white rounded-xl border transition-all ${
                    isAnyClassSelected ? "border-indigo-200 shadow-sm" : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Subject Header Trigger */}
                  <div 
                    onClick={() => toggleSubject(sub.id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                    style={{ borderLeft: `4px solid ${sub.color || "#cbd5e1"}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-wide font-mono">
                          {sub.code}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wide">
                          {sub.semester ? `${sub.semester}º Semestre` : "Optativa"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {sub.credits} Cred.
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-800 tracking-tight truncate">
                        {sub.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {sub.course}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAnyClassSelected && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Turma {selectedClassOfSubject.code}</span>
                        </div>
                      )}

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Subject Classes Expandable details panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                        Turmas Disponíveis ({sub.classes.length})
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {sub.classes.map(cls => {
                          const isCurrent = selectedClassIds.includes(cls.id);
                          const conflictWithList = getClassConflict(cls);

                          return (
                            <div 
                              key={cls.id}
                              className={`bg-white p-3 rounded-lg border transition-all ${
                                isCurrent 
                                  ? "border-emerald-200 bg-emerald-50/10 shadow-sm" 
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                {/* Class details */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-700">
                                      Turma {cls.code}
                                    </span>
                                    {isCurrent && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                                        Ativa na Grade
                                      </span>
                                    )}
                                    {conflictWithList && !isCurrent && (
                                      <span 
                                        className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider flex items-center gap-0.5"
                                        title={`Conflita com: ${conflictWithList.join(", ")}`}
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        Conflito de Horário
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-500 font-medium text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{cls.professor}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{formatSchedules(cls.schedules)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{cls.room || "Não definida"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{cls.vacancies} vagas</span>
                                    </div>
                                  </div>

                                  {/* Conflict details warning */}
                                  {conflictWithList && !isCurrent && (
                                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-1.5 rounded mt-1.5">
                                      Ocupa mesmo horário que: {conflictWithList.join(", ")}
                                    </div>
                                  )}
                                </div>

                                {/* Class actions */}
                                <div className="shrink-0 select-none">
                                  {isCurrent ? (
                                    <button
                                      onClick={() => onRemoveSubject(sub.id)}
                                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onSelectClass(sub.id, cls.id)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isAnyClassSelected
                                          ? "bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                                          : conflictWithList
                                            ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100"
                                      }`}
                                    >
                                      {isAnyClassSelected ? "Alternar para esta" : "Adicionar à Grade"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
