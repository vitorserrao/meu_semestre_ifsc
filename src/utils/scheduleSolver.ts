import { Subject, Class, Schedule, BestGridCombination } from "../types";

// Convert "HH:MM" string to minutes from midnight
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Check if two schedule slots overlap
export function doSchedulesOverlap(s1: Schedule, s2: Schedule): boolean {
  if (s1.dayOfWeek !== s2.dayOfWeek) return false;
  const start1 = timeToMinutes(s1.startTime);
  const end1 = timeToMinutes(s1.endTime);
  const start2 = timeToMinutes(s2.startTime);
  const end2 = timeToMinutes(s2.endTime);
  return start1 < end2 && start2 < end1;
}

// Check if two classes have any overlapping schedule
export function doClassesOverlap(c1: Class, c2: Class): boolean {
  for (const s1 of c1.schedules) {
    for (const s2 of c2.schedules) {
      if (doSchedulesOverlap(s1, s2)) {
        return true;
      }
    }
  }
  return false;
}

// Extract days occupied and calculate windows (gaps) and idle time for a list of classes
export function analyzeSchedules(classes: Class[]): {
  daysOccupied: number[];
  janelasCount: number;
  idleTimeMinutes: number;
  hasSingleClassDays: boolean;
  isConcentrated: boolean;
} {
  const daySchedules: Record<number, { start: number; end: number; duration: number }[]> = {};
  
  // Group all schedules by day of week
  classes.forEach(cls => {
    cls.schedules.forEach(sched => {
      const day = sched.dayOfWeek;
      const start = timeToMinutes(sched.startTime);
      const end = timeToMinutes(sched.endTime);
      
      if (!daySchedules[day]) {
        daySchedules[day] = [];
      }
      daySchedules[day].push({ start, end, duration: end - start });
    });
  });

  const daysOccupied = Object.keys(daySchedules).map(Number);
  let janelasCount = 0;
  let idleTimeMinutes = 0;
  let hasSingleClassDays = false;
  
  let allMorning = true;
  let allAfternoonNight = true;

  Object.entries(daySchedules).forEach(([dayStr, slots]) => {
    // Sort slots by start time
    slots.sort((a, b) => a.start - b.start);
    
    if (slots.length === 1) {
      hasSingleClassDays = true;
    }

    // Windows (janelas) and idle time calculation
    for (let i = 0; i < slots.length - 1; i++) {
      const currentEnd = slots[i].end;
      const nextStart = slots[i+1].start;
      if (nextStart > currentEnd) {
        janelasCount++;
        idleTimeMinutes += (nextStart - currentEnd);
      }
    }

    // Concentrado check
    slots.forEach(slot => {
      if (slot.start >= 13 * 60) {
        allMorning = false;
      } else {
        allAfternoonNight = false;
      }
    });
  });

  const isConcentrated = allMorning || allAfternoonNight;

  return {
    daysOccupied,
    janelasCount,
    idleTimeMinutes,
    hasSingleClassDays,
    isConcentrated
  };
}

// Generate the best schedule combinations using backtracking
export function solveBestGrids(
  selectedSubjects: Subject[],
  allSubjects: Subject[] // to fetch complete class data
): BestGridCombination[] {
  if (selectedSubjects.length === 0) return [];

  // Group of candidates for each subject
  const subjectsToCombine = selectedSubjects.map(subj => {
    // find full subject object in allSubjects to get classes
    const fullSubj = allSubjects.find(s => s.id === subj.id) || subj;
    return {
      subjectId: subj.id,
      classes: fullSubj.classes || []
    };
  }).filter(group => group.classes.length > 0);

  if (subjectsToCombine.length === 0) return [];

  const results: BestGridCombination[] = [];

  function backtrack(index: number, currentClasses: Class[]) {
    if (index === subjectsToCombine.length) {
      // Evaluate this combination
      const { daysOccupied, janelasCount, idleTimeMinutes, hasSingleClassDays, isConcentrated } = analyzeSchedules(currentClasses);
      
      // Check for conflicts
      let conflictCount = 0;
      for (let i = 0; i < currentClasses.length; i++) {
        for (let j = i + 1; j < currentClasses.length; j++) {
          if (doClassesOverlap(currentClasses[i], currentClasses[j])) {
            conflictCount++;
          }
        }
      }

      // Calculate score
      let score = 0;
      
      // 1. Conflict penalty or bonus
      if (conflictCount === 0) {
        score += 1000;
      } else {
        score -= conflictCount * 1500; // Penalize conflicts heavily so they stay at the bottom
      }

      // 2. Days presencial (+300 max)
      // Fewer days is better. Score is higher for fewer days occupied
      const daysCount = daysOccupied.length;
      if (daysCount > 0) {
        const daysScore = Math.max(0, (6 - daysCount) * 100); // 1 day = 500, 2 days = 400, 3 days = 300, 4 days = 200, 5 days = 100
        score += Math.min(300, daysScore);
      }

      // 3. Idle time (+250 max)
      if (idleTimeMinutes === 0) {
        score += 250;
      } else if (idleTimeMinutes < 120) { // < 2 hours
        score += 150;
      } else if (idleTimeMinutes < 240) { // < 4 hours
        score += 50;
      }

      // 4. Windows (+200 max)
      if (janelasCount === 0) {
        score += 200;
      } else if (janelasCount === 1) {
        score += 100;
      }

      // 5. Concentrated schedules (+150)
      if (isConcentrated) {
        score += 150;
      }

      // 6. Avoid single class days (+100)
      if (!hasSingleClassDays && daysCount > 0) {
        score += 100;
      }

      results.push({
        score,
        classIds: currentClasses.map(c => c.id),
        metrics: {
          conflicts: conflictCount,
          daysPresenciais: daysCount,
          janelasCount,
          timeOciosoMinutes: idleTimeMinutes,
          isConcentrated,
          hasSingleClassDays
        }
      });
      return;
    }

    const currentGroup = subjectsToCombine[index];
    for (const cls of currentGroup.classes) {
      backtrack(index + 1, [...currentClasses, cls]);
    }
  }

  // Start backtracking recursion
  backtrack(0, []);

  // Sort by score descending and return top 10
  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
