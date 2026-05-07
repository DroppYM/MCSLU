export default async function handler(req, res) {
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: "Username required" });
  
  const username = user.replace('.json', '');

  // --- 1. TRY ELY.BY ---
  try {
    const elyRes = await fetch(`https://skinsystem.ely.by/profiles/${username}`);
    if (elyRes.ok) {
      const data = await elyRes.json();
      if (data.skins?.default) {
        return sendResponse(res, username, data.skins.default, "Ely.by");
      }
    }
  } catch (e) {}

  // --- 2. TRY TLAUNCHER ---
  const tlUrl = `http://auth.tlauncher.org/skin/profile/texture/login/${username}`;
  try {
    const tlRes = await fetch(tlUrl, { method: 'HEAD' });
    if (tlRes.ok) {
      return sendResponse(res, username, tlUrl, "TLauncher");
    }
  } catch (e) {}

  // --- 3. TRY CSL SERVICES (LittleSkin, Blessing, SkinMe) ---
  const cslServices = [
    { name: "LittleSkin", url: `https://littleskin.cn/api/yggdrasil/api/profiles/minecraft/${username}` },
    { name: "BlessingSkin", url: `https://skin.printmeworld.com/api/yggdrasil/api/profiles/minecraft/${username}` },
    { name: "SkinMe", url: `http://www.skinme.cc/uniskin/${username}.json` }
  ];

  for (const service of cslServices) {
    try {
      const cslRes = await fetch(service.url);
      if (cslRes.ok) {
        const data = await cslRes.json();
        // CSL/Yggdrasil usually returns base64 in properties
        const skinUrl = extractSkinFromJson(data);
        if (skinUrl) return sendResponse(res, username, skinUrl, service.name);
      }
    } catch (e) {}
  }

  // --- 4. TRY MOJANG ---
  try {
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (mojangRes.ok) {
      const userData = await mojangRes.json();
      const profileRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${userData.id}`);
      const profileData = await profileRes.json();
      const skinUrl = extractSkinFromJson(profileData);
      if (skinUrl) return sendResponse(res, username, skinUrl, "Mojang");
    }
  } catch (e) {}

  return res.status(404).json({ error: "No skin found" });
}

// Helper to extract SKIN URL from Yggdrasil-style JSON
function extractSkinFromJson(data) {
  try {
    const prop = data.properties?.find(p => p.name === 'textures');
    if (!prop) return null;
    const decoded = JSON.parse(Buffer.from(prop.value, 'base64').toString());
    return decoded.textures.SKIN.url;
  } catch (e) {
    return null;
  }
}

// Unified response formatter
function sendResponse(res, name, url, source) {
  return res.status(200).json({
    username: name,
    source: source,
    skins: { default: url }
  });
}
