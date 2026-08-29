import { createHash } from 'node:crypto';

export type AuditActionType =
  | 'VIEW_STUDENT_NOTE'
  | 'EXPORT_GRADES'
  | 'DELETE_USER'
  | 'UPDATE_PERMISSIONS';

export interface AuditEventInput {
  actorUserId: string;
  actorRole: string;
  actionType: AuditActionType;
  targetResourceId: string;
  clientIp: string;
  userAgent: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: string;
  actionType: AuditActionType;
  targetResourceId: string;
  clientIp: string;
  userAgent: string;
  previousHash: string;
  currentHash: string;
}

export class ImmutableAuditLogger {
  private readonly entries: AuditLogEntry[] = [];

  logEvent(input: AuditEventInput): AuditLogEntry {
    const previousHash = this.entries.length === 0 ? 'GENESIS' : this.entries[this.entries.length - 1].currentHash;
    const timestamp = new Date().toISOString();
    const id = `audit-${this.entries.length + 1}-${createHash('sha256').update(`${input.actorUserId}:${input.actionType}:${timestamp}`).digest('hex').slice(0, 12)}`;

    const payload = {
      id,
      timestamp,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      actionType: input.actionType,
      targetResourceId: input.targetResourceId,
      clientIp: input.clientIp,
      userAgent: input.userAgent,
      previousHash,
    };

    const currentHash = createHash('sha256').update(`${JSON.stringify(payload)}:${previousHash}`).digest('hex');
    const entry: AuditLogEntry = {
      ...payload,
      currentHash,
    };

    this.entries.push(entry);
    return entry;
  }

  verifyChain(): boolean {
    for (let index = 1; index < this.entries.length; index += 1) {
      const current = this.entries[index];
      const previous = this.entries[index - 1];
      const expectedHash = createHash('sha256').update(`${JSON.stringify({
        id: current.id,
        timestamp: current.timestamp,
        actorUserId: current.actorUserId,
        actorRole: current.actorRole,
        actionType: current.actionType,
        targetResourceId: current.targetResourceId,
        clientIp: current.clientIp,
        userAgent: current.userAgent,
        previousHash: current.previousHash,
      })}:${current.previousHash}`).digest('hex');

      if (current.currentHash !== expectedHash || current.previousHash !== previous.currentHash) {
        return false;
      }
    }

    if (this.entries.length && this.entries[0].previousHash !== 'GENESIS') {
      return false;
    }

    return true;
  }

  getEntries(): AuditLogEntry[] {
    return [...this.entries];
  }
}
