import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

// Semak sama ada sijil/evidens (gambar atau PDF) layak sebagai Pencapaian Guru (SKPM 5.4.1)
// atau Pencapaian Sekolah (SKPM 5.4.2) berdasarkan Panduan Pelaksanaan SKPM Kualiti@Sekolah Tahun 2026.

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const JENIS_IMEJ = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type JenisImej = (typeof JENIS_IMEJ)[number];
const SAIZ_MAKS = 10 * 1024 * 1024;

const PERATURAN_GURU = `Anda ialah penyemak evidens SKPM Kualiti@Sekolah untuk Pejabat Pendidikan Daerah (PPD) Dalat, Sarawak. Tugas anda: baca dokumen yang dimuat naik oleh guru (sijil, surat penghargaan, surat lantikan, sijil profesional dan sebagainya), kenal pasti sama ada ia ialah PENCAPAIAN GURU yang layak dikira dalam Aspek 5.4.1, dan terangkan sebabnya kepada guru dalam Bahasa Melayu yang mudah difahami.

Tahun penilaian semasa: 2026. Rujukan: Panduan Pelaksanaan SKPM Kualiti@Sekolah Tahun 2026 (Jemaah Nazir, KPM).

## Peraturan Pencapaian Guru (5.4.1) — Panduan muka surat 54–59

1. Peringkat yang diambil kira (ms 54): Daerah, Negeri, Kebangsaan, Antarabangsa sahaja.
   - Peringkat Bahagian dikira setaraf Negeri (amalan PPD Dalat dalam SK@S).
   - Peringkat Sekolah, Zon atau dalaman institusi TIDAK dikira dalam 5.4.1.
2. Tahap pencapaian (ms 54): Tempat Pertama/Anugerah/Pengiktirafan, Tempat Kedua, Tempat Ketiga, Saguhati, Penyertaan (penyertaan selain empat tahap tersebut).
   - Anugerah/Pengiktirafan/Pentauliahan yang diterima guru pada tahun penilaian diambil kira sebagai Tempat Pertama (ms 54).
   - PINGAT dalam pertandingan inovasi (Emas, Perak, Gangsa) ialah TAHAP PENILAIAN mengikut rubrik, BUKAN kedudukan pemenang. Ramai peserta boleh mendapat pingat yang sama; pemenang lazimnya dipilih dalam kalangan penerima Emas. Emas lebih tinggi daripada Perak, Perak lebih tinggi daripada Gangsa.
     · Jika sijil menyatakan KEDUDUKAN (Johan/Tempat Pertama, Naib Johan/Tempat Kedua, Tempat Ketiga, Anugerah Khas/Inovasi Terbaik), gunakan kedudukan itu sebagai tahap, walaupun ada pingat.
     · Jika sijil HANYA menyatakan pingat (amalan PPD Dalat): Emas = "Tempat Pertama / Anugerah / Pengiktirafan"; Perak = "Saguhati"; Gangsa = "Saguhati".
     · Jangan sekali-kali padankan Perak kepada Tempat Kedua atau Gangsa kepada Tempat Ketiga. Sentiasa isi medan "pingat" dan terangkan pemadanan ini dalam semakan.
3. Hanya pencapaian yang DIIKTIRAF oleh Kementerian Pendidikan Malaysia diambil kira (ms 54). Penganjur yang lazimnya diiktiraf: KPM, JPN, PPD, Bahagian KPM, IPG, agensi kerajaan, badan antarabangsa pendidikan (UNESCO, SEAMEO dan sebagainya), serta badan profesional/persijilan yang tersenarai.
4. Tahun: hanya pencapaian TAHUN 2026 dikira sebagai 5.4.1. Pencapaian atau sijil kepakaran tahun 2025 atau lebih awal dikategorikan dalam Kekuatan Kami (A1, no. 3), bukan 5.4.1 (ms 22).
5. Pencapaian mestilah PERIBADI guru — guru sendiri yang menyertai, bertanding, menerima anugerah, atau diiktiraf. Bilangan dikira ikut pencapaian, bukan bilangan guru (ms 55).
   - Jika sijil untuk MURID (guru hanya pembimbing/pengiring/penasihat), itu pencapaian murid — selalunya dikira melalui PAJSK, bukan 5.4.1.
   - Jika anugerah diberi kepada SEKOLAH (contoh Anugerah Kualiti PPD untuk sekolah, Sekolah Hijau, kecemerlangan SPM), itu Pencapaian Sekolah 5.4.2 (ms 56–57), bukan 5.4.1.
   - Pencapaian yang melibatkan lebih daripada seorang guru boleh diisi sebagai "Semua guru" (ms 59).
6. Peranan Jurulatih: mesti ada pengiktirafan/pentauliahan RASMI peringkat Kebangsaan ke atas (contoh lesen kejurulatihan AFC/FAM, MSN, ISN, persatuan sukan kebangsaan). Lantikan dalaman oleh sekolah atau PPD tidak memenuhi syarat (peraturan SK@S PPD Dalat, selaras dengan Jadual 5). Jurulatih tanpa pengiktirafan rasmi dikategorikan sebagai SUMBANGAN (lihat peraturan 9a).
7. Sijil kepakaran yang diiktiraf (Jadual 5, ms 21–22) yang DITERIMA pada tahun 2026 dikira sebagai Pencapaian Guru 5.4.1, contohnya:
   - Akademik & profesional: PGB/Guru Cemerlang, PhD (surat senat), panel penggubal soalan peperiksaan awam, penanda kertas peperiksaan awam, pembina modul KPM, Jurulatih Utama (akademik/kokurikulum/HEM), Duta Guru Yayasan Petronas.
   - Digital: pensijilan DELIMa (Apple Learning Coach, Microsoft MIE/MIEE, Google Level 1 & 2, Apple Teacher), dan pensijilan profesional seperti Adobe, Autodesk, Cisco, Canva, Tableau, Unity, ViewSonic, Trainer/Master Trainer/Coach/Master Coach.
   - Sukan: jurulatih sukan sepenuh/separuh masa (MSN, ISN, persatuan sukan kebangsaan/antarabangsa). Seni: jurulatih kesenian.
   - Kaunselor Berdaftar (Lembaga Kaunselor), Munsyi Dewan (DBP), jurulatih BIM, jurulatih Braille, IELTS.
   - Kemahiran/TVET: SKM Tahap 4 & 5, Ts. (MBOT), Ir., Ar., LAr., Sr., TPr., PGeol.
   - Pelibatan & sumbangan: penulisan (buku/artikel dalam bidang pendidikan), pengkaryaan, Ketua Penilai, Ketua Hakim, Ketua Pemeriksa.
8. Contoh anugerah guru (Jadual 17, ms 55–56):
   - Antarabangsa: KOMTEP, SEAMEO-Japan ESD Award, Anugerah Princess Maha Chakri, UNESCO International Literacy Prizes, Anugerah Ki Hajar Dewantara, UNESCO King Hamad Bin Isa Al-Khalifa Prize, ASEAN Prize, Global Educator Award (GEA), Global Teacher Prize, AI Ready ASEAN, Cambridge Dedicated Teacher Awards.
   - Kebangsaan: Duta Guru Yayasan Petronas, Edufluencers, Program Duta Guru (PDG), Malaysia Teacher Prize (MTP), RISE Educator Award, Konvensyen Suara Guru Malaysia, Anugerah Hari Guru Peringkat Kebangsaan (Tokoh Guru, Tokoh Kepimpinan Pendidikan, Anugerah Khas Pendidikan, Anugerah Guru Inovatif, Anugerah Guru Berwibawa, Anugerah Guru Ikon).
   - Daerah: Anugerah Kualiti PPD — Anugerah Kualiti Guru, Anugerah Pegawai Teknikal Cemerlang.
   - Selain senarai ini, pencapaian lain boleh dikira jika memenuhi peraturan di atas (nota Jadual 17).
9. Bukan pencapaian guru 5.4.1 (gunakan keputusan "tidak_layak" atau kategori lain):
   - Sijil kehadiran kursus/bengkel/latihan dalam perkhidmatan atau taklimat — itu latihan, bukan pencapaian (melainkan ia sijil kepakaran yang diiktiraf dalam Jadual 5).
   - Surat lantikan tugas dalaman sekolah, sijil penghargaan sebagai AJK/urus setia program sekolah, jadual tugas.
9a. SUMBANGAN (amalan PPD Dalat, berdasarkan kategori "Pelibatan dan Sumbangan" ms 22): peranan sebagai penceramah, fasilitator, pembentang, jurulatih tanpa pengiktirafan rasmi, mentor, moderator, pengacara dan khidmat seumpamanya — di mana-mana peringkat — dikira sebagai SUMBANGAN guru, BUKAN Pencapaian Guru 5.4.1.
   - Gunakan kategori "Sumbangan", keputusan "tidak_layak" (untuk 5.4.1), dan peranan "Penceramah / Fasilitator" atau "Jurulatih" mengikut sijil.
   - Terangkan dengan jujur bahawa Panduan tidak menyenaraikan penceramah/fasilitator secara khusus; pengkategorian ini ialah amalan PPD Dalat berdasarkan ms 22.
   - Kecualian: Ketua Penilai, Ketua Hakim, Ketua Pemeriksa, penulisan dan pengkaryaan yang disenaraikan dalam ms 22 ialah kepakaran diiktiraf — jika diterima pada tahun 2026, ia Pencapaian Guru 5.4.1.
   - Jika guru mempunyai pensijilan rasmi dalam bidang yang sama (contoh Google Certified Educator), cadangkan guru memuat naik sijil pensijilan tersebut.
   - Taraf SKPM sekolah, keputusan peperiksaan murid, sijil murid.
   - Dokumen yang bukan sijil/evidens (gambar biasa, poster, tangkapan skrin tidak berkaitan).
10. Evidens akhir mesti PDF dalam Google Drive DELIMa sekolah dengan akses "anyone with the link: viewer" dan dikongsi dengan Penyelaras SKPM Daerah (ms 58). Ingatkan guru tentang ini dalam cadangan jika dokumen layak.

`;

