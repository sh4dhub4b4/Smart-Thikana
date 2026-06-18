import { getSupabaseClient } from "./client";
import type { Kyc } from "../types";

export async function fetchKyc(userId: string): Promise<Kyc | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("kyc").select("*").eq("user_id", userId).maybeSingle();
  return data as Kyc | null;
}

export async function uploadKycDocument(
  userId: string,
  field: "nid_front" | "nid_back" | "selfie",
  uri: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const filename = `${field}-${Date.now()}.jpg`;
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: filename,
  } as any);

  const { data: uploadData, error } = await supabase.storage
    .from("kyc-docs")
    .upload(`${userId}/${filename}`, formData, {
      contentType: "image/jpeg",
    });

  if (error) return null;

  const { data: urlData } = supabase.storage
    .from("kyc-docs")
    .getPublicUrl(`${userId}/${filename}`);

  return urlData.publicUrl;
}

export async function upsertKyc(
  userId: string,
  nidNumber: string,
  nidFrontUrl?: string,
  nidBackUrl?: string,
  selfieUrl?: string
): Promise<Kyc | null> {
  const supabase = getSupabaseClient();
  const existing = await fetchKyc(userId);
  const payload: any = { user_id: userId, nid_number: nidNumber, status: "pending" };
  if (nidFrontUrl) payload.nid_front_url = nidFrontUrl;
  if (nidBackUrl) payload.nid_back_url = nidBackUrl;
  if (selfieUrl) payload.selfie_url = selfieUrl;

  if (existing) {
    const { data } = await supabase.from("kyc").update(payload).eq("user_id", userId).select().single();
    return data as Kyc | null;
  } else {
    const { data } = await supabase.from("kyc").insert(payload).select().single();
    return data as Kyc | null;
  }
}
