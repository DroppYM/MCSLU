exports.handler = async (event) => {
  // Get the username from the URL (e.g., /get-skin/Steve)
  const pathParts = event.path.split('/');
  const username = pathParts[pathParts.length - 1];

  try {
    // Ask Mojang for the player's ID
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (res.status === 200) {
      const data = await res.json();
      // Ask Mojang for the skin link
      const sessionRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${data.id}`);
      const sessionData = await sessionRes.json();
      const textures = JSON.parse(Buffer.from(sessionData.properties[0].value, 'base64').toString());

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          username: username,
          skins: { default: textures.textures.SKIN.url }
        })
      };
    }
  } catch (e) { /* Fallback to Steve below */ }

  return {
    statusCode: 200,
    body: JSON.stringify({
      username: username,
      skins: { default: "https://textures.minecraft.net/texture/1a4af718455edc43147ba26ec979f048cfc06d15799981e14934bc7e46" }
    })
  };
};
