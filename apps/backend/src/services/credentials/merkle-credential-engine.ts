import { createHash } from 'crypto';

export interface CredentialRecord {
  studentId: string;
  classId: string;
  score: number;
  issueDate: string;
  issuerPrivateKey: string;
  credentialId: string;
  issuer: string;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
  credentialId: string;
}

export class MerkleCredentialEngine {
  static hashRecord(record: CredentialRecord): string {
    const serialized = [
      record.studentId,
      record.classId,
      String(record.score),
      record.issueDate,
      record.issuerPrivateKey,
    ].join('|');

    return createHash('sha256').update(serialized).digest('hex');
  }

  static buildMerkleTree(leaves: string[]): string[] {
    if (leaves.length === 0) return [];
    let level = leaves.map((leaf) => leaf);
    const result: string[] = [...level];

    while (level.length > 1) {
      const next: string[] = [];
      for (let index = 0; index < level.length; index += 2) {
        const left = level[index];
        const right = level[index + 1] ?? left;
        next.push(createHash('sha256').update(`${left}${right}`).digest('hex'));
      }
      level = next;
      result.push(...level);
    }

    return result;
  }

  static getMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return createHash('sha256').update('').digest('hex');
    const tree = this.buildMerkleTree(leaves);
    return tree[tree.length - 1] ?? leaves[0];
  }

  static generateProof(leaf: string, leaves: string[]): MerkleProof {
    const tree = this.buildMerkleTree(leaves);
    const proof: string[] = [];
    let currentIndex = leaves.indexOf(leaf);

    if (currentIndex === -1) {
      throw new Error('Leaf not found in tree');
    }

    for (let level = leaves; level.length > 1; level = this.buildMerkleTree(level)) {
      const nextLevel = this.buildMerkleTree(level);
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = level[siblingIndex] ?? level[currentIndex];
      proof.push(sibling);
      currentIndex = Math.floor(currentIndex / 2);
      if (level.length === nextLevel.length) {
        break;
      }
    }

    return {
      leaf,
      proof,
      root: this.getMerkleRoot(leaves),
      credentialId: leaf.slice(0, 12),
    };
  }

  static buildVerifiableCredential(record: CredentialRecord): Record<string, unknown> {
    const hash = this.hashRecord(record);
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
      ],
      id: `https://classsync.edu.vn/credentials/${record.credentialId}`,
      type: ['VerifiableCredential', 'AcademicCredential'],
      issuer: record.issuer,
      issuanceDate: record.issueDate,
      credentialSubject: {
        id: `did:student:${record.studentId}`,
        studentId: record.studentId,
        classId: record.classId,
        score: record.score,
        hash,
      },
      proof: {
        type: 'MerkleProof2019',
        created: record.issueDate,
        proofValue: hash,
      },
    };

    return credential;
  }
}
