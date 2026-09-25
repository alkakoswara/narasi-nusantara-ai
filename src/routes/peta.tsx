import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Siren } from "lucide-react";

import { AlertBanner } from "@/components/AlertBanner";
import { LevelBadge } from "@/components/LevelBadge";
import { useSurveilans } from "@/lib/store";
import { hitungDalamRentang, kasusValid, statusPerDesa, type StatusDesa } from "@/lib/analitik";
import { DESA } from "@/data/dataset";

export const Route = createFileRoute("/peta")({
  head: () => ({
    meta: [
      { title: "Peta Sebaran & Alert Otomatis | SIGAP Sentosa" },
      {
        name: "description",
        content:
          "Peta kepadatan kasus per desa dan kecamatan untuk memprioritaskan penyelidikan epidemiologi, fogging, edukasi, dan logistik.",
      },
      { property: "og:title", content: "Peta Sebaran & Alert Otomatis | SIGAP Sentosa" },
      {
        property: "og:description",
        content: "Kepadatan kasus per desa dengan ambang alert otomatis dan prioritas respons.",
      },
    ],
  }),
  component: Peta,
});

const PAD = 56;
const W = 760;
const H = 520;

function Peta() {
  const { kasus } = useSurveilans();
  const [aktif, setAktif] = useState<string | null>(null);

  const status = useMemo(() => statusPerDesa(kasusValid(kasus)), [kasus]);
  const mingguIni = useMemo(() => hitungDalamRentang(kasusValid(kasus), 7), [kasus]);

  const lats = DESA.map((d) => d.lat);
  const lons = DESA.map((d) => d.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const pos = (lat: number, lon: number) => ({
    x: PAD + ((lon - minLon) / (maxLon - minLon)) * (W - PAD * 2),
    y: PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - PAD * 2),
  });

  const maks = Math.max(...status.map((s) => s.mingguIni), 1);
  const dipilih = status.find((s) => s.kode === aktif) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Peta sebaran & alert otomatis</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ukuran gelembung mewakili jumlah kasus 7 hari terakhir; warna mewakili status ambang.
          Klik desa untuk melihat rincian dan rekomendasi prioritas respons.
        </p>
      </header>

      <AlertBanner status={status} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="panel p-4">
          <div className="flex flex-wrap items-center gap-4 px-2 pb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive" /> KLB
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-warning" /> Waspada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-success" /> Aman
            </span>
            <span className="ml-auto">Kabupaten Sehat Sentosa · 4 kecamatan · 8 desa</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-background/50">
            <defs>
              <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
                <path d="M 38 0 L 0 0 0 38" fill="none" stroke="var(--color-border)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />
            <path
              d={`M40,${H - 120} C180,${H - 190} 300,${H - 60} 470,${H - 130} S680,${H - 210} ${W - 30},${H - 150}`}
              fill="none"
              stroke="var(--color-chart-3)"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
            <text x={W - 150} y={H - 130} fill="var(--color-muted-foreground)" fontSize="11">
              Sungai Cisentosa
            </text>

            {status.map((s) => {
              const { x, y } = pos(s.lat, s.lon);
              const r = 14 + (s.mingguIni / maks) * 34;
              const warna =
                s.level === "KLB"
                  ? "var(--color-destructive)"
                  : s.level === "Waspada"
                    ? "var(--color-warning)"
                    : "var(--color-success)";
              return (
                <g key={s.kode} onClick={() => setAktif(s.kode)} style={{ cursor: "pointer" }}>
                  {s.level === "KLB" && (
                    <circle cx={x} cy={y} r={r + 12} fill={warna} opacity={0.12} className="pulse-dot" />
                  )}
                  <circle cx={x} cy={y} r={r} fill={warna} opacity={aktif === s.kode ? 0.55 : 0.32} />
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill="none"
                    stroke={warna}
                    strokeWidth={aktif === s.kode ? 3 : 1.5}
                  />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-foreground)">
                    {s.mingguIni}
                  </text>
                  <text x={x} y={y + r + 16} textAnchor="middle" fontSize="11" fill="var(--color-muted-foreground)">
                    {s.desa}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {dipilih ? (
            <RincianDesa s={dipilih} jumlahPenyakit={rangkumPenyakit(mingguIni, dipilih.desa)} />
          ) : (
            <div className="panel p-5 text-sm text-muted-foreground">
              <MapPin className="mb-2 size-5 text-primary" />
              Pilih salah satu desa di peta untuk melihat rincian kasus, ambang, dan rekomendasi
              tindakan.
            </div>
          )}

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Siren className="size-4 text-warning" /> Logika ambang alert
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Baseline:</strong> rata-rata kasus mingguan
                pada 3 minggu sebelumnya per desa.
              </li>
              <li>
                <strong className="text-destructive">KLB:</strong> kasus 7 hari ≥ 2x baseline dan
                ≥ 10 kasus, atau insidensi ≥ 50/100.000 penduduk/minggu.
              </li>
              <li>
                <strong className="text-warning">Waspada:</strong> kasus 7 hari ≥ 1,5x baseline
                dan ≥ 5 kasus.
              </li>
              <li>
                Ambang minimum absolut dipakai agar desa kecil tidak memicu alert palsu —
                mengurangi kelelahan alert (alert fatigue).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function rangkumPenyakit(kasus: ReturnType<typeof hitungDalamRentang>, desa: string) {
  const map = new Map<string, number>();
  for (const k of kasus.filter((k) => k.desa === desa)) {
    map.set(k.penyakit, (map.get(k.penyakit) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function RincianDesa({ s, jumlahPenyakit }: { s: StatusDesa; jumlahPenyakit: [string, number][] }) {
  const aksi =
    s.level === "KLB"
      ? [
          "Penyelidikan epidemiologi (PE) dalam 1x24 jam oleh tim surveilans + petugas puskesmas.",
          "Fogging fokus radius 100 m dari kasus indeks, disertai larvasidasi dan PSN 3M Plus.",
          "Aktivasi kader untuk pemantauan jentik dan penemuan kasus aktif rumah ke rumah.",
          "Siapkan logistik: RDT/NS1, cairan infus, rujukan RS terdekat.",
        ]
      : s.level === "Waspada"
        ? [
            "Pantau harian 48 jam; verifikasi cepat laporan warga yang masuk.",
            "Edukasi PSN lewat kader dan grup RT/RW.",
            "Siapkan tim PE agar bisa bergerak jika ambang KLB terlampaui.",
          ]
        : ["Lanjutkan pelaporan rutin harian dari puskesmas dan pos pembantu."];

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Desa {s.desa}</h2>
          <p className="text-xs text-muted-foreground">
            Kec. {s.kecamatan} · {s.puskesmas} · {s.penduduk.toLocaleString("id-ID")} jiwa
          </p>
        </div>
        <LevelBadge level={s.level} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Kasus 7 hari" nilai={String(s.mingguIni)} />
        <Info label="Baseline mingguan" nilai={s.rataBaseline.toFixed(1)} />
        <Info label="Rasio" nilai={`${s.rasio}x`} />
        <Info label="Insidensi/100.000" nilai={s.insidensi.toFixed(1)} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{s.alasan}</p>

      {jumlahPenyakit.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Penyakit dominan: </span>
          {jumlahPenyakit.map(([p, n]) => `${p} (${n})`).join(", ")}
        </p>
      )}

      <h3 className="mt-4 text-sm font-semibold">Rekomendasi prioritas</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        {aksi.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ol>
    </div>
  );
}

function Info({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold leading-none">{nilai}</p>
    </div>
  );
}
