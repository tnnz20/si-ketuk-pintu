import jsPDF from 'jspdf';
import type { VisitRequest } from '@app-types/api';

const pageWidth = 210;
const pageHeight = 297;
const marginX = 20;
const marginTop = 5;
const marginBottom = 15;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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

  const text = (value: string, x = marginX, size = 12, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFont('times', style);
    pdf.setFontSize(size);
    pdf.text(value, x, y);
    y += line;
  };

  const paragraph = (value: string) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(value, width) as string[];
    pdf.text(lines, marginX, y);
    y += lines.length * line + 2;
  };

  // --- NEW: Custom Renderer for Rich Text Paragraphs ---
  const richParagraph = (segments: { text: string; style: 'normal' | 'bold' }[]) => {
    pdf.setFontSize(12);
    let currentX = marginX;

    segments.forEach((segment) => {
      pdf.setFont('times', segment.style);

      // Split the segment into individual words
      const words = segment.text.split(' ');

      words.forEach((word) => {
        // Add a space after the word, unless it's the last word of a segment that needs to connect directly (we handle spacing manually below)
        const textToMeasure = word + ' ';
        const wordWidth = pdf.getTextWidth(textToMeasure);

        // If the word pushes past the right margin, wrap to the next line
        if (currentX + wordWidth > pageWidth - marginX) {
          y += line;
          currentX = marginX; // Reset to left margin
        }

        // Print the word
        pdf.text(word, currentX, y);

        // Move X cursor forward. (Only add space if it's not empty string to prevent double spaces)
        if (word !== '') {
          currentX += wordWidth;
        }
      });
    });
    y += line + 2; // Move Y cursor down after the whole paragraph is done
  };
  // -----------------------------------------------------

  // Updated field function to handle coloring/bolding for ID Registrasi
  const fieldWithStatus = (label: string, id: string, statusText: string) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.text(label, marginX, y);
    pdf.text(':', marginX + 40, y);

    // Print the ID
    pdf.text(id, marginX + 44, y);
    const idWidth = pdf.getTextWidth(id + ' ');

    // Print the Status in Bold
    pdf.setFont('times', 'bold');
    pdf.text(`(${statusText})`, marginX + 44 + idWidth, y);

    // Reset back to normal for the next items
    pdf.setFont('times', 'normal');
    y += line;
  };

  const field = (label: string, value: string) => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.text(label, marginX, y);
    pdf.text(':', marginX + 40, y);
    const lines = pdf.splitTextToSize(value, width - 45) as string[];
    pdf.text(lines, marginX + 44, y);
    y += lines.length * line;
  };

  // --- Start Rendering ---

  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);

  const startHeaderY = y;

  const headerField = (label: string, value: string) => {
    const colonX = marginX + 20;
    const valueX = colonX + 3;

    pdf.text(label, marginX, y);
    pdf.text(':', colonX, y);

    const lines = pdf.splitTextToSize(value, width - (valueX - marginX)) as string[];
    pdf.text(lines, valueX, y);
    y += lines.length * line;
  };

  // Cetak header menggunakan fungsi baru
  headerField('Nomor', input.nomor);

  // Cetak tanggal di kanan sejajar baris pertama (Nomor)
  pdf.text(`Rantau, ${formatLetterDate()}`, pageWidth - marginX, startHeaderY, { align: 'right' });

  headerField('Sifat', input.sifat);
  headerField('Lampiran', '-');
  headerField('Hal', 'Persetujuan Permohonan Kunjungan / Audiensi');

  y += 4; // Tambahan spasi sebelum "Kepada Yth."
  // --- END REPLACEMENT ---

  text('Kepada Yth.');
  text(`Sdr. ${request.pimpinan_rombongan} (Pimpinan Rombongan)`);
  text(request.nama_instansi);
  text('di Tempat');
  y += 4;

  // --- Using the new richParagraph for the bold formatting ---
  const createdDate = new Date(request.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  richParagraph([
    {
      text: 'Sehubungan dengan surat permohonan kunjungan audiensi melalui aplikasi ',
      style: 'normal',
    },
    { text: 'SI KETUK PINTU ', style: 'bold' },
    { text: 'dengan nomor registrasi ', style: 'normal' },
    { text: `#${request.token} `, style: 'bold' },
    {
      text: `tertanggal ${createdDate}, bersama ini kami sampaikan bahwa permohonan kunjungan Saudara telah `,
      style: 'normal',
    },
    { text: 'DISETUJUI ', style: 'bold' },
    {
      text: 'oleh Pimpinan dan Anggota Komisi I DPRD Kabupaten Tapin dengan rincian jadwal sebagai berikut:',
      style: 'normal',
    },
  ]);
  // ---------------------------------------------------------

  // Use the specific fieldWithStatus for the ID
  fieldWithStatus('ID Registrasi', `#${request.token}`, 'DISETUJUI');

  field('Hari / Tanggal', formatDate(request.tanggal_kunjungan));
  field('Waktu Pelaksanaan', `${request.jam_kunjungan} WITA - Selesai`);
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
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);

    const numText = `${index + 1}.`;

    const indentOffset = 5;
    const textX = marginX + indentOffset;

    const textAvailableWidth = pageWidth - textX - marginX;

    const lines = pdf.splitTextToSize(value, textAvailableWidth) as string[];

    pdf.text(numText, marginX, y);

    pdf.text(lines, textX, y);

    y += lines.length * line + 2;
  });

  y += 3;
  paragraph(
    'Demikian surat persetujuan ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya, diucapkan terima kasih.',
  );

  y = Math.min(y + 4, pageHeight - marginBottom - 25);

  const signatureCenterX = pageWidth - marginX - 25;

  pdf.text('Admin / PIC Layanan SI KETUK PINTU', signatureCenterX, y, { align: 'center' });
  y += line;
  pdf.text('Sekretariat DPRD Kabupaten Tapin', signatureCenterX, y, { align: 'center' });
  y += 20;
  pdf.text('( ......................................... )', signatureCenterX, y, {
    align: 'center',
  });
  y += line;
  pdf.text('NIP / ID Petugas: ........................', signatureCenterX, y, { align: 'center' });

  return pdf.output('blob');
}
