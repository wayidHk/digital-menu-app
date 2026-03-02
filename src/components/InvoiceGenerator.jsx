import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, FileText, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import jsPDF from 'jspdf';

export default function InvoiceGenerator({ orders, tableId, onClose, restaurantName = "Mon Restaurant" }) {
    const invoiceRef = useRef(null);

    const allItems = orders.flatMap(o => o.items || []);
    const grouped = {};
    allItems.forEach(item => {
        const key = item.product_id;
        if (!grouped[key]) {
            grouped[key] = { name: item.product_name, quantity: 0, price: item.price };
        }
        grouped[key].quantity += item.quantity;
    });
    const lines = Object.values(grouped);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const tva = subtotal * 0.1;
    const total = subtotal + tva;
    const invoiceNum = `F${moment().format('YYYYMMDD')}-T${tableId}`;

    const downloadPDF = () => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        let y = 20;

        // Header bg
        doc.setFillColor(146, 64, 14);
        doc.rect(0, 0, pageW, 45, 'F');

        // Restaurant name
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(restaurantName, 20, 22);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Facture de consommation', 20, 30);
        doc.text(`N° ${invoiceNum}`, 20, 37);

        // Right side info
        doc.setFontSize(10);
        doc.text(`Table ${tableId}`, pageW - 20, 22, { align: 'right' });
        doc.text(moment().format('DD/MM/YYYY HH:mm'), pageW - 20, 30, { align: 'right' });

        y = 60;

        // Table header
        doc.setFillColor(249, 250, 251);
        doc.rect(15, y - 5, pageW - 30, 10, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉSIGNATION', 20, y + 2);
        doc.text('QTÉ', 120, y + 2);
        doc.text('PRIX UNIT.', 145, y + 2);
        doc.text('MONTANT', pageW - 20, y + 2, { align: 'right' });

        y += 15;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(10);

        lines.forEach((line, i) => {
            if (i % 2 === 0) {
                doc.setFillColor(253, 251, 247);
                doc.rect(15, y - 4, pageW - 30, 9, 'F');
            }
            doc.text(line.name, 20, y + 2);
            doc.text(String(line.quantity), 122, y + 2);
            doc.text(`${line.price.toFixed(2)} €`, 147, y + 2);
            doc.text(`${(line.price * line.quantity).toFixed(2)} €`, pageW - 20, y + 2, { align: 'right' });
            y += 11;
        });

        y += 8;
        // Separator
        doc.setDrawColor(229, 231, 235);
        doc.line(15, y, pageW - 15, y);
        y += 8;

        // Totals
        const totalsX = pageW - 80;
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Sous-total HT', totalsX, y);
        doc.text(`${subtotal.toFixed(2)} €`, pageW - 20, y, { align: 'right' });
        y += 9;
        doc.text('TVA (10%)', totalsX, y);
        doc.text(`${tva.toFixed(2)} €`, pageW - 20, y, { align: 'right' });
        y += 4;
        doc.setDrawColor(146, 64, 14);
        doc.line(totalsX, y, pageW - 15, y);
        y += 7;

        doc.setFillColor(146, 64, 14);
        doc.rect(totalsX - 5, y - 5, pageW - totalsX + 20, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL TTC', totalsX, y + 3);
        doc.text(`${total.toFixed(2)} €`, pageW - 20, y + 3, { align: 'right' });

        y += 25;
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Merci de votre visite ! À bientôt.', pageW / 2, y, { align: 'center' });

        doc.save(`facture-table-${tableId}-${moment().format('YYYYMMDD-HHmm')}.pdf`);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Invoice Header */}
                    <div className="bg-gradient-to-br from-amber-800 to-amber-900 p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ChefHat className="w-5 h-5 opacity-80" />
                                <span className="font-bold text-lg">{restaurantName}</span>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex justify-between mt-4">
                            <div>
                                <p className="text-amber-200 text-xs">FACTURE</p>
                                <p className="font-mono text-sm font-bold">{invoiceNum}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-amber-200 text-xs">TABLE / DATE</p>
                                <p className="font-semibold text-sm">Table {tableId} · {moment().format('DD/MM/YYYY')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="p-5">
                        <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                            {lines.map((line, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{line.name}</p>
                                        <p className="text-xs text-gray-400">{line.quantity} × {line.price.toFixed(2)} €</p>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{(line.price * line.quantity).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-1.5 pt-3">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Sous-total HT</span>
                                <span>{subtotal.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>TVA (10%)</span>
                                <span>{tva.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-amber-800">
                                <span className="font-bold text-gray-900 text-lg">Total TTC</span>
                                <span className="font-black text-amber-800 text-xl">{total.toFixed(2)} €</span>
                            </div>
                        </div>

                        <p className="text-center text-gray-400 text-xs mt-4">Merci de votre visite ! À bientôt 🙏</p>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-3">
                        <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                            Fermer
                        </Button>
                        <Button onClick={downloadPDF} className="flex-1 bg-amber-800 hover:bg-amber-900 rounded-xl gap-2">
                            <Download className="w-4 h-4" />
                            Télécharger PDF
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}