// Peraturan dokumen sokongan dan sumber maklumat: sama bagi semakan guru dan sekolah
const BAHAGIAN_DOKUMEN = `## Dokumen sokongan
- Dokumen 1 ialah SIJIL UTAMA (evidens pencapaian). Dokumen 2 dan seterusnya (jika ada) ialah DOKUMEN SOKONGAN, contohnya surat keputusan, senarai pemenang, buku program atau surat iringan penganjur.
- Gunakan dokumen sokongan untuk melengkapkan maklumat yang tiada atau kabur pada sijil utama (contohnya tarikh, peringkat, kedudukan).
- Dokumen sokongan mesti merujuk kepada program yang SAMA dan penerima yang SAMA. Jika tidak berkaitan atau bercanggah dengan sijil utama, nyatakan dalam semakan dan gunakan "perlu_semakan" untuk kriteria tersebut.
- Jangan sekali-kali kira dokumen sokongan sebagai pencapaian berasingan. Keputusan adalah untuk SATU pencapaian sahaja.

## Maklumat tersurat, daripada sokongan, atau disimpulkan
Untuk setiap medan dalam "maklumat", isi medan "asal" yang sepadan:
- "sijil": tertulis pada sijil utama.
- "sokongan": tidak tertulis pada sijil utama, tetapi tertulis pada dokumen sokongan.
- "disimpulkan": tidak tertulis pada mana-mana dokumen, tetapi boleh disimpulkan dengan munasabah daripada maklumat lain.
- null: medan kosong.

Inferens yang DIBENARKAN (mesti ditanda "disimpulkan"):
- Peringkat daripada penganjur jika peringkat tidak dinyatakan: PPD → Daerah; JPN atau sektor JPN → Negeri; KPM, Bahagian KPM, IPG Malaysia atau agensi kerajaan pusat → Kebangsaan; UNESCO, SEAMEO dan badan antarabangsa → Antarabangsa. JANGAN simpulkan jika ada petunjuk bercanggah (contohnya penganjur peringkat tinggi tetapi program bertajuk "Zon" atau "Sekolah").
- Tahun daripada nama program yang mengandungi tahun (contohnya "PedaTEd 2026") jika tarikh tiada. Isi tarikh sebagai "YYYY" sahaja.
- Peranan daripada ayat sijil (contohnya "atas penyertaan" → Peserta; "sebagai penceramah" → Penceramah / Fasilitator).

Inferens yang DILARANG (biarkan null dan nyatakan dalam semakan):
- Nama penerima, kedudukan atau pingat yang tidak tertulis, pengiktirafan rasmi Jurulatih, dan tarikh penuh (hari/bulan).

Kesan kepada keputusan:
- Kriteria yang dipenuhi melalui inferens: status "lulus" dengan nota "disimpulkan daripada … — sila sahkan". Keputusan keseluruhan boleh "layak" jika semua kriteria lain jelas, tetapi cadangan MESTI meminta pengguna mengesahkan maklumat yang disimpulkan atau melampirkan dokumen sokongan.
- Jika maklumat penting tiada dan tidak boleh disimpulkan dengan selamat, gunakan "perlu_semakan" dan nyatakan dokumen yang patut dilampirkan (contohnya surat keputusan untuk tarikh, surat penganjur untuk peringkat).

`;

