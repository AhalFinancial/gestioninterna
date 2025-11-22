"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es";

interface Translations {
    [key: string]: {
        en: string;
        es: string;
    };
}

const translations: Translations = {
    // Navigation
    "nav.myVideos": { en: "My Videos", es: "Mis Videos" },
    "nav.teamLibrary": { en: "Team Library", es: "Biblioteca de Equipo" },
    "nav.recent": { en: "Recent", es: "Recientes" },
    "nav.newVideo": { en: "New Video", es: "Nuevo Video" },
    "nav.connectDrive": { en: "Connect Drive", es: "Conectar Drive" },

    // Recorder
    "recorder.title": { en: "Start Recording", es: "Iniciar Grabación" },
    "recorder.description": { en: "Select your screen and camera to preview before recording.", es: "Selecciona tu pantalla y cámara para previsualizar antes de grabar." },
    "recorder.selectScreen": { en: "Select Screen & Camera", es: "Seleccionar Pantalla y Cámara" },
    "recorder.preview": { en: "Preview Your Recording", es: "Previsualizar tu Grabación" },
    "recorder.screenActive": { en: "Screen sharing active", es: "Compartir pantalla activo" },
    "recorder.cameraActive": { en: "Camera active", es: "Cámara activa" },
    "recorder.micActive": { en: "Microphone active", es: "Micrófono activo" },
    "recorder.startRecording": { en: "Start Recording", es: "Iniciar Grabación" },
    "recorder.cancel": { en: "Cancel", es: "Cancelar" },
    "recorder.finish": { en: "Finish", es: "Finalizar" },
    "recorder.discard": { en: "Discard", es: "Descartar" },
    "recorder.nameVideo": { en: "Name your video", es: "Nombra tu video" },
    "recorder.enterTitle": { en: "Enter video title...", es: "Ingresa el título del video..." },
    "recorder.saveVideo": { en: "Save Video", es: "Guardar Video" },

    // Library
    "library.search": { en: "Search...", es: "Buscar..." },
    "library.newFolder": { en: "New Folder", es: "Nueva Carpeta" },
    "library.loading": { en: "Loading...", es: "Cargando..." },
    "library.noItems": { en: "No items found.", es: "No se encontraron elementos." },

    // Video Menu
    "menu.rename": { en: "Rename", es: "Renombrar" },
    "menu.share": { en: "Share", es: "Compartir" },
    "menu.moveTo": { en: "Move to...", es: "Mover a..." },
    "menu.delete": { en: "Delete", es: "Eliminar" },

    // Transcript
    "transcript.title": { en: "Transcript", es: "Transcripción" },
    "transcript.noTranscript": { en: "No Transcript Yet", es: "Sin Transcripción Aún" },
    "transcript.description": { en: "Generate a transcript using Gemini AI to make your video searchable and accessible.", es: "Genera una transcripción usando Gemini AI para hacer tu video buscable y accesible." },
    "transcript.generate": { en: "Generate with Gemini", es: "Generar con Gemini" },
    "transcript.generating": { en: "Generating...", es: "Generando..." },
    "transcript.autoDetect": { en: "Auto-detect", es: "Auto-detectar" },
    "transcript.spanish": { en: "Spanish", es: "Español" },
    "transcript.english": { en: "English", es: "Inglés" },

    // Settings
    "settings.title": { en: "Settings", es: "Configuración" },
    "settings.driveConnection": { en: "Drive Connection", es: "Conexión de Drive" },
    "settings.myVideosFolder": { en: "My Videos Folder", es: "Carpeta de Mis Videos" },
    "settings.teamFolder": { en: "Team Library Folder", es: "Carpeta de Biblioteca de Equipo" },
    "settings.language": { en: "Language", es: "Idioma" },
    "settings.changeFolder": { en: "Change Folder", es: "Cambiar Carpeta" },
    "settings.reconnect": { en: "Reconnect Drive", es: "Reconectar Drive" },
    "settings.logout": { en: "Logout", es: "Cerrar Sesión" },
    "settings.save": { en: "Save", es: "Guardar" },
    "settings.close": { en: "Close", es: "Cerrar" },

    // Common
    "common.saveToDrive": { en: "Save to Drive", es: "Guardar en Drive" },
    "common.uploading": { en: "Uploading...", es: "Subiendo..." },
    "common.description": { en: "Description", es: "Descripción" },
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        const saved = localStorage.getItem("ahal_language") as Language;
        if (saved && (saved === "en" || saved === "es")) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("ahal_language", lang);
    };

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }
    return context;
}
