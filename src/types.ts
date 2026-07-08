export interface Schedule {
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  startTime: string; // "07:30"
  endTime: string;   // "09:10"
  room: string;
}

export interface Class {
  id: string;
  code: string; // e.g. "ADS301", "CIV501"
  subjectId: string;
  professor: string;
  room: string;
  vacancies: number;
  semester: number;
  schedules: Schedule[];
}

export interface Subject {
  id: string;
  code: string; // e.g. "ALG1", "BD1"
  name: string;
  course: string; // e.g. "Análise e Desenvolvimento de Sistemas", "Engenharia Civil"
  semester: number;
  calendarSemester?: string; // e.g. "2026.1", "2026.2"
  credits: number;
  color: string; // hex or tailwind color class
  classes: Class[];
}

export interface Conflict {
  id: string;
  classId1: string;
  classId2: string;
  subject1: string;
  subject2: string;
  classCode1: string;
  classCode2: string;
  dayOfWeek: number;
  timeSlot: string; // "10:10 às 12:00"
}

export interface ScheduleStatistics {
  subjectCount: number;
  totalCredits: number;
  weeklyHours: number;
  daysOccupied: number;
  firstClassTime: string | null;
  lastClassTime: string | null;
  professorCount: number;
  roomCount: number;
  freeHours: number;
  idleTimeHours: number; // Janelas (time between classes on the same day)
  conflictsCount: number;
}

export interface SyncStatus {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
  importedCount?: {
    subjects: number;
    classes: number;
  };
}

export interface BestGridCombination {
  score: number;
  classIds: string[]; // List of class IDs in this combination
  metrics: {
    conflicts: number;
    daysPresenciais: number;
    janelasCount: number;
    timeOciosoMinutes: number;
    isConcentrated: boolean; // e.g. either all morning or all afternoon/night
    hasSingleClassDays: boolean;
  };
}

export interface SavedGrade {
  id: string;
  name: string;
  classIds: string[];
}

