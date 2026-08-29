import { ScheduleConflictDetector, ScheduledClass } from '../src/services/schedule-conflict-detector.service';

const baseClass: ScheduledClass = { classId: 'class-a', teacherId: 'teacher-a', branchId: 'branch-a', roomId: 'room-a', studentIds: ['student-a'], dayOfWeek: 2, startTime: '09:00', endTime: '10:00' };

describe('ScheduleConflictDetector', () => {
  it('detects teacher and student conflicts across branches', () => {
    const conflicts = ScheduleConflictDetector.findConflicts([baseClass, { ...baseClass, classId: 'class-b', branchId: 'branch-b', roomId: 'room-b' }]);
    expect(conflicts.map((conflict) => conflict.type)).toEqual(['TEACHER', 'STUDENT']);
  });

  it('detects room conflicts for different teachers', () => {
    const conflicts = ScheduleConflictDetector.findConflicts([baseClass, { ...baseClass, classId: 'class-b', teacherId: 'teacher-b' }]);
    expect(conflicts.map((conflict) => conflict.type)).toEqual(['ROOM', 'STUDENT']);
  });

  it('ignores adjacent and different-day classes', () => {
    expect(ScheduleConflictDetector.findConflicts([baseClass, { ...baseClass, classId: 'class-b', startTime: '10:00', endTime: '11:00' }, { ...baseClass, classId: 'class-c', dayOfWeek: 3 }])).toEqual([]);
  });
});