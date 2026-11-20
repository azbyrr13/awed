# LED Mongolia

React + Vite website for LED Mongolia.

## Install

```bash
npm install
```

## Development

Run the data API and Vite in two terminals:

```bash
npm run server
```

```bash
npm run dev
```

Vite forwards `/api/*` requests to the local data server at `http://localhost:3001`.

## Production

```bash
npm run build
npm start
```

The Node server serves the `dist` folder and exposes:

- `GET /api/health` — server health check
- `GET /api/events` — cached event feed
- `GET /api/events?refresh=1` — force a refresh from Ticket.mn and Portal.mn

The event feed is refreshed every five minutes when requested. The homepage also refreshes it every five minutes. Each event links to its original source page. Scraping depends on the source websites remaining publicly accessible and retaining compatible page markup; if a source changes its structure or blocks automated requests, that source is reported in the API `errors` field.


## Admin-only pricing

- Public visitors can add products and enter dimensions / quantities, but cannot see unit prices, line totals, or quote totals.
- Admin opens the quote section and chooses **Админ нэвтрэх** to manage product prices and the installation fee.
- Prices are stored server-side in `data/prices.json`; they are not bundled into the public frontend.
- Set `ADMIN_PASSWORD` and preferably `ADMIN_SESSION_SECRET` in the server environment before deployment. Never commit a real `.env` file or share the admin password.
- The local `.env` file contains the admin credentials from the original project ZIP, so the existing admin password is preserved. Keep this file private. Change `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before deploying publicly. The Node server reads this file automatically. In production, configure these variables in your hosting provider.
- The admin session uses an HttpOnly, SameSite=Strict cookie and expires after 8 hours.


## Admin болон үнийн саналын урсгал

- Admin тусдаа `/admin` хаягаар нэвтэрнэ.
- `.env` файл дахь `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` утгуудыг өөрийн нууц утгаар солино.
- Хэрэглэгч үндсэн сайтаас үнийн саналын хүсэлт илгээхэд серверийн `data/quotes.json` файлд хадгалагдана.
- Admin хүсэлтийг `/admin` самбараас нээж, бүтээгдэхүүн бүрийн үнийг болон суурилуулалтыг тохируулан баталгаажуулна.
- Хэрэглэгч хүсэлт илгээсэн тухайн browser дээрээ үндсэн сайтын үнийн санал хэсэгт баталгаажсан үнийг харна.
- Бүтээгдэхүүний үнэ `data/prices.json`, үнийн хүсэлтүүд `data/quotes.json` дотор хадгалагдана. Сервер дээр эдгээр `data` файлыг тогтмол хадгалагддаг диск/volume-д байрлуулах шаардлагатай.


## Имэйл илгээх тохиргоо

Admin хэсгийн **Имэйл тохиргоо** таб дээр мэдэгдэл хүлээн авах хаягаа оруулна. Хэрэглэгч хүсэлт илгээхэд админд мэдэгдэл, админ үнийн саналыг батлахад хэрэглэгчид PDF болон 50×50 см cabinet-ийн схем хавсаргасан имэйл илгээнэ.

Имэйл илгээхийн тулд серверийн `.env` файлд `SMTP_HOST`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` утгуудыг имэйл үйлчилгээ үзүүлэгчийн өгсөн SSL/TLS SMTP мэдээллээр тохируулна. `SMTP_PASS` нь имэйл үйлчилгээний app password байх шаардлагатай байж болно. Нууц үгийг React/client кодод бүү оруул. `.env` файл Git-д орохгүй.

## Vercel дээр байрлуулах

- Бүх API-ийн логик `lib/server-api.js` дотор. `api/` доторх жижиг файл бүр (`events.js`, `health.js`, `quotes.js`, `quotes/[id].js`, `admin/*.js`) түүнийг дууддаг: Vercel файл бүрээр нь замчилдаг тул rewrite шаардлагагүй. `api/admin/login.js`, `status.js` нь нэвтрэлтийн тусдаа endpoint.
- Үнэ, үнийн санал, тохиргоог **Firebase Firestore** дээр хадгална (`appData/prices`, `appData/settings`, `quotes` collection).
- `vercel.json` нь `/admin` зэрэг хаягийг `index.html` руу чиглүүлж, `/images`-г 7 хоног cache хийнэ.
- Vercel → Settings → Environment Variables: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, (имэйлд) `SMTP_*`.
- Хувьсагч нэмсний дараа заавал Redeploy хийнэ. Шалгах: `/api/health`, `/api/events`, `/admin`.
- Локал хөгжүүлэлт өмнөх шигээ: `npm run server` + `npm run dev`.
