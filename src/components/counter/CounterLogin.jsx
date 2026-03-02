import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ChefHat } from 'lucide-react';

export default function CounterLogin({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simple password check - stored in localStorage after first setup
        const storedPass = localStorage.getItem('counter_password');
        if (!storedPass) {
            // First time: set password
            localStorage.setItem('counter_password', password);
            onLogin();
        } else if (password === storedPass) {
            onLogin();
        } else {
            setError('Mot de passe incorrect');
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
            <div className="max-w-sm w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ChefHat className="w-8 h-8 text-amber-800" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Comptoir</h1>
                    <p className="text-sm text-gray-500 mt-1">Accès réservé au personnel</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="pl-10 h-12 rounded-xl"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button type="submit" className="w-full h-12 bg-amber-800 hover:bg-amber-900 rounded-xl font-semibold">
                        Accéder
                    </Button>
                    {!localStorage.getItem('counter_password') && (
                        <p className="text-xs text-gray-400 text-center">Première connexion : définissez votre mot de passe</p>
                    )}
                </form>
            </div>
        </div>
    );
}