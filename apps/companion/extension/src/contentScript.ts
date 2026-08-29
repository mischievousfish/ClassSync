declare const chrome: any;

import { applyAutoFillToPortal, detectPortalType, findStudentRow } from './autoFill';

const overlayId = 'classsync-floating-clipper';

function injectShadowUi(): HTMLDivElement {
  const existing = document.getElementById(overlayId);
  if (existing) return existing as HTMLDivElement;

  const host = document.createElement('div');
  host.id = overlayId;
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.right = '20px';
  host.style.bottom = '20px';
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  host.style.gap = '8px';
  host.style.pointerEvents = 'auto';

  const button = document.createElement('button');
  button.textContent = 'ClassSync AI Quiz';
  button.style.background = '#1d4ed8';
  button.style.color = '#fff';
  button.style.padding = '10px 16px';
  button.style.borderRadius = '12px';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
  button.addEventListener('click', () => {
    const selection = window.getSelection()?.toString().trim() || document.body.innerText.slice(0, 500);
    void chrome.runtime.sendMessage({
      type: 'CLASSSYNC_CLIP_READY',
      url: window.location.href,
      title: document.title,
      snippet: selection,
      imageDataUrl: undefined,
    });
  });

  host.appendChild(button);
  document.body.appendChild(host);
  return host;
}

function captureVisibleArea(): string | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = Math.min(window.innerWidth, 1600);
  const h = Math.min(window.innerHeight, 1200);
  canvas.width = w;
  canvas.height = h;

  try {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    console.warn('ClassSync screenshot capture failed', error);
    return null;
  }
}

function handleTextClip(raw: { title?: string; url?: string; snippet?: string; imageDataUrl?: string }): void {
  const selection = raw.snippet || window.getSelection()?.toString() || document.body.innerText.slice(0, 500);
  void chrome.runtime.sendMessage({
    type: 'CLASSSYNC_CLIP_READY',
    url: raw.url || window.location.href,
    title: raw.title || document.title,
    snippet: selection,
    imageDataUrl: raw.imageDataUrl,
  });
}

function handleCapturePage(): void {
  const imageDataUrl = captureVisibleArea();
  if (imageDataUrl) {
    void chrome.runtime.sendMessage({
      type: 'CLASSSYNC_CLIP_READY',
      url: window.location.href,
      title: document.title,
      snippet: document.body.innerText.slice(0, 4000),
      imageDataUrl,
    });
  }
}

function autoFillGradeFromMessage(message: any): void {
  if (!message || !message.grade) return;

  const portalType = detectPortalType(window.location.href);
  const writes = applyAutoFillToPortal(document, { grade: message.grade, studentName: message.studentName, portalName: portalType });
  if (writes === 0 && message.studentName) {
    const row = findStudentRow(document, message.studentName);
    if (row) {
      row.scrollIntoView({ block: 'center' });
    }
  }
}

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'CLASSSYNC_TRIGGER_CLIP') {
    handleTextClip({
      title: document.title,
      url: window.location.href,
      snippet: message.selectionText || document.body.innerText.slice(0, 500),
      imageDataUrl: message.imageDataUrl,
    });
  }

  if (message.type === 'CLASSSYNC_CAPTURE_PAGE') {
    handleCapturePage();
  }

  if (message.type === 'CLASSSYNC_APPLY_GRADE') {
    autoFillGradeFromMessage(message);
  }
});

window.addEventListener('load', () => {
  injectShadowUi();
});

if (document.readyState === 'complete') {
  injectShadowUi();
}
