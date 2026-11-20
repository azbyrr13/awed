import React, { useEffect, useMemo, useState } from 'react';
import { products } from './App.jsx';
import LedDiagramPanel from './LedDiagramPanel.jsx';

const money = (n) => `${(Number(n) || 0).toLocaleString('mn-MN')} ₮`;
const amount = (item) => item.measurement === 'cabinet'
  ? Math.ceil((Number(item.width) || 0) / .5) * Math.ceil((Number(item.height) || 0) / .5) * (Number(item.quantity) || 1)
  : item.unit === 'м²'
    ? (Number(item.width) || 0) * (Number(item.height) || 0) * (Number(item.quantity) || 1)
    : Number(item.quantity) || 1;

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [prices, setPrices] = useState({});
  const [installationFee, setInstallationFee] = useState(0);
  const [quotes, setQuotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quotePrices, setQuotePrices] = useState({});
  const [quoteInstall, setQuoteInstall] = useState(false);
  const [quoteInstallFee, setQuoteInstallFee] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('requests');
  const [adminEmail, setAdminEmail] = useState('');

  const load = async () => {
    const endpoints = ['/api/admin/prices', '/api/admin/quotes', '/api/admin/settings'];
    const responses = await Promise.all(endpoints.map((url) => fetch(url, { credentials: 'include', cache: 'no-store' })));
    const failed = responses.filter((r) => !r.ok);
    if (failed.length) {
      const details = await Promise.all(failed.map(async (r) => {
        try { return (await r.json()).error || ''; } catch { return ''; }
      }));
      const status = [...new Set(failed.map((r) => r.status))].join('/');
      const reason = [...new Set(details.filter(Boolean))].join(' | ');
      throw new Error(`Мэдээлэл татаж чадсангүй (HTTP ${status})${reason ? ': ' + reason : ''}`);
    }
    const [p, q, settings] = await Promise.all(responses.map((r) => r.json()));
    setPrices(p.prices || {});
    setInstallationFee(p.installationFee || 0);
    setQuotes(q);
    setAdminEmail(settings.adminEmail || '');
  };

 useEffect(() => {
  const checkStatus = async () => {
    try {
      const r = await fetch('/api/admin/status', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      const text = await r.text();
      let d;
      try { d = JSON.parse(text); } catch { throw new Error(`Серверийн хариу буруу байна (HTTP ${r.status}): ${text.slice(0, 120)}`); }

      setConfigured(d.configured);
      setAuthenticated(d.authenticated);

      if (d.authenticated) {
        await load();
      }
    } catch (e) {
      setError(e instanceof TypeError ? 'Сервертэй холбогдож чадсангүй.' : e.message);
    }
  };

  checkStatus();
}, []);
  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => { load().catch(e => setError(e.message)); }, 10000);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  const login = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password }),
});
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Нэвтрэх боломжгүй.');
      setAuthenticated(true); setPassword(''); await load();
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const logout = async () => { await fetch('/api/admin/logout',{method:'POST'}); setAuthenticated(false); setQuotes([]); };
  const savePrices = async () => {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/prices',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({prices,installationFee})});
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Хадгалж чадсангүй.');
      setPrices(d.prices || prices); setError('Үнийн мэдээлэл хадгалагдлаа.');
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const saveEmailSettings = async () => { setBusy(true); setError(''); try { const r=await fetch('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({adminEmail})}); const d=await r.json(); if(!r.ok) throw new Error(d.error || 'Хадгалж чадсангүй.'); setError('Имэйл хаяг хадгалагдлаа.'); } catch(e){setError(e.message);} finally{setBusy(false);} };
  const openQuote = (q) => {
    setSelected(q);
    setQuotePrices(Object.fromEntries(q.items.map(i => [i.name, prices[i.name] ?? ''])));
    setQuoteInstall(Boolean(q.installationRequested)); setQuoteInstallFee(Number(installationFee) || 0); setNote('');
  };
  const approve = async () => {
    if (!selected) return; setBusy(true); setError('');
    try {
      const r = await fetch(`/api/admin/quotes/${selected.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({prices:quotePrices,installation:quoteInstall,installationFee:quoteInstallFee,note})});
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Баталгаажуулж чадсангүй.');
      await load(); setSelected(null); setError('Үнийн санал хэрэглэгчид нээгдлээ.');
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  const selectedTotal = useMemo(() => selected ? selected.items.reduce((s,i)=>s+amount(i)*(Number(quotePrices[i.name])||0),0)+(quoteInstall?Number(quoteInstallFee)||0:0) : 0,[selected,quotePrices,quoteInstall,quoteInstallFee]);
  const printSelectedQuote = () => { if (selected) window.print(); };

  if (!authenticated) return <main className="admin-shell"><section className="admin-login-card"><a href="/" className="admin-back">← LED Mongolia</a><div className="admin-kicker">LED MONGOLIA · PRIVATE</div><h1>Admin нэвтрэх</h1><p>Үнийн санал, бүтээгдэхүүний үнэ болон хүсэлтүүдийг удирдах хэсэг.</p>{!configured && <p className="admin-error">Серверийн .env файлд ADMIN_PASSWORD тохируулна уу.</p>}<form onSubmit={login}><label>Нууц үг<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label><button disabled={busy}>{busy?'Нэвтэрч байна…':'Нэвтрэх'}</button></form>{error && <p className="admin-error">{error}</p>}</section></main>;

  return <main className="admin-shell"><header className="admin-top"><div><a href="/" className="admin-back">← Үндсэн сайт</a><div className="admin-kicker">LED MONGOLIA · ADMIN</div><h1>Удирдлагын самбар</h1></div><button className="admin-logout" onClick={logout}>Гарах</button></header>
    <nav className="admin-tabs"><button className={tab==='requests'?'active':''} onClick={()=>setTab('requests')}>Үнийн саналын хүсэлт ({quotes.filter(q=>q.status==='pending').length})</button><button className={tab==='prices'?'active':''} onClick={()=>setTab('prices')}>Бүтээгдэхүүний үнэ</button><button className={tab==='email'?'active':''} onClick={()=>setTab('email')}>Имэйл тохиргоо</button></nav>
    {error && <div className="admin-message">{error}</div>}
    {tab==='email' ? <section className="admin-panel"><h2>Имэйл тохиргоо</h2><p>Шинэ хүсэлтийн мэдэгдэл энэ хаягт ирнэ. Баталгаажсан үнийн санал хэрэглэгчийн оруулсан имэйл рүү PDF хавсралттай илгээгдэнэ.</p><label className="admin-install">Админы имэйл хаяг<input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="admin@example.com" /></label><button className="admin-primary" disabled={busy} onClick={saveEmailSettings}>Имэйл хаяг хадгалах</button><p>Илгээх серверийн SMTP тохиргоог серверийн .env файлд тусад нь тохируулна.</p></section> : tab==='prices' ? <section className="admin-panel"><h2>Бүтээгдэхүүний үнийн жагсаалт</h2><p>Module LED м²-аар, бусад LED cabinet 50×50см ширхэгээр бодогдоно.</p><div className="admin-price-grid">{products.map(p=><label key={p.name}><span>{p.name}<small>{p.category} · {p.category==='LED дэлгэц' ? (/module/i.test(p.name)?'м²':'cabinet / ш'):'ширхэг'}</small></span><input type="number" min="0" value={prices[p.name]??''} onChange={e=>setPrices(v=>({...v,[p.name]:e.target.value===''?'':Number(e.target.value)}))}/><b>₮</b></label>)}</div><label className="admin-install">Суурилуулалтын үнэ (10 хүн)<input type="number" min="0" value={installationFee} onChange={e=>setInstallationFee(Number(e.target.value)||0)}/></label><button className="admin-primary" disabled={busy} onClick={savePrices}>Үнийг хадгалах</button></section> : <section className="admin-requests"><div className="admin-request-list">{quotes.length===0?<p>Одоогоор үнийн саналын хүсэлт алга.</p>:quotes.map(q=><button key={q.id} className={`admin-request ${selected?.id===q.id?'chosen':''}`} onClick={()=>openQuote(q)}><span className={`admin-status ${q.status}`}>{q.status==='approved'?'Баталгаажсан':'Шинэ хүсэлт'}</span><strong>{q.customer.name}</strong><span>{q.customer.phone}</span><small>{new Date(q.createdAt).toLocaleString('mn-MN')} · {q.items.length} бүтээгдэхүүн</small></button>)}</div>
      {selected ? <article className="admin-panel admin-detail"><div className="admin-detail-head"><div><h2>{selected.customer.name}</h2><p>{selected.customer.phone} · {selected.customer.email || 'Имэйл оруулаагүй'} · {selected.customer.address || 'Хаяг оруулаагүй'}{(selected.customer.dateFrom || selected.customer.dateTo) ? ` · ${selected.customer.dateFrom || '…'} – ${selected.customer.dateTo || '…'}` : ''}</p></div><button onClick={()=>setSelected(null)}>Хаах</button></div><table><thead><tr><th>Бүтээгдэхүүн</th><th>Хэмжээ</th><th>Тоо / нэгж</th><th>Үнэ</th><th>Нийт</th></tr></thead><tbody>{selected.items.map((i,idx)=><React.Fragment key={idx}><tr><td>{i.name}</td><td>{i.width?`${i.width} × ${i.height} м`:'—'}</td><td>{amount(i)} {i.measurement==='cabinet'?'ш':i.unit}</td><td><input type="number" min="0" value={quotePrices[i.name]??''} onChange={e=>setQuotePrices(v=>({...v,[i.name]:e.target.value===''?'':Number(e.target.value)}))}/></td><td>{money(amount(i)*(Number(quotePrices[i.name])||0))}</td></tr>{i.width && i.height && <tr className="admin-diagram-row"><td colSpan="5"><LedDiagramPanel width={i.width} height={i.height} quantity={i.quantity} measurement={i.measurement} curved={/curved|numarsan/i.test(i.name||'')} cube={/cube/i.test(i.name||'')}/></td></tr>}</React.Fragment>)}</tbody></table><label className="admin-check"><input type="checkbox" checked={quoteInstall} onChange={e=>setQuoteInstall(e.target.checked)}/> Суурилуулалт нэмэх (10 хүн)</label>{quoteInstall&&<label className="admin-install">Суурилуулалтын үнэ<input type="number" min="0" value={quoteInstallFee} onChange={e=>setQuoteInstallFee(Number(e.target.value)||0)}/></label>}<label className="admin-note">Хэрэглэгчид харагдах тайлбар<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Нэмэлт нөхцөл, тайлбар..."/></label><div className="admin-total"><span>Нийт үнийн санал</span><strong>{money(selectedTotal)}</strong></div><div className="admin-quote-actions"><button className="admin-print" type="button" onClick={printSelectedQuote}>PDF татах / Хэвлэх</button><button className="admin-primary" disabled={busy || selected.status==='approved'} onClick={approve}>{selected.status==='approved'?'Аль хэдийн баталгаажсан':'Үнийн саналыг баталгаажуулж хэрэглэгчид илгээх'}</button></div>{selected.status==='approved'&&<p>Имэйл төлөв: {selected.emailStatus==='sent'?'Амжилттай илгээсэн':selected.emailStatus==='failed'?'Илгээж чадсангүй — SMTP тохиргоог шалгана уу.':'SMTP тохиргоо хийгдээгүй'} · Баталгаажсан: {new Date(selected.approvedPrices.approvedAt).toLocaleString('mn-MN')}</p>}</article> : <div className="admin-panel admin-empty">Зүүн талаас хүсэлт сонгож үнийг тохируулна уу.</div>}</section>}
  </main>;
}