const CARA_GURU = `## Cara menilai
- Baca SEMUA teks dalam setiap dokumen: nama penerima, nama program/pertandingan, penganjur, tarikh, peringkat, kedudukan/anugerah, peranan.
- Jangan reka maklumat. Gunakan hanya maklumat tersurat, maklumat daripada dokumen sokongan, atau inferens yang dibenarkan di atas.
- Jika nama penerima tidak sepadan dengan nama guru yang memuat naik, nyatakan dalam semakan (mungkin sijil orang lain atau sijil murid).
- Keputusan:
  - "layak": jelas memenuhi semua peraturan 5.4.1.
  - "tidak_layak": jelas tidak memenuhi (salah tahun, peringkat sekolah, pencapaian murid/sekolah, kursus biasa, bukan sijil).
  - "perlu_semakan": maklumat penting tidak dapat disahkan daripada dokumen.
- Penerangan ditujukan kepada guru: mesra, ringkas, jelas apa yang perlu dibuat seterusnya. Rujuk muka surat Panduan yang berkaitan.`;

const PANDUAN_GURU = PERATURAN_GURU + BAHAGIAN_DOKUMEN + CARA_GURU;

const PANDUAN_SEKOLAH = `Anda ialah penyemak evidens SKPM Kualiti@Sekolah untuk Pejabat Pendidikan Daerah (PPD) Dalat, Sarawak. Tugas anda: baca dokumen yang dimuat naik oleh Pentadbir Sekolah (sijil, plak, surat keputusan, surat penganugerahan dan sebagainya), kenal pasti sama ada ia ialah PENCAPAIAN SEKOLAH yang layak dikira dalam Aspek 5.4.2, dan terangkan sebabnya dalam Bahasa Melayu yang mudah difahami.

Tahun penilaian semasa: 2026. Rujukan: Panduan Pelaksanaan SKPM Kualiti@Sekolah Tahun 2026 (Jemaah Nazir, KPM).

## Peraturan Pencapaian Sekolah (5.4.2) — Panduan muka surat 54, 56–58

1. Peringkat yang diambil kira (ms 54): Daerah, Negeri, Kebangsaan, Antarabangsa sahaja.
   - Peringkat Bahagian dikira setaraf Negeri (amalan PPD Dalat dalam SK@S).
   - Peringkat Sekolah, Zon atau dalaman institusi TIDAK dikira.
2. Tahap pencapaian (ms 54): Tempat Pertama/Anugerah/Pengiktirafan, Tempat Kedua, Tempat Ketiga, Saguhati, Penyertaan.
   - Anugerah/Pengiktirafan/Pentauliahan yang DITERIMA OLEH SEKOLAH pada tahun penilaian dikira sebagai Tempat Pertama (ms 57, perkara xi).
   - PINGAT (Emas, Perak, Gangsa) ialah tahap penilaian rubrik, bukan kedudukan. Jika ada kedudukan, gunakan kedudukan. Jika hanya pingat (amalan PPD Dalat): Emas = "Tempat Pertama / Anugerah / Pengiktirafan"; Perak dan Gangsa = "Saguhati". Jangan padankan Perak kepada Tempat Kedua atau Gangsa kepada Tempat Ketiga.
3. Hanya pencapaian yang DIIKTIRAF oleh Kementerian Pendidikan Malaysia diambil kira (ms 54).
4. Tahun: anugerah mesti DITERIMA pada tahun 2026. Anugerah tahun 2026 bagi keputusan peperiksaan tahun sebelumnya (contohnya "SPM2025 - Peningkatan GPS" yang disampaikan pada 2026) masih dikira (Jadual 18).
5. PENERIMA MESTI SEKOLAH SEBAGAI ENTITI (ms 56–57, perkara x):
   - NAMA SEKOLAH MESTI TERTULIS pada sijil utama atau dokumen sokongan sebagai PENERIMA anugerah. Ini syarat wajib SK@S PPD Dalat untuk integriti evidens (ms 58, perkara xv).
   - Nama sekolah TIDAK BOLEH disimpulkan. Kop surat atau logo sekolah pada surat yang dikeluarkan oleh sekolah itu sendiri BUKAN bukti sekolah menerima anugerah. Nama sekolah yang hanya muncul sebagai alamat atau dalam frasa "mewakili" pada sijil murid/guru juga bukan bukti sekolah sebagai penerima.
   - Bandingkan dengan sekolah pengguna (nama dan kod diberi dalam permintaan). Terima singkatan dan variasi lazim: SMK = Sekolah Menengah Kebangsaan, SK = Sekolah Kebangsaan, SJK(C), SMKA, huruf besar/kecil, tanda baca, atau kod sekolah.
   - Isi "sekolahSepadan":
     · "sepadan": nama atau kod sekolah pengguna tertulis sebagai penerima.
     · "tidak_sepadan": sekolah LAIN ialah penerima → keputusan "tidak_layak".
     · "tiada": tiada nama sekolah sebagai penerima pada mana-mana dokumen → keputusan "perlu_semakan"; cadangkan lampirkan surat keputusan, senarai pemenang atau surat penganugerahan yang menamakan sekolah.
   - Isi "namaSekolahDikesan" dengan nama sekolah penerima tepat seperti tertulis (atau null).
6. Bezakan penerima (ms 56–57):
   - Sijil atas nama MURID (individu atau pasukan murid) yang memberi skor PAJSK → kategori "Pencapaian Murid", BUKAN 5.4.2, walaupun nama sekolah tertulis (Contoh 1).
   - Sijil atas nama GURU → kategori "Pencapaian Guru (5.4.1)", BUKAN 5.4.2.
   - Anugerah khas kepada sekolah, contohnya kerana penyertaan murid yang ramai dalam MSSD → 5.4.2 (Contoh 2).
   - Sekolah menyertai pertandingan sebagai entiti dan menang, contohnya Sekolah Hijau anjuran Jabatan Alam Sekitar → 5.4.2 (Contoh 3).
   - Anugerah kecemerlangan peperiksaan kepada sekolah oleh PPD/JPN, contohnya Anugerah Cemerlang SPM Peringkat Daerah → 5.4.2 (Contoh 4).
   - Taraf Cemerlang SKPM Kualiti@Sekolah yang diverifikasi JN → TIDAK dikira (Contoh 5); kategori "Bukan pencapaian".
7. Contoh anugerah sekolah (Jadual 18, ms 57):
   - Antarabangsa: World's Best School Prize.
   - Kebangsaan: Digital Utilization Award (DUTA), AIA Healthiest Schools Awards.
   - Daerah: Anugerah Kualiti PPD — Sekolah Cemerlang Sukan, Sekolah Cemerlang Kokurikulum, Pengurusan Kaunseling, Pengurusan Sahsiah, Kualiti Kepimpinan, Pengurusan Pendidikan Khas, Pengurusan Sekolah Terbaik, Pengurusan SPBT, Kecemerlangan Pengurusan Kewangan; anugerah SPM/STPM (Peratus Calon Cemerlang Tertinggi, Lonjakan Saujana, Gred Purata Terbaik MP, Peningkatan GPS, PNGK Terbaik, 100% Lulus, Bil. Tertinggi Pencapaian Emas).
   - Selain senarai ini, pencapaian lain boleh dikira jika memenuhi peraturan di atas (nota Jadual 18).
8. Bukan pencapaian sekolah: sijil penghargaan kerana menjadi tuan rumah atau urus setia program, sijil penyertaan kursus/taklimat, surat jemputan, sijil murid/guru, dan dokumen yang bukan evidens.
9. Bidang (untuk borang SK@S), pilih satu: "Akademik" (peperiksaan, PdP), "Ko-Akademik" (pertandingan berasaskan mata pelajaran, inovasi, STEM), "Kokurikulum" (sukan, unit beruniform, kelab), "Hal Ehwal Murid" (sahsiah, kaunseling, disiplin, kebajikan), "Pengurusan Sekolah" (kepimpinan, kewangan, SPBT, pengurusan).
10. Evidens akhir mesti PDF dalam Google Drive DELIMa sekolah dengan akses "anyone with the link: viewer" dan dikongsi dengan Penyelaras SKPM Daerah (ms 58). Ingatkan dalam cadangan jika dokumen layak.

` + BAHAGIAN_DOKUMEN + `## Cara menilai
- Baca SEMUA teks dalam setiap dokumen: penerima, nama program/anugerah, penganjur, tarikh, peringkat, kedudukan/anugerah.
- "namaPenerima" ialah penerima seperti tertulis pada dokumen (sekolah, murid atau guru).
- Jangan reka maklumat. Gunakan hanya maklumat tersurat, maklumat daripada dokumen sokongan, atau inferens yang dibenarkan. Nama sekolah tidak termasuk dalam inferens yang dibenarkan.
- Keputusan:
  - "layak": jelas memenuhi semua peraturan 5.4.2 DAN sekolahSepadan = "sepadan".
  - "tidak_layak": jelas tidak memenuhi (sekolah lain, pencapaian murid/guru, taraf SKPM, salah tahun, peringkat sekolah, bukan evidens).
  - "perlu_semakan": maklumat penting (termasuk nama sekolah) tidak dapat disahkan daripada dokumen.
- Penerangan ditujukan kepada Pentadbir Sekolah: ringkas, jelas apa yang perlu dibuat seterusnya. Rujuk muka surat Panduan yang berkaitan.`;

