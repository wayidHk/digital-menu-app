import React from 'react';
import { X, Minus, Plus, ShoppingBag, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function CartDrawer({ isOpen, onClose, cart, products, onAdd, onRemove, onSubmit, isSubmitting }) {
    const cartItems = Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => {
            const product = products.find(p => p.id === productId);
            return product ? { ...product, quantity: qty } : null;
        })
        .filter(Boolean);

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-2xl"
                    >
                        <div className="p-5 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-amber-800" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Votre Commande</h2>
                                    <p className="text-xs text-gray-500">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Votre panier est vide</p>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                        {item.image_url && (
                                            <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-amber-800 font-semibold">{item.price.toFixed(2)} €</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onRemove(item.id)} className="w-7 h-7 rounded-full bg-white border flex items-center justify-center">
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => onAdd(item.id)}
                                                disabled={item.quantity >= item.stock}
                                                className="w-7 h-7 rounded-full bg-amber-800 text-white flex items-center justify-center disabled:opacity-30"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-5 border-t bg-gray-50/50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600 font-medium">Total</span>
                                    <span className="text-xl font-bold text-gray-900">{total.toFixed(2)} €</span>
                                </div>
                                <Button
                                    onClick={() => onSubmit(cartItems, total)}
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Envoyer la commande
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}