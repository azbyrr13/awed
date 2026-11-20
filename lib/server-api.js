import crypto from "node:crypto";
import { db } from "./firebase-admin.js";

function send(res, status, data) {
  return res.status(status).json(data);
}

function readBody(req) {
  let body = req.body || {};

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  return body;
}

function isAdmin(req) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || password;

  if (!password || !secret) return false;

  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split(";").map((part) => {
      const index = part.indexOf("=");
      return index < 0
        ? ["", ""]
        : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }),
  );

  const token = cookies.led_admin_session || "";
  const [timestamp, signature] = token.split(".");

  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) {
    return false;
  }

  const age = Date.now() - Number(timestamp);

  if (age < 0 || age > 8 * 60 * 60 * 1000) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = req.method;

    // Хэрэглэгч үнийн санал хүсэх
    if (path === "/api/quotes" && method === "POST") {
      const body = readBody(req);

      const customer = body.customer;
      const items = body.items;

      if (!customer || !Array.isArray(items) || items.length === 0) {
        return send(res, 400, {
          error: "Хэрэглэгчийн мэдээлэл болон бүтээгдэхүүн шаардлагатай.",
        });
      }

      const id = crypto.randomUUID();
      const accessToken = crypto.randomBytes(32).toString("hex");

      const quote = {
        id,
        accessToken,
        customer,
        items,
        installation: Boolean(body.installation),
        status: "pending",
        createdAt: new Date().toISOString(),
        approvedPrices: null,
      };

      await db.collection("quotes").doc(id).set(quote);

      return send(res, 201, {
        id,
        accessToken,
        status: "pending",
      });
    }

    // Admin API — нэвтрэлтийг шалгах
    if (path.startsWith("/api/admin/")) {
      if (!isAdmin(req)) {
        return send(res, 401, {
          error: "Админ эрх шаардлагатай.",
        });
      }
    }

    // Admin — бүх үнийн хүсэлт
    if (path === "/api/admin/quotes" && method === "GET") {
      const snapshot = await db
        .collection("quotes")
        .orderBy("createdAt", "desc")
        .get();

      const quotes = snapshot.docs.map((doc) => {
        const data = doc.data();
        const { accessToken, ...safeData } = data;
        return safeData;
      });

      return send(res, 200, quotes);
    }

    // Admin — үнийн санал батлах
    const adminQuoteMatch = path.match(/^\/api\/admin\/quotes\/([^/]+)$/);

    if (adminQuoteMatch && method === "PATCH") {
      const id = adminQuoteMatch[1];
      const body = readBody(req);

      const quoteRef = db.collection("quotes").doc(id);
      const quoteDoc = await quoteRef.get();

      if (!quoteDoc.exists) {
        return send(res, 404, {
          error: "Үнийн санал олдсонгүй.",
        });
      }

      const approvedPrices = {
        prices: body.prices || {},
        installation: Boolean(body.installation),
        installationFee: Number(body.installationFee || 0),
        note: String(body.note || ""),
      };

      await quoteRef.update({
        approvedPrices,
        status: "approved",
        updatedAt: new Date().toISOString(),
      });

      return send(res, 200, {
        ok: true,
        approvedPrices,
      });
    }

    // Admin — бүтээгдэхүүний үнэ унших
    if (path === "/api/admin/prices" && method === "GET") {
      const doc = await db.collection("appData").doc("prices").get();

      return send(
        res,
        200,
        doc.exists
          ? doc.data()
          : {
              prices: [],
              installationFee: 0,
            },
      );
    }

    // Admin — бүтээгдэхүүний үнэ хадгалах
    if (path === "/api/admin/prices" && method === "PUT") {
      const body = readBody(req);

      const data = {
        prices: Array.isArray(body.prices) ? body.prices : [],
        installationFee: Number(body.installationFee || 0),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("appData").doc("prices").set(data);

      return send(res, 200, {
        ok: true,
        ...data,
      });
    }

    // Admin — тохиргоо унших
    if (path === "/api/admin/settings" && method === "GET") {
      const doc = await db.collection("appData").doc("settings").get();

      return send(
        res,
        200,
        doc.exists
          ? doc.data()
          : {
              adminEmail: "",
            },
      );
    }

    // Admin — тохиргоо хадгалах
    if (path === "/api/admin/settings" && method === "PUT") {
      const body = readBody(req);

      const data = {
        adminEmail: String(body.adminEmail || "").trim(),
      };

      await db.collection("appData").doc("settings").set(data, { merge: true });

      return send(res, 200, {
        ok: true,
        ...data,
      });
    }

    // Хэрэглэгч — өөрийн үнийн саналыг харах
    const publicQuoteMatch = path.match(/^\/api\/quotes\/([^/]+)$/);

    if (publicQuoteMatch && method === "GET") {
      const id = publicQuoteMatch[1];
      const token = url.searchParams.get("token") || "";

      const doc = await db.collection("quotes").doc(id).get();

      if (!doc.exists) {
        return send(res, 404, {
          error: "Үнийн санал олдсонгүй.",
        });
      }

      const quote = doc.data();

      if (!token || token !== quote.accessToken) {
        return send(res, 403, {
          error: "Хандах эрхгүй байна.",
        });
      }

      const { accessToken, ...safeQuote } = quote;

      return send(res, 200, safeQuote);
    }

    return send(res, 404, {
      error: "API endpoint олдсонгүй.",
    });
  } catch (error) {
    console.error("Server API error:", error);

    return send(res, 500, {
      error: "Серверийн алдаа гарлаа.",
    });
  }
}
