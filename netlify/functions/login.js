exports.handler = async function(event) {
  const data = JSON.parse(event.body || "{}");

  const username = (data.username || "").trim();
  const password = (data.password || "").trim();

  if (username === "btq" && password === "nespresso123") {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ ok: false })
  };
};
