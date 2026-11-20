
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || password;

  if (!password || !secret) {
    return res.status(503).json({
      error: "Admin тохиргоо дутуу байна."
    });
  }

  try {
    let body = req.body || {};

if (typeof body === "string") {
  try {
    body = JSON.parse(body);
  } catch {
    body = {};
  }
}

const supplied = String(body.password || "");

    const a = Buffer.from(supplied);
    const b = Buffer.from(password);

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return res.status(401).json({
        error: "Нууц үг буруу байна."
      });
    }

    const timestamp = String(Date.now());
    const signature = crypto
      .createHmac("sha256", secret)
      .update(timestamp)
      .digest("hex");

    res.setHeader(
      "Set-Cookie",
      `led_admin_session=${timestamp}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "Серверийн алдаа."
    });
  }
}
