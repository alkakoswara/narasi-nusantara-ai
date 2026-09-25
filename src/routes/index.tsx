import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AlertBanner } from "@/components/AlertBanner";
import { StatCard } from "@/components/StatCard";
import { useSurveilans } from "@/lib/store";
import {
  hitungDalamRentang,
  kasusValid,
  perPenyakit,
  perUmur,
  rataKeterlambatan,
  statusPerDesa,
  tren,
} from "@/lib/analitik";
import { TANGGAL_ACUAN } from "@/data/dataset";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Surveilans Real-time | SIGAP Sentosa" },
      {
        name: "description",
        content:
          "Dashboard harian kasus DBD, diare, chikungunya, dan hepatitis A di 8 desa Kabupaten Sehat Sentosa dengan alert otomatis berbasis ambang kasus.",
      },
      { property: "og:title", content: "Dashboard Surveilans Real-time | SIGAP Sentosa" },
      {
        property: "og:description",
        content:
          "Pantau tren kasus harian, sebaran wilayah, dan alert KLB otomatis dalam satu layar.",
      },
    ],
  }),
  component: Dashboard,
});

const WARNA = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

function Dashboard() {
  const { kasus } = useSurveilans();

  const d = useMemo(() => {
    const valid = kasusValid(kasus);
    const m1 = hitungDalamRentang(valid, 7);
    const m0 = hitungDalamRentang(valid, 7, 7);
    return {
      valid,
      m1,
      m0,
      delta: m0.length ? Math.round(((m1.length - m0.length) / m0.length) * 100) : 0,
      status: statusPerDesa(valid),
      tren28: tren(valid, 28),
      penyakit: perPenyakit(m1),
      umur: perUmur(m1),
      lag: rataKeterlambatan(hitungDalamRentang(valid, 14)),
      menunggu: kasus.filter(
        (k) => k.sumber === "Warga" && (k.status === "Baru" || k.status === "Investigasi"),
      ).length,
    };
  }, [kasus]);

  const jumlahKLB = d.status.filter((s) => s.level === "KLB").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="pulse-dot size-1.5 rounded-full bg-primary" />
          Data masuk real-time · per {TANGGAL_ACUAN}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold sm:text-4xl">
          Dari pelaporan reaktif menjadi{" "}
          <span className="text-gradient">peringatan dini wabah</span> di Kabupaten Sehat Sentosa
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          25 puskesmas, 12 rumah sakit, 150+ pos pembantu, dan 1,5 juta penduduk dalam satu
          layar: kasus terkonfirmasi dari puskesmas, laporan gejala dari warga, sebaran spasial,
          dan alert otomatis saat sebuah desa melewati ambang.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/peta"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Lihat peta & alert <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/analisis"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary/70"
          >
            <Sparkles className="size-4 text-primary" /> Analisis naratif AI
          </Link>
          <Link
            to="/lapor"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Warga lapor gejala
          </Link>
        </div>
      </section>

      <AlertBanner status={d.status} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Kasus 7 hari terakhir"
          nilai={d.m1.length}
          keterangan={`${d.delta >= 0 ? "+" : ""}${d.delta}% dibanding 7 hari sebelumnya (${d.m0.length} kasus)`}
          nada={d.delta > 25 ? "bahaya" : d.delta > 0 ? "waspada" : "baik"}
        />
        <StatCard
          icon={TrendingUp}
          label="Desa status KLB"
          nilai={jumlahKLB}
          satuan={`/ ${d.status.length} desa`}
          keterangan={jumlahKLB ? "Alert otomatis sudah terkirim" : "Tidak ada ambang terlampaui"}
          nada={jumlahKLB ? "bahaya" : "baik"}
        />
        <StatCard
          icon={Clock}
          label="Rata-rata keterlambatan lapor"
          nilai={d.lag}
          satuan="hari"
          keterangan="Selisih tanggal onset ke tanggal lapor (14 hari terakhir)"
          nada={d.lag <= 1 ? "baik" : "waspada"}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Laporan warga menunggu verifikasi"
          nilai={d.menunggu}
          keterangan="Belum dihitung sebagai kasus sampai diverifikasi petugas"
          nada={d.menunggu > 20 ? "waspada" : "netral"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Tren kasus harian (28 hari)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Berdasarkan tanggal onset gejala, hanya kasus terverifikasi/terkonfirmasi.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.tren28}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total kasus"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#gTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="DBD"
                  stroke="var(--color-chart-4)"
                  strokeWidth={1.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-semibold">Komposisi penyakit (7 hari)</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.penyakit}
                  dataKey="jumlah"
                  nameKey="penyakit"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {d.penyakit.map((_, i) => (
                    <Cell key={i} fill={WARNA[i % WARNA.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-sm">
            {d.penyakit.map((p, i) => (
              <li key={p.penyakit} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: WARNA[i % WARNA.length] }}
                />
                <span className="flex-1">{p.penyakit}</span>
                <span className="font-mono text-xs text-muted-foreground">{p.jumlah}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4 text-primary" /> Kelompok umur (7 hari)
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.umur}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="kelompok" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="jumlah" name="Kasus" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel overflow-hidden p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Status per desa (7 hari terakhir)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Desa</th>
                  <th className="py-2 pr-3">Kasus</th>
                  <th className="py-2 pr-3">Baseline</th>
                  <th className="py-2 pr-3">Rasio</th>
                  <th className="py-2 pr-3">Insidensi</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.status.map((s) => (
                  <tr key={s.kode} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{s.desa}</span>
                      <span className="block text-xs text-muted-foreground">{s.kecamatan}</span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono">{s.mingguIni}</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{s.rataBaseline}</td>
                    <td className="py-2.5 pr-3 font-mono">{s.rasio}x</td>
                    <td className="py-2.5 pr-3 font-mono text-muted-foreground">{s.insidensi}</td>
                    <td className="py-2.5">
                      <LevelBadge level={s.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export function LevelBadge({ level }: { level: "Aman" | "Waspada" | "KLB" }) {
  const kelas =
    level === "KLB"
      ? "bg-destructive/15 text-destructive border-destructive/40"
      : level === "Waspada"
        ? "bg-warning/15 text-warning border-warning/40"
        : "bg-success/15 text-success border-success/40";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${kelas}`}>
      {level}
    </span>
  );
}
