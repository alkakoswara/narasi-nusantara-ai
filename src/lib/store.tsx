import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DATASET_AWAL, type Kasus } from "@/data/dataset";

interface Ctx {
  kasus: Kasus[];
  tambah: (k: Omit<Kasus, "id">) => Kasus;
  ubahStatus: (id: string, status: Kasus["status"]) => void;
  reset: () => void;
}

const SurveilansContext = createContext<Ctx | null>(null);

export function SurveilansProvider({ children }: { children: ReactNode }) {
  const [kasus, setKasus] = useState<Kasus[]>(() => DATASET_AWAL);

  const tambah = useCallback((k: Omit<Kasus, "id">) => {
    const baru: Kasus = { ...k, id: `SS-${Date.now().toString().slice(-6)}` };
    setKasus((prev) => [baru, ...prev]);
    return baru;
  }, []);

  const ubahStatus = useCallback((id: string, status: Kasus["status"]) => {
    setKasus((prev) => prev.map((k) => (k.id === id ? { ...k, status } : k)));
  }, []);

  const reset = useCallback(() => setKasus(DATASET_AWAL), []);

  const value = useMemo(() => ({ kasus, tambah, ubahStatus, reset }), [kasus, tambah, ubahStatus, reset]);

  return <SurveilansContext.Provider value={value}>{children}</SurveilansContext.Provider>;
}

export function useSurveilans() {
  const ctx = useContext(SurveilansContext);
  if (!ctx) throw new Error("useSurveilans harus dipakai di dalam SurveilansProvider");
  return ctx;
}
