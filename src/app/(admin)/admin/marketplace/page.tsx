'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ShoppingBag, 
  PlusCircle, 
  DollarSign, 
  Percent, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Loader2, 
  AlertCircle,
  TrendingUp 
} from 'lucide-react';

export default function SuperAdminMarketplacePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCommissionShopId, setEditingCommissionShopId] = useState<string | null>(null);
  const [newCommissionValue, setNewCommissionValue] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  async function loadMarketplaceData() {
    try {
      const supabase = createClient();
      
      // 1. Fetch shops
      const { data: shopRows, error: shopErr } = await supabase
        .from('marketplace_shops')
        .select(`
          *,
          products:marketplace_products(count)
        `)
        .order('created_at', { ascending: false });

      if (shopErr) throw shopErr;
      setShops(shopRows || []);

      // 2. Fetch orders to calculate total commission revenue
      const { data: orderRows } = await supabase
        .from('marketplace_orders')
        .select('*');

      setOrders(orderRows || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketplace data.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateCommission = async (shopId: string) => {
    try {
      const supabase = createClient();
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, commission_percent: newCommissionValue } : s))
      );

      await supabase
        .from('marketplace_shops')
        .update({ commission_percent: newCommissionValue })
        .eq('id', shopId);

      setEditingCommissionShopId(null);
    } catch (err) {
      console.error('Error updating commission:', err);
    }
  };

  const handleToggleShopStatus = async (shopId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const supabase = createClient();
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, status: nextStatus } : s))
      );

      await supabase
        .from('marketplace_shops')
        .update({ status: nextStatus })
        .eq('id', shopId);
    } catch (err) {
      console.error('Error toggling shop status:', err);
    }
  };

  // KPIs
  const totalShops = shops.length;
  const totalOrders = orders.length;
  const totalGrossSales = orders.reduce((acc, o) => acc + Number(o.total_price_etb || 0), 0);
  const totalCommissionsEarned = orders.reduce((acc, o) => acc + Number(o.commission_amount_etb || 0), 0);

  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
        <p className="text-xs">Loading marketplace control center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-teal-700" />
            Motherpreneur Marketplace & Commissions
          </h1>
          <p className="text-xs text-stone-500">
            Super Admin control of maternal shops, partner pharmacies, and platform commission revenues.
          </p>
        </div>

        <Link
          href="/admin/marketplace/new-shop"
          className="inline-flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Enrol New Shop
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Active Shops</span>
            <Store className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalShops}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Pharmacies & vendors</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalOrders}</div>
          <p className="text-[11px] text-stone-400 mt-0.5">Maternal orders placed</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total GMV Sales</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {totalGrossSales.toLocaleString()} <span className="text-xs font-normal text-stone-500">ETB</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Gross order volume</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase">Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalCommissionsEarned.toLocaleString()} <span className="text-xs font-normal text-stone-500">ETB</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Commissions earned</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops by name, owner, or city..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Registered Vendor Shops ({filteredShops.length})
          </h2>
          <span className="text-[11px] text-stone-400">
            Configured Platform Take-Rate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
                <th className="py-3 px-6">Shop & Vendor</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Commission Rate</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-stone-50/60">
                  <td className="py-4 px-6">
                    <div className="font-bold text-stone-900 text-sm">{shop.name}</div>
                    <div className="text-[11px] text-stone-500">Contact: {shop.owner_name} ({shop.phone})</div>
                  </td>

                  <td className="py-4 px-6 text-stone-600">
                    {shop.city}
                  </td>

                  <td className="py-4 px-6 capitalize text-stone-700">
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-[10px] font-medium">
                      {shop.category ? shop.category.replace('_', ' ') : 'General Care'}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    {editingCommissionShopId === shop.id ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="50"
                          value={newCommissionValue}
                          onChange={(e) => setNewCommissionValue(Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-bold border border-teal-600 rounded-lg"
                        />
                        <span className="text-xs font-semibold">%</span>
                        <button
                          onClick={() => handleUpdateCommission(shop.id)}
                          className="px-2 py-1 bg-teal-700 text-white rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-teal-800 text-sm">
                          {shop.commission_percent}%
                        </span>
                        <button
                          onClick={() => {
                            setEditingCommissionShopId(shop.id);
                            setNewCommissionValue(Number(shop.commission_percent));
                          }}
                          className="text-[10px] text-teal-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      shop.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {shop.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition ${
                        shop.status === 'active'
                          ? 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {shop.status === 'active' ? 'Suspend Shop' : 'Activate Shop'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
