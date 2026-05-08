// app/workspaces/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  XCircle,
  Briefcase,
  Tag,
  FileText,
  Sparkles,
} from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/workspaces/", { name, description, plan });
      toast.success("Workspace created successfully!");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Failed to create workspace");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  // Get plan details
  const getPlanDetails = (planValue: string) => {
    switch (planValue) {
      case "free":
        return {
          name: "Free",
          price: "$0",
          period: "month",
          features: [
            "Up to 10 members",
            "5 projects",
            "1GB storage",
            "Basic support",
          ],
        };
      case "pro":
        return {
          name: "Pro",
          price: "$29",
          period: "month",
          features: [
            "Up to 50 members",
            "Unlimited projects",
            "50GB storage",
            "Priority support",
            "Advanced analytics",
          ],
        };
      case "business":
        return {
          name: "Business",
          price: "$99",
          period: "month",
          features: [
            "Unlimited members",
            "Unlimited projects",
            "1TB storage",
            "24/7 support",
            "Advanced analytics",
            "Custom integrations",
          ],
        };
      default:
        return {
          name: "Free",
          price: "$0",
          period: "month",
          features: [],
        };
    }
  };

  const currentPlan = getPlanDetails(plan);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Back Button */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Create New Workspace
                </h1>
                <p className="text-gray-600 mt-2">
                  Set up a new workspace to start collaborating with your team
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <form onSubmit={handleSubmit}>
                  <div className="p-6 lg:p-8 space-y-6">
                    {/* Workspace Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Workspace Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="e.g., Acme Corp, Design Team, Marketing"
                          autoFocus
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose a unique name that represents your team or
                        project
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                          placeholder="Describe what this workspace is for..."
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Help your team understand the purpose of this workspace
                      </p>
                    </div>

                    {/* Plan Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select Plan
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <label
                          className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                            plan === "free"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value="free"
                            checked={plan === "free"}
                            onChange={(e) => setPlan(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900">
                                  Free
                                </span>
                                <p className="text-sm text-gray-500">
                                  Perfect for getting started
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                  $0
                                </span>
                                <span className="text-gray-500">/month</span>
                              </div>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                            plan === "pro"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value="pro"
                            checked={plan === "pro"}
                            onChange={(e) => setPlan(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    Pro
                                  </span>
                                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Best for growing teams
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                  $29
                                </span>
                                <span className="text-gray-500">/month</span>
                              </div>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                            plan === "business"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            value="business"
                            checked={plan === "business"}
                            onChange={(e) => setPlan(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900">
                                  Business
                                </span>
                                <p className="text-sm text-gray-500">
                                  For large organizations
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                  $99
                                </span>
                                <span className="text-gray-500">/month</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="px-6 lg:px-8 py-5 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Create Workspace
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar - Plan Features */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 sticky top-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {currentPlan.name} Plan Features
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentPlan.price}
                    <span className="text-sm font-normal text-gray-500">
                      /{currentPlan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    You can upgrade or downgrade your plan at any time. All
                    plans include a 14-day free trial.
                  </p>
                </div>
              </div>

              {/* Tips Card */}
              <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">
                  💡 Tips for naming your workspace
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use your company or team name</li>
                  <li>• Keep it short and memorable</li>
                  <li>• Avoid special characters</li>
                  <li>• Make it descriptive of your project</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Helper component for checkmark
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
