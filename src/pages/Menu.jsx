import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/api/localDB';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Receipt, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import CategoryTabs from '../components/client/CategoryTabs';
import ProductCard from '../components/client/ProductCard';
import CartDrawer from '../components/client/CartDrawer';
import OrderConfirmation from '../components/client/OrderConfirmation';
import MyOrders from '../components/client/MyOrders';
import NavSwitcher from '../components/NavSwitcher';

function getSessionId() {
    let sid = localStorage.getItem('qr_session_id');
    if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('qr_session_id', sid);
    }
    return sid;
}

function getTableId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('table')) || 1;
}

export default function Menu() {
    const tableId = useMemo(() => getTableId(), []);
    const sessionId = useMemo(() => getSessionId(), []);
    const queryClient = useQueryClient();

    const [cart, setCart] = useState({});
    const [cartOpen, setCartOpen] = useState(false);
    const [ordersOpen, setOrdersOpen] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [lastOrderTime, setLastOrderTime] = useState(0);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => db.entities.Category.list('display_order'),
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => db.entities.Product.filter({ is_active: true }),
    });

    const { data: myOrders = [] } = useQuery({
        queryKey: ['my-orders', sessionId],
        queryFn: () => db.entities.Order.filter({ session_id: sessionId }, '-created_date'),
        refetchInterval: 10000,
    });

    // Real-time subscription for orders
    useEffect(() => {
        const unsubscribe = db.entities.Order.subscribe((event) => {
            if (event.data?.session_id === sessionId) {
                queryClient.invalidateQueries({ queryKey: ['my-orders', sessionId] });
            }
        });
        return unsubscribe;
    }, [sessionId, queryClient]);

    // Real-time subscription for products (stock updates)
    useEffect(() => {
        const unsubscribe = db.entities.Product.subscribe(() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        });
        return unsubscribe;
    }, [queryClient]);

    const [activeCategory, setActiveCategory] = useState(null);

    const filteredProducts = activeCategory
        ? products.filter(p => p.category_id === activeCategory)
        : products;

    const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

    const addToCart = useCallback((productId) => {
        setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart(prev => {
            const next = { ...prev };
            if (next[productId] > 1) next[productId]--;
            else delete next[productId];
            return next;
        });
    }, []);

    const orderMutation = useMutation({
        mutationFn: async ({ cartItems, total }) => {
            // Anti-spam: 10s cooldown
            const now = Date.now();
            if (now - lastOrderTime < 10000) {
                throw new Error('Veuillez patienter 10 secondes entre chaque commande.');
            }

            // Build order items
            const items = cartItems.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
            }));

            const order = await db.entities.Order.create({
                table_id: tableId,
                session_id: sessionId,
                total,
                status: 'pending',
                items,
            });

            // Update stock for each product
            for (const item of cartItems) {
                await db.entities.Product.update(item.id, {
                    stock: Math.max(0, item.stock - item.quantity),
                });
            }

            return order;
        },
        onSuccess: (order) => {
            setLastOrderTime(Date.now());
            setCart({});
            setCartOpen(false);
            setConfirmedOrder(order);
            queryClient.invalidateQueries({ queryKey: ['my-orders', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Erreur lors de la commande');
        },
    });

    const reorderLast = useCallback(() => {
        if (myOrders.length === 0) return;
        const lastOrder = myOrders[0];
        const newCart = {};
        lastOrder.items?.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product && product.stock > 0) {
                newCart[item.product_id] = Math.min(item.quantity, product.stock);
            }
        });
        setCart(newCart);
        setCartOpen(true);
        toast.success('Commande précédente ajoutée au panier');
    }, [myOrders, products]);

    const activeCategories = categories.filter(c => c.is_active !== false);

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Menu</h1>
                            <p className="text-xs text-amber-700 font-medium">Table {tableId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {myOrders.length > 0 && (
                                <button
                                    onClick={reorderLast}
                                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    title="Recommander"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            <button
                                onClick={() => setOrdersOpen(true)}
                                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative"
                            >
                                <Receipt className="w-4 h-4 text-gray-600" />
                                {myOrders.filter(o => o.status === 'pending').length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                        {myOrders.filter(o => o.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3">
                        <CategoryTabs
                            categories={activeCategories}
                            activeCategory={activeCategory}
                            onSelect={setActiveCategory}
                        />
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="max-w-lg mx-auto px-4 py-5">
                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            quantity={cart[product.id] || 0}
                            onAdd={() => addToCart(product.id)}
                            onRemove={() => removeFromCart(product.id)}
                        />
                    ))}
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-sm">Aucun produit dans cette catégorie</p>
                    </div>
                )}
            </div>

            {/* Floating cart button */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.button
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        onClick={() => setCartOpen(true)}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-800 text-white px-6 py-3.5 rounded-full shadow-xl shadow-amber-800/30 flex items-center gap-3 z-30 hover:bg-amber-900 transition-colors"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="font-semibold text-sm">Voir le panier</span>
                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">{cartCount}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <CartDrawer
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                cart={cart}
                products={products}
                onAdd={addToCart}
                onRemove={removeFromCart}
                onSubmit={(cartItems, total) => orderMutation.mutate({ cartItems, total })}
                isSubmitting={orderMutation.isPending}
            />

            {/* Order Confirmation */}
            {confirmedOrder && (
                <OrderConfirmation
                    order={confirmedOrder}
                    tableId={tableId}
                    onClose={() => setConfirmedOrder(null)}
                />
            )}

            {/* My Orders */}
            <MyOrders
                isOpen={ordersOpen}
                onClose={() => setOrdersOpen(false)}
                orders={myOrders}
            />

            <NavSwitcher currentPage="Menu" />
        </div>
    );
}