import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Utensils, Monitor, BarChart2, X, Grid3X3, ChefHat } from 'lucide-react';

export default function NavSwitcher({ currentPage }) {
    const [open, setOpen] = useState(false);

    const links = [
        { page: 'Menu', label: 'Menu Client', icon: Utensils, color: 'from-amber-500 to-amber-700' },
        { page: 'Counter', label: 'Comptoir', icon: Monitor, color: 'from-slate-600 to-slate-800' },
        { page: 'Kitchen', label: 'Cuisine', icon: ChefHat, color: 'from-orange-500 to-red-700' },
        { page: 'Finance', label: 'Finances', icon: BarChart2, color: 'from-emerald-500 to-emerald-700' },
    ];

    // Use a portal to render into document.body so that
    // parent transforms (framer-motion) don't break position:fixed
    return createPortal(
        <>
            {/* Toggle button — discreet, bottom-right */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(!open)}
                className="fixed bottom-5 right-5 z-[9999] w-11 h-11 rounded-2xl bg-gray-900/80 backdrop-blur-lg border border-white/10 flex items-center justify-center shadow-lg shadow-black/20 hover:bg-gray-800/90 transition-colors"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {open ? (
                        <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X className="w-4 h-4 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="grid" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Grid3X3 className="w-4 h-4 text-white/70" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Menu */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-[4.5rem] right-5 z-[9999] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/40 min-w-[180px]"
                        >
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 py-1.5 font-semibold">Navigation</p>
                            {links.map(({ page, label, icon: Icon, color }) => {
                                const isActive = currentPage === page;
                                return (
                                    <Link
                                        key={page}
                                        to={createPageUrl(page)}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-white/10' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                                            <Icon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</span>
                                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                    </Link>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}