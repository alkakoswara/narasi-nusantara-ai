// Dataset sintetis surveilans penyakit — Kabupaten Sehat Sentosa (fiktif, Indonesia).
// Struktur & variabel meniru dataset surveilans DBD/diare Indonesia yang umum
// dipublikasikan (mis. dataset "Indonesia Dengue Cases" di Kaggle: wilayah,
// tanggal, jumlah kasus, kelompok umur), namun SELURUH baris di sini sintetis
// sesuai batasan case pack (use synthetic data only).

export type Penyakit = "DBD" | "Diare" | "Chikungunya" | "Hepatitis A";

export type StatusKasus = "Baru" | "Investigasi" | "Terverifikasi" | "Selesai" | "Ditolak";

export type Sumber = "Puskesmas" | "Warga";

export interface Desa {
  kode: string;
  nama: string;
  kecamatan: string;
  puskesmas: string;
  penduduk: number;
  lat: number;
  lon: number;
}

export interface Kasus {
  id: string;
  penyakit: Penyakit;
  tanggalOnset: string; // ISO yyyy-mm-dd
  tanggalLapor: string; // ISO yyyy-mm-dd
  puskesmas: string;
  kodeDesa: string;
  desa: string;
  kecamatan: string;
  kelompokUmur: KelompokUmur;
  jenisKelamin: "L" | "P";
  status: StatusKasus;
  sumber: Sumber;
  gejala: string[];
  catatan?: string;
}

export type KelompokUmur = "0-4" | "5-14" | "15-44" | "45-64" | "65+";

export const KELOMPOK_UMUR: KelompokUmur[] = ["0-4", "5-14", "15-44", "45-64", "65+"];
export const PENYAKIT: Penyakit[] = ["DBD", "Diare", "Chikungunya", "Hepatitis A"];

export const GEJALA_UMUM = [
  "Demam",
  "Nyeri otot",
  "Mual / muntah",
  "Diare",
  "Ruam kulit",
  "Nyeri sendi",
  "Mata kuning",
  "Sakit kepala",
  "Bintik merah",
];

export const DESA: Desa[] = [
  {
    kode: "3204010001",
    nama: "Sukamaju",
    kecamatan: "Sentosa Utara",
    puskesmas: "Puskesmas Sentosa Utara",
    penduduk: 18400,
    lat: -6.9312,
    lon: 107.6098,
  },
  {
    kode: "3204010002",
    nama: "Cikoneng",
    kecamatan: "Sentosa Utara",
    puskesmas: "Puskesmas Sentosa Utara",
    penduduk: 12100,
    lat: -6.9188,
    lon: 107.6321,
  },
  {
    kode: "3204020003",
    nama: "Mekarsari",
    kecamatan: "Sentosa Timur",
    puskesmas: "Puskesmas Mekarsari",
    penduduk: 15600,
    lat: -6.9455,
    lon: 107.6612,
  },
  {
    kode: "3204020004",
    nama: "Babakan Jaya",
    kecamatan: "Sentosa Timur",
    puskesmas: "Puskesmas Mekarsari",
    penduduk: 9800,
    lat: -6.9601,
    lon: 107.6489,
  },
  {
    kode: "3204030005",
    nama: "Rancaekek Girang",
    kecamatan: "Sentosa Selatan",
    puskesmas: "Puskesmas Rancaekek",
    penduduk: 21300,
    lat: -6.9844,
    lon: 107.6075,
  },
  {
    kode: "3204030006",
    nama: "Panyileukan",
    kecamatan: "Sentosa Selatan",
    puskesmas: "Puskesmas Rancaekek",
    penduduk: 11200,
    lat: -6.9738,
    lon: 107.5852,
  },
  {
    kode: "3204040007",
    nama: "Cilame",
    kecamatan: "Sentosa Barat",
    puskesmas: "Puskesmas Cilame",
    penduduk: 14500,
    lat: -6.9256,
    lon: 107.5661,
  },
  {
    kode: "3204040008",
    nama: "Tanjungwangi",
    kecamatan: "Sentosa Barat",
    puskesmas: "Puskesmas Cilame",
    penduduk: 8700,
    lat: -6.9042,
    lon: 107.5794,
  },
];

