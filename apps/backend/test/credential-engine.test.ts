import { MerkleCredentialEngine } from '../src/services/credentials/merkle-credential-engine';
import { SteganographicWatermarker } from '../src/services/credentials/steganographic-watermarker';

describe('credential and watermarking engine', () => {
  it('hashes and produces a deterministic Merkle root', () => {
    const records = [
      { studentId: 'S1', classId: 'C1', score: 90, issueDate: '2026-08-29', issuerPrivateKey: 'priv-1', credentialId: 'cred-1', issuer: 'did:issuer:001' },
      { studentId: 'S2', classId: 'C1', score: 88, issueDate: '2026-08-29', issuerPrivateKey: 'priv-2', credentialId: 'cred-2', issuer: 'did:issuer:001' },
      { studentId: 'S3', classId: 'C1', score: 95, issueDate: '2026-08-29', issuerPrivateKey: 'priv-3', credentialId: 'cred-3', issuer: 'did:issuer:001' },
    ];

    const leaves = records.map((record) => MerkleCredentialEngine.hashRecord(record));
    const root = MerkleCredentialEngine.getMerkleRoot(leaves);

    expect(root).toBeTruthy();
    expect(leaves[0]).not.toBe(leaves[1]);
  });

  it('injects and extracts zero-width text watermarks', () => {
    const original = 'Complete the algebra worksheet by Friday.';
    const watermarked = SteganographicWatermarker.injectTextWatermark({
      text: original,
      userId: 'student-42',
      timestamp: '2026-08-29T10:00:00Z',
      issuer: 'school-01',
    });

    const extracted = SteganographicWatermarker.extractTextWatermark(watermarked);
    expect(extracted).not.toBeNull();
    expect(extracted?.userId).toBe('student-42');
    expect(extracted?.issuer).toBe('school-01');
  });

  it('embeds and extracts image watermark metadata', () => {
    const pixels = new Uint8ClampedArray(16);
    const encoded = SteganographicWatermarker.embedImageWatermark(pixels, 'student-42', '2026-08-29');
    const extracted = SteganographicWatermarker.extractImageWatermark(encoded);

    expect(extracted).not.toBeNull();
    expect(extracted?.userId).toBe('student-42');
  });
});
