export interface DeepLinkIntent {
  type: 'JOIN_CLASS' | 'OPEN_APP' | 'REFERRAL';
  code?: string;
  referralCode?: string;
  path?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export class DeepLinkHandler {
  static parseDeepLink(url: string): DeepLinkIntent {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, '');

    if (path.startsWith('join/')) {
      return {
        type: 'JOIN_CLASS',
        code: path.split('/')[1],
        path,
      };
    }

    if (parsed.searchParams.get('ref')) {
      return {
        type: 'REFERRAL',
        referralCode: parsed.searchParams.get('ref') ?? undefined,
        path,
      };
    }

    return { type: 'OPEN_APP', path };
  }

  static buildAppLink(classCode: string): string {
    return `https://classsync.edu.vn/join/${encodeURIComponent(classCode)}`;
  }

  static buildInstallFallback(classCode: string): { appStoreUrl: string; playStoreUrl: string } {
    return {
      appStoreUrl: `https://apps.apple.com/app/classsync?id=classsync&redirect=https://classsync.edu.vn/join/${encodeURIComponent(classCode)}`,
      playStoreUrl: `https://play.google.com/store/apps/details?id=com.classsync.app&referrer=${encodeURIComponent(`classCode=${classCode}`)}`,
    };
  }

  static handleInstalledApp(classCode: string): { action: string; payload: { classCode: string } } {
    return {
      action: 'joinClass',
      payload: { classCode },
    };
  }
}
