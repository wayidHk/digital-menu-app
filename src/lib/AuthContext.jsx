import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Simplified auth — no external provider, always authenticated
    const [user] = useState({ name: 'Admin', email: 'admin@restaurant.local' });

    const logout = () => {
        // In standalone mode, just reload
        window.location.reload();
    };

    const navigateToLogin = () => {
        // No external login — do nothing
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: true,
            isLoadingAuth: false,
            isLoadingPublicSettings: false,
            authError: null,
            appPublicSettings: null,
            logout,
            navigateToLogin,
            checkAppState: () => { },
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
