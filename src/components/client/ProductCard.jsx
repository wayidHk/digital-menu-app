import React from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, quantity, onAdd, onRemove }) {
    const outOfStock = product.stock <= 0;
    const lowStock = product.stock > 0 && product.stock <= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
            {product.image_url && (
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                    {outOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                Rupture temporaire
                            </span>
                        </div>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
                        {product.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                        )}
                    </div>
                    <span className="text-amber-800 font-bold text-sm whitespace-nowrap">
                        {product.price?.toFixed(2)} €
                    </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                        {lowStock && (
                            <span className="text-xs text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Plus que {product.stock}
                            </span>
                        )}
                        {outOfStock && !product.image_url && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Rupture
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {quantity > 0 && (
                            <>
                                <button
                                    onClick={onRemove}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                            </>
                        )}
                        <button
                            onClick={onAdd}
                            disabled={outOfStock || quantity >= product.stock}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${outOfStock || quantity >= product.stock
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-amber-800 text-white hover:bg-amber-900 shadow-sm'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}