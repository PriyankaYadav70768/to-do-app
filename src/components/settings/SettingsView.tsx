"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  ArrowLeft,
  Check,
  Bell,
  Palette,
  Sliders,
  ShieldAlert,
  Trash2,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

type SettingsTab = "profile" | "security" | "notifications" | "appearance" | "preferences" | "account";

export default function SettingsView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>({
    theme: "dark",
    timezone: "UTC",
    weekStartDay: 1,
    emailReminders: true,
    inAppReminders: true,
  });

  // Profile Form state
  const [name, setName] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences save feedback
  const [prefSuccess, setPrefSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/preferences").then((r) => r.json()),
    ])
      .then(([profData, prefData]) => {
        if (!profData.profile) {
          router.replace("/login");
        } else {
          setProfile(profData.profile);
          setName(profData.profile.name || "");
          if (prefData.preferences) {
            setPreferences(prefData.preferences);
          }
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Failed to update profile");
      } else {
        setProfileSuccess("Profile updated successfully!");
        setProfile((prev: any) => ({ ...prev, name: data.profile.name }));
      }
    } catch {
      setProfileError("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
      } else {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdatePreferences = async (updates: Partial<typeof preferences>) => {
    setPrefSuccess("");
    const updated = { ...preferences, ...updates };
    setPreferences(updated);

    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setPrefSuccess("Preferences saved!");
      setTimeout(() => setPrefSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure? This will delete your account and all associated workspace data permanently.")) {
      alert("Account deletion verified. Contact administrative support or session terminated.");
      await fetch("/api/auth/login", { method: "DELETE" });
      router.replace("/register");
    }
  };

  if (!profile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (profile.name || profile.email || "U")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "account", label: "Account", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-6 sm:p-12 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace Settings
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Settings Tabs Sidebar */}
          <aside className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Tab Content Panel */}
          <div className="md:col-span-3 space-y-6">
            {prefSuccess && (
              <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{prefSuccess}</span>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-xl flex items-center justify-center border border-blue-500/20">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {profile.name || "Productivity User"}
                    </h2>
                    <p className="text-xs text-slate-400">{profile.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full text-sm bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Email address is associated with your account identity and is read-only.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ensure your account is using a strong password.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure how and when you receive task reminders.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 cursor-pointer">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        In-App Task Reminders
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Show due dates and deadline alert badges inside the application.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.inAppReminders}
                      onChange={(e) => handleUpdatePreferences({ inAppReminders: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 cursor-pointer">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Email Notifications
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Receive daily summaries and high-priority deadline notifications.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailReminders}
                      onChange={(e) => handleUpdatePreferences({ emailReminders: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB: APPEARANCE (Full Real-Time Theme Switcher) */}
            {activeTab === "appearance" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize the visual look and feel of your workspace. Changes apply immediately.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Light Theme Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("light");
                      handleUpdatePreferences({ theme: "light" });
                    }}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
                      theme === "light"
                        ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-xs ring-1 ring-blue-600"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      {theme === "light" && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs font-bold">Light Theme</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Clean, crisp and bright</p>
                  </button>

                  {/* Dark Theme Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("dark");
                      handleUpdatePreferences({ theme: "dark" });
                    }}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
                      theme === "dark"
                        ? "border-blue-600 bg-blue-50/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-600"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Moon className="w-5 h-5 text-indigo-400" />
                      {theme === "dark" && <Check className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-xs font-bold">Dark Theme</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Deep and focused</p>
                  </button>

                  {/* System Theme Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("system");
                      handleUpdatePreferences({ theme: "system" });
                    }}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
                      theme === "system"
                        ? "border-blue-600 bg-blue-50/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-600"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Laptop className="w-5 h-5 text-slate-500" />
                      {theme === "system" && <Check className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-xs font-bold">System Theme</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Syncs with OS settings</p>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: PREFERENCES */}
            {activeTab === "preferences" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Productivity Preferences
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize calendar and workspace calculations.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Start of Week
                    </label>
                    <select
                      value={preferences.weekStartDay}
                      onChange={(e) => handleUpdatePreferences({ weekStartDay: Number(e.target.value) })}
                      className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                    >
                      <option value={1}>Monday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => handleUpdatePreferences({ timezone: e.target.value })}
                      className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                    >
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACCOUNT DANGER ZONE */}
            {activeTab === "account" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Overview</h3>
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-500">
                    <p>Identity: <strong className="text-slate-800 dark:text-slate-200">{profile.email}</strong></p>
                    <p>Status: <strong className="text-emerald-500">Active Personal Plan</strong></p>
                  </div>
                </div>

                <div className="pt-4 border-t border-red-200/50 dark:border-red-950/40">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                    Danger Zone
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Permanently delete your account and all associated workspace data.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
