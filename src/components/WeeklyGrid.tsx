import React, { useState } from "react";
import { AlertTriangle, Clock, MapPin, User, Info } from "lucide-react";
import { Subject, Class, Schedule } from "../types";
import { timeToMinutes, doSchedulesOverlap } from "../utils/scheduleSolver";

interface WeeklyGridProps {
  selectedClasses: Class[];
  subjects: Subject[];
  conflicts: any[];
}

const DAYS = [
  { id: 1, label: "Segunda", abbr: "SEG" },
  { id: 2, label: "Terça", abbr: "TERÇA" },
  { id: 3, label: "Quarta", abbr: "QUA" },
  { id: 4, label: "Quinta", abbr: "QUI" },
  { id: 5, label: "Sexta", abbr: "SEX" },
  { id: 6, label: "Sábado", abbr: "SAB" },
];

const START_HOUR = 7; // 07:00
const END_HOUR = 23;  // 23:00 (allows 22:30 to sit nicely within the grid)
const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 17 hours total

const STANDARD_SLOTS = [
  // Morning
  { start: "07:30", end: "08:20" },
  { start: "08:20", end: "09:10" },
  { start: "09:20", end: "10:10" },
  { start: "10:10", end: "11:00" },
  
  // Afternoon
  { start: "13:30", end: "14:20" },
  { start: "14:20", end: "15:10" },
  { start: "15:20", end: "16:10" },
  { start: "16:10", end: "17:00" },
  
  // Night
  { start: "18:30", end: "19:25" },
  { start: "19:25", end: "20:20" },
  { start: "20:40", end: "21:35" },
  { start: "21:35", end: "22:30" },
];

function splitScheduleIntoSlots(startTime: string, endTime: string): { startTime: string; endTime: string }[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  
  const matchedSlots = STANDARD_SLOTS.filter(slot => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    return slotStart >= startMin && slotEnd <= endMin;
  });
  
  if (matchedSlots.length > 0) {
    return matchedSlots.map(slot => ({ startTime: slot.start, endTime: slot.end }));
  }
  
  return [{ startTime, endTime }];
}

