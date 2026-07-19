/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Memory } from "../types";
import {
  Heart,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Calendar,
  Smile
} from "lucide-react";

interface MemoryCardProps {
  key?: any;
  memory: Memory;
  onToggleFavorite: (id: string, isFav: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
}

export default function MemoryCard({
  memory,
  onToggleFavorite,
  onDelete,
  onTagClick,
}: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const truncatedContent = memory.content.length > 250 && !isExpanded
    ? `${memory.content.substring(0, 250)}...`
    : memory.content;

  // Find primary URL inside content or previews
  const contentUrls = memory.content.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi);
  const primaryUrl = contentUrls?.[0] || (memory.linkPreviews && memory.linkPreviews[0]?.url);

  const getCleanUrl = (urlStr: string) => {
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      return urlStr;
    }
    return `https://${urlStr}`;
  };

  const handleContentClick = () => {
    if (primaryUrl) {
      window.open(getCleanUrl(primaryUrl), "_blank", "noopener,noreferrer");
    }
  };

  const renderContentWithLinks = (text: string) => {
    // URL pattern to match http/https or www.
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts = text.split(urlRegex);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith("http") ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline font-medium hover:text-gray-600 px-1 rounded bg-gray-50 hover:bg-gray-100 transition-colors break-all inline-flex items-center space-x-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{part}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0 ml-0.5 text-gray-400" />
          </a>
        );
      }
      return part;
    });
  };

  // YouTube parser
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>{memory.date}</span>
        </span>
 
        {/* Header Actions */}
        <div className="flex items-center space-x-1.5 text-gray-400">
          <button
            onClick={() => memory.id && onToggleFavorite(memory.id, !memory.isFavorite)}
            className="p-1 hover:text-rose-500 rounded-lg transition-colors group"
            title="즐겨찾기"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all ${
                memory.isFavorite
                  ? "fill-rose-500 text-rose-500 scale-110"
                  : "text-gray-300 hover:text-gray-500"
              }`}
            />
          </button>
          <button
            onClick={() => memory.id && onDelete(memory.id)}
            className="p-1 hover:text-red-500 rounded-lg transition-colors"
            title="기억 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
 
      {/* Card Title & Text Body */}
      <div className="space-y-1.5 text-left">
        {memory.title && (
          <h3 className="text-xs font-semibold text-gray-900 leading-snug">
            {memory.title}
          </h3>
        )}
        <div
          onClick={primaryUrl ? handleContentClick : undefined}
          className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap ${
            primaryUrl
              ? "cursor-pointer hover:bg-gray-50/70 p-2.5 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition-all group/content relative"
              : ""
          }`}
        >
          {renderContentWithLinks(truncatedContent)}
          {primaryUrl && (
            <div className="mt-2 flex items-center space-x-1 text-[9px] text-gray-400 opacity-80 group-hover/content:text-black transition-colors">
              <ExternalLink className="w-2.5 h-2.5" />
              <span>클릭하여 보관된 링크 열기</span>
            </div>
          )}
        </div>
        {memory.content.length > 250 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[10px] font-medium text-gray-500 hover:text-black underline transition-colors flex items-center mt-1"
          >
            <span>{isExpanded ? "접기" : "내용 더보기"}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        )}
      </div>

      {/* Attached Media Renderers */}
      {((memory.media?.images?.length || 0) > 0 ||
        (memory.media?.videos?.length || 0) > 0 ||
        (memory.linkPreviews?.length || 0) > 0) && (
        <div className="space-y-3 pt-1">
          {/* Images Grid */}
          {memory.media?.images && memory.media.images.length > 0 && (
            <div className={`grid gap-1.5 ${
              memory.media.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}>
              {memory.media.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className="relative group rounded-xl overflow-hidden aspect-video border border-gray-100 bg-gray-50 cursor-zoom-in"
                >
                  <img
                    src={img}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Videos Grid */}
          {memory.media?.videos && memory.media.videos.length > 0 && (
            <div className="space-y-2">
              {memory.media.videos.map((vid, idx) => {
                const embedUrl = getYouTubeEmbedUrl(vid);
                return (
                  <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 bg-black aspect-video relative shadow-xs">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={`Embedded video ${idx}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video
                        src={vid}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* URL Bookmark Previews */}
          {memory.linkPreviews && memory.linkPreviews.length > 0 && (
            <div className="space-y-2">
              {memory.linkPreviews.map((preview, idx) => (
                <a
                  key={idx}
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex bg-gray-50 hover:bg-gray-100/70 border border-gray-100 rounded-xl overflow-hidden p-2 transition-all group"
                >
                  {preview.image && (
                    <img
                      src={preview.image}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-20 h-14 object-cover rounded-lg shrink-0 border border-gray-100 bg-white"
                    />
                  )}
                  <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center text-left">
                    <span className="text-[10px] text-gray-500 font-bold truncate tracking-tight uppercase flex items-center space-x-1">
                      <span>{preview.siteName || "참고 웹"}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                    <h4 className="text-[11px] font-bold text-gray-800 truncate leading-snug group-hover:text-black transition-colors">
                      {preview.title || preview.url}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate leading-normal">
                      {preview.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hashtag List */}
      {memory.tags && memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {memory.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick && onTagClick(tag)}
              className="text-[10px] bg-gray-100 text-gray-700 border border-gray-200/50 hover:bg-gray-200 transition-colors px-2.5 py-1 rounded-md font-medium"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={activeImage}
            alt=""
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scaleUp"
          />
        </div>
      )}
    </div>
  );
}
