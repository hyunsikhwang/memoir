/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Memory } from "../types";
import MemoryCard from "./MemoryCard";
import {
  Search,
  Heart,
  Sparkles,
  Inbox,
  X,
  Filter,
  SlidersHorizontal
} from "lucide-react";

interface MemoryListProps {
  memories: Memory[];
  onToggleFavorite: (id: string, isFav: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface MemoryListProps {
  memories: Memory[];
  onToggleFavorite: (id: string, isFav: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function MemoryList({
  memories,
  onToggleFavorite,
  onDelete,
}: MemoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Clear all filters easily
  const resetFilters = () => {
    setSearchQuery("");
    setFavoritesOnly(false);
    setActiveTag(null);
  };

  // Click a tag in a card to trigger filtering
  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
  };

  // Memoized filter logic
  const filteredMemories = useMemo(() => {
    let result = [...memories];

    // 1. Filter by favorites
    if (favoritesOnly) {
      result = result.filter((m) => m.isFavorite);
    }

    // 2. Filter by selected tag click
    if (activeTag) {
      result = result.filter((m) => m.tags && m.tags.includes(activeTag));
    }

    // 3. Filter by search query (searches title, content, and tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        const titleMatch = m.title ? m.title.toLowerCase().includes(q) : false;
        const contentMatch = m.content.toLowerCase().includes(q);
        const tagMatch = m.tags ? m.tags.some((tag) => tag.toLowerCase().includes(q)) : false;
        return titleMatch || contentMatch || tagMatch;
      });
    }

    // Sort newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [memories, searchQuery, favoritesOnly, activeTag]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Hub */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
        {/* Search Input Bar + Favorite Toggle */}
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="보관된 기록 검색 (내용, 제목, #태그)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl py-2.5 pl-10 pr-4 border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
              favoritesOnly
                ? "bg-black border-black text-white"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-white text-white" : "text-gray-400"}`} />
            <span>중요 기억만 {favoritesOnly ? "끄기" : "보기"}</span>
          </button>
        </div>

        {/* Filter Activator Info */}
        {(activeTag || favoritesOnly || searchQuery) && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-display mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-gray-400" />
              <span>검색 필터</span>
            </span>
            {activeTag && (
              <span className="inline-flex items-center text-[10px] bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200">
                태그: #{activeTag}
                <button onClick={() => setActiveTag(null)} className="ml-1 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {favoritesOnly && (
              <span className="inline-flex items-center text-[10px] bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200">
                즐겨찾기 전용
                <button onClick={() => setFavoritesOnly(false)} className="ml-1 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center text-[10px] bg-white text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-200">
                검색어: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 text-gray-400 hover:text-gray-600"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline ml-auto font-medium"
            >
              필터 전체초기화
            </button>
          </div>
        )}
      </div>

      {/* Grid of Memories */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-4 bg-gray-50 rounded-full text-gray-400">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-800 font-display">매칭되는 기억이 없습니다.</h3>
            <p className="text-xs text-gray-400 leading-normal max-w-xs">
              검색어를 변경하거나 필터 전체 초기화 버튼을 눌러 처음으로 돌아갈 수 있습니다.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="bg-black hover:bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all border border-black"
          >
            모든 필터 제거하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
