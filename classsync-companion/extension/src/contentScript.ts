declare const chrome: any;

import { autoFillGradesOnPortal, detectPortalContext } from './utils/portalAutoFill';

const PAGE_MARKER = '__classsync_companion__';

function injectFloatingBadge() {
  if ((document as any)[PAGE_MARKER]) {
    return;
  }

  const host = document.createElement('div');
  host.id = 'classsync-floating-badge';
  host.style.position = 'fixed';
  host.style.right = '18px';
  host.style.bottom = '18px';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'auto';
  host.style.fontFamily = 'system-ui, sans-serif';

  const shadowRoot = host.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = `
    <style>
      .toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.2);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.35);
        color: white;
      }
      button {
        appearance: none;
        border: none;
        border-radius: 999px;
        padding: 8px 12px;
        cursor: pointer;
        background: linear-gradient(135deg, #5b8cff, #7a5cff);
        color: white;
        font-weight: 700;
        font-size: 12px;
      }
      .secondary {
        background: rgba(148, 163, 184, 0.18);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #48e5a3;
        box-shadow: 0 0 12px rgba(72, 229, 163, 0.9);
      }
    </style>
    <div class="toolbar">
      <span class="dot"></span>
      <button data-action="clip">AI Quiz</button>
      <button class="secondary" data-action="capture">OCR</button>
    </div>
  `;

  shadowRoot.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = (button as HTMLElement).dataset.action;
      if (action === 'clip') {
        handleClipRequest();
      }
      if (action === 'capture') {
        await chrome.runtime.sendMessage({ type: 'SCREENSHOT_CAPTURE_REQUEST', tabId: undefined });
      }
    });
  });

  document.body.appendChild(host);
  (document as any)[PAGE_MARKER] = true;
}

function handleClipRequest() {
  const selectionText = window.getSelection()?.toString().trim();
  const payload = {
    type: 'CLIP_REQUEST',
    title: document.title,
    url: location.href,
    selectionText: selectionText || (window as any).__classsyncSelection || '',
    source: 'webpage',
    capturedAt: new Date().toISOString(),
    portalContext: detectPortalContext(document)
  };

  chrome.runtime.sendMessage(payload);
}

function handleAutoFillRequest(message: any) {
  const request = message?.payload || { grade: 100, comment: 'Auto-filled by ClassSync Companion' };
  const result = autoFillGradesOnPortal(request, document);
  return result;
}

function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (response: any) => void) => {
    if (!message || !message.type) {
      return false;
    }

    switch (message.type) {
      case 'CLIP_REQUEST':
        handleClipRequest();
        sendResponse({ ok: true });
        return true;
      case 'AUTO_FILL_REQUEST':
        sendResponse(handleAutoFillRequest(message));
        return true;
      case 'CAPTURE_SCREENSHOT':
        chrome.runtime.sendMessage({ type: 'SCREENSHOT_CAPTURE_REQUEST' }, (response: any) => {
          sendResponse(response || { ok: true, url: location.href });
        });
        return true;
      default:
        return false;
    }
  });
}

function setupContextMenuListeners() {
  document.addEventListener('contextmenu', () => {
    const selection = window.getSelection()?.toString()?.trim();
    (window as any).__classsyncSelection = selection || '';
  }, true);
}

function observePageSignals() {
  const observer = new MutationObserver(() => {
    const portalContext = detectPortalContext(document);
    if (portalContext.detected) {
      const marker = document.body?.getAttribute('data-classsync-portal');
      if (marker !== 'true') {
        document.body?.setAttribute('data-classsync-portal', 'true');
      }
    }
  });

  if (document.body || document.documentElement) {
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

injectFloatingBadge();
registerMessageHandlers();
setupContextMenuListeners();
observePageSignals();

if (document.readyState === 'complete') {
  chrome.runtime.sendMessage({ type: 'PAGE_READY', url: location.href });
} else {
  window.addEventListener('load', () => {
    chrome.runtime.sendMessage({ type: 'PAGE_READY', url: location.href });
  });
}