// Skema keputusan yang dipulangkan kepada aplikasi SK@S
const MEDAN_GURU = ["namaPenerima", "program", "penganjur", "tarikh", "peringkat", "pingat", "tahap", "peranan"];
const MEDAN_SEKOLAH = ["namaPenerima", "program", "penganjur", "tarikh", "peringkat", "pingat", "tahap", "bidang"];
const MEDAN_SKEMA: Record<string, object> = {
  namaPenerima: { type: ["string", "null"] },
  program: { type: ["string", "null"] },
  penganjur: { type: ["string", "null"] },
  tarikh: { type: ["string", "null"], description: "YYYY-MM-DD jika lengkap, atau YYYY" },
  peringkat: { type: ["string", "null"], enum: ["Antarabangsa", "Kebangsaan", "Negeri", "Bahagian", "Daerah", "Sekolah", "Lain-lain", null] },
  pingat: { type: ["string", "null"], enum: ["Emas", "Perak", "Gangsa", null], description: "Tahap penilaian rubrik jika ada; bukan kedudukan" },
  tahap: { type: ["string", "null"], enum: ["Tempat Pertama / Anugerah / Pengiktirafan", "Tempat Kedua", "Tempat Ketiga", "Saguhati", "Penyertaan", null] },
  peranan: { type: ["string", "null"], enum: ["Peserta", "Jurulatih", "Penyelidik", "Penerima Anugerah", "Pembimbing Murid", "Urus Setia / AJK", "Penceramah / Fasilitator", "Lain-lain", null] },
  bidang: { type: ["string", "null"], enum: ["Akademik", "Ko-Akademik", "Kokurikulum", "Hal Ehwal Murid", "Pengurusan Sekolah", null] },
};

