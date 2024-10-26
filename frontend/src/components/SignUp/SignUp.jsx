import React, { useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import './SignUp.css'; 
import Navbar from '../navbar/navbar';

const Signup = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); 
    const { isAuthenticated, login } = useAuth();
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            alert("Password must be at least 8 characters long");
            return;
        }

        const newUser = { username, password };

        try {
            const response = await axios.post("http://localhost:5001/register", newUser);

            login({ username: response.data.username });
        } catch (err) {
            console.error(err);
            setError("Username already exists or another error occurred.");
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <Navbar />
            <div className="signup-page">
                <div className="signup-container">
                    <form onSubmit={handleSubmit} className="signup-form">
                        <h2 className="signup-title">Sign Up</h2>
                        <div className="signup-input-group">
                            <label className="signup-label">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className="signup-input" 
                                required 
                            />
                        </div>
                        <div className="signup-input-group">
                            <label className="signup-label">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="signup-input" 
                                required 
                            />
                        </div>
                        <div className="signup-input-group">
                            <label className="signup-label">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className="signup-input" 
                                required 
                            />
                        </div>
                        <button type="submit" className="signup-btn">Sign Up</button>
                        {error && <p className="signup-error-message">{error}</p>}
                        <p className="login-link">Already have an account? <a href="/login">Log In</a></p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
