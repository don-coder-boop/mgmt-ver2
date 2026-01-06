
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  ShoppingBag, 
  LogOut, 
  Settings, 
  Package, 
  Truck, 
  BarChart3, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  X,
  Upload,
  Download,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Collection, 
  Product, 
  ShippingEntry, 
  ShippingStatus, 
  CartItem, 
  AppState 
} from './types';
import { 
  compressImage, 
  getStorageUsage, 
  MAX_STORAGE_MB, 
  generateId, 
  downloadCSV 
} from './utils';

// --- Local Storage Management ---
const STORAGE_KEY = 'nuuanu_app_state';

const defaultState: AppState = {
  collections: [],
  activeCollectionId: null,
  adminAccessCode: 'admin'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultState;
    } catch (e) {
      console.error("Failed to parse storage", e);
      return defaultState;
    }
  });

  const [currentUser, setCurrentUser] = useState<'admin' | 'influencer' | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<'login' | 'select_collection' | 'admin' | 'influencer'>('login');
  const [adminSubView, setAdminSubView] = useState<'settings' | 'products' | 'shipping' | 'report'>('settings');
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const notify = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLogin = () => {
    const code = accessCodeInput.trim().toLowerCase();
    
    // Admin check (case-insensitive)
    if (code === state.adminAccessCode.toLowerCase()) {
      setCurrentUser('admin');
      setView('select_collection');
      return;
    }

    // Influencer check (case-insensitive)
    const matched = state.collections.find(c => c.accessCode.toLowerCase() === code);
    if (matched) {
      setActiveCollection(matched);
      setCurrentUser('influencer');
      setView('influencer');
      return;
    }

    notify('Invalid Access Code', 'error');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCollection(null);
    setCart([]);
    setView('login');
    setAccessCodeInput('');
  };

  const updateCollection = (updated: Collection) => {
    const newCollections = state.collections.map(c => c.id === updated.id ? updated : c);
    setState(prev => ({ ...prev, collections: newCollections }));
    setActiveCollection(updated);
  };

  const createCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    
    if (parseFloat(getStorageUsage()) >= MAX_STORAGE_MB * 0.95) {
      notify('Storage nearly full. Delete old collections first.', 'error');
      return;
    }

    const newColl: Collection = {
      id: generateId(),
      name,
      accessCode: generateId().substring(0, 6),
      maxProducts: 2,
      lookbookImages: [],
      descriptionTitle: 'Collection Story',
      descriptionBody: 'Share the inspiration behind this season.',
      products: [],
      shippingEntries: []
    };

    setState(prev => ({
      ...prev,
      collections: [...prev.collections, newColl]
    }));

    // Immediately select and navigate
    setActiveCollection(newColl);
    setView('admin');
    setAdminSubView('settings');
    setIsCreateModalOpen(false);
    setNewCollectionName('');
    notify(`Collection "${name}" created`, 'success');
  };

  const usagePercent = (parseFloat(getStorageUsage()) / MAX_STORAGE_MB) * 100;

  // --- RENDERING ---

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      {view === 'login' && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-12 animate-fade-in">
            <h1 className="text-5xl font-light tracking-[0.3em] uppercase">nuuanu</h1>
            <div className="space-y-6">
              <input
                type="text"
                placeholder="ACCESS CODE"
                className="w-full border-b border-gray-300 py-4 text-center focus:outline-none focus:border-black transition-colors uppercase tracking-[0.2em] text-sm bg-transparent"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
              <button
                onClick={handleLogin}
                className="w-full bg-black text-white py-5 text-[10px] tracking-[0.4em] hover:bg-gray-800 transition-colors uppercase font-medium"
              >
                Entrance
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'select_collection' && currentUser === 'admin' && (
        <div className="min-h-screen bg-white p-8 sm:p-16">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="flex justify-between items-end border-b border-gray-100 pb-8">
              <div>
                <h2 className="text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-2">Management</h2>
                <h1 className="text-3xl font-light tracking-widest uppercase">Collections</h1>
              </div>
              <button onClick={handleLogout} className="text-[10px] tracking-[0.3em] uppercase border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-colors">Logout</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {state.collections.map(coll => (
                <div 
                  key={coll.id}
                  onClick={() => {
                    setActiveCollection(coll);
                    setAdminSubView('settings');
                    setView('admin');
                  }}
                  className="group bg-white border border-gray-100 p-10 hover:border-black transition-all cursor-pointer flex flex-col items-center justify-center space-y-6 text-center aspect-square"
                >
                  <div className="w-16 h-16 bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all rounded-full">
                    <Package size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-1">{coll.name}</h3>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Entry: {coll.accessCode}</p>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="border border-dashed border-gray-200 p-10 hover:border-black hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-6 text-center aspect-square"
              >
                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-black transition-all rounded-full">
                  <Plus size={24} strokeWidth={1} />
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase font-bold">Create New</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'admin' && activeCollection && (
        <AdminDashboard 
          collection={activeCollection} 
          onUpdate={updateCollection} 
          onBack={() => setView('select_collection')}
          activeSubView={adminSubView}
          setSubView={setAdminSubView}
          notify={notify}
          adminAccessCode={state.adminAccessCode}
          updateAdminCode={(code) => setState(prev => ({ ...prev, adminAccessCode: code }))}
          usagePercent={usagePercent}
          error={error}
          success={success}
          onDelete={() => {
            if (window.confirm(`Delete "${activeCollection.name}"?`)) {
              const next = state.collections.filter(c => c.id !== activeCollection.id);
              setState(prev => ({ ...prev, collections: next }));
              setView('select_collection');
              setActiveCollection(null);
              notify('Collection deleted', 'success');
            }
          }}
        />
      )}

      {view === 'influencer' && activeCollection && (
        <InfluencerPage 
          collection={activeCollection} 
          cart={cart}
          setCart={setCart}
          onLogout={handleLogout}
          notify={notify}
          error={error}
          success={success}
          onSubmission={(newEntries) => {
            const updatedCollection = {
              ...activeCollection,
              shippingEntries: [...activeCollection.shippingEntries, ...newEntries]
            };
            updateCollection(updatedCollection);
          }}
        />
      )}

      {/* Persistent Components */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreateModalOpen(false)}>
          <div className="bg-white p-12 w-full max-w-md shadow-2xl space-y-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em]">New Collection</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-black"><X size={20} strokeWidth={1} /></button>
            </div>
            <div className="space-y-8">
              <input 
                autoFocus
                type="text"
                placeholder="COLLECTION NAME"
                className="w-full border-b border-gray-300 py-4 text-sm focus:outline-none focus:border-black tracking-[0.2em] uppercase bg-transparent"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              />
              <button 
                onClick={createCollection}
                className="w-full bg-black text-white py-5 text-[10px] tracking-[0.4em] uppercase hover:bg-gray-800 transition-colors font-bold"
              >
                Confirm Creation
              </button>
            </div>
          </div>
        </div>
      )}

      <StorageMonitor percent={usagePercent} />
      <Toast error={error} success={success} />
    </div>
  );
};

