"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit2, Trash2, Share2, FolderInput } from "lucide-react";

interface VideoMenuProps {
    onRename: () => void;
    onDelete: () => void;
    onShare: () => void;
    onMove: () => void;
}

export default function VideoMenu({ onRename, onDelete, onShare, onMove }: VideoMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onRename(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
                    >
                        <Edit2 size={14} />
                        Rename
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onShare(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
                    >
                        <Share2 size={14} />
                        Share
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onMove(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition text-left"
                    >
                        <FolderInput size={14} />
                        Move to...
                    </button>
                    <div className="h-[1px] bg-white/5 my-1" />
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition text-left"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