function skema(sekolah: boolean) {
  const medan = sekolah ? MEDAN_SEKOLAH : MEDAN_GURU;
  // Semakan sekolah: AI mesti nyatakan sama ada sekolah pengguna tertulis sebagai penerima
  const tambahan = sekolah
    ? {
        sekolahSepadan: { type: "string", enum: ["sepadan", "tidak_sepadan", "tiada"], description: "Adakah sekolah pengguna tertulis sebagai penerima" },
        namaSekolahDikesan: { type: ["string", "null"], description: "Nama sekolah penerima seperti tertulis" },
      }
    : {};
  return {
  type: "object",
  additionalProperties: false,
  required: ["dokumenSah", "keputusan", "kategori", "ringkasan", "penerangan", "maklumat", "asal", "semakan", "rujukan", "cadangan", "keyakinan", ...Object.keys(tambahan)],
  properties: {
    ...tambahan,
    dokumenSah: { type: "boolean", description: "true jika dokumen ialah sijil/surat/evidens yang boleh dibaca" },
    keputusan: { type: "string", enum: ["layak", "tidak_layak", "perlu_semakan"] },
    kategori: {
      type: "string",
      enum: ["Pencapaian Guru (5.4.1)", "Kekuatan Kami (A1)", "Pencapaian Sekolah (5.4.2)", "Pencapaian Murid", "Sumbangan", "Latihan / Kursus", "Bukan pencapaian"],
    },
    ringkasan: { type: "string", description: "Satu ayat keputusan untuk guru" },
    penerangan: { type: "string", description: "2–4 ayat menerangkan sebab keputusan" },
    maklumat: {
      type: "object",
      additionalProperties: false,
      required: medan,
      properties: Object.fromEntries(medan.map((k) => [k, MEDAN_SKEMA[k]])),
    },
    asal: {
      type: "object",
      additionalProperties: false,
      description: "Sumber setiap medan maklumat",
      required: medan,
      properties: Object.fromEntries(medan.map((k) => [k, { type: ["string", "null"], enum: ["sijil", "sokongan", "disimpulkan", null] }])),
    },
    semakan: {
      type: "array",
      description: "Senarai semakan kriteria satu per satu",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kriteria", "status", "nota"],
        properties: {
          kriteria: { type: "string" },
          status: { type: "string", enum: ["lulus", "gagal", "tidak_pasti"] },
          nota: { type: "string" },
        },
      },
    },
    rujukan: { type: "array", items: { type: "string" }, description: "Contoh: 'Panduan ms 54: peringkat yang diambil kira'" },
    cadangan: { type: "string", description: "Tindakan seterusnya untuk pengguna" },
    keyakinan: { type: "number", description: "0 hingga 1" },
  },
  };
}
const SKEMA_GURU = skema(false);
const SKEMA_SEKOLAH = skema(true);

