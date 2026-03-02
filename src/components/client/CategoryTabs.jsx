import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function CategoryTabs({ categories, activeCategory, onSelect }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    !activeCategory
                        ? "bg-amber-800 text-white shadow-md"
                        : "bg-white/80 text-gray-600 hover:bg-white border border-gray-200"
                )}
            >
                Tout
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={cn(
                        "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                        activeCategory === cat.id
                            ? "bg-amber-800 text-white shadow-md"
                            : "bg-white/80 text-gray-600 hover:bg-white border border-gray-200"
                    )}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}