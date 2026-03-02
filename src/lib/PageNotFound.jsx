import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageNotFound() {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-black text-gray-200">404</h1>
                <p className="text-gray-500">Page introuvable</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors text-sm font-medium"
                >
                    Retour au menu
                </button>
            </div>
        </div>
    );
}