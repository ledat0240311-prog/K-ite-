import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Sender, ModelId } from '../types';
import { FileText, Copy, Check, Loader2, ThumbsUp, ThumbsDown, Download, RotateCcw, MoreHorizontal, Volume2, Flag, StopCircle, X, AlertTriangle, Pencil, CornerDownLeft, FileType } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  onImageClick?: (imageUrl: string) => void;
  currentModel?: ModelId;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
}

// Custom Solid Icons to match the user's requested "100% like image" look
const FilledThumbsUp = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
  </svg>
);

const FilledThumbsDown = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
  </svg>
);

// Custom Filled Stop Icon (Circle with Square inside)
const FilledStopCircle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM9 9H15V15H9V9Z" />
  </svg>
);

// Helper to clean Markdown for better speech flow
const cleanMarkdownForSpeech = (markdown: string): string => {
  if (!markdown) return "";
  let text = markdown;

  // 1. Replace Code Blocks with a natural phrase
  // e.g. ```js ... ``` -> "Sau đây là một đoạn mã."
  text = text.replace(/```[\s\S]*?```/g, ". Sau đây là một đoạn mã lập trình. ");
  
  // 2. Remove Inline Code `code`
  text = text.replace(/`([^`]+)`/g, "$1");
  
  // 3. Handle Headers (## Title) - Add pause by replacing with period
  text = text.replace(/^#+\s+(.*)$/gm, "$1.");
  
  // 4. Remove Bold/Italic (**text** or *text*)
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  
  // 5. Clean Links [text](url) -> read only "text"
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  
  // 6. Handle Lists - replace * or - with pauses
  text = text.replace(/^\s*[\-\*]\s+/gm, ", ");
  
  // 7. Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // 8. Collapse multiple spaces/newlines
  text = text.replace(/\s+/g, " ").trim();

  return text;
};

// Sub-component for handling Code Blocks with Copy functionality
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  // Handle inline code
  if (inline || !match) {
    return (
      <code className="bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-slate-200 dark:border-slate-700" {...props}>
        {children}
      </code>
    );
  }

  const language = match[1];

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Outer Container (The "Table" containing the Code)
    // Updated bg to pure white for Light Mode
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm group/code">
        
        {/* Inner Code Block (The dark box) */}
        <div className="rounded-lg overflow-hidden bg-[#1e1e1e] border border-slate-800">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] text-slate-400 select-none border-b border-white/5">
                {/* Left: Language Name */}
                <span className="text-xs font-sans font-medium lowercase text-slate-300">
                    {language}
                </span>

                {/* Right: Copy Button */}
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10 active:scale-95 duration-200"
                    title="Sao chép toàn bộ mã"
                >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? <span className="text-emerald-400">Đã chép</span> : <span>Sao chép mã</span>}
                </button>
            </div>

            {/* Code Content */}
            <pre className="p-4 overflow-x-auto text-[13.5px] leading-6 text-[#d4d4d4] font-mono custom-scrollbar bg-[#1e1e1e] m-0">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    </div>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onImageClick, currentModel, onRegenerate, onEdit }) => {
  const isUser = message.sender === Sender.User;
  const isImageAttachment = message.attachment?.mimeType.startsWith('image/');
  
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Menu & Speech States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('harmful');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Check if AI is "thinking"
  const isThinking = !isUser && !message.text && !message.attachment && !message.isError;
  
  const imageUrl = isImageAttachment && message.attachment 
    ? `data:${message.attachment.mimeType};base64,${message.attachment.data}` 
    : '';

  // Auto-resize textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        textareaRef.current.focus();
        // Move cursor to end
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Clean up speech when unmounting
  useEffect(() => {
    return () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
        }
    };
  }, [isSpeaking]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([message.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kite-response-${message.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (newFeedback) {
        console.log(`[k-ite System] User sent feedback: ${type.toUpperCase()} for message ID: ${message.id}`);
    }
  };

  const handleReadAloud = () => {
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsMenuOpen(false);
          return;
      }

      // 1. Clean the text (remove markdown symbols, handle code blocks)
      const speechText = cleanMarkdownForSpeech(message.text);
      const utterance = new SpeechSynthesisUtterance(speechText);
      
      // 2. Advanced Voice Selection
      // Try to find a high-quality Vietnamese voice (Google, Microsoft)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
          v => v.lang.includes('vi') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
      ) || voices.find(v => v.lang.includes('vi'));

      if (preferredVoice) {
          utterance.voice = preferredVoice;
      }

      // 3. Fallback and Settings
      utterance.lang = 'vi-VN'; 
      utterance.pitch = 1.0; // Slightly deeper/standard pitch
      utterance.rate = 1.0;  // Standard reading speed

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsMenuOpen(false);
  };

  const openReportModal = () => {
      setIsMenuOpen(false);
      setIsReportModalOpen(true);
      setReportReason('harmful'); // Reset to default
  };

  const submitReport = () => {
      setIsSubmittingReport(true);
      // Simulate API call delay
      setTimeout(() => {
          console.log(`[Reported] Message ID: ${message.id}, Reason: ${reportReason}`);
          setIsSubmittingReport(false);
          setIsReportModalOpen(false);
          alert("Cảm ơn bạn. Chúng tôi sẽ xem xét báo cáo này.");
      }, 800);
  };

  const handleSaveEdit = () => {
      if (editedText.trim() !== message.text) {
          onEdit?.(message.id, editedText);
      }
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedText(message.text);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSaveEdit();
      } else if (e.key === 'Escape') {
          handleCancelEdit();
      }
  };

  if (isThinking) {
      return (
          <div className="flex w-full justify-start mb-6 animate-in fade-in duration-300 items-center pl-1">
              <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-black dark:text-white" />
                  {currentModel === 'gemini-3-pro-preview' && (
                    <span className="text-sm font-medium animate-pulse text-black dark:text-white">Đang suy nghĩ...</span>
                  )}
              </div>
          </div>
      );
  }

  return (
    // UPDATED MARGIN LOGIC: Reduced user margin even further (mb-1) to pull AI text up
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${isUser ? 'mb-1' : 'mb-6'} group animate-in slide-in-from-bottom-2 duration-300`}>
      
      {/* REPORT MODAL (Portal) */}
      {isReportModalOpen && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <AlertTriangle size={20} className="text-amber-500" />
                          Báo cáo tin nhắn
                      </h3>
                      <button 
                        onClick={() => setIsReportModalOpen(false)}
                        className="text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Hãy giúp chúng tôi hiểu chuyện gì đang xảy ra với tin nhắn này.</p>
                      
                      <div className="space-y-2">
                          {[
                              { id: 'harmful', label: 'Có hại / Không an toàn' },
                              { id: 'false', label: 'Sai sự thật / Không chính xác' },
                              { id: 'not_helpful', label: 'Không hữu ích' },
                              { id: 'spam', label: 'Spam / Quảng cáo' }
                          ].map((reason) => (
                              <label key={reason.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                  <input 
                                    type="radio" 
                                    name="report_reason" 
                                    value={reason.id}
                                    checked={reportReason === reason.id}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                                  />
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{reason.label}</span>
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                      <button 
                        onClick={() => setIsReportModalOpen(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                          Hủy
                      </button>
                      <button 
                        onClick={submitReport}
                        disabled={isSubmittingReport}
                        className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-lg shadow-sm transition-all flex items-center gap-2"
                      >
                          {isSubmittingReport && <Loader2 size={14} className="animate-spin" />}
                          Gửi báo cáo
                      </button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full md:max-w-[85%]`}>
        
        {/* 1. ATTACHMENT SECTION */}
        {message.attachment && (
            <div className={`mb-3 ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                {isImageAttachment ? (
                    <div 
                        className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm cursor-zoom-in group/image bg-white dark:bg-slate-900"
                        onClick={() => onImageClick?.(imageUrl)}
                    >
                        <img 
                            src={imageUrl}
                            alt="Uploaded content" 
                            className="w-full h-auto object-cover transition-transform duration-300 group-hover/image:scale-105"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 max-w-sm">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                                {message.attachment.fileName || 'Tài liệu đính kèm'}
                            </p>
                            <p className="text-[10px] uppercase truncate text-slate-400 dark:text-slate-500">
                                {message.attachment.mimeType.split('/')[1] || 'FILE'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 2. TEXT CONTENT / EDIT SECTION */}
        {isEditing ? (
            <div className="w-full min-w-[300px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 animate-in zoom-in-95 duration-200">
                <textarea
                    ref={textareaRef}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-slate-800 dark:text-white text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-slate-900 transition-all mb-3"
                    rows={1}
                />
                <div className="flex justify-end gap-3 mt-2">
                    <button 
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 rounded-lg shadow-sm transition-colors"
                    >
                        Gửi
                    </button>
                </div>
            </div>
        ) : (
            (message.text || message.isError) && (
                <div
                    className={`relative ${
                    isUser
                        ? 'bg-[#0b57d0] text-white rounded-[22px] rounded-tr-[4px] px-5 py-3 shadow-sm text-[15px] leading-relaxed'
                        : 'bg-transparent text-black dark:text-slate-100 w-full text-base' 
                    } ${message.isError ? 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400 rounded-xl px-4 py-3' : ''}`}
                    style={{ fontFamily: isUser ? 'Arial, sans-serif' : undefined }}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                        // ... AI Message Rendering (Unchanged)
                        <div className="w-full">
                            <div className="prose dark:prose-invert prose-slate prose-base max-w-none 
                                prose-p:leading-[1.9] prose-p:mb-6 
                                prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
                                prose-li:my-2 prose-li:leading-relaxed
                                prose-strong:font-bold prose-strong:text-black dark:prose-strong:text-white">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                code: CodeBlock,
                                table({children}) {
                                    return (
                                    <div className="overflow-x-auto my-6 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
                                        <table className="w-full border-collapse bg-white dark:bg-slate-900 text-sm">
                                        {children}
                                        </table>
                                    </div>
                                    )
                                },
                                thead({children}) {
                                    return <thead className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">{children}</thead>
                                },
                                th({children}) {
                                    return <th className="border border-slate-300 dark:border-slate-700 px-4 py-3 font-semibold text-xs uppercase tracking-wider text-left">{children}</th>
                                },
                                td({children}) {
                                    return <td className="border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-700 dark:text-slate-300 align-top">{children}</td>
                                },
                                h1({children}) {
                                    return <h1 className="text-3xl font-extrabold text-black dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">{children}</h1>
                                },
                                blockquote({children}) {
                                    return <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic text-slate-600 dark:text-slate-400 my-6">{children}</blockquote>
                                },
                                }}
                            >
                                {message.text}
                            </ReactMarkdown>
                            </div>
                            
                            {/* BOTTOM ACTION BAR (Icons below the AI message) */}
                            {!message.isError && message.text && (
                                <div className="flex items-center justify-between mt-4 pt-2 select-none">
                                    <div className="flex items-center gap-3">
                                        {/* Voting Buttons Group */}
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleFeedback('like')}
                                                className={`p-2 rounded-full transition-all duration-200 ${
                                                    feedback === 'like' 
                                                    ? 'text-black dark:text-white scale-110' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                }`}
                                                title={feedback === 'like' ? "Đã gửi phản hồi thích" : "Thích"}
                                            >
                                                {feedback === 'like' ? (
                                                    <FilledThumbsUp className="w-[18px] h-[18px]" />
                                                ) : (
                                                    <ThumbsUp size={18} />
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => handleFeedback('dislike')}
                                                className={`p-2 rounded-full transition-all duration-200 ${
                                                    feedback === 'dislike' 
                                                    ? 'text-black dark:text-white scale-110' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                                }`}
                                                title={feedback === 'dislike' ? "Đã gửi phản hồi không thích" : "Không thích"}
                                            >
                                                {feedback === 'dislike' ? (
                                                    <FilledThumbsDown className="w-[18px] h-[18px]" />
                                                ) : (
                                                    <ThumbsDown size={18} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                                        {/* Tools Group */}
                                        <button 
                                            onClick={handleCopyMessage}
                                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                            title="Sao chép"
                                        >
                                            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                        </button>
                                        
                                        {/* Text Download Button */}
                                        <button 
                                            onClick={handleDownload}
                                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                            title="Tải xuống (txt)"
                                        >
                                            <Download size={18} />
                                        </button>

                                        <button 
                                            onClick={() => onRegenerate?.(message.id)}
                                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                            title="Tải lại câu trả lời"
                                        >
                                            <RotateCcw size={18} />
                                        </button>

                                        {/* More Menu with Dropdown */}
                                        <div className="relative" ref={menuRef}>
                                            <button 
                                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                                className={`p-2 rounded-full transition-all border border-transparent ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                                title="Khác"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Dropdown Menu - INCREASED WIDTH from w-40 to w-52 */}
                                            {isMenuOpen && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 z-10 animate-in fade-in zoom-in-95 duration-200 origin-bottom">
                                                    <div className="space-y-0.5">
                                                        <button
                                                            onClick={handleReadAloud}
                                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                                        >
                                                            {isSpeaking ? (
                                                                // Use the new Custom Filled Stop Circle Icon
                                                                <FilledStopCircle className="w-[18px] h-[18px] text-black dark:text-white" />
                                                            ) : (
                                                                <Volume2 size={18} className="text-black dark:text-white" />
                                                            )}
                                                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                                {isSpeaking ? 'Dừng đọc' : 'Đọc to'}
                                                            </span>
                                                        </button>
                                                        
                                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>

                                                        <button
                                                            onClick={openReportModal}
                                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                                                        >
                                                            <Flag size={18} className="text-black dark:text-white" />
                                                            <span className="font-medium text-sm text-slate-900 dark:text-white">Báo cáo tin nhắn</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <span className="text-[11px] text-slate-300 dark:text-slate-600 font-medium">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* User Timestamp (Only when not editing) */}
                    {isUser && !isEditing && (
                    <span className="text-[10px] absolute bottom-1 right-3 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    )}
                </div>
            )
        )}
        
        {/* NEW: User Message Actions (Copy & Edit) - BELOW the bubble, SMALLER and CLOSER */}
        {!isEditing && isUser && (
            <div className="flex items-center gap-2 mt-2 mr-2 select-none">
                <button
                    onClick={handleCopyMessage}
                    className="p-2 rounded-full text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Sao chép văn bản"
                >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Chỉnh sửa"
                >
                    <Pencil size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};