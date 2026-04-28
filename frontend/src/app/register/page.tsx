"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

interface Errors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name as keyof Errors]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const newErrors: Errors = {};

    if (!formData.email.includes("@")) newErrors.email = "Invalid email";
    if (formData.username.length < 3) newErrors.username = "Min 3 characters";
    if (formData.password.length < 6) newErrors.password = "Min 6 characters";

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      toast.success("Account created 🚀");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />
          {errors.email && <p className="text-red-500">{errors.email}</p>}

          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />
          {errors.username && <p className="text-red-500">{errors.username}</p>}

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />
          {errors.password && <p className="text-red-500">{errors.password}</p>}

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />
          {errors.confirmPassword && (
            <p className="text-red-500">{errors.confirmPassword}</p>
          )}

          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-indigo-600">
            Already have account?
          </Link>
        </div>
      </div>
    </div>
  );
}
