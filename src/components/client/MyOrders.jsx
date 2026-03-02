import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, Truck, XCircle, Receipt } from 'lucide-react';
import moment from 'moment';

const statusConfig = {
    pending: { label: 'En préparation', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ready: { label: 'Prêt', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    delivered: { label: 'Servi', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    cancelled: { label: 'Annulé', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function MyOrders({ isOpen, onClose, orders }) {
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
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-blue-700" />
                                </div>
                                <h2 className="font-bold text-gray-900">Mes Commandes</h2>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Aucune commande</p>
                                </div>
                            ) : (
                                orders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig.pending;
                                    const Icon = status.icon;
                                    return (
                                        <div key={order.id} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-mono text-gray-400">#{order.id?.slice(-6).toUpperCase()}</span>
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg}`}>
                                                    <Icon className={`w-3 h-3 ${status.color}`} />
                                                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 mb-2">
                                                {order.items?.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{item.quantity}× {item.product_name}</span>
                                                        <span className="text-gray-900 font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                <span className="text-xs text-gray-400">{moment(order.created_date).fromNow()}</span>
                                                <span className="font-bold text-gray-900">{order.total?.toFixed(2)} €</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}