import { getSupabaseClient } from "./client";
import type { Profile } from "../types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  return data as Profile | null;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const formData = new FormData();
  const filename = `avatar-${Date.now()}.jpg`;
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: filename,
  } as any);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(`${userId}/${filename}`, formData, {
      contentType: "image/jpeg",
    });

  if (uploadError) return null;

  const { data: urlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(`${userId}/${filename}`);

  await updateProfile(userId, { avatar_url: urlData.publicUrl });
  return urlData.publicUrl;
}
