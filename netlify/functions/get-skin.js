exports.handler = async (event) => {
  const username = event.path.split('/').pop(); // Gets the name from the URL

  try {
    // 1. Fallback to Mojang (since you don't have a database yet)
    const profileRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    
    if (profileRes.status === 200) {
      const { id } = await profileRes.json();
      const sessionRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`);
      const sessionData = await sessionRes.json();

      const texturesBase64 = sessionData.properties.find(p => p.name === 'textures').value;
      const decoded = JSON.parse(Buffer.from(texturesBase64, 'base64').toString());
      const mojangSkinUrl = decoded.textures.SKIN.url;

      return {
        statusCode: 200,
        body: JSON.stringify({
          username: username,
          skins: { default: mojangSkinUrl }
        })
      };
    }

    // 2. If no skin found, return Steve
    return {
      statusCode: 200,
      body: JSON.stringify({
        username: username,
        skins: { default: "https://textures.minecraft.net/texture/1a4af718455edc43147ba26ec979f048cfc06d15799981e14934bc7e46" }
      })
    };
  } catch (error) {
    return { statusCode: 500, body: "Error fetching skin" };
  }
};
