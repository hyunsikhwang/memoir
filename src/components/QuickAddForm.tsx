/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Memory, LinkPreview } from "../types";
import {
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Plus,
  X,
  Loader2,
  Calendar,
  Compass
} from "lucide-react";

interface QuickAddFormProps {
  onSave: (memory: Omit<Memory, "id">) => Promise<void>;
}

export default function QuickAddForm({ onSave }: QuickAddFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = new Date(today.getTime() - tzOffset).toISOString().slice(0, 10);
    return localISOTime;
  });

  // Media states
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [linkUrls, setLinkUrls] = useState<string[]>([]);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);

  // Input drawers
  const [showImageInput, setShowImageInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Field values
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [tempVideoUrl, setTempVideoUrl] = useState("");
  const [tempLinkUrl, setTempLinkUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setImageUrls((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle image copy & paste inside the content box
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData) {
      const items = e.clipboardData.items;
      let hasImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            hasImage = true;
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                setImageUrls((prev) => [...prev, reader.result as string]);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
      if (hasImage) {
        e.preventDefault();
      }
    }
  };

  // Add online image url
  const addImageUrl = () => {
    if (tempImageUrl.trim()) {
      setImageUrls((prev) => [...prev, tempImageUrl.trim()]);
      setTempImageUrl("");
      setShowImageInput(false);
    }
  };

  // Add online video url (handles youtube links)
  const addVideoUrl = () => {
    if (tempVideoUrl.trim()) {
      let cleanedUrl = tempVideoUrl.trim();
      // Parse Youtube URL to embed format if needed
      setVideoUrls((prev) => [...prev, cleanedUrl]);
      setTempVideoUrl("");
      setShowVideoInput(false);
    }
  };

  // Add link URL and fetch meta preview card
  const addLinkUrl = async () => {
    if (!tempLinkUrl.trim()) return;
    const url = tempLinkUrl.trim();

    // Prevent duplicate urls
    if (linkUrls.includes(url)) {
      setTempLinkUrl("");
      setShowLinkInput(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/preview-link?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data: LinkPreview = await res.json();
        setLinkUrls((prev) => [...prev, url]);
        setLinkPreviews((prev) => [...prev, data]);
      } else {
        throw new Error("Failed to load metadata.");
      }
    } catch (err) {
      // Graceful fallback
      setLinkUrls((prev) => [...prev, url]);
      setLinkPreviews((prev) => [
        ...prev,
        {
          url,
          title: url,
          description: "소중한 링크가 첨부되었습니다.",
        }
      ]);
    } finally {
      setPreviewLoading(false);
      setTempLinkUrl("");
      setShowLinkInput(false);
    }
  };

  // Remove elements
  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeLink = (index: number) => {
    setLinkUrls((prev) => prev.filter((_, i) => i !== index));
    setLinkPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag inputs
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/#/g, "");
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags((prev) => [...prev, cleanTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Handle final save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) return;

    const memoryTitle = title.trim() || (content.trim() ? `${content.substring(0, 15)}...` : "이미지 기록");

    const newMemory: Omit<Memory, "id"> = {
      title: memoryTitle,
      content: content.trim(),
      createdAt: Date.now(),
      date,
      tags,
      media: {
        images: imageUrls,
        videos: videoUrls,
        urls: linkUrls,
      },
      linkPreviews,
    };

    await onSave(newMemory);

    // Reset Form
    setTitle("");
    setContent("");
    setDate(new Date().toISOString().slice(0, 10));
    setImageUrls([]);
    setVideoUrls([]);
    setLinkUrls([]);
    setLinkPreviews([]);
    setTags([]);
    setTagInput("");
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">New Entry</h2>
        <span className="text-[10px] text-gray-400">기록 보관</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Memory Date & Title */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 relative">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl py-2.5 pl-9 pr-3 border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하지 않으면 내용이 요약되어 보관됩니다."
              className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl py-2.5 px-3 border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-gray-300 focus:border-gray-400"
            />
          </div>
        </div>

        {/* Content Box */}
        <div>
          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="생각, 떠오른 아이디어, 보관할 링크를 입력하거나 클립보드 이미지를 붙여넣어 보세요."
            rows={4}
            className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl p-3.5 border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-gray-300 focus:border-gray-400 resize-y leading-relaxed"
          />
        </div>

        {/* Interactive Add Media Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between border-t border-b border-gray-100 py-3">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Add Media</span>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(!showImageInput);
                  setShowVideoInput(false);
                  setShowLinkInput(false);
                }}
                className={`flex items-center space-x-1 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                  showImageInput ? "bg-gray-100 border-gray-300 text-black font-medium" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVideoInput(!showVideoInput);
                  setShowImageInput(false);
                  setShowLinkInput(false);
                }}
                className={`flex items-center space-x-1 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                  showVideoInput ? "bg-gray-100 border-gray-300 text-black font-medium" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(!showLinkInput);
                  setShowImageInput(false);
                  setShowVideoInput(false);
                }}
                className={`flex items-center space-x-1 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                  showLinkInput ? "bg-gray-100 border-gray-300 text-black font-medium" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
                }`}
              >
                <LinkIcon className="w-3 h-3" />
                <span>Web Link</span>
              </button>
            </div>
          </div>

          {/* Image Input Drawer */}
          {showImageInput && (
            <div className="p-3 bg-gray-50 rounded-xl mt-2 space-y-2.5 border border-gray-100 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500">사진 추가 방법 선택</span>
                <button type="button" onClick={() => setShowImageInput(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-gray-100/50 border border-dashed border-gray-200 py-3.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span className="text-[10px] font-medium text-gray-600">내 컴퓨터에서 파일 업로드</span>
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="bg-white border border-gray-100 rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[9px] text-gray-400 font-medium mb-1">웹 이미지 주소(URL) 입력</span>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={tempImageUrl}
                      onChange={(e) => setTempImageUrl(e.target.value)}
                      className="text-[10px] text-gray-700 bg-gray-50 rounded-lg p-1.5 flex-1 border border-gray-100 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="bg-indigo-600 text-white text-[10px] font-bold px-2 rounded-lg hover:bg-indigo-700"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Input Drawer */}
          {showVideoInput && (
            <div className="p-3 bg-gray-50 rounded-xl mt-2 space-y-2 border border-gray-100 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500">동영상 주소(YouTube 또는 MP4 링크) 첨부</span>
                <button type="button" onClick={() => setShowVideoInput(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="예: https://www.youtube.com/watch?v=... 또는 mp4 주소"
                  value={tempVideoUrl}
                  onChange={(e) => setTempVideoUrl(e.target.value)}
                  className="text-[10px] text-gray-700 bg-white rounded-lg p-2 flex-1 border border-gray-100 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={addVideoUrl}
                  className="bg-indigo-600 text-white text-[10px] font-bold px-3 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* Link Input Drawer */}
          {showLinkInput && (
            <div className="p-3 bg-gray-50 rounded-xl mt-2 space-y-2 border border-gray-100 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500">참조할 웹 사이트(URL) 첨부</span>
                <button type="button" onClick={() => setShowLinkInput(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="예: https://brunch.co.kr/@... 혹은 참고 기사 주소"
                  value={tempLinkUrl}
                  onChange={(e) => setTempLinkUrl(e.target.value)}
                  className="text-[10px] text-gray-700 bg-white rounded-lg p-2 flex-1 border border-gray-100 focus:outline-hidden"
                />
                <button
                  type="button"
                  disabled={previewLoading}
                  onClick={addLinkUrl}
                  className="bg-indigo-600 text-white text-[10px] font-bold px-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 whitespace-nowrap flex items-center space-x-1"
                >
                  {previewLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>추가</span>
                </button>
              </div>
            </div>
          )}

          {/* Media Attachments Preview List */}
          {(imageUrls.length > 0 || videoUrls.length > 0 || linkPreviews.length > 0) && (
            <div className="mt-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-3.5">
              {/* Image Previews */}
              {imageUrls.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">사진 첨부 목록 ({imageUrls.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((img, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 group">
                        <img src={img} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Previews */}
              {videoUrls.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">동영상 첨부 목록 ({videoUrls.length})</h4>
                  <div className="space-y-1.5">
                    {videoUrls.map((vid, i) => (
                      <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-[10px] text-gray-600">
                        <div className="flex items-center space-x-1.5 truncate">
                          <Film className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">{vid}</span>
                        </div>
                        <button type="button" onClick={() => removeVideo(i)} className="text-gray-400 hover:text-red-500 ml-2">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link og Card Previews */}
              {linkPreviews.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">웹 링크 첨부 목록 ({linkPreviews.length})</h4>
                  <div className="space-y-2">
                    {linkPreviews.map((preview, i) => (
                      <div key={i} className="relative bg-white border border-gray-100 rounded-xl overflow-hidden flex h-14 p-1.5 space-x-2 group">
                        {preview.image && (
                          <img src={preview.image} referrerPolicy="no-referrer" alt="" className="w-12 h-full object-cover rounded-lg shrink-0 border border-gray-50" />
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                          <p className="text-[10px] font-bold text-gray-800 truncate">{preview.title || preview.url}</p>
                          <p className="text-[9px] text-gray-400 truncate leading-normal">{preview.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLink(i)}
                          className="absolute -top-1 -right-1 bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags input */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1 font-display">태그 첨부 (쉼표 혹은 엔터 입력)</label>
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200 items-center">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-0.5 text-[10px] bg-white text-gray-800 border border-gray-200 font-medium px-2 py-0.5 rounded-lg"
              >
                <span>#{tag}</span>
                <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "예: 가족, 나들이, 깨달음" : ""}
              className="text-[10px] bg-transparent text-gray-700 border-none outline-hidden p-1 min-w-[120px] flex-1"
            />
          </div>
        </div>

        {/* Submit Form Button */}
        <div className="pt-4 flex justify-end border-t border-gray-100">
          <button
            type="submit"
            disabled={!content.trim() && imageUrls.length === 0}
            className="w-full md:w-auto bg-black hover:bg-gray-900 text-white text-xs font-semibold py-2.5 px-8 rounded-xl shadow-sm transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            기억 저장하기 🔒
          </button>
        </div>
      </form>
    </div>
  );
}
