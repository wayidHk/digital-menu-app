import React, { useState } from 'react';
import { db } from '@/api/localDB';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, CheckCircle, Truck, XCircle, Search, Download, ChevronDown } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

const statusConfig = {
    pending: { label: 'À préparer', icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    ready: { label: 'Prêt', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
    delivered: { label: 'Servi', icon: Truck, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    cancelled: { label: 'Annulé', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' },
};

const statusFlow = ['pending', 'ready', 'delivered'];

export default function OrdersTab({ orders, products }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => db.entities.Order.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
    });

    const cancelOrder = useMutation({
        mutationFn: async (order) => {
            const timeDiff = Date.now() - new Date(order.created_date).getTime();
            if (timeDiff > 60000) {
                throw new Error('Annulation impossible après 60 secondes');
            }
            await db.entities.Order.update(order.id, { status: 'cancelled' });
            // Restore stock
            for (const item of (order.items || [])) {
                const product = products.find(p => p.id === item.product_id);
                if (product) {
                    await db.entities.Product.update(item.product_id, {
                        stock: product.stock + item.quantity,
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Commande annulée, stock restauré');
        },
        onError: (err) => toast.error(err.message),
    });

    const advanceStatus = (order) => {
        const idx = statusFlow.indexOf(order.status);
        if (idx < statusFlow.length - 1) {
            updateMutation.mutate({ id: order.id, data: { status: statusFlow[idx + 1] } });
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesSearch = !search ||
            o.table_id?.toString().includes(search) ||
            o.id?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const exportCSV = () => {
        const headers = ['ID', 'Table', 'Total', 'Statut', 'Date', 'Articles'];
        const rows = orders.map(o => [
            o.id?.slice(-6),
            o.table_id,
            o.total?.toFixed(2),
            o.status,
            moment(o.created_date).format('DD/MM/YYYY HH:mm'),
            o.items?.map(i => `${i.quantity}x ${i.product_name}`).join(' | '),
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commandes_${moment().format('YYYY-MM-DD')}.csv`;
        a.click();
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher table ou n° commande..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'pending', label: 'À préparer' },
                        { key: 'ready', label: 'Prêts' },
                        { key: 'all', label: 'Toutes' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === f.key
                                ? 'bg-amber-800 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f.label}
                            {f.key !== 'all' && (
                                <span className="ml-1.5 opacity-70">
                                    ({orders.filter(o => o.status === f.key).length})
                                </span>
                            )}
                        </button>
                    ))}
                    <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-lg">
                        <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                </div>
            </div>

            {/* Orders list */}
            <div className="space-y-3">
                {filteredOrders.map(order => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const Icon = status.icon;
                    const canCancel = order.status === 'pending' &&
                        (Date.now() - new Date(order.created_date).getTime()) < 60000;
                    const canAdvance = statusFlow.indexOf(order.status) < statusFlow.length - 1 && order.status !== 'cancelled';

                    return (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                                        <span className="text-amber-800 font-bold text-sm">T{order.table_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-mono text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                                        <p className="text-xs text-gray-500">{moment(order.created_date).fromNow()}</p>
                                    </div>
                                </div>
                                <Badge className={`${status.color} border flex items-center gap-1`}>
                                    <Icon className="w-3 h-3" />
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="space-y-1 mb-3">
                                {order.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{item.quantity}× {item.product_name}</span>
                                        <span className="text-gray-900 font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <span className="font-bold text-lg text-gray-900">{order.total?.toFixed(2)} €</span>
                                <div className="flex gap-2">
                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => cancelOrder.mutate(order)}
                                            className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" /> Annuler
                                        </Button>
                                    )}
                                    {canAdvance && (
                                        <Button
                                            size="sm"
                                            onClick={() => advanceStatus(order)}
                                            className="bg-amber-800 hover:bg-amber-900 rounded-lg"
                                        >
                                            {order.status === 'pending' ? 'Marquer Prêt' : 'Marquer Servi'}
                                            <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p>Aucune commande</p>
                    </div>
                )}
            </div>
        </div>
    );
}