import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
            setLoading(false);
            // Redirect to home page or dashboard
            navigate("/");
        } catch (error: any) {
            setLoading(false);
            if (error.code === "auth/invalid-credential") {
                setError("Invalid email or password");
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
                    Login to Visitix
                </h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
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
                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-blue-600">
                            Forgot Password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition duration-300 ${
                            loading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                    >
                        {loading ? "LOGGING IN..." : "LOGIN"}
                    </button>
                </form>
            </div>
            <div className="mt-8 text-center text-gray-800">
                <p className="text-lg">
                    Don't have an account?{" "}
                    <Link to="/signup" className="underline text-blue-600">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;