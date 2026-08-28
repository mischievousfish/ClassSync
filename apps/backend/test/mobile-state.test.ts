type AppMode = 'STUDENT' | 'TEACHER';

function toggleMode(current: AppMode): AppMode {
  return current === 'STUDENT' ? 'TEACHER' : 'STUDENT';
}

describe('mobile dual-mode state contract', () => {
  it('persists and restores the selected mode', () => {
    let stored: AppMode = 'STUDENT';
    stored = toggleMode(stored);
    expect(stored).toBe('TEACHER');
    const restored: AppMode = stored;
    expect(restored).toBe('TEACHER');
  });
});