export default function WeeklyGrid({ selectedClasses, subjects, conflicts }: WeeklyGridProps) {
  const [hoveredClass, setHoveredClass] = useState<{ cls: Class; subject: Subject; sched: Schedule } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tooltip dynamic bounds-checking for fixed positioning
  const getTooltipStyle = () => {
    if (typeof window === 'undefined') {
      return { left: `${hoverPosition.x}px`, top: `${hoverPosition.y}px` };
    }
    
    const tooltipWidth = 288; // w-72 is 288px
    const tooltipHeight = 220; // safe estimation
    const margin = 16;
    
    // Position slightly offset from the mouse cursor
    let left = hoverPosition.x + 16;
    let top = hoverPosition.y + 16;
    
    // If it would go off the right side of the screen, place it to the left of the cursor instead
    if (left + tooltipWidth > window.innerWidth) {
      left = hoverPosition.x - tooltipWidth - 16;
    }
    // Prevent going off the left edge of the screen
    if (left < margin) {
      left = margin;
    }
    
    // If it would go off the bottom of the screen, place it above the cursor instead
    if (top + tooltipHeight > window.innerHeight) {
      top = hoverPosition.y - tooltipHeight - 16;
    }
    // Prevent going off the top edge of the screen
    if (top < margin) {
      top = margin;
    }
    
    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  // Convert time to percentage from 07:00 to 22:30
  const START_MIN = START_HOUR * 60; // 420 (07:00)
  const END_MIN = 22 * 60 + 30; // 1350 (22:30)
  const TOTAL_MIN = END_MIN - START_MIN; // 930 minutes

  const getGridPosition = (startTime: string, endTime: string) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    
    const top = ((startMin - START_MIN) / TOTAL_MIN) * 100;
    const height = ((endMin - startMin) / TOTAL_MIN) * 100;
    
    return { top: `${top}%`, height: `${height}%` };
  };

  // Check if a class ID is involved in any conflict
  const isClassConflicted = (classId: string) => {
    return conflicts.some(c => c.classId1 === classId || c.classId2 === classId);
  };

  // Generate hour list for the grid axis
  const hours = Array.from({ length: TOTAL_HOURS - 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-full" id="weekly-schedule-grid">
      {/* Calendar Header */}
      <div className="grid grid-cols-[60px_1fr] border-b border-slate-100 bg-slate-50 shrink-0 select-none">
        <div className="flex items-center justify-center border-r border-slate-200/60 p-2.5">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-6 divide-x divide-slate-200/60">
          {DAYS.map((day) => (
            <div key={day.id} className="p-2.5 text-center">
              <span className="font-display font-semibold text-xs text-slate-600 sm:text-sm">
                <span className="sm:hidden">{day.abbr}</span>
                <span className="hidden sm:inline">{day.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Body Area */}
      <div className="relative flex-1 overflow-y-auto min-h-[500px] h-[600px] sm:h-[900px]">
        <div className="grid grid-cols-[60px_1fr] h-full absolute inset-0">
          
          {/* Time scale label column */}
          <div className="border-r border-slate-200/60 bg-slate-50/50 flex flex-col relative h-full select-none">
            {hours.map((hour) => {
              const topPercent = ((hour * 60 - START_MIN) / TOTAL_MIN) * 100;
              return (
                <div 
                  key={hour} 
                  className="absolute left-0 right-0 pr-2 text-right -translate-y-2.5"
                  style={{ top: `${topPercent}%` }}
                >
                  <span className="font-mono text-[10px] font-semibold text-slate-400">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              );
            })}
            {/* 22:30 label */}
            <div 
              className="absolute left-0 right-0 pr-2 text-right -translate-y-2.5"
              style={{ top: `${((22 * 60 + 30 - START_MIN) / TOTAL_MIN) * 100}%` }}
            >
              <span className="font-mono text-[10px] font-semibold text-slate-400">
                22:30
              </span>
            </div>
          </div>

          {/* Schedule columns */}
          <div className="relative h-full grid grid-cols-6 divide-x divide-slate-100">
            {/* Draw Horizontal Grid Lines */}
            {hours.map((hour) => {
              const topPercent = ((hour * 60 - START_MIN) / TOTAL_MIN) * 100;
              return (
                <div 
                  key={hour} 
                  className="absolute left-0 right-0 border-t border-slate-100/70"
                  style={{ top: `${topPercent}%` }}
                />
              );
            })}

            {/* Draw line at 22:30 boundary */}
            <div 
              className="absolute left-0 right-0 border-t border-slate-100/70"
              style={{ top: `${((22 * 60 + 30 - START_MIN) / TOTAL_MIN) * 100}%` }}
            />

            {/* Draw half-hour dashed lines */}
            {hours.map((hour) => {
              if (hour === 22) return null; // 22:30 is solid
              const topPercent = ((hour * 60 + 30 - START_MIN) / TOTAL_MIN) * 100;
              return (
                <div 
                  key={`half-${hour}`} 
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100/40"
                  style={{ top: `${topPercent}%` }}
                />
              );
            })}

            {/* Shift Dividers (Manhã / Tarde / Noite) */}
            {/* 07:30 Shift Divider */}
            <div 
              className="absolute left-0 right-0 border-t-[3px] border-emerald-400/55 z-10 flex items-center"
              style={{ top: `${((7 * 60 + 30 - START_MIN) / TOTAL_MIN) * 100}%` }}
            >
              <span className="absolute left-2 -top-2.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-sans text-[8px] sm:text-[9px] uppercase tracking-wider font-bold rounded shadow-xs border border-emerald-100">
                Turno Manhã
              </span>
            </div>

            {/* 12:00 Shift Divider */}
            <div 
              className="absolute left-0 right-0 border-t-[3px] border-emerald-400/55 z-10 flex items-center"
              style={{ top: `${((12 * 60 - START_MIN) / TOTAL_MIN) * 100}%` }}
            >
              <span className="absolute left-2 -top-2.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-sans text-[8px] sm:text-[9px] uppercase tracking-wider font-bold rounded shadow-xs border border-emerald-100">
                Turno Tarde
              </span>
            </div>

            {/* 18:00 Shift Divider */}
            <div 
              className="absolute left-0 right-0 border-t-[3px] border-emerald-400/55 z-10 flex items-center"
              style={{ top: `${((18 * 60 - START_MIN) / TOTAL_MIN) * 100}%` }}
            >
              <span className="absolute left-2 -top-2.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-sans text-[8px] sm:text-[9px] uppercase tracking-wider font-bold rounded shadow-xs border border-emerald-100">
                Turno Noite
              </span>
            </div>

            {/* Render actual class schedule blocks */}
            {DAYS.map((day) => {
              // Filter classes that have a schedule on this day
              const classesForDay = selectedClasses.flatMap(cls => {
                const subject = subjects.find(s => s.id === cls.subjectId);
                if (!subject) return [];
                
                return cls.schedules
                  .filter(sched => sched.dayOfWeek === day.id)
                  .map(sched => ({
                    cls,
                    subject,
                    sched
                  }));
              });

              return (
                <div key={day.id} className="relative h-full">
                  {classesForDay.map(({ cls, subject, sched }) => {
                    const { top, height } = getGridPosition(sched.startTime, sched.endTime);
                    const conflicted = isClassConflicted(cls.id);
                    
                    return (
                      <div
                        key={`${cls.id}-${sched.dayOfWeek}-${sched.startTime}`}
                        className={`absolute left-0.5 right-0.5 px-2 py-1 rounded-lg text-left select-none overflow-hidden transition-all duration-200 border-l-[3px] shadow-xs hover:shadow-sm cursor-pointer ${
                          conflicted 
                            ? "bg-rose-50 border border-rose-200 text-rose-950" 
                            : "hover:scale-[1.01] hover:z-20"
                        }`}
                        style={{
                          top: `calc(${top} + 1px)`,
                          height: `calc(${height} - 2px)`,
                          borderLeftColor: conflicted ? "#ef4444" : subject.color,
                          backgroundColor: conflicted ? undefined : `${subject.color}12`, // 7% opacity for extra high contrast
                          color: conflicted ? "#9f1239" : subject.color
                        }}
                        onMouseEnter={(e) => {
                          setHoveredClass({ cls, subject, sched });
                          setHoverPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                          setHoverPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredClass(null)}
                      >
                        <div className="h-full flex flex-col justify-start py-0.5 gap-0.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-display font-bold text-[10.5px] sm:text-xs leading-tight line-clamp-2">
                                {subject.name}
                              </h5>
                              {conflicted && (
                                <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[9.5px] opacity-80 truncate mt-0.5">
                              <MapPin className="w-2.5 h-2.5 opacity-60 shrink-0" />
                              <span className="truncate font-semibold">{sched.room || cls.room}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover Information Tooltip Card */}
        {hoveredClass && (
          <div 
            className="fixed z-[9999] bg-slate-900 text-slate-100 text-xs rounded-xl shadow-xl p-4 w-72 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
            style={getTooltipStyle()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-mono text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-indigo-400">
                {hoveredClass.cls.code}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {hoveredClass.subject.credits} Créditos
              </span>
            </div>
            
            <h4 className="font-display font-bold text-sm text-white mb-2">
              {hoveredClass.subject.name}
            </h4>

            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Prof: {hoveredClass.cls.professor}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Sala: {hoveredClass.sched.room || hoveredClass.cls.room}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">
                  {hoveredClass.sched.startTime} às {hoveredClass.sched.endTime} ({(() => {
                    const diff = timeToMinutes(hoveredClass.sched.endTime) - timeToMinutes(hoveredClass.sched.startTime);
                    const credits = diff <= 60 ? 1 : diff <= 150 ? 2 : diff <= 250 ? 4 : Math.round(diff / 50);
                    return `${credits} ${credits === 1 ? "crédito" : "créditos"}`;
                  })()})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Vagas Restantes: {hoveredClass.cls.vacancies}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span className="truncate max-w-[150px]">{hoveredClass.subject.course}</span>
              <span className="font-semibold text-indigo-400">{hoveredClass.subject.semester}º Semestre</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
