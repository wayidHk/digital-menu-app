import React, { useState, useEffect } from 'react';
import { db } from '@/api/localDB';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, CheckCircle2, Clock, Bell, Flame, Hash } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import NavSwitcher from '../components/NavSwitcher';

function useElapsed(date) {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const update = () => setElapsed(moment(date).fromNow(true));
        update();
        const id = setInterval(update, 10000);
        return () => clearInterval(id);
    }, [date]);
    return elapsed;
}

function OrderCard({ order, onReady }) {
    const elapsed = useElapsed(order.created_date);
    const minutes = moment().diff(moment(order.created_date), 'minutes');
    const isUrgent = minutes >= 10;
    const isWarning = minutes >= 5 && minutes < 10;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22 }}
            className={`rounded-2xl border-2 overflow-hidden shadow-lg transition-all ${isUrgent
                ? 'border-red-400 bg-red-950/80'
                : isWarning
                    ? 'border-orange-400 bg-orange-950/70'
                    : 'border-white/10 bg-white/5'
                }`}
        >
            {/* Card header */}
            <div className={`px-4 py-3 flex items-center justify-between ${isUrgent ? 'bg-red-500/20' : isWarning ? 'bg-orange-500/20' : 'bg-white/5'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg ${isUrgent ? 'bg-red-500 text-white' : isWarning ? 'bg-orange-500 text-white' : 'bg-amber-700 text-white'
                        }`}>
                        {order.table_id}
                    </div>
                    <div>
                        <p className="text-white font-bold text-base leading-tight">Table {order.table_id}</p>
                        <p className="text-gray-400 text-xs font-mono">#{order.id?.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`flex items-center gap-1 text-xs font-semibold ${isUrgent ? 'text-red-300' : isWarning ? 'text-orange-300' : 'text-gray-400'
                        }`}>
                        {isUrgent ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {elapsed}
                    </div>
                    {isUrgent && <p className="text-red-300 text-[10px] font-bold mt-0.5 animate-pulse">⚠ URGENT</p>}
                </div>
            </div>

            {/* Items list */}
            <div className="px-4 py-3 space-y-2">
                {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isUrgent ? 'bg-red-500/30 text-red-200' : isWarning ? 'bg-orange-500/30 text-orange-200' : 'bg-amber-700/30 text-amber-300'
                            }`}>
                            {item.quantity}
                        </div>
                        <span className="text-white font-medium text-sm">{item.product_name}</span>
                    </div>
                ))}
            </div>

            {/* Ready button */}
            <div className="px-4 pb-4">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onReady(order)}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${isUrgent
                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    COMMANDE PRÊTE
                </motion.button>
            </div>
        </motion.div>
    );
}

export default function Kitchen() {
    const queryClient = useQueryClient();
    const [newOrderFlash, setNewOrderFlash] = useState(false);

    const { data: orders = [] } = useQuery({
        queryKey: ['kitchen-orders'],
        queryFn: () => db.entities.Order.filter({ status: 'pending' }, 'created_date'),
        refetchInterval: 8000,
    });

    // Real-time subscription
    useEffect(() => {
        const unsub = db.entities.Order.subscribe((event) => {
            queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
            if (event.type === 'create') {
                setNewOrderFlash(true);
                setTimeout(() => setNewOrderFlash(false), 1500);
                toast('🔔 Nouvelle commande !', {
                    description: `Table ${event.data?.table_id} — ${event.data?.items?.length} article(s)`,
                    style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
                });
                // Play audio beep if supported
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 880;
                    gain.gain.value = 0.3;
                    osc.start();
                    osc.stop(ctx.currentTime + 0.18);
                    setTimeout(() => { osc.frequency.value = 660; osc.start(ctx.currentTime + 0.2); osc.stop(ctx.currentTime + 0.38); }, 200);
                } catch (_) { }
            }
        });
        return unsub;
    }, [queryClient]);

    const readyMutation = useMutation({
        mutationFn: (order) => db.entities.Order.update(order.id, { status: 'ready' }),
        onSuccess: (_, order) => {
            queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
            queryClient.invalidateQueries({ queryKey: ['all-orders'] });
            toast.success(`Table ${order.table_id} — commande envoyée au service !`);
        },
    });

    // Total items to prepare
    const totalItems = orders.flatMap(o => o.items || []).reduce((s, i) => s + i.quantity, 0);

    return (
        <div className={`min-h-screen bg-[#0a0a0f] transition-colors duration-300 ${newOrderFlash ? 'bg-amber-900/20' : ''}`}>
            {/* Header */}
            <div className="bg-[#0f1117] border-b border-white/5 px-4 sm:px-6 py-4 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${orders.length > 0 ? 'bg-amber-600 shadow-amber-600/30' : 'bg-gray-800'
                            }`}>
                            <ChefHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-xl tracking-tight">Cuisine</h1>
                            <p className="text-gray-500 text-xs">Tableau de bord des préparations</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {orders.length > 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <p className="text-amber-400 font-black text-2xl leading-none">{orders.length}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">commande{orders.length > 1 ? 's' : ''}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-white font-black text-2xl leading-none">{totalItems}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">article{totalItems > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Tout est prêt
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-5">
                                <ChefHat className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="text-white font-bold text-xl mb-2">Aucune commande en attente</p>
                            <p className="text-gray-500 text-sm">Les nouvelles commandes apparaîtront ici automatiquement</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onReady={(o) => readyMutation.mutate(o)}
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <NavSwitcher currentPage="Kitchen" />
        </div>
    );
}