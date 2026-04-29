import { getStore } from "@netlify/blobs";

const STEVE_FALLBACK =
  "https://textures.minecraft.net/texture/1a4af718455edc43147ba26ec979f048cfc06d15799981e14934bc7e46";

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });

export default async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username =
    url.searchParams.get("username") || segments[segments.length - 1];

  if (!username || username === "get-skin") {
    return json(400, { error: "username is required" });
  }

  try {
    const profileRes = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
    );

    if (profileRes.status === 200) {
      const profile = await profileRes.json();
      const sessionRes = await fetch(
        `https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`,
      );

      if (sessionRes.ok) {
        const session = await sessionRes.json();
        const texturesProp = session.properties?.find((p) => p.name === "textures");
        if (texturesProp) {
          const decoded = JSON.parse(
            Buffer.from(texturesProp.value, "base64").toString("utf-8"),
          );
          const skinUrl = decoded?.textures?.SKIN?.url;
          if (skinUrl) {
            return json(200, {
              username: profile.name || username,
              skins: { default: skinUrl },
              source: "mojang",
            });
          }
        }
      }
    }
  } catch (err) {
    // fall through to blob/Steve lookup
  }

  const customStore = getStore("skins");
  const customKey = `${username.toLowerCase()}.png`;
  const customMeta = await customStore.getMetadata(customKey);
  if (customMeta) {
    const customUrl = `${url.origin}/.netlify/functions/skin-asset/${encodeURIComponent(
      username.toLowerCase(),
    )}`;
    return json(200, {
      username,
      skins: { default: customUrl },
      source: "custom",
    });
  }

  return json(200, {
    username,
    skins: { default: STEVE_FALLBACK },
    source: "fallback",
  });
};

export const config = {
  path: ["/.netlify/functions/get-skin", "/.netlify/functions/get-skin/:username"],
};
