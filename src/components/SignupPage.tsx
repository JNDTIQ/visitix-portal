import React, { useState } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { createUserProfile } from "../services/userService";

const SignupPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        // Validate form
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }
        
        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user profile in Firestore
            await createUserProfile(userCredential.user.uid, {
                displayName,
                email,
                createdAt: new Date().toISOString(),
            });
            
            setLoading(false);
            // Redirect to login page or dashboard
            navigate("/login");
        } catch (error: any) {
            setLoading(false);
            if (error.code === "auth/email-already-in-use") {
                setError("Email is already in use");
            } else {
                setError(error.message);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center" 
             style={{ backgroundImage: `url('/api/placeholder/1200/800')` }}>
            <div className="bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-2xl shadow-md w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
                    Sign Up for Visitix
                </h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="p-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition duration-300 ${
                            loading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                    >
                        {loading ? "SIGNING UP..." : "SIGN UP"}
                    </button>
                </form>
            </div>
            <div className="mt-8 text-center text-gray-800">
                <p className="text-lg">
                    Already have an account?{" "}
                    <Link to="/login" className="underline text-blue-600">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;