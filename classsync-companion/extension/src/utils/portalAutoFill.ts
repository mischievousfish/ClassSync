export type GradeFillRequest = {
  grade?: number;
  comment?: string;
  assignmentId?: string;
  dueDate?: string;
  portalName?: string;
};

export type PortalElementCandidate = {
  key: string;
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  value: string | number;
  confidence: number;
};

export function detectPortalContext(doc: Document = document) {
  const bodyText = (doc.body?.innerText || '').toLowerCase();
  const titleText = (doc.title || '').toLowerCase();
  const combinedText = `${bodyText} ${titleText}`;

  const portalName = /canvas|schoology|blackboard|powerschool|google forms|gradebook|classroom|microsoft teams|google classroom/i.test(combinedText)
    ? 'education-portal'
    : 'generic-form';

  const gradeSignals = [
    'grade',
    'points',
    'score',
    'assignment',
    'total points',
    'student grade',
    'final grade',
    'percent',
    'mark'
  ];

  const signalScore = gradeSignals.filter((signal) => combinedText.includes(signal)).length;

  return {
    portalName,
    detected: signalScore > 0 || /gradebook|grade|score|assignment|mark/i.test(titleText),
    score: signalScore
  };
}

export function findRelevantInputFields(doc: Document = document): HTMLInputElement[] {
  const selectors = [
    'input[type="number"]',
    'input[name*="grade" i]',
    'input[name*="score" i]',
    'input[name*="mark" i]',
    'input[name*="points" i]',
    'input[aria-label*="grade" i]',
    'input[aria-label*="score" i]',
    'input[placeholder*="grade" i]',
    'input[placeholder*="score" i]',
    'input[data-testid*="grade" i]',
    'input[data-testid*="score" i]',
    'input[autocomplete*="off"][inputmode="numeric"]'
  ];

  const matches = selectors.flatMap((selector) => Array.from(doc.querySelectorAll<HTMLInputElement>(selector)));
  return matches.filter((el) => !el.disabled && el.offsetParent !== null && el.value !== undefined);
}

export function setFieldValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string | number
) {
  const nextValue = String(value);

  if (!('value' in element)) {
    return;
  }

  const previousValue = element.value;
  element.value = nextValue;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));

  if (typeof (element as HTMLInputElement).focus === 'function') {
    (element as HTMLInputElement).focus();
  }

  if (previousValue !== nextValue) {
    element.setAttribute('data-classsync-filled', 'true');
  }
}

export function buildAutoFillPlan(
  doc: Document = document,
  gradeValue = 100
): PortalElementCandidate[] {
  const context = detectPortalContext(doc);
  const fields = findRelevantInputFields(doc);

  return fields.slice(0, 10).map((field, index) => {
    const key = field.name || field.id || field.getAttribute('aria-label') || field.getAttribute('placeholder') || `grade-field-${index}`;
    const confidence = context.detected ? 0.86 : 0.5;

    return {
      key,
      element: field,
      value: gradeValue,
      confidence
    };
  });
}

export function autoFillGradesOnPortal(
  request: GradeFillRequest = {},
  doc: Document = document
): { applied: number; context: ReturnType<typeof detectPortalContext>; fields: PortalElementCandidate[] } {
  const context = detectPortalContext(doc);
  const candidates = buildAutoFillPlan(doc, request.grade ?? 100);

  candidates.forEach((candidate) => {
    const comment = request.comment || '';
    setFieldValue(candidate.element, candidate.value);

    if (comment && candidate.element instanceof HTMLTextAreaElement) {
      setFieldValue(candidate.element, comment);
    }
  });

  return {
    applied: candidates.length,
    context,
    fields: candidates
  };
}

export function attachAutoFillListeners(doc: Document = document) {
  doc.addEventListener('keydown', (event) => {
    const shortcut = event.altKey && event.key.toLowerCase() === 'g';
    if (!shortcut) {
      return;
    }

    const payload: GradeFillRequest = {
      grade: 100,
      comment: 'Auto-filled by ClassSync Companion',
      portalName: detectPortalContext(doc).portalName
    };

    autoFillGradesOnPortal(payload, doc);
  });
}
