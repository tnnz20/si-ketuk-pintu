import jsPDF from 'jspdf';
import type { VisitRequest } from '@app-types/api';

const margin = 20;
const pageWidth = 210;
const pageHeight = 297;
const contentWidth = pageWidth - margin * 2;

// Kordinat absolut untuk menjaga struktur tabel/kolom agar sejajar rapi
const labelX = margin;
const colonX = margin + 45; 
const valueX = colonX + 4;
const maxValueWidth = pageWidth - margin - valueX;
const lineHeight = 6;

const statusLabels: Record<VisitRequest['status'], string> = {
  pending: 'Terkirim',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const statusExplanations: Record<VisitRequest['status'], string> = {
  pending: '(Menunggu Konfirmasi)',
  approved: '(Telah Disetujui)',
  rejected: '(Permohonan Ditolak)',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  const datePart = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', ':');
  
  return `${datePart}, ${timePart} WITA`;
};

export function generateVisitRequestPdf(request: VisitRequest): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // --- HEADER SEKSI ---
  const addSection = (title: string) => {
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(title, margin, y);
    y += 8; // Jarak/Spasi dari judul seksi ke baris pertama data
  };

  // --- BARIS DATA (Format Kolom Sejajar) ---
  const addField = (label: string, value: string | number) => {
    ensureSpace(lineHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // 1. Label
    pdf.text(label, labelX, y);
    // 2. Titik Dua
    pdf.text(':', colonX, y);

    // 3. Value (Bisa Multi-baris)
    const lines = pdf.splitTextToSize(String(value), maxValueWidth) as string[];
    pdf.text(lines, valueX, y);
    
    // Tambah jarak Y sesuai dengan jumlah baris teks
    y += (lines.length * (lineHeight - 1.5)) + 2.5; 
  };

  // --- BARIS DATA KHUSUS STATUS (Normal + Italic) ---
  const addFieldMixedStatus = (label: string, status: string, explanation: string) => {
    ensureSpace(lineHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    pdf.text(label, labelX, y);
    pdf.text(':', colonX, y);

    pdf.text(status, valueX, y);
    const statusWidth = pdf.getTextWidth(status + ' ');

    pdf.setFont('helvetica', 'italic');
    pdf.text(explanation, valueX + statusWidth, y);
    
    y += lineHeight + 1;
  };

  // ==========================================
  // MULAI RENDER DOKUMEN
  // ==========================================

  // 1. JUDUL
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('SI KETUK PINTU', pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  pdf.setFontSize(14);
  pdf.text('Surat Permohonan Kunjungan', pageWidth / 2, y, { align: 'center' });
  y += 20; // SPASI ANTARA JUDUL DAN SEKSI PERTAMA

  // 2. INFORMASI SISTEM & VERIFIKASI
  addSection('Informasi Sistem & Verifikasi');
  addField('ID Registrasi', request.token);
  addField('Waktu Pengajuan', formatDateTime(request.created_at));
  addFieldMixedStatus('Status Berkas', statusLabels[request.status], statusExplanations[request.status]);

  y += 2; 

  // 3. INFORMASI KUNJUNGAN
  addSection('Informasi Kunjungan');
  addField('Hari/Tanggal', formatDate(request.tanggal_kunjungan));
  addField('Waktu', `${request.jam_kunjungan} WITA`); 
  addField('Tema', request.tema_kunjungan);
  addField('Pimpinan Rombongan', request.pimpinan_rombongan);
  addField('Nama', request.pimpinan_rombongan);
  addField('Jumlah Tamu', `${request.jumlah_tamu} Orang`);
  addField('Asal Instansi', request.nama_instansi);
  addField('Nomor Kontak', request.kontak_dihubungi);

  y += 8;

  // 4. KELENGKAPAN HARI-H
  addSection('Kelengkapan yang Dibawa saat Hari-H');
  const requirements = [
    'Membawa Kartu Tanda Penduduk (KTP) asli / tanda pengenal resmi untuk Pimpinan Rombongan serta seluruh peserta/anggota rombongan yang hadir.',
    'Menunjukkan lembar/tangkapan layar formulir ini kepada petugas piket / penerima tamu saat tiba di lokasi.',
    'Membawa berkas/naskah tertulis aspirasi (jika ada) untuk diserahkan saat audiensi.',
    'Wajib berpakaian sopan, rapi serta hadir 15 menit sebelum kegiatan dimulai.',
  ];

  pdf.setFont('helvetica', 'normal');
  requirements.forEach((req, idx) => {
    const numText = `${idx + 1}.`;
    const indentX = margin + 6; 
    const listTextWidth = pageWidth - margin - indentX;
    
    const lines = pdf.splitTextToSize(req, listTextWidth) as string[];
    ensureSpace(lines.length * (lineHeight - 1));
    
    pdf.text(numText, margin, y); 
    pdf.text(lines, indentX, y); 
    
    y += lines.length * (lineHeight - 1.5) + 3;
  });

  y += 10;

  // 5. CATATAN
  ensureSpace(30);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Catatan:', margin, y);
  y += 5.5;

  pdf.setFont('helvetica', 'normal');
  const noteText =
    'Permohonan kunjungan akan diproses sesuai dengan jadwal dan ketentuan yang berlaku. Mohon menunggu konfirmasi dari petugas melalui kontak yang telah dicantumkan. Permohonan belum dinyatakan disetujui sebelum mendapatkan konfirmasi dari pihak Sekretariat DPRD Kabupaten Tapin.';
  const noteLines = pdf.splitTextToSize(noteText, contentWidth) as string[];
  pdf.text(noteLines, margin, y);
  y += noteLines.length * 5.5 + 5;

  pdf.text('Terima kasih atas perhatian dan kerja sama Anda.', margin, y);

  // SIMPAN PDF
  pdf.save(`surat-permohonan-kunjungan-${request.token}.pdf`);
}