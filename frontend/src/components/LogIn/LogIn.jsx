import React, { useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import './LogIn.css'; 
import Navbar from "../navbar/navbar";

const LogIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { isAuthenticated, login } = useAuth(); 
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const user = { username, password };

        try {
            const response = await axios.post("http://localhost:5001/login", user);

            if (response.status === 200) {
                const { token, username } = response.data; 

                localStorage.setItem("token", token);

                login({ username });

                console.log("User logged in successfully");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/home" />; 
    }

    return (
        <div>
        <Navbar />
        <div className="login-page">
            <div className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2 className="login-title">Login</h2>
                    <div className="login-input-group">
                        <label className="login-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>
                    <div className="login-input-group">
                        <label className="login-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>
                    <div className="login-options">
                        <label>
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <a href="/forgot-password" className="forgot-password-link">Forgot password?</a>
                    </div>
                    <button type="submit" className="login-btn">Log In</button>
                    {error && <p className="login-error-message">{error}</p>}
                    <p className="signup-link">Don't have an account? <a href="/signup">Register</a></p>
                </form>
            </div>
        </div>
        </div>
    );
};

export default LogIn;
