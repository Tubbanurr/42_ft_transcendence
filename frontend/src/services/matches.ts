import { api } from "@/services/api";

export async function fetchMyMatches() {
  try {
    const response = await api.get<{ count: number; matches: any[] }>("/tournaments/my-matches");

    if (!response) throw new Error("Beklenmeyen API cevabı");

    return response;
  } catch (err) {
    console.error("❌ fetchMyMatches hata:", err);
    throw new Error("Maçlar yüklenemedi");
  }
}
