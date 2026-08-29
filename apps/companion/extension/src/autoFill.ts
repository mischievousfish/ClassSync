export type AutoFillTarget = {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  score: number;
  label: string;
};

export type GradeFillContext = {
  grade: string;
  studentName?: string;
 portalName?: string;
};

const GRADE_INPUT_HINTS = [
  'grade',
  'score',
  'mark',
  'points',
  'result',
  'assessment',
  'final grade',
  'percentage',
];

export function normalizeGrade(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '0';

  const asNumber = Number(trimmed.replace(/[^0-9.\-]/g, ''));
  if (Number.isFinite(asNumber)) {
    return String(Math.max(0, Math.min(100, asNumber)));
  }

  return trimmed;
}

export function detectPortalType(url: string): string {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('google.com') || host.includes('forms')) return 'google_forms';
  if (host.includes('classroom')) return 'google_classroom';
  if (host.includes('canvas')) return 'canvas';
  if (host.includes('schoology')) return 'schoology';
  return 'generic_portal';
}

export function findAutoFillTargets(root: ParentNode = document): AutoFillTarget[] {
  const candidates: AutoFillTarget[] = [];

  const selector = 'input, textarea, select';
  root.querySelectorAll(selector).forEach((element) => {
    const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const label = [
      input.getAttribute('name'),
      input.getAttribute('id'),
      input.getAttribute('aria-label'),
      input.getAttribute('placeholder'),
      input.title,
      (input as HTMLInputElement).value,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const isLikelyGradeInput = GRADE_INPUT_HINTS.some((hint) => label.includes(hint));
    if (isLikelyGradeInput || input.type === 'number') {
      candidates.push({
        element: input,
        score: isLikelyGradeInput ? 90 : 60,
        label,
      });
    }
  });

  return candidates.sort((a, b) => b.score - a.score);
}

export function applyAutoFillToPortal(root: ParentNode, context: GradeFillContext): number {
  const grade = normalizeGrade(context.grade);
  const targets = findAutoFillTargets(root);

  if (!targets.length) {
    return 0;
  }

  let writes = 0;

  for (const target of targets.slice(0, 3)) {
    const input = target.element;
    if (input.tagName === 'SELECT') {
      const select = input as HTMLSelectElement;
      const option = Array.from(select.options).find((optionEl) => {
        const optionText = (optionEl.text ?? '').toLowerCase();
        const optionValue = String(optionEl.value ?? '');
        return optionText.includes(grade.toLowerCase()) || optionValue === grade;
      });
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        writes += 1;
      }
      continue;
    }

    const inputField = input as HTMLInputElement | HTMLTextAreaElement;
    const currentValue = inputField.value ?? '';
    if (!currentValue || currentValue === '0') {
      inputField.focus();
      inputField.value = grade;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
      writes += 1;
    }
  }

  return writes;
}

export function findStudentRow(root: ParentNode, studentName?: string): HTMLTableRowElement | null {
  if (!studentName) return null;

  const rows = Array.from(root.querySelectorAll('tr')) as HTMLTableRowElement[];
  return rows.find((row) => row.textContent?.toLowerCase().includes(studentName.toLowerCase())) ?? null;
}
