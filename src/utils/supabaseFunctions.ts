import { resolveSupabaseConfig } from "../lib/supabaseEnv";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
};

type UpdateUserProfileResponse = {
  success: boolean;
  user: any;
  error?: string;
};

type GetUserProfileResponse = {
  success: boolean;
  user: any;
  services?: any[];
  reviews?: any[];
  error?: string;
};

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabaseConfig();

function buildHeaders(rawHeaders?: HeadersInit, hasBody?: boolean): Headers {
  const headers = new Headers(rawHeaders);

  headers.set("apikey", supabaseAnonKey);
  headers.set("Authorization", `Bearer ${supabaseAnonKey}`);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function callSupabaseFunction<T>(path: string, options: RequestOptions = {}): Promise<{
  response: Response;
  data: T | null;
}> {
  const { headers: rawHeaders, body, ...rest } = options;

  const headers = buildHeaders(rawHeaders, typeof body !== "undefined");

  const response = await fetch(`${supabaseUrl}/functions/v1/${path}`, {
    ...rest,
    headers,
    body,
  });

  const text = await response.text();
  let data: T | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse response from ${path}`);
    }
  }

  return { response, data };
}

export async function fetchUserProfileById(userId: string) {
  const path = `get-user-profile?id=${encodeURIComponent(userId)}`;

  const { response, data } = await callSupabaseFunction<GetUserProfileResponse>(path, {
    method: "GET",
  });

  if (!data) {
    throw new Error("Failed to load user profile");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to load user profile");
  }

  return data;
}

export async function updateUserProfile(payload: Record<string, unknown>) {
  const { response, data } = await callSupabaseFunction<UpdateUserProfileResponse>(
    "update-user-profile",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!data) {
    throw new Error("Failed to update profile");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to update profile");
  }

  return data.user;
}

