declare const chrome: any;

type ClipQueueItem = {
  id: string;
  url: string;
  title: string;
  snippet: string;
  imageDataUrl?: string;
  createdAt: string;
  status: 'queued' | 'synced';
};

const CLASSSYNC_API_BASE = 'https://api.classsync.app';

async function enqueueClip(item: ClipQueueItem): Promise<void> {
  const existing = ((await chrome.storage.local.get('classsyncQueuedClips'))?.classsyncQueuedClips ?? []) as ClipQueueItem[];
  const next = [item, ...existing].slice(0, 200);
  await chrome.storage.local.set({ classsyncQueuedClips: next });
}

async function syncQueuedClips(): Promise<void> {
  const queue = ((await chrome.storage.local.get('classsyncQueuedClips'))?.classsyncQueuedClips ?? []) as ClipQueueItem[];
  const pending = queue.filter((entry) => entry.status === 'queued');

  for (const item of pending) {
    try {
      await fetch(`${CLASSSYNC_API_BASE}/api/v1/companion/clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getStoredToken()}` },
        body: JSON.stringify({
          sourceUrl: item.url,
          title: item.title,
          snippet: item.snippet,
          imageDataUrl: item.imageDataUrl,
        }),
      });

      item.status = 'synced';
    } catch (error) {
      console.warn('Could not sync clip to ClassSync:', error);
    }
  }

  const remaining = queue.map((item) => ({ ...item, status: item.status === 'queued' ? 'queued' : 'synced' }));
  await chrome.storage.local.set({ classsyncQueuedClips: remaining });
}

async function getStoredToken(): Promise<string> {
  const data = await chrome.storage.local.get('classsyncAuthToken');
  return data.classsyncAuthToken ?? '';
}

async function saveToken(token: string): Promise<void> {
  await chrome.storage.local.set({ classsyncAuthToken: token });
}

async function beginPkceAuth(): Promise<void> {
  const authUrl = `${CLASSSYNC_API_BASE}/oauth/authorize?response_type=code&client_id=YOUR_CLASSSYNC_CLIENT_ID&redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&scope=${encodeURIComponent('openid email profile offline_access')}&code_challenge_method=S256&code_challenge=${encodeURIComponent('demo_challenge')}`;

  const code = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  const params = new URLSearchParams(code.split('?')[1] ?? code);
  const grantCode = params.get('code');

  if (!grantCode) {
    throw new Error('No authorization code returned from ClassSync');
  }

  const tokenResponse = await fetch(`${CLASSSYNC_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: grantCode,
      client_id: 'YOUR_CLASSSYNC_CLIENT_ID',
      redirect_uri: chrome.identity.getRedirectURL(),
      code_verifier: 'demo_verifier',
    }),
  });

  const tokenJson = await tokenResponse.json();
  if (tokenJson.access_token) {
    await saveToken(tokenJson.access_token);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'classsyncSendClip',
    title: 'Send to ClassSync AI Quiz Generator',
    contexts: ['selection', 'image', 'page'],
  });

  chrome.contextMenus.create({
    id: 'classsyncCapturePage',
    title: 'Capture quiz screenshot',
    contexts: ['page', 'selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) {
    return;
  }

  if (info.menuItemId === 'classsyncSendClip') {
    const payload = {
      type: 'CLASSSYNC_TRIGGER_CLIP',
      source: 'context-menu',
      url: tab.url ?? '',
      title: tab.title ?? 'Untitled page',
      selectionText: info.selectionText ?? '',
      imageDataUrl: info.srcUrl,
    };

    await chrome.tabs.sendMessage(tab.id, payload);
  }

  if (info.menuItemId === 'classsyncCapturePage') {
    await chrome.tabs.sendMessage(tab.id, { type: 'CLASSSYNC_CAPTURE_PAGE' });
  }
});

chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (response?: any) => void) => {
  if (message.type === 'CLASSSYNC_CLIP_READY') {
    void enqueueClip({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: message.url,
      title: message.title,
      snippet: message.snippet,
      imageDataUrl: message.imageDataUrl,
      createdAt: new Date().toISOString(),
      status: 'queued',
    }).then(() => {
      sendResponse({ ok: true, queued: true });
    });
    return true;
  }

  if (message.type === 'CLASSSYNC_AUTH') {
    void beginPkceAuth().then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === 'CLASSSYNC_SYNC_QUEUE') {
    void syncQueuedClips().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'CLASSSYNC_FILL_GRADE') {
    void chrome.tabs.sendMessage(message.tabId, { type: 'CLASSSYNC_APPLY_GRADE', grade: message.grade, studentName: message.studentName });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

chrome.runtime.onStartup.addListener(() => {
  void syncQueuedClips();
});

chrome.runtime.onSuspend.addListener(() => {
  void syncQueuedClips();
});
