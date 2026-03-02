import React, { useState } from 'react';
import { db } from '@/api/localDB';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Euro, FileText, Download, Calendar, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import InvoiceGenerator from '../components/InvoiceGenerator';

const COLORS = ['#92400e', '#d97706', '#fbbf24', '#fde68a', '#78350f'];

function StatCard({ label, value, sub, icon: Icon, trend, color = 'amber' }) {
    const colors = {
        amber: 'from-amber-500 to-amber-700',
        green: 'from-emerald-500 to-emerald-700',
        blue: 'from-blue-500 to-blue-700',
        purple: 'from-violet-500 to-violet-700',
    };
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(trend)}% vs hier
                </div>
            )}
        </div>
    );
}

export default function Finance() {
    const [period, setPeriod] = useState('7');
    const [invoiceOrders, setInvoiceOrders] = useState(null);
    const [invoiceTable, setInvoiceTable] = useState(null);

    const { data: orders = [] } = useQuery({
        queryKey: ['all-orders'],
        queryFn: () => db.entities.Order.list('-created_date', 500),
        refetchInterval: 30000,
    });

    // Filter by period
    const since = moment().subtract(parseInt(period), 'days').startOf('day');
    const periodOrders = orders.filter(o =>
        o.status !== 'cancelled' && moment(o.created_date).isAfter(since)
    );

    // Stats
    const revenue = periodOrders.reduce((s, o) => s + (o.total || 0), 0);
    const avgOrder = periodOrders.length ? revenue / periodOrders.length : 0;
    const tables = [...new Set(periodOrders.map(o => o.table_id))].length;

    // Revenue by day
    const revenueByDay = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
        const day = moment().subtract(i, 'days');
        const dayOrders = periodOrders.filter(o => moment(o.created_date).isSame(day, 'day'));
        revenueByDay.push({
            date: day.format(period === '1' ? 'HH:mm' : 'DD/MM'),
            ca: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
            commandes: dayOrders.length,
        });
    }

    // Revenue by table
    const byTable = {};
    periodOrders.forEach(o => {
        const t = `Table ${o.table_id}`;
        byTable[t] = (byTable[t] || 0) + (o.total || 0);
    });
    const tableData = Object.entries(byTable).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // Top products
    const productMap = {};
    periodOrders.forEach(o => {
        o.items?.forEach(item => {
            const k = item.product_name;
            if (!productMap[k]) productMap[k] = { name: k, qty: 0, revenue: 0 };
            productMap[k].qty += item.quantity;
            productMap[k].revenue += item.price * item.quantity;
        });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Orders by table for invoice
    const ordersByTable = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
        const k = o.table_id;
        if (!ordersByTable[k]) ordersByTable[k] = [];
        ordersByTable[k].push(o);
    });

    const generateInvoice = (tableId) => {
        setInvoiceOrders(ordersByTable[tableId] || []);
        setInvoiceTable(tableId);
    };

    return (
        <div className="min-h-screen bg-[#0f1117]">
            {/* Dark header */}
            <div className="bg-[#0f1117] border-b border-white/5 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Finances & Rapports</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Tableau de bord analytique</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white rounded-xl h-9">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Aujourd'hui</SelectItem>
                                <SelectItem value="7">7 derniers jours</SelectItem>
                                <SelectItem value="30">30 derniers jours</SelectItem>
                                <SelectItem value="90">3 mois</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Chiffre d'affaires" value={`${revenue.toFixed(0)} €`} icon={Euro} color="amber" trend={12} />
                    <StatCard label="Commandes" value={periodOrders.length} sub={`${avgOrder.toFixed(0)} € moy.`} icon={ShoppingBag} color="blue" trend={5} />
                    <StatCard label="Tables actives" value={tables} icon={Users} color="green" />
                    <StatCard label="Panier moyen" value={`${avgOrder.toFixed(2)} €`} icon={TrendingUp} color="purple" trend={-2} />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Évolution du CA</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={revenueByDay} barSize={24}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    formatter={(v) => [`${v.toFixed(2)} €`, 'CA']}
                                />
                                <Bar dataKey="ca" fill="#92400e" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table distribution */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">CA par table</h3>
                        {tableData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie data={tableData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                                            {tableData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [`${v.toFixed(2)} €`]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 mt-2">
                                    {tableData.slice(0, 4).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span className="text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{item.value.toFixed(0)} €</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Aucune donnée</div>
                        )}
                    </div>
                </div>

                {/* Top products + Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top products */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Top Produits</h3>
                        <div className="space-y-3">
                            {topProducts.length > 0 ? topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-black text-amber-800">{i + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-600 rounded-full"
                                                    style={{ width: `${(p.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 shrink-0">{p.qty} vendus</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{p.revenue.toFixed(0)} €</span>
                                </div>
                            )) : (
                                <div className="py-8 text-center text-gray-300 text-sm">Aucune donnée</div>
                            )}
                        </div>
                    </div>

                    {/* Generate invoices by table */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Générer une Facture</h3>
                            <FileText className="w-5 h-5 text-amber-700" />
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Sélectionnez une table pour générer sa facture de consommation.</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map(t => {
                                const tableOrders = ordersByTable[t] || [];
                                const tableTotal = tableOrders.reduce((s, o) => s + (o.total || 0), 0);
                                const hasOrders = tableOrders.length > 0;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => hasOrders && generateInvoice(t)}
                                        disabled={!hasOrders}
                                        className={`rounded-xl p-3 text-center transition-all border-2 ${hasOrders
                                            ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 cursor-pointer'
                                            : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <p className="text-xs font-bold text-amber-800">Table {t}</p>
                                        <p className="text-lg font-black text-gray-900">{tableTotal.toFixed(0)} €</p>
                                        <p className="text-[10px] text-gray-400">{tableOrders.length} cmd</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent orders table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Historique des Commandes</h3>
                        <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => {
                            const csv = ['ID,Table,Total,Statut,Date,Articles',
                                ...orders.map(o => [
                                    o.id?.slice(-6), o.table_id, o.total?.toFixed(2), o.status,
                                    moment(o.created_date).format('DD/MM/YYYY HH:mm'),
                                    o.items?.map(i => `${i.quantity}x ${i.product_name}`).join(' | ')
                                ].join(','))
                            ].join('\n');
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                            a.download = `rapport-${moment().format('YYYY-MM-DD')}.csv`;
                            a.click();
                        }}>
                            <Download className="w-3 h-3 mr-1" /> Exporter CSV
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <th className="px-5 py-3 text-left font-semibold">N°</th>
                                    <th className="px-5 py-3 text-left font-semibold">Table</th>
                                    <th className="px-5 py-3 text-left font-semibold">Articles</th>
                                    <th className="px-5 py-3 text-left font-semibold">Total</th>
                                    <th className="px-5 py-3 text-left font-semibold">Statut</th>
                                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                                    <th className="px-5 py-3 text-left font-semibold">Facture</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.slice(0, 20).map(order => {
                                    const statusColors = {
                                        pending: 'bg-amber-50 text-amber-700',
                                        ready: 'bg-green-50 text-green-700',
                                        delivered: 'bg-blue-50 text-blue-700',
                                        cancelled: 'bg-red-50 text-red-600',
                                    };
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs text-gray-400">#{order.id?.slice(-6).toUpperCase()}</td>
                                            <td className="px-5 py-3 font-semibold text-amber-800">T{order.table_id}</td>
                                            <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                                                {order.items?.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}
                                            </td>
                                            <td className="px-5 py-3 font-bold text-gray-900">{order.total?.toFixed(2)} €</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 text-xs">{moment(order.created_date).format('DD/MM HH:mm')}</td>
                                            <td className="px-5 py-3">
                                                {order.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => { setInvoiceOrders([order]); setInvoiceTable(order.table_id); }}
                                                        className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-700 transition-colors"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Invoice modal */}
            {invoiceOrders && (
                <InvoiceGenerator
                    orders={invoiceOrders}
                    tableId={invoiceTable}
                    onClose={() => { setInvoiceOrders(null); setInvoiceTable(null); }}
                />
            )}
        </div>
    );
}