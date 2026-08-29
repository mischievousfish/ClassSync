export interface ScheduleWindow {
  id: string;
  start: string;
  end: string;
}

export interface ScheduledClass {
  classId: string;
  teacherId: string;
  branchId: string;
  roomId?: string;
  studentIds: string[];
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type ConflictType = 'TEACHER' | 'ROOM' | 'STUDENT';

export interface ScheduleConflict {
  type: ConflictType;
  resourceId: string;
  classIds: [string, string];
  branchIds: [string, string];
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function overlaps(leftStart: string, leftEnd: string, rightStart: string, rightEnd: string): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

export class ScheduleConflictDetector {
  static findConflicts(classes: ScheduledClass[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    for (let leftIndex = 0; leftIndex < classes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < classes.length; rightIndex += 1) {
        const left = classes[leftIndex];
        const right = classes[rightIndex];
        if (left.dayOfWeek !== right.dayOfWeek || !overlaps(left.startTime, left.endTime, right.startTime, right.endTime)) continue;
        const sharedStudents = left.studentIds.filter((studentId) => right.studentIds.includes(studentId));
        const resources: Array<[ConflictType, string | undefined]> = [
          ['TEACHER', left.teacherId === right.teacherId ? left.teacherId : undefined],
          ['ROOM', left.roomId && left.roomId === right.roomId ? left.roomId : undefined],
        ];
        for (const [type, resourceId] of resources) {
          if (resourceId) conflicts.push({ type, resourceId, classIds: [left.classId, right.classId], branchIds: [left.branchId, right.branchId], dayOfWeek: left.dayOfWeek, startTime: left.startTime > right.startTime ? left.startTime : right.startTime, endTime: left.endTime < right.endTime ? left.endTime : right.endTime });
        }
        for (const studentId of sharedStudents) conflicts.push({ type: 'STUDENT', resourceId: studentId, classIds: [left.classId, right.classId], branchIds: [left.branchId, right.branchId], dayOfWeek: left.dayOfWeek, startTime: left.startTime > right.startTime ? left.startTime : right.startTime, endTime: left.endTime < right.endTime ? left.endTime : right.endTime });
      }
    }
    return conflicts;
  }
}