import crypto from "node:crypto";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || password;

  const rawCookie = req.headers.cookie || "";

  const cookies = Object.fromEntries(
    rawCookie.split(";").map((part) => {
      const index = part.indexOf("=");
      return index < 0
        ? ["", ""]
        : [
            part.slice(0, index).trim(),
            part.slice(index + 1).trim()
          ];
    })
  );

  const token = cookies["led_admin_session"] || "";
  const [timestamp, signature] = token.split(".");

  const validTimestamp = Boolean(
    timestamp && /^\d+$/.test(timestamp)
  );

  const ageMs = validTimestamp
    ? Date.now() - Number(timestamp)
    : null;

  const notExpired =
    validTimestamp &&
    ageMs >= 0 &&
    ageMs <= 8 * 60 * 60 * 1000;

  const expected = secret && timestamp
    ? crypto.createHmac("sha256", secret)
        .update(timestamp)
        .digest("hex")
    : "";

  const signatureMatches = Boolean(
    signature &&
    expected &&
    signature.length === expected.length &&
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  );

  return res.status(200).json({
    authenticated: Boolean(
      validTimestamp && notExpired && signatureMatches
    ),
    configured: Boolean(password)
  });
}