// --- COMPONENTS ---

const Toast: React.FC<{ error: string | null; success: string | null }> = ({ error, success }) => {
  if (error) return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-4 text-[10px] tracking-[0.4em] uppercase font-bold z-[300] shadow-lg">
      STORAGE FULL! / {error}
    </div>
  );
  if (success) return (
    <div className="fixed top-0 left-0 right-0 bg-black text-white text-center py-4 text-[10px] tracking-[0.4em] uppercase z-[300] shadow-lg font-medium">
      {success}
    </div>
  );
  return null;
};

const StorageMonitor: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="fixed bottom-6 right-6 bg-white border border-gray-100 p-4 rounded-sm shadow-xl z-50 min-w-[140px] animate-fade-in">
    <div className="flex justify-between items-center mb-2 text-[9px] tracking-[0.2em] text-gray-400 uppercase font-bold">
      <span>Local Space</span>
      <span className={percent > 90 ? 'text-red-500' : 'text-black'}>{percent.toFixed(1)}%</span>
    </div>
    <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ease-out ${percent > 90 ? 'bg-red-500' : 'bg-black'}`} 
        style={{ width: `${Math.min(percent, 100)}%` }} 
      />
    </div>
  </div>
);

// --- ADMIN DASHBOARD ---

interface AdminDashboardProps {
  collection: Collection;
  onUpdate: (c: Collection) => void;
  onBack: () => void;
  activeSubView: string;
  setSubView: (v: any) => void;
  notify: (m: string, t: 'success' | 'error') => void;
  adminAccessCode: string;
  updateAdminCode: (c: string) => void;
  usagePercent: number;
  error: string | null;
  success: string | null;
  onDelete: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { collection, onUpdate, onBack, activeSubView, setSubView, notify, adminAccessCode, updateAdminCode, usagePercent, onDelete } = props;
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const handleUpdate = (updates: Partial<Collection>) => {
    onUpdate({ ...collection, ...updates });
    notify('Changes Saved', 'success');
  };

  const toggleEntrySelection = (id: string) => {
    const next = new Set(selectedEntries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEntries(next);
  };

  const toggleAllSelection = () => {
    if (selectedEntries.size === collection.shippingEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(collection.shippingEntries.map(e => e.id)));
    }
  };

  const handleDownload = () => {
    // If some items are selected, download only those. Otherwise, download all.
    const dataToDownload = selectedEntries.size > 0 
      ? collection.shippingEntries.filter(e => selectedEntries.has(e.id))
      : collection.shippingEntries;
    
    downloadCSV(`${collection.name}_shipping_export.csv`, dataToDownload);
    notify(`Exported ${dataToDownload.length} items`, 'success');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-gray-100 py-6 px-10 flex justify-between items-center bg-white sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center space-x-10">
          <button onClick={onBack} className="text-[10px] uppercase tracking-[0.3em] flex items-center hover:text-gray-400 transition-colors font-bold group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" strokeWidth={1} /> Back
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <h2 className="text-xs font-bold tracking-[0.4em] uppercase">{collection.name}</h2>
        </div>
        <nav className="flex items-center space-x-12">
          {[
            { id: 'settings', label: 'Basics', icon: Settings },
            { id: 'products', label: 'Catalog', icon: Package },
            { id: 'shipping', label: 'Shipments', icon: Truck },
            { id: 'report', label: 'Reports', icon: BarChart3 },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setSubView(tab.id)}
              className={`flex items-center space-x-2 text-[10px] uppercase tracking-[0.3em] transition-all relative py-1 ${activeSubView === tab.id ? 'text-black font-bold' : 'text-gray-400 hover:text-black'}`}
            >
              <tab.icon size={14} strokeWidth={activeSubView === tab.id ? 2 : 1} />
              <span className="hidden md:inline">{tab.label}</span>
              {activeSubView === tab.id && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black animate-fade-in" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-10 overflow-auto">
        {activeSubView === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-16 animate-fade-in">
            <section className="space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] border-b border-gray-100 pb-4">Security & Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <label className="block text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Admin Code</label>
                  <input 
                    type="text" 
                    value={adminAccessCode} 
                    onChange={(e) => updateAdminCode(e.target.value)}
                    className="w-full border-b border-gray-200 py-3 focus:outline-none focus:border-black text-xs tracking-[0.2em] bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Influencer Access Code</label>
                  <input 
                    type="text" 
                    value={collection.accessCode} 
                    onChange={(e) => handleUpdate({ accessCode: e.target.value })}
                    className="w-full border-b border-gray-200 py-3 focus:outline-none focus:border-black text-xs tracking-[0.2em] bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Selection Limit (Items)</label>
                  <input 
                    type="number" 
                    value={collection.maxProducts} 
                    onChange={(e) => handleUpdate({ maxProducts: parseInt(e.target.value) || 1 })}
                    className="w-full border-b border-gray-200 py-3 focus:outline-none focus:border-black text-xs tracking-[0.2em] bg-transparent"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] border-b border-gray-100 pb-4">Collection Story</h3>
              <div className="space-y-8">
                <input 
                  placeholder="TITLE"
                  className="w-full text-2xl font-light tracking-[0.3em] border-b border-gray-100 py-4 focus:outline-none focus:border-black bg-transparent"
                  value={collection.descriptionTitle}
                  onChange={(e) => handleUpdate({ descriptionTitle: e.target.value })}
                />
                <textarea 
                  placeholder="STORY CONTENT (Supports <br/> for line breaks)"
                  className="w-full h-48 border border-gray-100 p-6 text-xs font-light tracking-widest focus:outline-none focus:border-black leading-relaxed"
                  value={collection.descriptionBody}
                  onChange={(e) => handleUpdate({ descriptionBody: e.target.value })}
                />
              </div>
            </section>

            <section className="space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] border-b border-gray-100 pb-4">Lookbook (1:1.5)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {collection.lookbookImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-[1/1.5] group border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
                    <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <button 
                      onClick={() => {
                        const next = [...collection.lookbookImages];
                        next.splice(idx, 1);
                        handleUpdate({ lookbookImages: next });
                      }}
                      className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <X size={14} strokeWidth={1} />
                    </button>
                  </div>
                ))}
                <label className="aspect-[1/1.5] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group">
                  <Upload size={24} className="mb-3 text-gray-200 group-hover:text-black transition-colors" strokeWidth={1} />
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold group-hover:text-black">Add Frame</span>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    onChange={async (e) => {
                      if (e.target.files) {
                        const newImages = [];
                        for (const file of Array.from(e.target.files)) {
                          newImages.push(await compressImage(file));
                        }
                        handleUpdate({ lookbookImages: [...collection.lookbookImages, ...newImages] });
                      }
                    }} 
                  />
                </label>
              </div>
            </section>

            <section className="pt-16 border-t border-gray-100 text-center">
              <button 
                onClick={onDelete}
                className="text-red-400 text-[9px] uppercase tracking-[0.4em] inline-flex items-center hover:text-red-600 transition-colors font-bold px-8 py-3 bg-red-50 hover:bg-red-100 rounded-full"
              >
                <Trash2 size={12} className="mr-2" strokeWidth={2} /> Dangerous: Delete Collection
              </button>
            </section>
          </div>
        )}

        {activeSubView === 'products' && (
          <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Product Catalog</h3>
              <button 
                onClick={() => {
                  const newProd: Product = {
                    id: generateId(),
                    name: 'New Item',
                    price: '0',
                    options: ['OS'],
                    description: '',
                    images: []
                  };
                  handleUpdate({ products: [...collection.products, newProd] });
                }}
                className="bg-black text-white px-8 py-3 text-[9px] uppercase tracking-[0.3em] flex items-center hover:bg-gray-800 transition-all font-bold"
              >
                <Plus size={14} className="mr-2" /> Add Manually
              </button>
            </div>

            <div className="space-y-10">
              {collection.products.map(prod => (
                <div key={prod.id} className="border border-gray-100 p-8 flex flex-col lg:flex-row gap-10 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 tracking-widest font-bold">Display Name</label>
                      <input 
                        className="w-full border-b border-gray-100 py-2 text-xs font-medium focus:outline-none focus:border-black tracking-widest"
                        value={prod.name}
                        onChange={(e) => {
                          const next = collection.products.map(p => p.id === prod.id ? { ...p, name: e.target.value } : p);
                          onUpdate({ ...collection, products: next });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 tracking-widest font-bold">Price Label (KRW)</label>
                      <input 
                        className="w-full border-b border-gray-100 py-2 text-xs font-medium focus:outline-none focus:border-black tracking-widest"
                        value={prod.price}
                        onChange={(e) => {
                          const next = collection.products.map(p => p.id === prod.id ? { ...p, price: e.target.value } : p);
                          onUpdate({ ...collection, products: next });
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 tracking-widest font-bold">Size Options (Comma separated)</label>
                      <input 
                        className="w-full border-b border-gray-100 py-2 text-xs font-medium focus:outline-none focus:border-black tracking-widest"
                        value={prod.options.join(',')}
                        onChange={(e) => {
                          const next = collection.products.map(p => p.id === prod.id ? { ...p, options: e.target.value.split(',').map(o => o.trim()) } : p);
                          onUpdate({ ...collection, products: next });
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9px] uppercase text-gray-400 tracking-widest font-bold">Summary & Details</label>
                      <textarea 
                        className="w-full border border-gray-100 p-4 text-xs h-32 focus:outline-none focus:border-black leading-relaxed tracking-wider"
                        value={prod.description}
                        onChange={(e) => {
                          const next = collection.products.map(p => p.id === prod.id ? { ...p, description: e.target.value } : p);
                          onUpdate({ ...collection, products: next });
                        }}
                      />
                    </div>
                  </div>

                  <div className="lg:w-80 space-y-6">
                    <label className="text-[9px] uppercase text-gray-400 tracking-widest font-bold">Visuals (2:3 Ratio)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {prod.images.map((img, i) => (
                        <div key={i} className="aspect-[2/3] bg-gray-50 relative group border border-gray-100 overflow-hidden">
                          <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <button 
                            onClick={() => {
                              const pIdx = collection.products.findIndex(p => p.id === prod.id);
                              const newImgs = [...prod.images];
                              newImgs.splice(i, 1);
                              const nextProds = [...collection.products];
                              nextProds[pIdx].images = newImgs;
                              onUpdate({ ...collection, products: nextProds });
                            }}
                            className="absolute -top-1 -right-1 bg-white shadow-xl p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:text-white"
                          >
                            <X size={12} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-[2/3] border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all group">
                        <Upload size={18} className="text-gray-200 group-hover:text-black transition-colors" strokeWidth={1} />
                        <input type="file" className="hidden" multiple onChange={async (e) => {
                          if (e.target.files) {
                            const newImages = [];
                            for (const file of Array.from(e.target.files)) {
                              newImages.push(await compressImage(file));
                            }
                            const pIdx = collection.products.findIndex(p => p.id === prod.id);
                            const nextProds = [...collection.products];
                            nextProds[pIdx].images = [...prod.images, ...newImages];
                            onUpdate({ ...collection, products: nextProds });
                          }
                        }} />
                      </label>
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <button 
                        onClick={() => {
                          if(window.confirm('Delete this product from catalog?')) {
                            const next = collection.products.filter(p => p.id !== prod.id);
                            onUpdate({ ...collection, products: next });
                          }
                        }}
                        className="text-red-400 text-[9px] uppercase tracking-[0.2em] flex items-center hover:text-red-600 transition-colors font-bold"
                      >
                        <Trash2 size={12} className="mr-2" strokeWidth={2} /> Remove Product
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="sticky bottom-10 flex justify-center pb-10">
              <button 
                onClick={() => notify('Product Changes Synchronized', 'success')}
                className="bg-black text-white px-20 py-5 text-[10px] tracking-[0.5em] uppercase shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
              >
                Confirm Full Catalog Save
              </button>
            </div>
          </div>
        )}

        {activeSubView === 'shipping' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Seeding Shipments</h3>
                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">
                  {selectedEntries.size > 0 ? `${selectedEntries.size} items selected for export` : `Exporting ${collection.shippingEntries.length} total entries`}
                </p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={handleDownload}
                  className="bg-white border border-black text-black px-8 py-3 text-[9px] uppercase tracking-[0.3em] flex items-center hover:bg-black hover:text-white transition-all font-bold"
                >
                  <Download size={14} className="mr-2" /> Download Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-sm">
              <table className="w-full text-left text-[11px] tracking-tight border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100 uppercase text-[9px] tracking-[0.3em] text-gray-400">
                    <th className="p-5 w-12 text-center">
                      <button onClick={toggleAllSelection} className="hover:text-black transition-colors">
                        {selectedEntries.size === collection.shippingEntries.length && collection.shippingEntries.length > 0 ? <CheckSquare size={16} strokeWidth={2} /> : <Square size={16} strokeWidth={1} />}
                      </button>
                    </th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Submission</th>
                    <th className="p-5">Influencer</th>
                    <th className="p-5">Contact</th>
                    <th className="p-5">Address</th>
                    <th className="p-5">Item Details</th>
                    <th className="p-5">Admin Notes</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collection.shippingEntries.map(entry => (
                    <tr key={entry.id} className={`${selectedEntries.has(entry.id) ? 'bg-black/[0.02]' : 'hover:bg-gray-50/50'} transition-all group`}>
                      <td className="p-5 text-center">
                        <button onClick={() => toggleEntrySelection(entry.id)} className="text-gray-300 hover:text-black transition-colors">
                          {selectedEntries.has(entry.id) ? <CheckSquare size={16} className="text-black" strokeWidth={2} /> : <Square size={16} strokeWidth={1} />}
                        </button>
                      </td>
                      <td className="p-5">
                        <select 
                          className={`text-[9px] px-2 py-1.5 border rounded-sm focus:outline-none font-bold uppercase tracking-widest ${entry.status === ShippingStatus.SHIPPED ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                          value={entry.status}
                          onChange={(e) => {
                            const next = collection.shippingEntries.map(s => s.id === entry.id ? { ...s, status: e.target.value as ShippingStatus } : s);
                            onUpdate({ ...collection, shippingEntries: next });
                          }}
                        >
                          <option value={ShippingStatus.PREPARING}>준비중</option>
                          <option value={ShippingStatus.SHIPPED}>배송완료</option>
                        </select>
                      </td>
                      <td className="p-5 whitespace-nowrap text-gray-400 font-mono text-[10px]">{entry.submitDate}</td>
                      <td className="p-5">
                        <div className="font-bold tracking-wider">@{entry.instagramId}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{entry.name}</div>
                      </td>
                      <td className="p-5 font-mono text-[10px] text-gray-500">{entry.phone}</td>
                      <td className="p-5 max-w-[140px]">
                        <div className="truncate text-gray-600 leading-relaxed" title={entry.address}>{entry.address}</div>
                      </td>
                      <td className="p-5">
                        <div className="space-y-2">
                          <input 
                            className="bg-transparent border-b border-transparent focus:border-black w-full font-bold tracking-wider uppercase text-[10px] pb-1"
                            placeholder="PRODUCT NAME"
                            value={entry.productName}
                            onChange={(e) => {
                              const next = collection.shippingEntries.map(s => s.id === entry.id ? { ...s, productName: e.target.value } : s);
                              onUpdate({ ...collection, shippingEntries: next });
                            }}
                          />
                          <input 
                            className="bg-transparent border-b border-transparent focus:border-black w-16 text-[9px] tracking-widest uppercase"
                            placeholder="SIZE"
                            value={entry.size}
                            onChange={(e) => {
                              const next = collection.shippingEntries.map(s => s.id === entry.id ? { ...s, size: e.target.value } : s);
                              onUpdate({ ...collection, shippingEntries: next });
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-5 min-w-[160px]">
                        <textarea 
                          className="bg-transparent border border-transparent focus:border-gray-200 focus:bg-white p-2 text-[10px] w-full resize-y min-h-[40px] leading-relaxed"
                          placeholder="Admin observations..."
                          value={entry.adminMemo}
                          onChange={(e) => {
                            const next = collection.shippingEntries.map(s => s.id === entry.id ? { ...s, adminMemo: e.target.value } : s);
                            onUpdate({ ...collection, shippingEntries: next });
                          }}
                        />
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const copy: ShippingEntry = { 
                                ...entry, 
                                id: generateId(), 
                                submitDate: '추가 제품',
                                productName: '', // Requirement: Leave blank
                                size: ''         // Requirement: Leave blank
                              };
                              onUpdate({ ...collection, shippingEntries: [...collection.shippingEntries, copy] });
                              notify('Entry duplicated (Fields cleared)', 'success');
                            }}
                            className="p-2 hover:bg-black hover:text-white transition-all rounded-full"
                            title="Duplicate Entry"
                          >
                            <Copy size={14} strokeWidth={1} />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('Irreversibly delete this shipment record?')) {
                                const next = collection.shippingEntries.filter(s => s.id !== entry.id);
                                onUpdate({ ...collection, shippingEntries: next });
                              }
                            }}
                            className="p-2 hover:bg-red-500 hover:text-white transition-all rounded-full"
                            title="Delete Record"
                          >
                            <Trash2 size={14} strokeWidth={1} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {collection.shippingEntries.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-24 text-center text-gray-300 italic uppercase tracking-[0.2em] text-[10px]">No shipment data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubView === 'report' && (
          <div className="space-y-16 animate-fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-10 border border-gray-100 shadow-sm text-center space-y-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">Total Packets</p>
                <p className="text-4xl font-light tracking-widest">{collection.shippingEntries.length}</p>
              </div>
              <div className="bg-white p-10 border border-gray-100 shadow-sm text-center space-y-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">Original Requests</p>
                <p className="text-4xl font-light tracking-widest">
                  {collection.shippingEntries.filter(s => s.submitDate !== '추가 제품').length}
                </p>
              </div>
              <div className="bg-white p-10 border border-gray-100 shadow-sm text-center space-y-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">Shipping Progress</p>
                <p className="text-4xl font-light tracking-widest">
                  {collection.shippingEntries.length ? Math.round((collection.shippingEntries.filter(s => s.status === ShippingStatus.SHIPPED).length / collection.shippingEntries.length) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="bg-white p-10 border border-gray-100 shadow-sm h-[500px]">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-12">Seeding Distribution</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={
                  Object.values(
                    collection.shippingEntries.reduce((acc, curr) => {
                      if (!curr.productName) return acc;
                      const name = curr.productName.toUpperCase();
                      acc[name] = acc[name] || { name, count: 0 };
                      acc[name].count += 1;
                      return acc;
                    }, {} as any)
                  )
                }>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#999', fontWeight: 'bold' }} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#999' }} />
                  <RechartsTooltip cursor={{ fill: '#fafafa' }} contentStyle={{ fontSize: '10px', borderRadius: '0px', border: '1px solid #eee' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {collection.shippingEntries.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#000" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- INFLUENCER PAGE ---

interface InfluencerPageProps {
  collection: Collection;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onLogout: () => void;
  notify: (m: string, t: 'success' | 'error') => void;
  error: string | null;
  success: string | null;
  onSubmission: (entries: ShippingEntry[]) => void;
}

const InfluencerPage: React.FC<InfluencerPageProps> = ({ collection, cart, setCart, onLogout, notify, onSubmission }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [view, setView] = useState<'lookbook' | 'product_detail' | 'cart' | 'success'>('lookbook');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const scrollPosRef = useRef(0);
  
  // Checkout Form
  const [formData, setFormData] = useState({
    instagramId: '',
    name: '',
    phone: '',
    address: '',
    message: '',
    extra: '',
    agreed: false
  });

  // Preserve and Restore Scroll Position between view changes
  useLayoutEffect(() => {
    if (view === 'lookbook') {
      // Small timeout to ensure DOM is ready before restoring scroll
      setTimeout(() => window.scrollTo(0, scrollPosRef.current), 0);
    }
  }, [view]);

  const handleNavigate = (newView: any) => {
    if (view === 'lookbook') {
      scrollPosRef.current = window.scrollY;
    }
    setView(newView);
  };

  const nextSlide = () => {
    if (collection.lookbookImages.length === 0) return;
    setActiveSlide(prev => (prev + 2) >= collection.lookbookImages.length ? 0 : prev + 2);
  };
  const prevSlide = () => {
    if (collection.lookbookImages.length === 0) return;
    setActiveSlide(prev => prev - 2 < 0 ? Math.max(0, collection.lookbookImages.length - (collection.lookbookImages.length % 2 || 2)) : prev - 2);
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) {
      alert('Please select a size preference.');
      return;
    }
    if (cart.length >= collection.maxProducts) {
      alert(`You've reached the selection limit of ${collection.maxProducts} products.`);
      return;
    }
    
    setCart([...cart, {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      size: selectedSize,
      image: selectedProduct.images[0] || 'https://picsum.photos/seed/nuuanu/400/600'
    }]);
    handleNavigate('lookbook');
    setSelectedProduct(null);
    setSelectedSize('');
    notify('Successfully added to selection', 'success');
  };

  const handleSubmit = () => {
    if (!formData.instagramId || !formData.name || !formData.phone || !formData.address || !formData.agreed) {
      alert('Please complete all required fields and accept the terms.');
      return;
    }

    const newEntries: ShippingEntry[] = cart.map(item => ({
      id: generateId(),
      status: ShippingStatus.PREPARING,
      submitDate: new Date().toISOString().split('T')[0],
      instagramId: formData.instagramId,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      message: formData.message,
      extra: formData.extra,
      productName: item.productName,
      size: item.size,
      quantity: 1,
      adminMemo: ''
    }));

    onSubmission(newEntries);
    handleNavigate('success');
    setCart([]);
  };

  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-10">
        <div className="max-w-xl text-center animate-fade-in space-y-10">
          <CheckCircle2 size={64} className="mx-auto text-black mb-8" strokeWidth={1} />
          <h2 className="text-2xl tracking-[0.3em] uppercase font-light">Submission Confirmed</h2>
          <p className="text-sm font-light leading-relaxed text-gray-400 tracking-widest max-w-sm mx-auto">
            Thank you, nuuanu girl! We love having you as part of our journey✨
          </p>
          <div className="pt-10">
            <button onClick={onLogout} className="text-[10px] uppercase tracking-[0.4em] border-b border-black pb-1 hover:text-gray-400 transition-colors">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Influencer Header */}
      <header className="px-10 py-8 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-gray-50">
        <h1 className="text-2xl font-light tracking-[0.5em] uppercase cursor-pointer" onClick={() => handleNavigate('lookbook')}>nuuanu</h1>
        <div className="flex items-center space-x-10">
          <button onClick={() => handleNavigate('cart')} className="relative flex items-center space-x-2 text-[10px] tracking-[0.3em] font-bold group">
            <ShoppingBag size={20} strokeWidth={1} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">SELECTION</span>
            {cart.length > 0 && (
              <span className="absolute -top-3 -right-3 bg-black text-white text-[8px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-fade-in">{cart.length}</span>
            )}
          </button>
          <button onClick={onLogout} className="text-gray-300 hover:text-black transition-colors" title="Logout">
            <LogOut size={20} strokeWidth={1} />
          </button>
        </div>
      </header>

      {view === 'lookbook' && (
        <main className="animate-fade-in">
          {/* Lookbook Slider */}
          <div className="relative mb-32 px-4 sm:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 max-w-7xl mx-auto">
              {collection.lookbookImages.length > 0 ? (
                <>
                  <div className="aspect-[1/1.5] bg-gray-50 overflow-hidden shadow-2xl">
                    <img src={collection.lookbookImages[activeSlide]} className="w-full h-full object-cover animate-fade-in" key={`slide-${activeSlide}`} />
                  </div>
                  <div className="hidden md:block aspect-[1/1.5] bg-gray-50 overflow-hidden shadow-2xl">
                    <img src={collection.lookbookImages[activeSlide + 1] || collection.lookbookImages[0]} className="w-full h-full object-cover animate-fade-in" key={`slide-side-${activeSlide}`} />
                  </div>
                </>
              ) : (
                <div className="col-span-2 aspect-[2/1.5] bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-[0.5em]">No Visuals Provided</div>
              )}
            </div>
            {collection.lookbookImages.length > 2 && (
              <div className="absolute top-1/2 -translate-y-1/2 w-full left-0 flex justify-between px-4 sm:px-16 pointer-events-none">
                <button onClick={prevSlide} className="pointer-events-auto bg-white/40 backdrop-blur-xl p-5 rounded-full hover:bg-white transition-all shadow-xl group">
                  <ChevronLeft size={24} strokeWidth={1} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button onClick={nextSlide} className="pointer-events-auto bg-white/40 backdrop-blur-xl p-5 rounded-full hover:bg-white transition-all shadow-xl group">
                  <ChevronRight size={24} strokeWidth={1} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Season Story */}
          <section className="max-w-2xl mx-auto text-center px-10 mb-40 space-y-10">
            <h2 className="text-xl font-light tracking-[0.5em] uppercase border-b border-gray-100 pb-8 inline-block mx-auto">{collection.descriptionTitle}</h2>
            <div 
              className="text-sm font-light leading-relaxed text-gray-500 tracking-widest" 
              dangerouslySetInnerHTML={{ __html: collection.descriptionBody.replace(/\n/g, '<br/>') }}
            />
          </section>

          {/* Product Grid */}
          <section className="max-w-6xl mx-auto px-10">
            <div className="flex justify-between items-end mb-16 border-b border-gray-50 pb-8">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em]">Seasonal Catalog</h3>
                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest italic">Curated for your style</p>
              </div>
              <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">Selected: {cart.length} / {collection.maxProducts}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-24">
              {collection.products.map(prod => (
                <div 
                  key={prod.id} 
                  className="group cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(prod);
                    handleNavigate('product_detail');
                  }}
                >
                  <div className="aspect-[2/3] bg-gray-50 mb-6 overflow-hidden relative shadow-lg group-hover:shadow-2xl transition-all duration-700">
                    <img src={prod.images[0] || 'https://picsum.photos/seed/nuuanu/400/600'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-700" />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="bg-white text-black px-6 py-2 text-[9px] uppercase tracking-[0.4em] font-bold shadow-2xl">Details</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase">{prod.name}</h4>
                    <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">KRW {prod.price}</p>
                  </div>
                </div>
              ))}
              {collection.products.length === 0 && (
                <div className="col-span-full py-40 text-center text-[10px] text-gray-300 uppercase tracking-[0.5em] italic">No products currently available for selection</div>
              )}
            </div>
          </section>
        </main>
      )}

      {view === 'product_detail' && selectedProduct && (
        <main className="max-w-6xl mx-auto px-10 pt-12 animate-fade-in">
          <button onClick={() => handleNavigate('lookbook')} className="text-[10px] uppercase tracking-[0.4em] mb-20 flex items-center hover:text-gray-400 transition-colors font-bold group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" strokeWidth={1} /> Return to Shop
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Visuals */}
            <div className="space-y-8">
              <div className="aspect-[2/3] bg-gray-50 shadow-2xl overflow-hidden">
                <img src={selectedProduct.images[0] || 'https://picsum.photos/seed/nuuanu/400/600'} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {selectedProduct.images.slice(1).map((img, i) => (
                  <div key={i} className="aspect-[2/3] bg-gray-50 border border-gray-100 overflow-hidden shadow-md">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            {/* Intel */}
            <div className="space-y-16">
              <div className="space-y-4 border-b border-gray-100 pb-10">
                <h2 className="text-4xl font-light tracking-[0.3em] uppercase">{selectedProduct.name}</h2>
                <p className="text-gray-400 tracking-[0.4em] text-xs">KRW {selectedProduct.price}</p>
              </div>
              
              <div 
                className="text-sm leading-relaxed text-gray-500 font-light tracking-widest max-w-md" 
                dangerouslySetInnerHTML={{ __html: selectedProduct.description.replace(/\n/g, '<br/>') }}
              />

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Size Preference</p>
                  <button className="text-[9px] text-gray-400 uppercase tracking-widest underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {selectedProduct.options.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[70px] py-3 px-5 text-[10px] tracking-[0.3em] border transition-all duration-300 font-bold ${selectedSize === size ? 'bg-black text-white border-black shadow-xl' : 'border-gray-200 hover:border-black'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-10">
                <button 
                  onClick={addToCart}
                  className="w-full bg-black text-white py-6 text-[10px] tracking-[0.5em] uppercase hover:bg-gray-800 transition-all font-bold shadow-2xl disabled:opacity-30 active:scale-[0.98]"
                >
                  Add to Selection
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === 'cart' && (
        <main className="max-w-3xl mx-auto px-10 pt-12 animate-fade-in">
          <button onClick={() => handleNavigate('lookbook')} className="text-[10px] uppercase tracking-[0.4em] mb-20 flex items-center hover:text-gray-400 transition-colors font-bold group">
            <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" strokeWidth={1} /> Continue Exploring
          </button>
          <div className="flex justify-between items-end border-b border-gray-100 pb-8 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.4em]">Current Selection</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{cart.length} / {collection.maxProducts} Allocated</p>
          </div>
          
          <div className="space-y-12 mb-24">
            {cart.map((item, idx) => (
              <div key={idx} className="flex space-x-8 items-center group">
                <div className="w-24 aspect-[2/3] bg-gray-50 shadow-lg overflow-hidden">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2">{item.productName}</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Size Preference: <span className="text-black ml-1">{item.size}</span></p>
                </div>
                <button 
                  onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                  className="text-gray-200 hover:text-red-500 transition-colors p-3"
                  title="Remove Item"
                >
                  <X size={20} strokeWidth={1} />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-24 space-y-6">
                <p className="text-[10px] text-gray-300 uppercase tracking-[0.5em] italic">Your list is currently empty</p>
                <button onClick={() => handleNavigate('lookbook')} className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-black pb-1">Shop Now</button>
              </div>
            )}
          </div>

          <div className="space-y-12 bg-gray-50 p-12 shadow-sm rounded-sm">
            <h3 className="text-xs font-bold uppercase tracking-[0.4em] border-b border-gray-200 pb-6">Delivery Details</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <input 
                  placeholder="INSTAGRAM ID (@)"
                  className="w-full border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300"
                  value={formData.instagramId}
                  onChange={e => setFormData({...formData, instagramId: e.target.value})}
                />
                <input 
                  placeholder="FULL NAME"
                  className="w-full border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <input 
                  placeholder="MOBILE NUMBER"
                  className="w-full border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
                <input 
                  placeholder="DETAILED ADDRESS"
                  className="w-full border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <textarea 
                placeholder="SHIPPING MESSAGE (OPTIONAL)"
                className="w-full h-24 border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300 resize-none"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
              <input 
                placeholder="ADDITIONAL INQUIRIES (OPTIONAL)"
                className="w-full border-b border-gray-200 bg-transparent py-4 text-xs tracking-[0.2em] focus:outline-none focus:border-black uppercase placeholder:text-gray-300"
                value={formData.extra}
                onChange={e => setFormData({...formData, extra: e.target.value})}
              />

              <label className="flex items-start space-x-4 cursor-pointer pt-6 group">
                <div className="mt-1">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={formData.agreed}
                    onChange={e => setFormData({...formData, agreed: e.target.checked})}
                  />
                  {formData.agreed ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300 group-hover:text-black transition-colors" />}
                </div>
                <span className="text-[9px] text-gray-500 leading-relaxed font-light tracking-[0.1em] uppercase">
                  *재고 상황 등에 따라 일부 내용이 달라질 수 있으며, 올려주신 콘텐츠는 브랜드 소개나 홍보에 활용될 수 있음에 동의합니다.
                </span>
              </label>

              <button 
                onClick={handleSubmit}
                className="w-full bg-black text-white py-6 text-[10px] tracking-[0.5em] uppercase hover:bg-gray-800 transition-all font-bold shadow-2xl disabled:opacity-30 mt-8"
                disabled={cart.length === 0}
              >
                Complete Submission
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
