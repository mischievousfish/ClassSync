declare const chrome: any;

type OfflineQueueItem = {
  id: string;
  url: string;
  title: string;
  createdAt: string;
  payload: Record<string, any>;
};

async function queueOfflineItem(item: OfflineQueueItem) {
  const existing = ((await chrome.storage.local.get(['classsyncQueue']))?.classsyncQueue || []) as OfflineQueueItem[];
  await chrome.storage.local.set({
    classsyncQueue: [item, ...existing].slice(0, 200)
  });
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'classsync-clip',
      title: 'Send to ClassSync AI Quiz Generator',
      contexts: ['selection', 'image', 'page']
    });

    chrome.contextMenus.create({
      id: 'classsync-ocr',
      title: 'Capture Screenshot for OCR',
      contexts: ['page', 'selection', 'image']
    });
  });
}

async function triggerCloudVisionOCR(imageDataUrl: string, sourceUrl: string) {
  const payload = {
    provider: 'google-cloud-vision',
    sourceUrl,
    imageBase64: imageDataUrl.replace(/^data:image\/(png|jpeg);base64,/, ''),
    operation: 'ocr_extract_questions'
  };

  try {
    const response = await fetch('https://api.classsync.ai/v1/vision/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer DEMO_TOKEN'
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || 'Unable to reach OCR service',
      queued: true,
      payload
    };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
  const url = tab?.url || info.pageUrl || 'about:blank';

  if (info.menuItemId === 'classsync-clip') {
    const payload = {
      type: 'CLIP_REQUEST',
      title: tab?.title || 'Page clip',
      url,
      selectionText: info.selectionText || '',
      source: 'context-menu'
    };

    await queueOfflineItem({
      id: crypto.randomUUID(),
      url,
      title: payload.title,
      createdAt: new Date().toISOString(),
      payload
    });

    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, payload, () => undefined);
    }
  }

  if (info.menuItemId === 'classsync-ocr') {
    if (!tab?.id) {
      return;
    }

    const imageDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    const result = await triggerCloudVisionOCR(imageDataUrl, url);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: result.ok ? 'OCR Ready' : 'OCR Queued',
      message: result.ok ? 'Questions extracted successfully.' : 'Processing queued for offline sync.'
    });
  }
});

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response: any) => void) => {
  if (!message || !message.type) {
    return false;
  }

  switch (message.type) {
    case 'CLIP_REQUEST': {
      const queuedItem = {
        id: crypto.randomUUID(),
        url: message.url || sender?.tab?.url || 'about:blank',
        title: message.title || sender?.tab?.title || 'Page clip',
        createdAt: new Date().toISOString(),
        payload: message
      };

      void queueOfflineItem(queuedItem);
      sendResponse({ ok: true, queued: true });
      return true;
    }
    case 'PAGE_READY':
      sendResponse({ ok: true, ready: true });
      return true;
    case 'AUTO_FILL_REQUEST': {
      const tabId = sender?.tab?.id;
      if (typeof tabId === 'number') {
        chrome.tabs.sendMessage(tabId, message, (response: any) => {
          sendResponse(response || { ok: true });
        });
        return true;
      }
      sendResponse({ ok: false, error: 'No active tab available' });
      return true;
    }
    case 'SCREENSHOT_CAPTURE_REQUEST': {
      const tabId = sender?.tab?.id ?? message.tabId;
      if (typeof tabId === 'number') {
        chrome.tabs.captureVisibleTab(sender?.tab?.windowId ?? undefined, { format: 'png' }).then((imageDataUrl: string) => {
          sendResponse({ ok: true, imageDataUrl });
        }).catch((error: any) => {
          sendResponse({ ok: false, error: error?.message || 'Screenshot capture failed.' });
        });
        return true;
      }
      sendResponse({ ok: false, error: 'No valid tab context for screenshot capture.' });
      return true;
    }
    default:
      return false;
  }
});

chrome.action.onClicked.addListener(async (tab: any) => {
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'CLIP_REQUEST' }, () => undefined);
  }
});
