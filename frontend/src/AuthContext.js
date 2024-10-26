import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(storedUser)); 
        }
    }, []);

    const login = (userData) => {
        setIsAuthenticated(true);
        setCurrentUser(userData);

        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const register = (userData) => {
        setIsAuthenticated(true);
        setCurrentUser(userData);

        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, setCurrentUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