const MAKS_DOKUMEN = 5;
type Dokumen = { fail?: string; mimeType?: string; namaFail?: string };
type Badan = { dokumen?: Dokumen[]; namaGuru?: string; jenis?: "guru" | "sekolah"; namaSekolah?: string; kodSekolah?: string };

export async function POST(req: NextRequest) {
  // Prototaip: hanya terima panggilan dari halaman portal sendiri (asal yang sama)
  const asal = req.headers.get("origin");
  if (asal && new URL(asal).host !== req.headers.get("host")) {
    return Response.json({ ralat: "Permintaan tidak dibenarkan." }, { status: 403 });
  }
  let badan: Badan;
  try {
    badan = await req.json();
  } catch {
    return Response.json({ ralat: "Data permintaan tidak sah." }, { status: 400 });
  }
  const { dokumen, namaGuru, namaSekolah, kodSekolah } = badan;
  const sekolah = badan.jenis === "sekolah";
  if (sekolah && !namaSekolah) {
    return Response.json({ ralat: "Nama sekolah pengguna diperlukan untuk semakan Pencapaian Sekolah." }, { status: 400 });
  }
  if (!Array.isArray(dokumen) || dokumen.length === 0) {
    return Response.json({ ralat: "Muat naik sekurang-kurangnya satu sijil." }, { status: 400 });
  }
  if (dokumen.length > MAKS_DOKUMEN) {
    return Response.json({ ralat: `Maksimum ${MAKS_DOKUMEN} fail bagi satu semakan.` }, { status: 400 });
  }
  const bersih = [];
  for (const d of dokumen) {
    const pdf = d.mimeType === "application/pdf";
    if (!d.fail || !d.mimeType || (!pdf && !JENIS_IMEJ.includes(d.mimeType as JenisImej))) {
      return Response.json({ ralat: "Muat naik gambar (JPG, PNG, WebP) atau fail PDF sahaja." }, { status: 400 });
    }
    bersih.push({ pdf, mimeType: d.mimeType, namaFail: d.namaFail, data: d.fail.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "") });
  }
  if (bersih.reduce((a, d) => a + (d.data.length * 3) / 4, 0) > SAIZ_MAKS) {
    return Response.json({ ralat: "Jumlah saiz fail melebihi 10MB. Kecilkan gambar atau mampatkan PDF." }, { status: 413 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ralat: "Perkhidmatan AI belum dikonfigurasi di pelayan (ANTHROPIC_API_KEY). Hubungi Unit ICT PPD Dalat." }, { status: 503 });
  }

  // Setiap dokumen dilabel sebelum kandungannya supaya AI tahu mana sijil utama dan mana sokongan
  const kandungan: Anthropic.Beta.Messages.BetaContentBlockParam[] = bersih.flatMap((d, i) => [
    { type: "text" as const, text: `Dokumen ${i + 1} — ${i === 0 ? "SIJIL UTAMA" : "DOKUMEN SOKONGAN"}${d.namaFail ? ` (fail: ${d.namaFail})` : ""}:` },
    d.pdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: d.data } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: d.mimeType as JenisImej, data: d.data } },
  ]);

  const skop = bersih.length > 1 ? `${bersih.length} dokumen di atas (1 sijil utama, ${bersih.length - 1} dokumen sokongan) sebagai SATU pencapaian` : "sijil di atas";

  try {
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: sekolah ? PANDUAN_SEKOLAH : PANDUAN_GURU, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: { type: "json_schema", schema: sekolah ? SKEMA_SEKOLAH : SKEMA_GURU } },
      messages: [
        {
          role: "user",
          content: [
            ...kandungan,
            {
              type: "text",
              text: sekolah
                ? `Semak ${skop}. Sekolah pengguna: ${namaSekolah}${kodSekolah ? ` (kod ${kodSekolah})` : ""}. Tentukan sama ada ia Pencapaian Sekolah 5.4.2 bagi tahun penilaian 2026 dengan sekolah ini sebagai penerima, tandakan sumber setiap maklumat, dan terangkan kepada Pentadbir Sekolah.`
                : `Semak ${skop}. Guru yang memuat naik: ${namaGuru || "tidak dinyatakan"}. Tentukan sama ada ia Pencapaian Guru 5.4.1 bagi tahun penilaian 2026, tandakan sumber setiap maklumat, dan terangkan kepada guru.`,
            },
          ],
        },
      ],
    });

    if (res.stop_reason === "refusal") {
      return Response.json({ ralat: "AI tidak dapat menyemak dokumen ini. Cuba muat naik semula atau semak secara manual." }, { status: 422 });
    }
    const teks = res.content.find((b) => b.type === "text");
    if (!teks || teks.type !== "text") {
      return Response.json({ ralat: "Tiada keputusan diterima daripada AI." }, { status: 502 });
    }
    return Response.json({ hasil: JSON.parse(teks.text), model: res.model });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ ralat: "Terlalu banyak semakan serentak. Cuba lagi sebentar." }, { status: 429 });
    }
    if (err instanceof Anthropic.BadRequestError) {
      return Response.json({ ralat: "Fail tidak dapat diproses oleh AI (mungkin rosak atau dilindungi kata laluan)." }, { status: 400 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json({ ralat: "Perkhidmatan AI tidak dapat dihubungi. Cuba lagi sebentar." }, { status: 502 });
    }
    if (err instanceof SyntaxError) {
      return Response.json({ ralat: "Keputusan AI tidak dapat dibaca. Cuba lagi." }, { status: 502 });
    }
    throw err;
  }
}
