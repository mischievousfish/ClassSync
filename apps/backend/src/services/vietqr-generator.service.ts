function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16Ccitt(value: string): string {
  let crc = 0xffff;
  for (const character of value) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export interface VietQrInput {
  bankBin: string;
  accountNumber: string;
  amount: number;
  transferDescription: string;
}

export class VietQRGeneratorService {
  static generate(input: VietQrInput): string {
    if (!/^\d{6}$/.test(input.bankBin)) throw new Error('VietQR bank BIN must contain 6 digits');
    if (!input.accountNumber || !Number.isInteger(input.amount) || input.amount <= 0) throw new Error('VietQR account and positive integer amount are required');
    const beneficiary = tlv('00', input.bankBin) + tlv('01', input.accountNumber);
    const merchantAccount = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
    const payload = tlv('00', '01') + tlv('01', '12') + tlv('38', merchantAccount) + tlv('53', '704') + tlv('54', String(input.amount)) + tlv('58', 'VN') + tlv('62', tlv('08', input.transferDescription.slice(0, 25))) + '6304';
    return payload + crc16Ccitt(payload);
  }
}