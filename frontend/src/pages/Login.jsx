import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../features/auth/authSlice";
import api from "../services/axiosInstance";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("auth/login", {
        email,
        password,
      });

      dispatch(
        loginSuccess({
          user: data.user,
          token: data.token,
        })
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Small delay to ensure state is updated before navigating
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate("/admin");
        } else {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect") || "/account";
          navigate(redirect);
        }
      }, 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("Google Sign-In is not implemented yet.");
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 animate-fade-in font-sans">
      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Logo and welcome header */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl tracking-wide text-atelier-dark">
            Atelier
          </h1>
          <div className="space-y-1">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-atelier-gray block">
              Welcome Back
            </span>
            <h2 className="font-serif text-3xl text-atelier-dark font-medium leading-tight">
              Sign in
            </h2>
          </div>
        </div>

        {/* Continue with Google */}
        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 border border-atelier-dark bg-transparent text-atelier-dark hover:bg-atelier-dark hover:text-white transition-all duration-300 font-mono text-sm tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-3"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-atelier-lightgray"></div>
            <span className="flex-shrink mx-4 font-mono text-xs tracking-widest text-atelier-gray">
              OR
            </span>
            <div className="flex-grow border-t border-atelier-lightgray"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {error && (
            <p className="text-sm font-mono uppercase text-red-600 tracking-wider text-center">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-3.5 px-1 text-sm text-atelier-dark placeholder-atelier-gray/30 focus:outline-none transition-colors"
              placeholder="name@domain.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-mono tracking-widest uppercase text-atelier-gray hover:text-atelier-dark underline"
              >
                Forgot?
              </Link>
            </div>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-3.5 px-1 text-sm text-atelier-dark placeholder-atelier-gray/30 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-atelier-dark py-4 mt-4"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="pt-4 font-mono text-xs tracking-widest text-atelier-gray uppercase">
          New to Atelier?{" "}
          <Link
            to="/register"
            className="text-atelier-dark underline hover:opacity-75"
          >
            create a new account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;