import { getStore } from "@netlify/blobs";

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

const sanitize = (name) => name.toLowerCase().replace(/[^a-z0-9_]/g, "");

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return json(400, { error: "Expected multipart/form-data" });
  }

  const rawUsername = formData.get("username");
  const file = formData.get("skin");

  if (typeof rawUsername !== "string" || !rawUsername.trim()) {
    return json(400, { error: "username is required" });
  }
  if (!(file instanceof File)) {
    return json(400, { error: "skin file is required" });
  }
  if (file.type && file.type !== "image/png") {
    return json(400, { error: "skin must be a PNG" });
  }
  if (file.size > 1_000_000) {
    return json(413, { error: "skin file too large" });
  }

  const username = sanitize(rawUsername.trim());
  if (!username) {
    return json(400, { error: "invalid username" });
  }

  const store = getStore("skins");
  const buffer = await file.arrayBuffer();
  await store.set(`${username}.png`, buffer);

  return json(200, {
    username,
    skins: {
      default: `${new URL(req.url).origin}/.netlify/functions/skin-asset/${username}`,
    },
  });
};

export const config = {
  path: "/.netlify/functions/upload-skin",
};
