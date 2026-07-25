import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerSuccess } from "../features/auth/authSlice";
import api from "../services/axiosInstance";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!agree) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("auth/register", {
        name,
        email,
        password,
      });

      dispatch(
        registerSuccess({
          user: data.user,
          token: data.token,
        })
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Small delay to ensure state is updated before navigating
      setTimeout(() => {
        navigate("/account");
      }, 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 animate-fade-in font-sans">
      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl tracking-wide text-atelier-dark">
            Atelier
          </h1>

          <div className="space-y-1">
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-atelier-gray block">
              Join the Studio
            </span>

            <h2 className="font-serif text-3xl text-atelier-dark font-medium leading-tight">
              Create account
            </h2>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {error && (
            <p className="text-sm font-mono uppercase text-red-600 tracking-wider text-center">
              {error}
            </p>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">
              Full Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-3.5 px-1 text-sm text-atelier-dark placeholder-atelier-gray/30 focus:outline-none transition-colors"
              placeholder="Piyush Sharma"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1">
            <label className="block font-mono text-xs tracking-widest uppercase text-atelier-gray">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-3.5 px-1 text-sm text-atelier-dark placeholder-atelier-gray/30 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded border-atelier-lightgray text-atelier-dark focus:ring-atelier-dark bg-transparent"
              />
            </div>

            <div className="ml-3 text-sm leading-tight font-mono uppercase text-atelier-gray">
              <label htmlFor="agree" className="cursor-pointer">
                I agree to the{" "}
                <a href="/terms" className="text-atelier-dark underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-atelier-dark underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-atelier-dark py-4 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Login */}
        <div className="pt-4 font-mono text-xs tracking-widest text-atelier-gray uppercase">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-atelier-dark underline hover:opacity-75"
          >
            sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;