import React, { useState, useEffect } from 'react';
import { db } from '@/api/localDB';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, UtensilsCrossed, QrCode, LogOut, ChefHat, Bell } from 'lucide-react';
import { toast } from 'sonner';

import CounterLogin from '../components/counter/CounterLogin';
import OrdersTab from '../components/counter/OrdersTab';
import MenuTab from '../components/counter/MenuTab';
import QRCodesTab from '../components/counter/QRCodesTab';
import NavSwitcher from '../components/NavSwitcher';

export default function Counter() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const queryClient = useQueryClient();

    // Check if already logged in
    useEffect(() => {
        const auth = sessionStorage.getItem('counter_auth');
        if (auth === 'true') setIsAuthenticated(true);
    }, []);

    const handleLogin = () => {
        sessionStorage.setItem('counter_auth', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('counter_auth');
        setIsAuthenticated(false);
    };

    const { data: orders = [] } = useQuery({
        queryKey: ['all-orders'],
        queryFn: () => db.entities.Order.list('-created_date', 200),
        enabled: isAuthenticated,
        refetchInterval: 5000,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => db.entities.Category.list('display_order'),
        enabled: isAuthenticated,
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => db.entities.Product.list(),
        enabled: isAuthenticated,
    });

    // Real-time subscriptions
    useEffect(() => {
        if (!isAuthenticated) return;
        const unsubOrders = db.entities.Order.subscribe((event) => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] });
            if (event.type === 'create') {
                toast('🔔 Nouvelle commande !', {
                    description: `Table ${event.data?.table_id} — ${event.data?.total?.toFixed(2)} €`,
                });
            }
        });
        const unsubProducts = db.entities.Product.subscribe(() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        });
        const unsubCategories = db.entities.Category.subscribe(() => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        });
        return () => { unsubOrders(); unsubProducts(); unsubCategories(); };
    }, [isAuthenticated, queryClient]);

    if (!isAuthenticated) {
        return <CounterLogin onLogin={handleLogin} />;
    }

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-amber-800" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg">Comptoir</h1>
                            <p className="text-xs text-gray-500">Gestion des commandes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                                <Bell className="w-4 h-4" />
                                {pendingCount} en attente
                            </div>
                        )}
                        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Déconnexion">
                            <LogOut className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <Tabs defaultValue="orders" className="space-y-5">
                    <TabsList className="bg-white border shadow-sm rounded-xl p-1 h-auto">
                        <TabsTrigger value="orders" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-amber-800 data-[state=active]:text-white">
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Commandes
                            {pendingCount > 0 && (
                                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="menu" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-amber-800 data-[state=active]:text-white">
                            <UtensilsCrossed className="w-4 h-4 mr-2" />
                            Gestion Menu
                        </TabsTrigger>
                        <TabsTrigger value="qr" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-amber-800 data-[state=active]:text-white">
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Codes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="orders">
                        <OrdersTab orders={orders} products={products} />
                    </TabsContent>
                    <TabsContent value="menu">
                        <MenuTab categories={categories} products={products} />
                    </TabsContent>
                    <TabsContent value="qr">
                        <QRCodesTab />
                    </TabsContent>
                </Tabs>
            </div>
            <NavSwitcher currentPage="Counter" />
        </div>
    );
}