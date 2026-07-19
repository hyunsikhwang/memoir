/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Memory } from "./types";
import { db, isFirebaseEnabled } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import QuickAddForm from "./components/QuickAddForm";
import MemoryList from "./components/MemoryList";
import { Sparkles, BrainCircuit, ShieldAlert, CloudCheck, Loader2 } from "lucide-react";

export default function App() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Show auto-dismiss toast helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Sync with Firestore or LocalStorage on mount
  useEffect(() => {
    let unsubscribe: any = null;

    if (isFirebaseEnabled && db) {
      try {
        const memoriesRef = collection(db, "memories");
        const q = query(memoriesRef, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list: Memory[] = [];
            snapshot.forEach((docSnap) => {
              list.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<Memory, "id">),
              });
            });
            setMemories(list);
            setIsLoading(false);
          },
          (error) => {
            console.error("Firestore sync error, fallback to LocalStorage:", error);
            loadFromLocalStorage();
          }
        );
      } catch (err) {
        console.error("Failed to setup Firestore listener:", err);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("memories_vault");
      if (stored) {
        setMemories(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load memories from localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Add / Save memory
  const handleSaveMemory = async (newMemory: Omit<Memory, "id">) => {
    if (isFirebaseEnabled && db) {
      try {
        await addDoc(collection(db, "memories"), newMemory);
        showToast("기억 창고에 소중한 조각이 안전하게 저장되었습니다! ✨", "success");
      } catch (error) {
        console.error("Failed to save to Firestore:", error);
        saveToLocalStorageFallback(newMemory);
      }
    } else {
      saveToLocalStorageFallback(newMemory);
    }
  };

  const saveToLocalStorageFallback = (newMemory: Omit<Memory, "id">) => {
    try {
      const updated: Memory = {
        id: `local_${Date.now()}`,
        ...newMemory,
      };
      const newList = [updated, ...memories];
      setMemories(newList);
      localStorage.setItem("memories_vault", JSON.stringify(newList));
      showToast("기억이 브라우저 로컬 저장소에 안전하게 기록되었습니다. 💾", "success");
    } catch (e) {
      console.error("LocalStorage save error:", e);
      showToast("기억 저장에 실패했습니다.", "error");
    }
  };

  // 2. Delete memory
  const handleDeleteMemory = async (id: string) => {
    if (window.confirm("정말로 이 기억을 삭제하시겠습니까? 지워진 기억은 복구할 수 없습니다.")) {
      if (isFirebaseEnabled && db && !id.startsWith("local_")) {
        try {
          await deleteDoc(doc(db, "memories", id));
          showToast("기억의 한 조각이 삭제되었습니다.", "info");
        } catch (error) {
          console.error("Failed to delete from Firestore:", error);
          deleteFromLocalStorageFallback(id);
        }
      } else {
        deleteFromLocalStorageFallback(id);
      }
    }
  };

  const deleteFromLocalStorageFallback = (id: string) => {
    try {
      const newList = memories.filter((m) => m.id !== id);
      setMemories(newList);
      localStorage.setItem("memories_vault", JSON.stringify(newList));
      showToast("기억이 로컬에서 삭제되었습니다.", "info");
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Toggle favorite
  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    if (isFirebaseEnabled && db && !id.startsWith("local_")) {
      try {
        await updateDoc(doc(db, "memories", id), { isFavorite: isFav });
      } catch (error) {
        console.error("Failed to update Firestore favorite:", error);
        toggleFavoriteLocalStorageFallback(id, isFav);
      }
    } else {
      toggleFavoriteLocalStorageFallback(id, isFav);
    }
  };

  const toggleFavoriteLocalStorageFallback = (id: string, isFav: boolean) => {
    try {
      const newList = memories.map((m) =>
        m.id === id ? { ...m, isFavorite: isFav } : m
      );
      setMemories(newList);
      localStorage.setItem("memories_vault", JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };



  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-800 transition-colors duration-150 pb-12 font-sans selection:bg-gray-100 selection:text-black">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center space-x-2 animate-scaleUp text-xs font-medium border border-gray-800">
          <Sparkles className="w-4 h-4 text-gray-400 animate-spin-slow shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Slim Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-150 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <span className="text-base font-semibold tracking-tight text-gray-900">Memoir.</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest border-l border-gray-200 pl-3 hidden sm:inline-block">Archive System</span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center space-x-1">
              {isFirebaseEnabled ? (
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-150 text-[10px] text-gray-600 font-medium">
                  <CloudCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span>Cloud Synced</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-150 text-[10px] text-gray-600 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
                  <span>Local Workspace</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Aesthetic Page Title Intro */}
        <div className="text-left space-y-1 mb-8">
          <h1 className="text-lg font-medium text-gray-900 tracking-tight">
            Personal Memory Archive
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
            생각, 영감, 그리고 유용한 웹 사이트 링크를 한곳에 담아두세요.
            가볍고 정제된 방식으로 소중한 일상을 안전하게 보관합니다.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quick Add Workspace (Desktop 5/12 width) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
            <QuickAddForm onSave={handleSaveMemory} />
          </div>

          {/* Right Column: Search Hub & Memory Feed (Desktop 7/12 width) */}
          <div className="lg:col-span-7 space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-2xl p-16 border border-gray-200 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-gray-800 animate-spin" />
                <span className="text-xs text-gray-500 font-medium font-display">기억을 열어보고 있습니다...</span>
              </div>
            ) : (
              <MemoryList
                memories={memories}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteMemory}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Add simple loader styles inline just in case
const style = document.createElement("style");
style.textContent = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;
document.head.appendChild(style);
