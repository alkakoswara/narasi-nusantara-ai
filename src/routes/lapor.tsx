import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Lock, ShieldAlert, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { useSurveilans } from "@/lib/store";
import { DESA, GEJALA_UMUM, KELOMPOK_UMUR, TANGGAL_ACUAN, type KelompokUmur } from "@/data/dataset";

export const Route = createFileRoute("/lapor")({
  head: () => ({
    meta: [
      { title: "Lapor Gejala (Kanal Warga) | SIGAP Sentosa" },
      {
        name: "description",
        content:
          "Kanal pelaporan gejala oleh warga: cukup 4 langkah, tanpa nama wajib, dan diverifikasi petugas sebelum dihitung sebagai kasus.",
      },
      { property: "og:title", content: "Lapor Gejala (Kanal Warga) | SIGAP Sentosa" },
      {
        property: "og:description",
        content: "Laporkan demam, diare, atau kluster keluhan di keluarga Anda dalam 1 menit.",
      },
    ],
  }),
  component: LaporWarga;
});

function LaporWarga() {
  return null;
}
