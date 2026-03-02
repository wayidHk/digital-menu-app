import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

export default function OrderConfirmation({ order, tableId, onClose }) {
    if (!order) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
                    >
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Commande envoyée !</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        Table {tableId} — Commande #{order.id?.slice(-6).toUpperCase()}
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 mb-5">
                        <p className="text-amber-800 text-sm font-medium">
                            Votre commande est en cours de préparation
                        </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-6">{order.total?.toFixed(2)} €</p>
                    <button
                        onClick={onClose}
                        className="w-full h-11 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors"
                    >
                        Retour au menu
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}