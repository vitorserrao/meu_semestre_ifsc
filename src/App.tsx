import React, { useState, useEffect } from "react";
import { 
  Calendar, Layers, BarChart3, Sparkles, GraduationCap, 
  HelpCircle, RotateCcw, AlertTriangle, AlertCircle, Info, BookOpen, Plus, Trash2
} from "lucide-react";
import { Subject, Class, Conflict, ScheduleStatistics, SavedGrade } from "./types";
import { timeToMinutes, doSchedulesOverlap } from "./utils/scheduleSolver";
import CommandPalette from "./components/CommandPalette";
import WeeklyGrid from "./components/WeeklyGrid";
import SidebarStats from "./components/SidebarStats";
import SelectedSubjectsList from "./components/SelectedSubjectsList";
import ClassComparator from "./components/ClassComparator";
import AutoCombinator from "./components/AutoCombinator";
import StatsDashboard from "./components/StatsDashboard";
import ExportPanel from "./components/ExportPanel";
import CourseCatalog from "./components/CourseCatalog";
import logoImg from "./assets/images/ifsc_icon_cropped_1783518817832.jpg";

export default function App() {
  // Master database state loaded from server
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Active calendar semester state (e.g., "2026.1", "2026.2")
  const [activeCalendarSemester, setActiveCalendarSemester] = useState<string>(() => {
    try {
      return localStorage.getItem("planejador_grade_calendar_semester") || "2026.2";
    } catch {
      return "2026.2";
    }
  });

  // Multiple schedules (grades) state
  const [grades, setGrades] = useState<SavedGrade[]>([]);
  const [activeGradeId, setActiveGradeId] = useState<string>("");

  // Derive active selectedClassIds from the active grade selection
  const activeGrade = grades.find(g => g.id === activeGradeId);
  const selectedClassIds = activeGrade ? activeGrade.classIds : [];

  // Helper method to update selected class IDs of the current active grade
  const updateActiveGradeClassIds = (updater: string[] | ((prev: string[]) => string[])) => {
    setGrades(prevGrades => {
      const updated = prevGrades.map(g => {
        if (g.id === activeGradeId) {
          const nextClassIds = typeof updater === "function" ? updater(g.classIds) : updater;
          return { ...g, classIds: nextClassIds };
        }
        return g;
      });
      try {
        localStorage.setItem(`planejador_grades_list_${activeCalendarSemester}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar grades no LocalStorage:", e);
      }
      return updated;
    });
  };

  // Grade/Schedule management actions
  const handleCreateNewGrade = () => {
    const nextNum = grades.length + 1;
    const newGrade: SavedGrade = {
      id: `grade-${Date.now()}`,
      name: `Grade ${nextNum}`,
      classIds: []
    };
    const nextGrades = [...grades, newGrade];
    setGrades(nextGrades);
    setActiveGradeId(newGrade.id);
  };

  const handleRenameGrade = () => {
    const active = grades.find(g => g.id === activeGradeId);
    if (!active) return;
    const newName = window.prompt("Digite o novo nome para esta grade:", active.name);
    if (newName && newName.trim()) {
      setGrades(prev => prev.map(g => g.id === activeGradeId ? { ...g, name: newName.trim() } : g));
    }
  };

  const handleDeleteGrade = () => {
    if (grades.length <= 1) return;
    const active = grades.find(g => g.id === activeGradeId);
    if (!active) return;
    if (window.confirm(`Deseja realmente excluir a "${active.name}"?`)) {
      const remaining = grades.filter(g => g.id !== activeGradeId);
      setGrades(remaining);
      setActiveGradeId(remaining[0].id);
    }
  };

  // UI Tabs / Modals state
  const [activeTab, setActiveTab] = useState<"grid" | "catalog" | "auto" | "stats">("grid");
  const [comparatorSubject, setComparatorSubject] = useState<Subject | null>(null);

  // Load active plan from localStorage on semester change
  useEffect(() => {
    try {
      localStorage.setItem("planejador_grade_calendar_semester", activeCalendarSemester);
      
      // Clear grades on semester change as requested
      const loadedGrades: SavedGrade[] = [
        { id: "grade-1", name: "Grade 1", classIds: [] }
      ];
      
      setGrades(loadedGrades);
      setActiveGradeId("grade-1");

      localStorage.removeItem(`planejador_grades_list_${activeCalendarSemester}`);
      localStorage.removeItem(`planejador_active_grade_id_${activeCalendarSemester}`);
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage:", e);
    }
  }, [activeCalendarSemester]);

  // Save grades list on change
  useEffect(() => {
    if (grades.length === 0) return;
    try {
      localStorage.setItem(`planejador_grades_list_${activeCalendarSemester}`, JSON.stringify(grades));
    } catch (e) {
      console.error("Erro ao salvar dados no LocalStorage:", e);
    }
  }, [grades, activeCalendarSemester]);

  // Save active grade ID on change
  useEffect(() => {
    if (!activeGradeId) return;
    try {
      localStorage.setItem(`planejador_active_grade_id_${activeCalendarSemester}`, activeGradeId);
    } catch (e) {
      console.error("Erro ao salvar activeGradeId no LocalStorage:", e);
    }
  }, [activeGradeId, activeCalendarSemester]);

  // Load database subjects from server on mount
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setAllSubjects(data);
      }
    } catch (error) {
      console.error("Erro ao carregar disciplinas:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // Compute subjects filtered for the active calendar semester
  const currentSemesterSubjects = allSubjects.filter(sub => {
    const sem = sub.calendarSemester || "2026.1";
    return sem === activeCalendarSemester;
  });

  // Handle choosing a subject from search or Command Palette
  const handleSelectSubject = (subject: Subject) => {
    // If subject is already added, do nothing or show comparator
    const alreadyAdded = selectedClassIds.some(id => {
      const cls = subject.classes.find(c => c.id === id);
      return !!cls;
    });

    if (alreadyAdded) {
      setComparatorSubject(subject);
      return;
    }

    // Default to adding the FIRST available class/turma automatically
    if (subject.classes && subject.classes.length > 0) {
      const defaultClassId = subject.classes[0].id;
      updateActiveGradeClassIds(prev => [...prev, defaultClassId]);
    }
  };

  // Handle removing a subject completely from active plan
  const handleRemoveSubject = (subjectId: string) => {
    const subject = currentSemesterSubjects.find(s => s.id === subjectId);
    if (!subject) return;

    const classIdsToRemove = subject.classes.map(c => c.id);
    updateActiveGradeClassIds(prev => prev.filter(id => !classIdsToRemove.includes(id)));
  };

  // Handle switching a class/turma for an already added subject
  const handleSelectClass = (subjectId: string, classId: string) => {
    const subject = currentSemesterSubjects.find(s => s.id === subjectId);
    if (!subject) return;

    const classIdsOfSubject = subject.classes.map(c => c.id);
    updateActiveGradeClassIds(prev => {
      // Remove other classes of same subject, add new classId
      const cleared = prev.filter(id => !classIdsOfSubject.includes(id));
      return [...cleared, classId];
    });

    setComparatorSubject(null); // Close comparator modal
  };

  // Handle applying a fully calculated combination from the backtracking solver
  const handleApplyCombination = (classIds: string[]) => {
    updateActiveGradeClassIds(classIds);
    setActiveTab("grid"); // Switch back to grid view tab
    alert("Horário otimizado aplicado com sucesso!");
  };

  // Derive selected classes list from active class IDs
  const selectedClassesList: Class[] = [];
  selectedClassIds.forEach(id => {
    currentSemesterSubjects.forEach(sub => {
      const found = sub.classes.find(c => c.id === id);
      if (found) {
        selectedClassesList.push(found);
      }
    });
  });

  // Calculate conflicts list
  const calculateConflicts = (classes: Class[]): Conflict[] => {
    const list: Conflict[] = [];
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const c1 = classes[i];
        const c2 = classes[j];
        
        for (const s1 of c1.schedules) {
          for (const s2 of c2.schedules) {
            if (doSchedulesOverlap(s1, s2)) {
              const subj1 = currentSemesterSubjects.find(s => s.id === c1.subjectId);
              const subj2 = currentSemesterSubjects.find(s => s.id === c2.subjectId);
              
              list.push({
                id: `${c1.id}-${c2.id}-${s1.dayOfWeek}-${s1.startTime}`,
                classId1: c1.id,
                classId2: c2.id,
                subject1: subj1?.name || "Desconhecida",
                subject2: subj2?.name || "Desconhecida",
                classCode1: c1.code,
                classCode2: c2.code,
                dayOfWeek: s1.dayOfWeek,
                timeSlot: `${s1.startTime} às ${s1.endTime}`
              });
            }
          }
        }
      }
    }
    return list;
  };

  const conflictsList = calculateConflicts(selectedClassesList);

  // Calculate stats summary
  const getStatistics = (classes: Class[]): ScheduleStatistics => {
    let creditsSum = 0;
    let minutesSum = 0;
    const profs = new Set<string>();
    const rooms = new Set<string>();
    const activeDays = new Set<number>();
    const daySchedules: Record<number, { start: number; end: number }[]> = {};

    classes.forEach(cls => {
      const subj = allSubjects.find(s => s.id === cls.subjectId);
      if (subj) {
        creditsSum += subj.credits;
      }
      profs.add(cls.professor);
      rooms.add(cls.room);

      cls.schedules.forEach(sched => {
        activeDays.add(sched.dayOfWeek);
        if (sched.room) rooms.add(sched.room);
        
        const start = timeToMinutes(sched.startTime);
        const end = timeToMinutes(sched.endTime);
        minutesSum += (end - start);

        if (!daySchedules[sched.dayOfWeek]) {
          daySchedules[sched.dayOfWeek] = [];
        }
        daySchedules[sched.dayOfWeek].push({ start, end });
      });
    });

    // Windows (idle time) calculation
    let idleMinutes = 0;
    Object.values(daySchedules).forEach(slots => {
      slots.sort((a, b) => a.start - b.start);
      for (let i = 0; i < slots.length - 1; i++) {
        if (slots[i+1].start > slots[i].end) {
          idleMinutes += (slots[i+1].start - slots[i].end);
        }
      }
    });

    // Earliest and latest class slots
    let firstTime: string | null = null;
    let lastTime: string | null = null;
    const DAY_NAMES = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    
    let minMinutes = 99999;
    let maxMinutes = -1;

    classes.forEach(cls => {
      cls.schedules.forEach(sched => {
        const start = timeToMinutes(sched.startTime);
        const end = timeToMinutes(sched.endTime);
        
        if (start < minMinutes) {
          minMinutes = start;
          firstTime = `${DAY_NAMES[sched.dayOfWeek]} às ${sched.startTime}`;
        }
        if (end > maxMinutes) {
          maxMinutes = end;
          lastTime = `${DAY_NAMES[sched.dayOfWeek]} às ${sched.endTime}`;
        }
      });
    });

    return {
      subjectCount: classes.length,
      totalCredits: creditsSum,
      weeklyHours: minutesSum / 60,
      daysOccupied: activeDays.size,
      firstClassTime: firstTime,
      lastClassTime: lastTime,
      professorCount: profs.size,
      roomCount: rooms.size,
      freeHours: Math.max(0, 44 - (minutesSum / 60)), // 44 academic hours
      idleTimeHours: idleMinutes / 60,
      conflictsCount: conflictsList.length
    };
  };

  const scheduleStats = getStatistics(selectedClassesList);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-800 flex flex-col font-sans" id="app-root">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 select-none print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo and Title */}
          <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
            <img 
              src={logoImg} 
              alt="Logo Meu Semestre IFSC" 
              className="w-10 h-10 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <h1 className="font-display font-extrabold text-lg text-slate-800 tracking-tight">
              Meu Semestre <span className="text-emerald-600">IFSC</span>
            </h1>
          </div>

          {/* Controls Container */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {/* Grade Selector */}
            <select
              value={activeGradeId}
              onChange={(e) => setActiveGradeId(e.target.value)}
              className="h-8 pl-3 pr-8 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none flex-grow sm:flex-grow-0"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px'
              }}
            >
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            {/* Actions (Edit/Plus/Trash) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={handleCreateNewGrade}
                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-md transition-all cursor-pointer shadow-sm"
                title="Criar Nova Grade"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleRenameGrade}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-md transition-all cursor-pointer shadow-sm"
                title="Renomear Grade"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              {grades.length > 1 && (
                <button
                  onClick={handleDeleteGrade}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-white rounded-md transition-all cursor-pointer shadow-sm"
                  title="Excluir Grade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Semester Selector */}
            <select
              value={activeCalendarSemester}
              onChange={(e) => setActiveCalendarSemester(e.target.value)}
              className="h-9 pl-3 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none transition-all shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px'
              }}
            >
              <option value="2026.1">2026.1</option>
              <option value="2026.2">2026.2</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Search section and Tabs header */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-200/60 pb-4 print:hidden select-none">
          {/* Intelligent Command Search Trigger */}
          <div className="w-full max-w-2xl">
            <CommandPalette 
              onSelectSubject={handleSelectSubject} 
              selectedSubjectIds={currentSemesterSubjects.filter(s => s.classes.some(c => selectedClassIds.includes(c.id))).map(s => s.id)} 
              calendarSemester={activeCalendarSemester}
            />
          </div>

          {/* SaaS Navigation Tabs */}
          <div className="flex overflow-x-auto sm:justify-center bg-slate-200/50 p-1 rounded-lg gap-1 no-scrollbar w-full">
            <button
              onClick={() => setActiveTab("grid")}
              className={`px-3 py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 ${
                activeTab === "grid" 
                  ? "bg-white text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-weekly-grid"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Grade</span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 ${
                activeTab === "catalog" 
                  ? "bg-white text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-course-catalog"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Disciplinas</span>
            </button>

            <button
              onClick={() => setActiveTab("auto")}
              className={`px-3 py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 ${
                activeTab === "auto" 
                  ? "bg-white text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-auto-combinator"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Melhor</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`px-3 py-2 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 ${
                activeTab === "stats" 
                  ? "bg-white text-emerald-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-metrics-stats"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stats</span>
            </button>
          </div>
        </div>

        {/* Global Loading screen */}
        {loadingSubjects ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 select-none">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mb-4" />
            <h3 className="font-display font-bold text-slate-700 mb-1">Carregando dados acadêmicos...</h3>
            <p className="text-xs text-slate-400">Verificando arquivos locais e integrando com o EduPage.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            {/* If selected semester has no subjects, show IFSC not published yet message */}
            {currentSemesterSubjects.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 shadow-sm select-none">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-800 tracking-tight mb-2">
                  Semestre {activeCalendarSemester}
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-1">
                  O horário oficial de aulas ainda não foi divulgado pelo IFSC para este período letivo.
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-3">
                  Fique atento às atualizações oficiais e canais de comunicação do campus!
                </p>
              </div>
            ) : (
              <>
                {/* Viewport content rendering based on active tab */}
                {activeTab === "grid" && (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* Main Content Area */}
                    <div className="w-full space-y-6">
                      {/* Main: Weekly Grid */}
                      <div className="w-full">
                        <WeeklyGrid 
                          selectedClasses={selectedClassesList} 
                          subjects={currentSemesterSubjects}
                          conflicts={conflictsList}
                        />
                      </div>

                      {/* Selected disciplines detailed listing (now below grid) */}
                      <div className="w-full space-y-3">
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider select-none px-1">
                          Disciplinas na Grade ({selectedClassesList.length})
                        </div>
                        <SelectedSubjectsList 
                          selectedClasses={selectedClassesList}
                          subjects={currentSemesterSubjects}
                          onRemoveSubject={handleRemoveSubject}
                          onOpenComparator={setComparatorSubject}
                        />
                      </div>
                    </div>

                    {/* Sidebar: Stats & Export */}
                    <div className="space-y-6 print:hidden">
                      <SidebarStats 
                        selectedClasses={selectedClassesList} 
                        subjects={currentSemesterSubjects}
                        conflicts={conflictsList}
                        stats={scheduleStats}
                      />
                      <ExportPanel 
                        selectedClasses={selectedClassesList} 
                        subjects={currentSemesterSubjects} 
                      />
                    </div>
                  </div>
                )}

                {activeTab === "catalog" && (
                  <div className="w-full print:hidden">
                    <CourseCatalog 
                      subjects={currentSemesterSubjects}
                      selectedClassIds={selectedClassIds}
                      onSelectClass={handleSelectClass}
                      onRemoveSubject={handleRemoveSubject}
                    />
                  </div>
                )}

                {activeTab === "auto" && (
                  <div className="max-w-4xl mx-auto w-full print:hidden">
                    <AutoCombinator 
                      selectedSubjects={currentSemesterSubjects.filter(sub => sub.classes.some(c => selectedClassIds.includes(c.id)))}
                      allSubjects={currentSemesterSubjects}
                      onApplyCombination={handleApplyCombination}
                      activeClassIds={selectedClassIds}
                      grades={grades}
                      activeGradeId={activeGradeId}
                      onSelectGrade={(id) => {
                        setActiveGradeId(id);
                        setActiveTab("grid");
                      }}
                    />
                  </div>
                )}

                {activeTab === "stats" && (
                  <div className="max-w-4xl mx-auto w-full print:hidden">
                    <StatsDashboard 
                      selectedClasses={selectedClassesList} 
                      subjects={currentSemesterSubjects} 
                    />
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </main>

      {/* Class Comparator side-by-side comparison Modal popup */}
      {comparatorSubject && (
        <ClassComparator 
          subject={comparatorSubject}
          selectedClasses={selectedClassesList}
          allSelectedSubjects={currentSemesterSubjects.filter(sub => sub.classes.some(c => selectedClassIds.includes(c.id)))}
          onSelectClass={handleSelectClass}
          onClose={() => setComparatorSubject(null)}
        />
      )}

      {/* Styles for print output optimization */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11px;
          }
          #app-root {
            min-height: 0 !important;
            height: auto !important;
          }
          #weekly-schedule-grid {
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            height: 900px !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
}
