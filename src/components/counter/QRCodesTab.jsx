import React, { useState, useRef } from 'react';
import { QrCode, Download, Printer, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRCodesTab() {
    const [tableCount, setTableCount] = useState(() => {
        const saved = localStorage.getItem('tableCount');
        return saved ? parseInt(saved, 10) : 6;
    });
    const [selectedTable, setSelectedTable] = useState(null);
    const qrRef = useRef(null);

    const handleAddTable = () => {
        setTableCount(prev => {
            const newValue = prev + 1;
            localStorage.setItem('tableCount', newValue.toString());
            return newValue;
        });
    };

    const getMenuUrl = (tableId) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/Menu?table=${tableId}`;
    };

    const getQRCodeUrl = (tableId) => {
        const menuUrl = encodeURIComponent(getMenuUrl(tableId));
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${menuUrl}`;
    };

    const downloadQR = (tableId) => {
        const link = document.createElement('a');
        link.href = getQRCodeUrl(tableId);
        link.download = `qr-table-${tableId}.png`;
        link.click();
    };

    const printQR = (tableId) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>QR Code - Table ${tableId}</title></head>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;">
                    <h1 style="font-size:2rem;margin-bottom:0.5rem;">Table ${tableId}</h1>
                    <p style="color:#666;margin-bottom:2rem;">Scannez pour commander</p>
                    <img src="${getQRCodeUrl(tableId)}" style="width:300px;height:300px;" />
                    <p style="color:#999;margin-top:2rem;font-size:0.8rem;">${getMenuUrl(tableId)}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    const printAll = () => {
        const printWindow = window.open('', '_blank');
        let html = `
            <html>
                <head><title>QR Codes - Toutes les tables</title></head>
                <body style="font-family:system-ui,sans-serif;">
                    <style>
                        .qr-card { page-break-inside: avoid; text-align: center; padding: 2rem; display: inline-block; width: 45%; margin: 1%; }
                        @media print { .qr-card { break-inside: avoid; } }
                    </style>
        `;
        for (let i = 1; i <= tableCount; i++) {
            html += `
                <div class="qr-card">
                    <h2 style="margin-bottom:0.5rem;">Table ${i}</h2>
                    <p style="color:#666;margin-bottom:1rem;font-size:0.9rem;">Scannez pour commander</p>
                    <img src="${getQRCodeUrl(i)}" style="width:200px;height:200px;" />
                </div>
            `;
        }
        html += `</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.print(); };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">QR Codes par table</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Chaque QR code dirige vers le menu avec le numéro de table pré-rempli
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={printAll} variant="outline" className="rounded-xl">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer tout
                    </Button>
                    <Button onClick={handleAddTable} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une table
                    </Button>
                </div>
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(tableId => (
                    <div
                        key={tableId}
                        className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:shadow-md transition-all group"
                    >
                        <p className="text-sm font-bold text-amber-800 mb-3">Table {tableId}</p>
                        <div className="bg-white p-2 rounded-xl inline-block border mb-3">
                            <img
                                src={getQRCodeUrl(tableId)}
                                alt={`QR Code Table ${tableId}`}
                                className="w-40 h-40"
                                loading="lazy"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mb-3 font-mono break-all">
                            {getMenuUrl(tableId)}
                        </p>
                        <div className="flex items-center gap-2 justify-center">
                            <button
                                onClick={() => downloadQR(tableId)}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Télécharger"
                            >
                                <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                                onClick={() => printQR(tableId)}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Imprimer"
                            >
                                <Printer className="w-4 h-4 text-gray-600" />
                            </button>
                            <a
                                href={getMenuUrl(tableId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Ouvrir"
                            >
                                <ExternalLink className="w-4 h-4 text-gray-600" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
