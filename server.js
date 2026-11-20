import http from 'node:http';
import tls from 'node:tls';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const SOURCES = [
  { id: 'ticket', name: 'Ticket.mn', urls: ['https://www.ticket.mn/', 'https://www.ticket.mn/old/'], eventPattern: /\/(?:event|events)\/[\w-]+\/?(?:\?|$)/i },
  { id: 'portal', name: 'Portal.mn', urls: ['https://www.portal.mn/', 'https://www.portal.mn/events'], eventPattern: /\/events?\/[^\s"'<>?#]+/i },
];
const cache = { events: [], updatedAt: null, errors: [] };
const TTL = 5 * 60 * 1000;

function decode(s = '') {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function clean(s = '') {
  return decode(String(s).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}
function absolute(url, base) {
  try { return new URL(decode(url), base).href; } catch { return ''; }
}
function dateFrom(text = '') {
  const m = text.match(/20\d{2}[.\-/年 ]\s?\d{1,2}[.\-/月 ]\s?\d{1,2}(?:日)?(?:\s+\d{1,2}:\d{2})?/);
  return m ? m[0].replace(/年|月/g, '.').replace(/日/g, '') : '';
}
function extractJson(html, base, source) {
  const out = [];
  const scripts = [...html.matchAll(/<script[^>]*(?:type=["']application\/ld\+json["']|id=["']__NEXT_DATA__["']|id=["']__NUXT_DATA__["']|id=["']__NUXT__["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of scripts) {
    try {
      const root = JSON.parse(m[1]);
      const walk = (v) => {
        if (!v || typeof v !== 'object') return;
        if (Array.isArray(v)) { v.forEach(walk); return; }
        const type = String(v['@type'] || v.type || '').toLowerCase();
        const title = v.name || v.title || v.eventName || v.event_name;
        const rawUrl = v.url || v.href || v.slug;
        const url = rawUrl ? absolute(String(rawUrl).startsWith('/') || String(rawUrl).startsWith('http') ? rawUrl : `/events/${rawUrl}`, base) : '';
        if (title && (type.includes('event') || source.eventPattern.test(url))) {
          const location = v.location?.name || v.venue || v.locationName || '';
          const image = typeof v.image === 'string' ? v.image : Array.isArray(v.image) ? v.image[0] : v.image?.url;
          const start = v.startDate || v.date || v.eventDate || '';
          const offers = v.offers;
          const price = v.price || offers?.price || (Array.isArray(offers) ? offers[0]?.price : '') || '';
          out.push({ source: source.name, title: clean(title), date: clean(start), venue: clean(location), price: price ? `${price} ₮` : '', image: image ? absolute(image, base) : '', url: url || base });
        }
        Object.values(v).forEach(walk);
      };
      walk(root);
    } catch { /* ignore non-JSON script blocks */ }
  }
  return out;
}
function extractLinks(html, base, source) {
  const out = [];
  const re = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  const ignored = /^(тасалбар авах|дэлгэрэнгүй|дэлгэрэнгүй үзэх|read more|buy ticket|ticket|захиалах)$/i;
  let m;
  while ((m = re.exec(html))) {
    const url = absolute(m[2], base);
    if (!url || !source.eventPattern.test(url)) continue;

    // Event title is usually a heading elsewhere in the same card, not the
    // anchor label ("Тасалбар авах"). Inspect a wider local card fragment.
    const before = html.slice(Math.max(0, m.index - 5000), m.index);
    const after = html.slice(re.lastIndex, Math.min(html.length, re.lastIndex + 1800));
    const starts = [...before.matchAll(/<(?:article|li|section|div)\b[^>]*>/gi)];
    const blockStart = starts.length ? starts[starts.length - 1].index : Math.max(0, before.length - 1600);
    const block = before.slice(blockStart) + m[0] + after;

    const headingBefore = [...before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
      .map(x => clean(x[1])).filter(x => x.length > 2 && !ignored.test(x));
    const headingAfter = [...after.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
      .map(x => clean(x[1])).filter(x => x.length > 2 && !ignored.test(x));
    const headings = [headingBefore[headingBefore.length - 1], headingAfter[0]].filter(Boolean);
    const titleAttrs = [...block.matchAll(/(?:aria-label|title|alt)=["']([^"']{3,180})["']/gi)]
      .map(x => clean(x[1]))
      .filter(x => !ignored.test(x));
    const anchorText = clean(m[4]);
    const blockText = clean(block).slice(0, 1000);
    const textWithoutAction = blockText.replace(/(Тасалбар авах|Дэлгэрэнгүй үзэх|Дэлгэрэнгүй|Read more|Buy ticket)/gi, ' ');
    const title = headings[0] || titleAttrs[0] ||
      (anchorText && !ignored.test(anchorText) ? anchorText : '') ||
      textWithoutAction.split(/(?:20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}\s*(?:11-р сар|12-р сар))/)[0].trim().slice(-180);

    if (!title || title.length < 3 || ignored.test(title)) continue;
    const imageMatch = block.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
    const dateMatch = blockText.match(/20\d{2}[.\-/年 ]\s?\d{1,2}[.\-/月 ]\s?\d{1,2}(?:日)?(?:\s+\d{1,2}:\d{2})?/) ||
      blockText.match(/\d{1,2}\s*(?:11-р сар|12-р сар)/);
    const venueMatch = blockText.match(/(?:байршил|танхим|заал)\s*[:：]?\s*([^|,]{3,90})/i);
    out.push({
      source: source.name,
      title: title.replace(/\s+/g, ' ').trim(),
      date: dateMatch ? dateMatch[0] : '',
      venue: venueMatch ? venueMatch[1].trim() : '',
      price: (blockText.match(/[\d,.]+\s*₮/) || [])[0] || '',
      image: imageMatch ? absolute(imageMatch[1], base) : '',
      url
    });
  }
  return out;
}
async function scrape(source) {
  const pages = await Promise.all(source.urls.map(async (pageUrl) => {
    const response = await fetch(pageUrl, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; LEDMongoliaEvents/1.0)', accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(18000) });
    if (!response.ok) throw new Error(`${pageUrl} → HTTP ${response.status}`);
    return { pageUrl, html: await response.text() };
  }));
  const items = pages.flatMap(({ pageUrl, html }) => [...extractJson(html, pageUrl, source), ...extractLinks(html, pageUrl, source)]);
  const seen = new Set();
  return items.filter(e => {
    const key = `${e.source}|${e.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    e.title = e.title.replace(/^(Тасалбар авах|Дэлгэрэнгүй|Read more)\s*/i, '').trim();
    return e.title.length > 2;
  });
}
async function refresh(force = false) {
  if (!force && cache.updatedAt && Date.now() - cache.updatedAt < TTL) return;
  const results = await Promise.all(SOURCES.map(async s => {
    try { return { source: s.name, events: await scrape(s) }; }
    catch (e) { return { source: s.name, events: [], error: e.message }; }
  }));
  cache.events = results.flatMap(r => r.events);
  cache.errors = results.filter(r => r.error).map(r => ({ source: r.source, message: r.error }));
  cache.sourceCounts = Object.fromEntries(results.map(r => [r.source, r.events.length]));
  cache.updatedAt = Date.now();
}
function send(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(data));
}
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp' };

// Load local .env without an extra dependency; real environment values take priority.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !Object.prototype.hasOwnProperty.call(process.env, match[1])) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}
const DATA_DIR = path.join(__dirname, 'data');
const PRICE_FILE = path.join(DATA_DIR, 'prices.json');
const QUOTES_FILE = path.join(DATA_DIR, 'quotes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || ADMIN_PASSWORD;
const SESSION_COOKIE = 'led_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

function readPrices() {
  try {
    return JSON.parse(fs.readFileSync(PRICE_FILE, 'utf8'));
  } catch {
    return { prices: {}, installationFee: 0 };
  }
}
function readQuotes() {
  try { return JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8')); } catch { return []; }
}
function writeQuotes(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${QUOTES_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, QUOTES_FILE);
}
function writePrices(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${PRICE_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, PRICE_FILE);
}

function readSettings() { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return { adminEmail: '' }; } }
function writeSettings(value) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(SETTINGS_FILE, JSON.stringify(value, null, 2), 'utf8'); }
function pdfEscape(value) { return String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1'); }
function quotePdf(quote) {
  const lines = ['LED MONGOLIA - QUOTATION', `Customer: ${quote.customer.name}`, `Email: ${quote.customer.email || '-'}`, `Phone: ${quote.customer.phone}`, `Address: ${quote.customer.address || '-'}`, `Period: ${quote.customer.dateFrom || '-'} - ${quote.customer.dateTo || '-'}`, `Date: ${new Date(quote.approvedPrices.approvedAt).toLocaleString('en-US')}`, ''];
  let total = 0; let y = 750; const ops = ['BT /F1 16 Tf 50 790 Td (LED MONGOLIA - QUOTATION) Tj ET'];
  for (const item of quote.items) {
    const qty = item.measurement === 'cabinet' ? Math.ceil(item.width/.5)*Math.ceil(item.height/.5)*item.quantity : item.unit === 'м²' ? item.width*item.height*item.quantity : item.quantity;
    const price = Number(quote.approvedPrices.prices[item.name]) || 0; const sum = qty*price; total += sum;
    lines.push(`${item.name} | ${item.width ? `${item.width} x ${item.height} m | ` : ''}${qty} ${item.unit || 'pcs'} | ${sum.toLocaleString('en-US')} MNT`);
    ops.push(`BT /F1 9 Tf 50 ${y} Td (${pdfEscape(lines[lines.length-1])}) Tj ET`); y -= 16;
    if (item.width && item.height && y > 120) {
      const cols=Math.min(24,Math.ceil(item.width/.5)), rows=Math.min(14,Math.ceil(item.height/.5)), cell=Math.min(14,480/cols,150/rows), x0=50, y0=y-rows*cell;
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) ops.push(`${(x0+c*cell).toFixed(1)} ${(y0+r*cell).toFixed(1)} ${cell.toFixed(1)} ${cell.toFixed(1)} re S`);
      ops.push(`BT /F1 8 Tf 50 ${y0-12} Td (${pdfEscape(`Schematic: ${item.width}m x ${item.height}m; ${cols} x ${rows} cabinets (50cm x 50cm)`)}) Tj ET`); y=y0-30;
    }
  }
  const installation = quote.approvedPrices.installation ? quote.approvedPrices.installationFee : 0;
  total += installation; ops.push(`BT /F1 11 Tf 50 ${Math.max(60,y-10)} Td (Installation: ${installation.toLocaleString('en-US')} MNT) Tj ET`);
  ops.push(`BT /F1 13 Tf 50 ${Math.max(40,y-32)} Td (TOTAL: ${total.toLocaleString('en-US')} MNT) Tj ET`);
  if(quote.approvedPrices.note) ops.push(`BT /F1 9 Tf 50 ${Math.max(20,y-50)} Td (${pdfEscape(quote.approvedPrices.note.slice(0,120))}) Tj ET`);
  const stream=ops.join('\n'); const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf='%PDF-1.4\n', offsets=[0]; for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const xref=Buffer.byteLength(pdf); pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf,'binary');
}
async function sendEmail(to, subject, body, attachment) {
  const host=process.env.SMTP_HOST, port=Number(process.env.SMTP_PORT || 465), user=process.env.SMTP_USER, pass=process.env.SMTP_PASS, from=process.env.SMTP_FROM || user;
  if(!host || !user || !pass || !from) throw new Error('SMTP тохиргоо дутуу байна (.env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM).');
  const socket=tls.connect({host,port, servername:host}); socket.setEncoding('utf8');
  let buffer=''; const waiters=[];
  socket.on('data',chunk=>{buffer+=chunk; if(/(?:^|\r?\n)\d{3} [^\r\n]*\r?\n$/.test(buffer)){const b=buffer;buffer='';waiters.splice(0).forEach(w=>w(b));}});
  const response=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('SMTP timeout')),15000);waiters.push(v=>{clearTimeout(timer);resolve(v);});});
  const read=async()=>{const r=await response(); if(!/^2|^3/m.test(r)) throw new Error(`SMTP: ${r.trim().slice(-300)}`); return r;};
  const cmd=async(c)=>{socket.write(c+'\r\n');return read();};
  try { await read(); await cmd(`EHLO led-mongolia.local`); await cmd('AUTH LOGIN'); await cmd(Buffer.from(user).toString('base64')); await cmd(Buffer.from(pass).toString('base64')); await cmd(`MAIL FROM:<${from}>`); await cmd(`RCPT TO:<${to}>`); await cmd('DATA');
    const boundary='LED_'+crypto.randomBytes(12).toString('hex'); const subject64=`=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    let msg=`From: ${from}\r\nTo: ${to}\r\nSubject: ${subject64}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(body).toString('base64')}\r\n`;
    if(attachment) msg+=`--${boundary}\r\nContent-Type: application/pdf; name="LED-Mongolia-Quote.pdf"\r\nContent-Disposition: attachment; filename="LED-Mongolia-Quote.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\n${attachment.toString('base64').replace(/.{1,76}/g,'$&\r\n')}\r\n`;
    msg+=`--${boundary}--\r\n.`; await cmd(msg); await cmd('QUIT');
  } finally { socket.end(); }
}

function signSession(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}
function isAdmin(req) {
  if (!SESSION_SECRET) return false;
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
  const token = cookies[SESSION_COOKIE] || '';
  const [timestamp, signature] = token.split('.');
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Date.now() - Number(timestamp) > SESSION_MAX_AGE || Number(timestamp) > Date.now() + 60000) return false;
  const expected = signSession(timestamp);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function adminCookie(req, value, maxAge = 28800) {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/admin/status' && req.method === 'GET') {
      return send(res, 200, { authenticated: isAdmin(req), configured: Boolean(ADMIN_PASSWORD) });
    }
    if (url.pathname === '/api/admin/login' && req.method === 'POST') {
      if (!ADMIN_PASSWORD) return send(res, 503, { error: 'Админыг сервер дээр тохируулаагүй байна. ADMIN_PASSWORD тохируулна уу.' });
      try {
        const body = await readBody(req);
        const supplied = String(body.password || '');
        const a = Buffer.from(supplied);
        const b = Buffer.from(ADMIN_PASSWORD);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
          return send(res, 401, { error: 'Нууц үг буруу байна.' });
        }
        const timestamp = String(Date.now());
        res.setHeader('Set-Cookie', adminCookie(req, `${timestamp}.${signSession(timestamp)}`));
        return send(res, 200, { ok: true });
      } catch (error) {
        return send(res, 400, { error: error.message });
      }
    }
    if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', adminCookie(req, '', 0));
      return send(res, 200, { ok: true });
    }
    if (url.pathname === '/api/quotes' && req.method === 'POST') {
      try {
        const body = await readBody(req);
        const name = String(body.customer?.name || '').trim();
        const phone = String(body.customer?.phone || '').trim();
        const email = String(body.customer?.email || '').trim().toLowerCase();
        const dateFrom = String(body.customer?.dateFrom || '').trim();
        const dateTo = String(body.customer?.dateTo || '').trim();
        const validDate = (v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)));
        if (!validDate(dateFrom) || !validDate(dateTo)) return send(res, 400, { error: 'Огнооны формат буруу байна.' });
        if (dateFrom && dateTo && dateTo < dateFrom) return send(res, 400, { error: 'Дуусах огноо нь эхлэх огнооноос өмнө байж болохгүй.' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Зөв имэйл хаяг оруулна уу.' });
        const items = Array.isArray(body.items) ? body.items : [];
        if (!name || !phone || !items.length) return send(res, 400, { error: 'Нэр, утас болон бүтээгдэхүүн шаардлагатай.' });
        if (items.length > 100) return send(res, 400, { error: 'Бүтээгдэхүүний тоо хэтэрсэн байна.' });
        const safeItems = items.map(item => ({
          name: String(item.name || '').slice(0, 180), category: String(item.category || '').slice(0, 100),
          unit: String(item.unit || 'ш').slice(0, 10), measurement: String(item.measurement || 'piece').slice(0, 20),
          width: Math.max(0, Math.min(10000, Number(item.width) || 0)), height: Math.max(0, Math.min(10000, Number(item.height) || 0)),
          quantity: Math.max(1, Math.min(100000, Number(item.quantity) || 1)),
        }));
        const id = crypto.randomUUID();
        const accessToken = crypto.randomBytes(24).toString('hex');
        const quotes = readQuotes();
        quotes.unshift({ id, accessToken, customer: { name, phone, email, address: String(body.customer?.address || '').slice(0, 500), dateFrom, dateTo }, items: safeItems, installationRequested: Boolean(body.installation), status: 'pending', createdAt: new Date().toISOString(), approvedPrices: null });
        writeQuotes(quotes);
        const adminEmail = readSettings().adminEmail;
        if (adminEmail) sendEmail(adminEmail, 'Шинэ үнийн саналын хүсэлт', `${name} шинэ хүсэлт илгээлээ. Утас: ${phone}. Имэйл: ${email}.`, null).catch(err => console.error('Admin notification email failed:', err.message));
        return send(res, 201, { id, accessToken, status: 'pending' });
      } catch (error) { return send(res, 400, { error: error.message }); }
    }
    const publicQuoteMatch = url.pathname.match(/^\/api\/quotes\/([0-9a-f-]+)$/i);
    if (publicQuoteMatch && req.method === 'GET') {
      const quote = readQuotes().find(q => q.id === publicQuoteMatch[1] && q.accessToken === url.searchParams.get('token'));
      if (!quote) return send(res, 404, { error: 'Үнийн санал олдсонгүй.' });
      const { accessToken, ...safeQuote } = quote;
      return send(res, 200, safeQuote);
    }
    if (url.pathname === '/api/admin/quotes') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Админ эрх шаардлагатай.' });
      if (req.method === 'GET') return send(res, 200, readQuotes().map(({ accessToken, ...q }) => q));
      return send(res, 405, { error: 'Method not allowed' });
    }
    const adminQuoteMatch = url.pathname.match(/^\/api\/admin\/quotes\/([0-9a-f-]+)$/i);
    if (adminQuoteMatch && req.method === 'PATCH') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Админ эрх шаардлагатай.' });
      try {
        const body = await readBody(req);
        const quotes = readQuotes();
        const quote = quotes.find(q => q.id === adminQuoteMatch[1]);
        if (!quote) return send(res, 404, { error: 'Хүсэлт олдсонгүй.' });
        const prices = body.prices && typeof body.prices === 'object' ? body.prices : {};
        const cleanPrices = {};
        for (const item of quote.items) {
          const price = Number(prices[item.name]);
          if (!Number.isFinite(price) || price < 0 || price > 100000000000) return send(res, 400, { error: `${item.name}: үнэ буруу байна.` });
          cleanPrices[item.name] = Math.round(price);
        }
        const installationFee = Math.max(0, Math.round(Number(body.installationFee) || 0));
        quote.approvedPrices = { prices: cleanPrices, installationFee, installation: Boolean(body.installation), note: String(body.note || '').slice(0, 2000), approvedAt: new Date().toISOString() };
        quote.status = 'approved';
        writeQuotes(quotes);
        let emailStatus = 'not_configured';
        if (quote.customer.email) { try { await sendEmail(quote.customer.email, 'LED Mongolia - Баталгаажсан үнийн санал', `Сайн байна уу, ${quote.customer.name}. Таны үнийн санал баталгаажлаа. PDF хавсралтаас дэлгэрэнгүй болон хэмжээсийн схемийг үзнэ үү.`, quotePdf(quote)); emailStatus = 'sent'; } catch (mailError) { emailStatus = 'failed'; console.error('Customer quote email failed:', mailError.message); } }
        quote.emailStatus = emailStatus; writeQuotes(quotes);
        const { accessToken, ...safeQuote } = quote;
        return send(res, 200, safeQuote);
      } catch (error) { return send(res, 400, { error: error.message }); }
    }
    if (url.pathname === '/api/admin/settings') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Админ эрх шаардлагатай.' });
      if (req.method === 'GET') return send(res, 200, readSettings());
      if (req.method === 'PUT') { try { const body=await readBody(req); const adminEmail=String(body.adminEmail||'').trim().toLowerCase(); if(adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) return send(res,400,{error:'Имэйл хаяг буруу байна.'}); const saved={...readSettings(),adminEmail}; writeSettings(saved); return send(res,200,saved); } catch(e){ return send(res,400,{error:e.message}); } }
      return send(res,405,{error:'Method not allowed'});
    }
    if (url.pathname === '/api/admin/prices') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Админ эрх шаардлагатай.' });
      if (req.method === 'GET') return send(res, 200, readPrices());
      if (req.method === 'PUT') {
        try {
          const body = await readBody(req);
          const incoming = body.prices && typeof body.prices === 'object' ? body.prices : {};
          const prices = {};
          for (const [name, value] of Object.entries(incoming)) {
            const amount = Number(value);
            if (name.length > 180 || !Number.isFinite(amount) || amount < 0 || amount > 100000000000) {
              return send(res, 400, { error: 'Үнэ буруу байна. 0-ээс их эсвэл тэнцүү тоо оруулна уу.' });
            }
            prices[name] = Math.round(amount);
          }
          const installationFee = Number(body.installationFee);
          if (!Number.isFinite(installationFee) || installationFee < 0 || installationFee > 100000000000) {
            return send(res, 400, { error: 'Суурилуулалтын үнэ буруу байна.' });
          }
          const saved = { prices, installationFee: Math.round(installationFee), updatedAt: new Date().toISOString() };
          writePrices(saved);
          return send(res, 200, saved);
        } catch (error) {
          return send(res, 400, { error: error.message });
        }
      }
      return send(res, 405, { error: 'Method not allowed' });
    }
    if (url.pathname === '/api/events') {
      await refresh(url.searchParams.get('refresh') === '1');
      return send(res, 200, { events: cache.events, updatedAt: cache.updatedAt, sources: SOURCES.map(s => s.name), sourceCounts: cache.sourceCounts || {}, errors: cache.errors });
    }
    if (url.pathname === '/api/health') return send(res, 200, { ok: true });
    return send(res, 404, { error: 'Not found' });
  }
  const dist = path.join(__dirname, 'dist');
  const requested = path.normalize(path.join(dist, decodeURIComponent(url.pathname)));
  const file = requested.startsWith(dist) && fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.join(dist, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(503, { 'content-type':'text/plain; charset=utf-8' }); return res.end('Frontend build not found. Run npm run build first.'); }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, () => console.log(`LED Mongolia server listening on http://localhost:${PORT}`));
