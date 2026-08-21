import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { VisitRequest } from '@app-types/api';

export interface Schedule { tanggal_kunjungan: string; jam_kunjungan: string }

const pageWidth = 210;
const marginLeft = 20;
const marginRight = 20;
const contentWidth = pageWidth - marginLeft - marginRight;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('KOP surat gagal dimuat.'));
    image.src = src;
  });
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export async function generateRescheduleLetterPdf(
  request: VisitRequest,
  oldSchedule: Schedule,
  newSchedule: Schedule,
  input: { nomor: string; sifat: string },
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const image = await loadImage('/assets/kop_surat.png');
  const imageHeight = (image.naturalHeight / image.naturalWidth) * contentWidth;
  pdf.addImage(image, 'PNG', marginLeft, 5, contentWidth, imageHeight);
  
  let y = imageHeight + 13;
  const line = 5.5;

  // 1. SET FONT TERLEBIH DAHULU SEBELUM MENCETAK APAPUN
  pdf.setFont('times', 'normal'); 
  pdf.setFontSize(12);

  // 2. FUNGSI KHUSUS HEADER AGAR TITIK DUA (:) SEJAJAR TERMASUK UNTUK NOMOR
  const startHeaderY = y; // Simpan kordinat Y awal untuk mencetak tanggal di kanan
  
  const headerField = (label: string, value: string) => {
    const colonX = marginLeft + 22; // Posisi sejajar titik dua
    const valueX = colonX + 3;
    
    pdf.text(label, marginLeft, y);
    pdf.text(':', colonX, y);
    
    const lines = pdf.splitTextToSize(value, contentWidth - (valueX - marginLeft)) as string[]; 
    pdf.text(lines, valueX, y); 
    y += lines.length * line;
  };

  // Cetak header menggunakan fungsi yang baru
  headerField('Nomor', input.nomor);
  
  // Cetak tanggal tepat lurus di kanan sejajar dengan baris "Nomor"
  pdf.text(`Rantau, ${today()}`, pageWidth - marginRight, startHeaderY, { align: 'right' }); 
  
  headerField('Sifat', input.sifat); 
  headerField('Lampiran', '-'); 
  headerField('Hal', 'Pemberitahuan Penjadwalan Ulang (Reschedule) Kunjungan'); 
  
  y += 6;
  
  // Lanjut ke alamat tujuan
  pdf.text('Kepada Yth.', marginLeft, y); y += line;
  pdf.text(`Sdr. ${request.pimpinan_rombongan} (Pimpinan Rombongan)`, marginLeft, y); y += line;
  pdf.text(request.nama_instansi, marginLeft, y); y += line; 
  pdf.text('di Tempat', marginLeft, y); y += 8;

  // Paragraf Pembuka
  const segments = [
    { text: 'Sehubungan dengan surat permohonan kunjungan melalui aplikasi ', bold: false },
    { text: 'SI KETUK PINTU ', bold: true },
    { text: `dengan nomor registrasi #${request.token}, kami sampaikan bahwa jadwal kunjungan Saudara `, bold: false },
    { text: 'DIJADWALKAN ULANG (RESCHEDULE) ', bold: true },
    { text: 'dengan rincian perubahan sebagai berikut:', bold: false },
  ];
  
  let x = marginLeft;
  for (const segment of segments) {
    pdf.setFont('times', segment.bold ? 'bold' : 'normal'); pdf.setFontSize(12);
    const words = segment.text.split(' ');
    for (const word of words) {
      if (word === '') continue; // Abaikan string kosong akibat spasi
      const token = `${word} `;
      if (x + pdf.getTextWidth(token) > pageWidth - marginRight) { x = marginLeft; y += line; }
      pdf.text(token, x, y); x += pdf.getTextWidth(token);
    }
  }
  y += 8;

  // 3. PERBAIKAN TEKS "TEMPAT" PADA TABEL
  const rows = [
    ['Hari / Tanggal', formatDate(oldSchedule.tanggal_kunjungan), formatDate(newSchedule.tanggal_kunjungan)],
    ['Waktu', `${oldSchedule.jam_kunjungan} WITA`, `${newSchedule.jam_kunjungan} WITA`],
    ['Tempat', 'Ruang Rapat Komisi I DPRD', 'Ruang Rapat Komisi I DPRD'], // <-- Diubah di sini
    [{ content: 'Agenda / Tema', colSpan: 1 }, { content: request.tema_kunjungan, colSpan: 2 }],
    [{ content: 'Jumlah Tamu', colSpan: 1 }, { content: `${request.jumlah_tamu} Orang`, colSpan: 2 }],
  ];
  
  autoTable(pdf, {
    startY: y,
    margin: { left: marginLeft, right: marginRight },
    head: [['Komponen', 'Jadwal Semula (Dibatalkan)', 'Jadwal Perubahan (Baru)']],
    body: rows as never,
    styles: { font: 'times', fontSize: 11, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { font: 'times', fillColor: [230, 230, 230], textColor: [0, 0, 0] },
  });
  
  y = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  y += 10; 
  
  pdf.setFont('times', 'bold'); 
  pdf.setFontSize(12); 
  pdf.text('Ketentuan Pelaksanaan Jadwal Baru:', marginLeft, y); 
  y += 7;
  
  const conditions = [
    'Menunjukkan surat pemberitahuan ini kepada petugas penerima tamu.', 
    'Hadir 15 menit sebelum jadwal baru dimulai.', 
    'Membawa dokumen dan identitas peserta sesuai ketentuan kunjungan.'
  ];
  
  conditions.forEach((condition, index) => { 
    const lines = pdf.splitTextToSize(condition, contentWidth - 8) as string[]; 
    pdf.setFont('times', 'normal'); 
    pdf.text(`${index + 1}.`, marginLeft, y); 
    pdf.text(lines, marginLeft + 8, y); 
    y += lines.length * line + 2; 
  });
  
  y += 5; 
  const ending = pdf.splitTextToSize('Demikian surat pemberitahuan ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya, diucapkan terima kasih.', contentWidth) as string[]; 
  pdf.text(ending, marginLeft, y); 
  y += ending.length * line + 12;
  
  const centerX = pageWidth - 65; // Sedikit digeser agar tanda tangan center-nya tidak terlalu ke pinggir
  pdf.text('Admin / PIC Layanan SI KETUK PINTU', centerX, y, { align: 'center' }); y += line; 
  pdf.text('Sekretariat DPRD Kabupaten Tapin', centerX, y, { align: 'center' }); y += 20; 
  pdf.text('( ......................................... )', centerX, y, { align: 'center' }); y += line; 
  pdf.text('NIP / ID Petugas: ........................', centerX, y, { align: 'center' });
  
  return pdf.output('blob');
}