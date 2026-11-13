import type { Timestamp } from 'firebase/firestore';
import type { Notice } from '../types';

export function toDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return null;
}

export function formatDate(value: Timestamp | Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: Timestamp | Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isNoticeExpired(notice: Notice, referenceDate = new Date()): boolean {
  const expires = toDate(notice.expiresAt);
  if (!expires) return false;
  return expires.getTime() < referenceDate.getTime();
}

export function isNoticePublishedAndActive(notice: Notice, referenceDate = new Date()): boolean {
  if (notice.status !== 'published') return false;
  const pub = toDate(notice.publishAt);
  if (pub && pub.getTime() > referenceDate.getTime()) return false;
  if (isNoticeExpired(notice, referenceDate)) return false;
  return true;
}

export function generateSampleCircularPdfBlob(notice: Notice): Blob {
  // Generates a valid minimal PDF binary for offline preview/download of sample circulars
  const lines = [
    'GLOBAL ACADEMY OF TECHNOLOGY - DIGITAL STUDENT NOTICE BOARD',
    'Rajarajeshwari Nagar, Bengaluru, Karnataka - 560098 | https://gat.ac.in',
    '----------------------------------------------------------------------',
    `Title: ${notice.title.replace(/[()\\]/g, '')}`,
    `Category: ${notice.category} | Priority: ${notice.priority.toUpperCase()}`,
    `Published: ${formatDate(notice.publishAt)} | Issued By: ${notice.authorName.replace(/[()\\]/g, '')}`,
    notice.isSample ? 'Note: SAMPLE DEMONSTRATION CIRCULAR' : 'Official Portal Notice',
    '----------------------------------------------------------------------',
    ...notice.content
      .replace(/[()\\]/g, '')
      .split('\n')
      .slice(0, 24)
      .map((line) => line.slice(0, 88)),
  ];

  const textOps = lines
    .map((line, index) => `BT /F1 ${index === 0 ? 12 : 10} Tf 48 ${750 - index * 22} Td (${line}) Tj ET`)
    .join('\n');

  const streamContent = `${textOps}\n`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${streamContent.length} >> stream\n${streamContent}endstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}
