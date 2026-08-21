import jsPDF from 'jspdf';
import type { VisitRequest } from '@app-types/api';

const pageWidth = 210;
const pageHeight = 297;
const marginX = 20;
const marginTop = 15;
const marginBottom = 15;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatLetterDate() {
  return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('KOP surat gagal dimuat.'));
    image.src = src;
  });
}

export async function generateApprovalLetterPdf(
  request: VisitRequest,
  input: { nomor: string; sifat: string },
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const image = await loadImage('/assets/kop_surat.png');
  const imageHeight = (image.naturalHeight / image.naturalWidth) * (pageWidth - marginX * 2);
  pdf.addImage(image, 'PNG', marginX, marginTop, pageWidth - marginX * 2, imageHeight);

  let y = marginTop + imageHeight + 8;
  const width = pageWidth - marginX * 2;
  const line = 5.5;
  const text = (value: string, x = marginX, size = 11, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFont('times', style);
    pdf.setFontSize(size);
    pdf.text(value, x, y);
    y += line;
  };
  const paragraph = (value: string) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(value, width) as string[];
    pdf.text(lines, marginX, y);
    y += lines.length * line + 2;
  };
  const field = (label: string, value: string) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(label, marginX, y);
    pdf.text(':', marginX + 40, y);
    const lines = pdf.splitTextToSize(value, width - 45) as string[];
    pdf.text(lines, marginX + 44, y);
    y += lines.length * line;
  };

  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.text(`Nomor: ${input.nomor}`, marginX, y);
  pdf.text(`Rantau, ${formatLetterDate()}`, pageWidth - marginX, y, { align: 'right' });
  y += line;
  text(`Sifat: ${input.sifat}`);
  text('Lampiran: -');
  text('Hal: Persetujuan Permohonan Kunjungan / Audiensi');
  y += 4;
  text('Kepada Yth.');
  text(`Sdr. ${request.pimpinan_rombongan} (Pimpinan Rombongan)`);
  text(request.nama_instansi);
  text('di Tempat');
  y += 4;

  paragraph(`Sehubungan dengan surat permohonan kunjungan audiensi melalui aplikasi SI KETUK PINTU dengan nomor registrasi #${request.token} tertanggal ${new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, bersama ini kami sampaikan bahwa permohonan kunjungan Saudara telah DISETUJUI oleh Pimpinan dan Anggota Komisi I DPRD Kabupaten Tapin dengan rincian jadwal sebagai berikut:`);
  field('ID Registrasi', `#${request.token} (DISETUJUI)`);
  field('Hari / Tanggal', formatDate(request.tanggal_kunjungan));
  field('Waktu Pelaksanaan', `${request.jam_kunjungan} WITA – Selesai`);
  field('Tempat / Ruangan', 'Ruang Rapat Komisi I DPRD Kabupaten Tapin');
  field('Penerima Audiensi', 'Pimpinan dan Anggota Komisi I DPRD Kab. Tapin');
  field('Tema / Agenda', request.tema_kunjungan);
  field('Jumlah Peserta', `${request.jumlah_tamu} Orang`);
  y += 3;
  text('Ketentuan dan Kelengkapan Kunjungan:', marginX, 11, 'bold');
  const requirements = [
    'Membawa Kartu Tanda Penduduk (KTP) asli atau tanda pengenal resmi yang masih berlaku untuk Pimpinan Rombongan serta seluruh peserta yang hadir.',
    'Menunjukkan lembar konfirmasi persetujuan ini atau bukti barcode aplikasi SI KETUK PINTU kepada petugas resepsionis/piket penerima tamu.',
    'Menyiapkan dokumen/materi tertulis aspirasi (jika ada) untuk diserahkan secara resmi saat pertemuan.',
    'Wajib berpakaian sopan, rapi serta hadir 15 menit sebelum kegiatan dimulai.',
  ];
  requirements.forEach((value, index) => {
    const lines = pdf.splitTextToSize(`${index + 1}. ${value}`, width) as string[];
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(lines, marginX, y);
    y += lines.length * line + 1;
  });
  y += 3;
  paragraph('Demikian surat persetujuan ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya, diucapkan terima kasih.');
  y = Math.min(y + 4, pageHeight - marginBottom - 25);
  pdf.text('Admin / PIC Layanan SI KETUK PINTU', pageWidth - marginX, y, { align: 'right' });
  y += line;
  pdf.text('Sekretariat DPRD Kabupaten Tapin', pageWidth - marginX, y, { align: 'right' });
  y += 20;
  pdf.text('( ......................................... )', pageWidth - marginX, y, { align: 'right' });
  y += line;
  pdf.text('NIP / ID Petugas: ........................', pageWidth - marginX, y, { align: 'right' });

  return pdf.output('blob');
}