// ---------- PRNG deterministik (mulberry32) agar data stabil di server & klien ----------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tanggal acuan dataset (tetap, agar demo konsisten). */
export const TANGGAL_ACUAN = "2026-09-25";
export const JUMLAH_HARI = 42;

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

const GEJALA_PER_PENYAKIT: Record<Penyakit, string[]> = {
  DBD: ["Demam", "Nyeri otot", "Bintik merah", "Sakit kepala"],
  Diare: ["Diare", "Mual / muntah", "Demam"],
  Chikungunya: ["Demam", "Nyeri sendi", "Ruam kulit"],
  "Hepatitis A": ["Mata kuning", "Mual / muntah", "Demam"],
};

/** Intensitas dasar kasus per desa per hari. */
const BASE: Record<string, number> = {
  Sukamaju: 1.1,
  Cikoneng: 0.5,
  Mekarsari: 0.7,
  "Babakan Jaya": 0.35,
  "Rancaekek Girang": 0.9,
  Panyileukan: 0.4,
  Cilame": 0.5,
  Tanjungwangi: 0.3,
};

export function buatDataset(): Kasus[] {
  const r = rng(20260925);
  const kasus: Kasus[] = [];
  let n = 1;

  for (let hari = JUMLAH_HARI - 1; hari >= 0; hari--) {
    const tanggal = addDays(TANGGAL_ACUAN, -hari);
    const hariKe = JUMLAH_HARI - 1 - hari; // 0 = paling lama

    for (const desa of DESA) {
      let lambda = BASE[desa.nama] ?? 0.5;

      // Lonjakan yang direkayasa: Sukamaju melewati ambang pada 12 hari terakhir.
      if (desa.nama === "Sukamaju" && hariKe >= JUMLAH_HARI - 12) {
        lambda *= 3.4 + (hariKe - (JUMLAH_HARI - 12)) * 0.35;
      }
      // Kenaikan sedang di Rancaekek Girang (kandidat waspada).
      if (desa.nama === "Rancaekek Girang" && hariKe >= JUMLAH_HARI - 8) {
        lambda *= 1.9;
      }

      const jumlah = Math.floor(lambda + r() * lambda * 1.4);
      for (let i = 0; i < jumlah; i++) {
        const penyakit: Penyakit =
          desa.nama === "Sukamaju" && hariKe >= JUMLAH_HARI - 12
            ? r() < 0.82
              ? "DBD"
              : pick(r, PENYAKIT)
            : r() < 0.45
              ? "DBD"
              : r() < 0.75
                ? "Diare"
                : r() < 0.9
                  ? "Chikungunya"
                  : "Hepatitis A";

        const lagLapor = r() < 0.7 ? 0 : r() < 0.9 ? 1 : 2;
        const sumber: Sumber = r() < 0.72 ? "Puskesmas" : "Warga";
        const status: StatusKasus =
          sumber === "Warga"
            ? r() < 0.55
              ? "Terverifikasi"
              : r() < 0.8
                ? "Investigasi"
                : r() < 0.92
                  ? "Baru"
                  : "Ditolak"
            : r() < 0.6
              ? "Terverifikasi"
              : r() < 0.85
                ? "Selesai"
                : "Investigasi";

        const umur: KelompokUmur =
          penyakit === "DBD"
            ? r() < 0.42
              ? "5-14"
              : r() < 0.7
                ? "15-44"
                : pick(r, KELOMPOK_UMUR)
            : penyakit === "Diare"
              ? r() < 0.45
                ? "0-4"
                : pick(r, KELOMPOK_UMUR)
              : pick(r, KELOMPOK_UMUR);

        kasus.push({
          id: `SS-${String(n++).padStart(5, "0")}`,
          penyakit,
          tanggalOnset: tanggal,
          tanggalLapor: addDays(tanggal, lagLapor),
          puskesmas: desa.puskesmas,
          kodeDesa: desa.kode,
          desa: desa.nama,
          kecamatan: desa.kecamatan,
          kelompokUmur: umur,
          jenisKelamin: r() < 0.5 ? "L" : "P",
          status,
          sumber,
          gejala: GEJALA_PER_PENYAKIT[penyakit].slice(0, 2 + Math.floor(r() * 2)),
        });
      }
    }
  }

  return kasus;
}

export const DATASET_AWAL = buatDataset();
