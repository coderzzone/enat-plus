'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ShoppingBag, 
  Search, 
  Pill, 
  Sparkles, 
  Baby, 
  Shirt, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Loader2,
  X 
} from 'lucide-react';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export default function MotherpreneurMarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'medications_supplements' | 'cosmetics_care' | 'baby_essentials' | 'maternity_wear'>('all');
  
  // Order Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          shops:marketplace_shops(id, name, owner_name, phone, city, commission_percent)
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setProducts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketplace products.');
    } finally {
      setLoading(false);
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setOrdering(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const unitPrice = Number(selectedProduct.price_etb);
      const totalPrice = unitPrice * quantity;
      const commissionRate = Number(selectedProduct.shops?.commission_percent || 10) / 100;
      const commissionEarned = Math.round(totalPrice * commissionRate * 100) / 100;

      const { error: orderErr } = await supabase
        .from('marketplace_orders')
        .insert({
          mother_id: user ? user.id : null,
          shop_id: selectedProduct.shop_id,
          product_id: selectedProduct.id,
          quantity,
          total_price_etb: totalPrice,
          commission_amount_etb: commissionEarned,
          delivery_address: deliveryAddress.trim(),
          contact_phone: contactPhone.trim(),
          status: 'placed',
        });

      if (orderErr) throw orderErr;

      setOrderSuccess(true);
      setTimeout(() => {
        setSelectedProduct(null);
        setOrderSuccess(false);
        setQuantity(1);
        setDeliveryAddress('');
        setContactPhone('');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to place order.');
    } finally {
      setOrdering(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.shops?.name && p.shops.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const categories = [
    { id: 'all', label: 'All Items', icon: ShoppingBag },
    { id: 'medications_supplements', label: 'Supplements & Meds', icon: Pill },
    { id: 'cosmetics_care', label: 'Cosmetics & Care', icon: Sparkles },
    { id: 'baby_essentials', label: 'Baby Goods', icon: Baby },
    { id: 'maternity_wear', label: 'Maternity Comfort', icon: Shirt },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Loading Motherpreneur Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Motherpreneur Marketplace</h1>
            <p className="text-xs text-stone-500">Verified maternal health, baby essentials & safe skincare</p>
          </div>
        </div>
      </div>

      {/* Mandatory Pharmaceutical & Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed flex items-start space-x-2">
        <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="text-[11px]">
          <span className="font-bold">Medical Safety Guarantee:</span> Prescription medications are dispensed only through licensed partner pharmacies upon prescription verification. Always consult your midwife or doctor before starting new supplements.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prenatal vitamins, belly butter, baby items..."
          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-enat-600 shadow-2xs"
        />
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? 'bg-enat-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-start justify-between">
                <span className="text-2xl p-2 bg-stone-50 rounded-xl border border-stone-100 inline-block mb-2">
                  {p.image_emoji || '📦'}
                </span>
                <span className="text-sm font-extrabold text-enat-800">
                  {p.price_etb} <span className="text-[10px] font-normal text-stone-500">ETB</span>
                </span>
              </div>

              <h3 className="text-xs font-bold text-stone-900 leading-snug">{p.name}</h3>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="border-t border-stone-100 pt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span className="flex items-center gap-1 font-medium text-stone-700 truncate max-w-[150px]">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  {p.shops?.name}
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  In Stock
                </span>
              </div>

              <button
                onClick={() => setSelectedProduct(p)}
                className="w-full bg-enat-700 hover:bg-enat-800 text-white font-medium text-xs py-2 rounded-xl transition shadow-2xs"
              >
                Order / Inquire
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-8 text-center text-stone-400 space-y-2">
          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-xs font-semibold text-stone-700">No products found in this category.</p>
        </div>
      )}

      {/* Order Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-enat-700 uppercase bg-enat-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  {selectedProduct.shops?.name}
                </span>
                <h3 className="text-sm font-bold text-stone-900">{selectedProduct.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold">Order Inquired Successfully!</p>
                <p className="text-[11px] text-emerald-700">The shop has been notified and will contact you for delivery.</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-600 font-medium">Price per unit:</span>
                  <span className="font-bold text-stone-900">{selectedProduct.price_etb} ETB</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Your Delivery Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bole Sub-city, Woreda 03, House 412"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 91 234 5678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                  />
                </div>

                <div className="p-2.5 bg-stone-100 rounded-xl text-xs flex justify-between font-bold text-stone-900">
                  <span>Total Amount:</span>
                  <span>{Number(selectedProduct.price_etb) * quantity} ETB</span>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ordering}
                    className="px-4 py-2 text-xs font-semibold bg-enat-700 hover:bg-enat-800 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
                  >
                    {ordering ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
