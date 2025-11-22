"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, X, FolderOpen, Globe, LogOut, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onChangeFolder: () => void;
    onReconnect: () => void;
}

export default function SettingsModal({ isOpen, onClose, onLogout, onChangeFolder, onReconnect }: SettingsModalProps) {
    const { language, setLanguage, t } = useI18n();
    const [rootFolder, setRootFolder] = useState(localStorage.getItem("ahal_root_folder") || "");

    if (!isOpen) return null;

    const handleLogout = () => {
        if (confirm(t("settings.logout") + "?")) {
            // Clear cookies and localStorage
            document.cookie = "google_tokens=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem("ahal_root_folder");
            localStorage.removeItem("ahal_language");
            onLogout();
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <SettingsIcon className="text-indigo-400" size={28} />
                        {t("settings.title")}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Language */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <Globe size={20} className="text-indigo-400" />
                            <h3 className="text-white font-semibold">{t("settings.language")}</h3>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`flex-1 py-3 px-4 rounded-lg border transition ${language === "en"
                                        ? "bg-indigo-500 border-indigo-500 text-white"
                                        : "bg-slate-700/50 border-white/10 text-slate-300 hover:bg-slate-700"
                                    }`}
                            >
                                🇺🇸 English
                            </button>
                            <button
                                onClick={() => setLanguage("es")}
                                className={`flex-1 py-3 px-4 rounded-lg border transition ${language === "es"
                                        ? "bg-indigo-500 border-indigo-500 text-white"
                                        : "bg-slate-700/50 border-white/10 text-slate-300 hover:bg-slate-700"
                                    }`}
                            >
                                🇪🇸 Español
                            </button>
                        </div>
                    </div>

                    {/* Drive Connection */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <RefreshCw size={20} className="text-indigo-400" />
                            <h3 className="text-white font-semibold">{t("settings.driveConnection")}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                            {language === "en"
                                ? "Manage your Google Drive connection and permissions."
                                : "Administra tu conexión y permisos de Google Drive."}
                        </p>
                        <button onClick={onReconnect} className="btn btn-secondary w-full">
                            <RefreshCw size={16} />
                            {t("settings.reconnect")}
                        </button>
                    </div>

                    {/* My Videos Folder */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <FolderOpen size={20} className="text-indigo-400" />
                            <h3 className="text-white font-semibold">{t("settings.myVideosFolder")}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                            {rootFolder ? (
                                <>
                                    {language === "en" ? "Current folder ID: " : "ID de carpeta actual: "}
                                    <code className="text-indigo-400">{rootFolder.substring(0, 20)}...</code>
                                </>
                            ) : (
                                language === "en" ? "No folder configured" : "Sin carpeta configurada"
                            )}
                        </p>
                        <button onClick={onChangeFolder} className="btn btn-secondary w-full">
                            <FolderOpen size={16} />
                            {t("settings.changeFolder")}
                        </button>
                    </div>

                    {/* Team Library */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <FolderOpen size={20} className="text-indigo-400" />
                            <h3 className="text-white font-semibold">{t("settings.teamFolder")}</h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                            {language === "en"
                                ? "Team Library is configured with a shared folder."
                                : "La Biblioteca de Equipo está configurada con una carpeta compartida."}
                        </p>
                    </div>

                    {/* Logout */}
                    <div className="pt-4 border-t border-white/5">
                        <button onClick={handleLogout} className="btn btn-secondary w-full text-red-400 border-red-500/20 hover:bg-red-500/10">
                            <LogOut size={16} />
                            {t("settings.logout")}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
                    <button onClick={onClose} className="btn btn-primary">
                        {t("settings.close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
