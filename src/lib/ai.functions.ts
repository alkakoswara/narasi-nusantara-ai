import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const skema = z.object({
  ringkasan: z.string().min(2).max(20000),
  pertanyaan: z.string().max(500).optional(),
});

const SYSTEM = `Anda adalah epidemiolog lapangan senior yang mendampingi Dinas Kesehatan Kabupaten Sehat Sentosa (Indonesia).
Tugas Anda: membaca ringkasan data surveilans sintetis dan menulis ANALISIS NARATIF dalam Bahasa Indonesia yang tajam, ringkas, dan langsung dapat dipakai untuk mengambil keputusan lapangan.

Format jawaban (gunakan markdown sederhana dengan judul tebal):
**1. Situasi Terkini** — 2-3 kalimat.
**2. Sinyal Peringatan Dini** — desa/kecamatan yang melewati ambang, sebutkan angka (kasus 7 hari, baseline, rasio, insidensi/100.000).
**3. Interpretasi Epidemiologis** — kemungkinan penyebab, kelompok umur berisiko, pola penyakit dominan.
**4. Rekomendasi Aksi 72 Jam** — daftar bernomor, prioritas per desa (PE, fogging/larvasidasi, edukasi, logistik), sebut siapa pelaksananya.
**5. Catatan Kualitas Data** — keterlambatan lapor, laporan warga belum terverifikasi, keterbatasan.

Aturan: jangan menyebut identitas individu; ingatkan bahwa data pelapor warga bersifat sensitif (UU PDP) bila relevan; jangan mengarang angka di luar data; maksimal ~450 kata.`;

export const analisisNaratif = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => skema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "Kunci GROQ_API_KEY belum tersedia di server. Simpan kunci API Groq terlebih dahulu.",
      };
    }

    const model = process.env["GROQ_MODEL"] || "llama-3.3-70b-versatile";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `Ringkasan data surveilans (JSON):\n${data.ringkasan}\n\n` +
              (data.pertanyaan
                ? `Pertanyaan khusus dari pengguna: ${data.pertanyaan}`
                : "Tulis analisis naratif lengkap sesuai format."),
          },
        ],
      }),
    });

    if (!res.ok) {
      const teks = await res.text();
      let pesan = `Groq menolak permintaan (HTTP ${res.status}).`;
      if (res.status === 401) pesan = "Kunci API Groq tidak valid atau sudah dicabut.";
      if (res.status === 429) pesan = "Batas permintaan Groq tercapai. Coba lagi beberapa saat.";
      if (res.status === 404) pesan = `Model "${model}" tidak tersedia di akun Groq ini.`;
      return { ok: false as const, error: pesan, detail: teks.slice(0, 500) };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };
    const teks = json.choices?.[0]?.message?.content?.trim();
    if (!teks) {
      return { ok: false as const, error: "Groq mengembalikan jawaban kosong." };
    }

    return { ok: true as const, teks, model: json.model ?? model };
  });
