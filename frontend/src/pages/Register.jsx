import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGoogleLogin } from "@react-oauth/google";
import { registerSuccess, loginSuccess } from "../features/auth/authSlice";
import api from "../services/axiosInstance";
import StyleOnboarding from "../components/onboarding/StyleOnboarding";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

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

      // Show onboarding instead of navigating directly
      setTimeout(() => {
        setShowOnboarding(true);
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

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("auth/google", {
        accessToken: tokenResponse.access_token,
      });

      dispatch(
        loginSuccess({
          user: data.user,
          token: data.token,
        })
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        if (!data.user.onboardingCompleted) {
          setShowOnboarding(true);
        } else {
          navigate("/");
        }
      }, 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Google sign-up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-up was cancelled or failed."),
  });

  const handleGoogleSignUp = () => {
    setError("");
    googleLogin();
  };

  return (
    <>
      {showOnboarding && (
        <StyleOnboarding
          onComplete={() => navigate('/')}
          onSkip={() => navigate('/')}
        />
      )}
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

        {/* Continue with Google */}
        <div className="space-y-6">
          <button
            onClick={handleGoogleSignUp}
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
    </>
  );
};

export default Register;