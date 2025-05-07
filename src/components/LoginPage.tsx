import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
        } catch (error: any) {
            setError(error.message);
        }
    };

    const toggleSignUp = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center" 
             style={{ backgroundImage: `url('/api/placeholder/1200/800')` }}>
            <div className="bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-2xl shadow-md w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
                    {isSignUp ? "Sign Up for Visitix" : "Login to Visitix"}
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
                    <button
                        type="submit"
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition duration-300"
                    >
                        {isSignUp ? "SIGN UP" : "LOGIN"}
                    </button>
                </form>
            </div>
            <div className="mt-8 text-center text-gray-800">
                <p className="text-lg">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <span className="underline cursor-pointer text-blue-600" onClick={toggleSignUp}>
                        {isSignUp ? "Login" : "Sign Up"}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;