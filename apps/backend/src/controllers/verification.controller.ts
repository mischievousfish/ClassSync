import { NextFunction, Request, Response } from 'express';
import { MerkleCredentialEngine } from '../services/credentials/merkle-credential-engine';

export interface VerificationRecord {
  credentialId: string;
  studentId: string;
  classId: string;
  score: number;
  issueDate: string;
  issuerPrivateKey: string;
  issuer: string;
}

export class VerificationController {
  private readonly credentials = new Map<string, VerificationRecord>();

  registerCredential(record: VerificationRecord): string {
    this.credentials.set(record.credentialId, record);
    return record.credentialId;
  }

  verifyCredential(credentialId: string): { verified: boolean; credential?: Record<string, unknown>; reason?: string } {
    const record = this.credentials.get(credentialId);
    if (!record) {
      return { verified: false, reason: 'Credential not found' };
    }

    const digest = MerkleCredentialEngine.hashRecord(record);
    const credential = MerkleCredentialEngine.buildVerifiableCredential({
      ...record,
      credentialId,
    });

    return {
      verified: !!digest,
      credential,
    };
  }

  getVerificationRoute(request: Request, response: Response, next: NextFunction): void {
    try {
      const credentialId = Array.isArray(request.params.credentialId)
        ? request.params.credentialId[0]
        : request.params.credentialId;

      const result = this.verifyCredential(String(credentialId ?? ''));
      response.status(result.verified ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }
}
