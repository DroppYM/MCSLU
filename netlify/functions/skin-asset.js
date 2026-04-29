import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 1] || "");

  if (!username || username === "skin-asset") {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore("skins");
  const blob = await store.get(`${username.toLowerCase()}.png`, { type: "arrayBuffer" });

  if (!blob) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = {
  path: "/.netlify/functions/skin-asset/:username",
};
