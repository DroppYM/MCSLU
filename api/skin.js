export default async function handler(req, res) {
  // Get the username from the URL (e.g., Player.json -> Player)
  const { user } = req.query;
  const username = user.replace('.json', '');

  // --- 1. TRY ELY.BY ---
  try {
    const elyRes = await fetch(`https://skinsystem.ely.by/profiles/${username}`);
    if (elyRes.ok) {
      const data = await elyRes.json();
      if (data.skins?.default) {
        return sendResponse(res, username, data.skins.default);
      }
    }
  } catch (e) {}

  // --- 2. TRY MOJANG ---
  try {
    const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (mojangRes.ok) {
      const userData = await mojangRes.json();
      const profileRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${userData.id}`);
      const profileData = await profileRes.json();
      const decoded = JSON.parse(Buffer.from(profileData.properties[0].value, 'base64').toString());
      if (decoded.textures.SKIN.url) {
        return sendResponse(res, username, decoded.textures.SKIN.url);
      }
    }
  } catch (e) {}

  // --- 3. TRY TLAUNCHER ---
  // TLauncher stores skins at a predictable URL pattern
  const tlUrl = `http://auth.tlauncher.org/skin/profile/texture/login/${username}`;
  try {
    const tlRes = await fetch(tlUrl, { method: 'HEAD' });
    if (tlRes.ok) {
      return sendResponse(res, username, tlUrl);
    }
  } catch (e) {}

  return res.status(404).json({ error: "No skin found" });
}

// Helper to format the response for CustomSkinLoader
function sendResponse(res, name, url) {
  return res.status(200).json({
    username: name,
    skins: { default: url }
  });
}
