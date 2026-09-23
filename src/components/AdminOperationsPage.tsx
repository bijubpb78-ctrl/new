import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, MessageSquare, PackageSearch, RefreshCw, Save, Search, Trash2, Truck } from 'lucide-react';
import { PILATES_PRODUCTS } from '../data/products';
import { Product } from '../types';

type Inquiry = { id: string; name: string; email: string; phone?: string; subject: string; message: string; status: string; created_at: string };
type Shipment = { order_id: string; cj_order_id?: string; tracking_number?: string; carrier?: string; tracking_url?: string; status: string; source: string; updated_at: string };
type Override = { id: string; data?: string; deleted: number };

const emptyProduct = (): Product => ({
  id: `product-${Date.now()}`, name: '', slug: '', subtitle: '', category: 'Props & Resistance', basePriceUSD: 0,
  sku: '', weightKg: 0, dimensions: '', material: '', images: [], description: '', features: [], includedItems: [],
  warehouses: [{ warehouse: 'Central Atelier Hub', stock: 0, dispatchHours: 24 }], reviews: [], rating: 5, reviewCount: 0,
});

export const AdminOperationsPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'enquiries' | 'products' | 'tracking'>('enquiries');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [editing, setEditing] = useState<Product>(emptyProduct());
  const [sourceSku, setSourceSku] = useState('');
  const [cjMessage, setCjMessage] = useState('');
  const [shipment, setShipment] = useState({ orderId: '', cjOrderId: '', trackingNumber: '', carrier: '', trackingUrl: '', status: 'Processing' });

  const products = useMemo(() => {
    const map = new Map(PILATES_PRODUCTS.map(product => [product.id, product]));
    overrides.forEach(row => row.deleted ? map.delete(row.id) : row.data && map.set(row.id, JSON.parse(row.data)));
    return [...map.values()];
  }, [overrides]);

  const load = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/data');
    if (response.status === 401) { setAuthenticated(false); setLoading(false); return; }
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Unable to load operations data.'); setLoading(false); return; }
    setAuthenticated(true); setInquiries(data.inquiries || []); setShipments(data.shipments || []); setOverrides(data.products || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Sign-in failed.'); return; }
    setPassword(''); await load();
  };
  const saveProduct = async () => {
    const normalized = { ...editing, slug: editing.slug || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
    const response = await fetch('/api/admin/products', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(normalized) });
    const data = await response.json(); if (!response.ok) { setError(data.error); return; } await load(); setEditing(normalized);
  };
  const deleteProduct = async (id: string) => {
    await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await load(); setEditing(emptyProduct());
  };
  const sourceFromCj = async () => {
    setError(''); const response = await fetch(`/api/admin/cj-product?sku=${encodeURIComponent(sourceSku)}`); const data = await response.json();
    if (!response.ok) { setError(data.error || 'CJ lookup failed.'); return; }
    const item = data.product || {};
    setEditing({ ...emptyProduct(), id: `cj-${item.pid || Date.now()}`, sku: item.productSku || item.sku || sourceSku,
      name: item.productNameEn || item.productName || '', subtitle: item.productNameEn || '', description: item.productDescription || '',
      basePriceUSD: Number(item.sellPrice || item.productSellPrice || 0), images: [item.productImage || item.bigImage].filter(Boolean) });
  };
  const connectCj = async () => {
    setError(''); setCjMessage('Connecting…');
    const response = await fetch('/api/admin/cj-connect', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) { setCjMessage(''); setError(data.error || 'CJ connection failed.'); return; }
    setCjMessage(data.message || 'CJ connected.');
  };
  const saveShipment = async () => {
    const response = await fetch('/api/admin/shipments', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(shipment) });
    const data = await response.json(); if (!response.ok) { setError(data.error); return; } await load();
  };

  if (loading) return <div className="min-h-screen bg-[#0b0b0a] text-white grid place-items-center"><RefreshCw className="animate-spin" /></div>;
  if (!authenticated) return <div className="min-h-screen bg-[#0b0b0a] text-white grid place-items-center p-5"><form onSubmit={signIn} className="w-full max-w-sm bg-[#151513] border border-stone-800 rounded-2xl p-6 space-y-4"><h1 className="font-serif text-2xl">Fetecart Operations</h1><p className="text-sm text-stone-400">Private store management</p><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3"/><button className="w-full bg-amber-500 text-black font-bold rounded-xl py-3">Sign in</button>{error && <p className="text-red-400 text-sm">{error}</p>}<a href="/" className="block text-center text-sm text-stone-400">Return to store</a></form></div>;

  return <div className="min-h-screen bg-[#0b0b0a] text-stone-200">
    <header className="sticky top-0 z-10 bg-[#11110f] border-b border-stone-800 px-5 py-4 flex justify-between"><div><h1 className="font-serif text-xl text-white">Fetecart Operations</h1><p className="text-xs text-stone-500">Enquiries, products and shipping</p></div><div className="flex gap-2"><button onClick={load} className="p-2"><RefreshCw className="w-4"/></button><button onClick={async()=>{await fetch('/api/admin/logout',{method:'POST'});location.reload();}} className="p-2"><LogOut className="w-4"/></button></div></header>
    <main className="max-w-6xl mx-auto p-5 space-y-5">
      <div className="flex gap-2 flex-wrap">{([['enquiries',MessageSquare],['products',PackageSearch],['tracking',Truck]] as const).map(([id,Icon])=><button key={id} onClick={()=>setTab(id)} className={`px-4 py-2 rounded-xl flex gap-2 capitalize ${tab===id?'bg-amber-500 text-black':'bg-stone-900'}`}><Icon className="w-4"/>{id}</button>)}</div>
      {error && <div className="bg-red-950/40 border border-red-800 p-3 rounded-xl text-red-200">{error}</div>}
      {tab==='enquiries' && <div className="grid gap-3">{inquiries.length===0?<p className="text-stone-500">No customer enquiries yet.</p>:inquiries.map(item=><article key={item.id} className="bg-[#151513] border border-stone-800 rounded-xl p-4"><div className="flex justify-between gap-3"><div><h2 className="font-bold text-white">{item.subject}</h2><a className="text-amber-400 text-sm" href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject} (${item.id})`)}`}>{item.name} · {item.email}</a></div><select value={item.status} onChange={async e=>{await fetch('/api/admin/inquiries',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:item.id,status:e.target.value})});load();}} className="bg-stone-900 border border-stone-700 rounded-lg px-2 h-9"><option>new</option><option>open</option><option>replied</option><option>closed</option></select></div><p className="mt-3 whitespace-pre-wrap text-sm">{item.message}</p><p className="mt-2 text-xs text-stone-500">{item.id} · {new Date(item.created_at).toLocaleString()} {item.phone?`· ${item.phone}`:''}</p></article>)}</div>}
      {tab==='products' && <div className="space-y-4"><div className="bg-[#151513] border border-stone-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"><div><strong className="text-white">CJ Dropshipping connection</strong><p className="text-xs text-stone-500">Securely obtains Open ID and registers order and logistics webhooks.</p>{cjMessage&&<p className="text-emerald-400 text-sm mt-1">{cjMessage}</p>}</div><button onClick={connectCj} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg">Connect CJ</button></div><div className="grid lg:grid-cols-[300px_1fr] gap-5"><aside className="bg-[#151513] border border-stone-800 rounded-xl p-3 max-h-[70vh] overflow-auto"><button onClick={()=>setEditing(emptyProduct())} className="w-full bg-amber-500 text-black rounded-lg py-2 font-bold mb-3">Add product</button>{products.map(p=><button key={p.id} onClick={()=>setEditing(p)} className="block w-full text-left p-2 hover:bg-stone-800 rounded-lg text-sm"><strong className="block text-white">{p.name}</strong><span className="text-stone-500">{p.sku}</span></button>)}</aside><section className="space-y-4 bg-[#151513] border border-stone-800 rounded-xl p-5"><div className="flex gap-2"><input value={sourceSku} onChange={e=>setSourceSku(e.target.value)} placeholder="CJ SKU" className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3"/><button onClick={sourceFromCj} className="px-4 py-2 bg-stone-800 rounded-lg flex gap-2"><Search className="w-4"/>Source from CJ</button></div><div className="grid sm:grid-cols-2 gap-3">{[['Name','name'],['SKU','sku'],['Price USD','basePriceUSD'],['Subtitle','subtitle'],['Weight kg','weightKg'],['Dimensions','dimensions'],['Material','material']].map(([label,key])=><label key={key} className={key==='subtitle'?'sm:col-span-2':''}><span className="text-xs text-stone-400">{label}</span><input value={String((editing as any)[key]??'')} type={key==='basePriceUSD'||key==='weightKg'?'number':'text'} onChange={e=>setEditing({...editing,[key]:key==='basePriceUSD'||key==='weightKg'?Number(e.target.value):e.target.value})} className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2"/></label>)}</div><label className="block"><span className="text-xs text-stone-400">Description</span><textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} rows={5} className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2"/></label><label className="block"><span className="text-xs text-stone-400">Image URL</span><input value={editing.images[0]||''} onChange={e=>setEditing({...editing,images:e.target.value?[e.target.value]:[]})} className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2"/></label><div className="flex gap-2"><button onClick={saveProduct} className="px-5 py-2 bg-amber-500 text-black font-bold rounded-lg flex gap-2"><Save className="w-4"/>Save</button><button onClick={()=>deleteProduct(editing.id)} className="px-5 py-2 bg-red-950 text-red-300 rounded-lg flex gap-2"><Trash2 className="w-4"/>Delete</button></div></section></div></div>}
      {tab==='tracking' && <div className="grid lg:grid-cols-2 gap-5"><section className="bg-[#151513] border border-stone-800 rounded-xl p-5 space-y-3"><h2 className="font-bold text-white">Add or update tracking</h2>{Object.entries(shipment).map(([key,value])=><label key={key} className="block"><span className="text-xs text-stone-400">{key}</span>{key==='status'?<select value={value} onChange={e=>setShipment({...shipment,status:e.target.value})} className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2"><option>Processing</option><option>Dispatched</option><option>In Transit</option><option>Out for Delivery</option><option>Delivered</option></select>:<input value={value} onChange={e=>setShipment({...shipment,[key]:e.target.value})} className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2"/>}</label>)}<button onClick={saveShipment} className="px-5 py-2 bg-amber-500 text-black font-bold rounded-lg">Save tracking</button></section><section className="space-y-3">{shipments.map(s=><button key={s.order_id} onClick={()=>setShipment({orderId:s.order_id,cjOrderId:s.cj_order_id||'',trackingNumber:s.tracking_number||'',carrier:s.carrier||'',trackingUrl:s.tracking_url||'',status:s.status})} className="block w-full text-left bg-[#151513] border border-stone-800 rounded-xl p-4"><strong className="text-amber-400">{s.order_id}</strong><div>{s.status} · {s.carrier||'No carrier'} · {s.tracking_number||'No tracking number'}</div><small className="text-stone-500">Source: {s.source}</small></button>)}</section></div>}
    </main>
  </div>;
};
