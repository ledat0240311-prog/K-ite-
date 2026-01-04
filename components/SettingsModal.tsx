import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Moon, Sun, Monitor, Trash2, Download, Shield, FileText, Info, LogOut, ArrowLeft } from 'lucide-react';
import { ChatSession } from '../types';

type Theme = 'system' | 'light' | 'dark';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  userEmail: string | null;
  onLogout: () => void;
  sessions: ChatSession[];
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
}

type Tab = 'general' | 'data' | 'about';
type DocType = 'terms' | 'privacy' | 'license' | null;

const TERMS_CONTENT = {
    terms: `1. Chấp nhận Điều khoản\nBằng việc sử dụng k-ite, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.\n\n2. Sử dụng Dịch vụ\nk-ite là một trợ lý AI. Bạn chịu trách nhiệm về nội dung bạn nhập vào và cách bạn sử dụng câu trả lời.\n\n3. Giới hạn Trách nhiệm\nChúng tôi không chịu trách nhiệm về tính chính xác tuyệt đối của thông tin do AI tạo ra.`,
    privacy: `1. Thu thập dữ liệu\nChúng tôi lưu trữ lịch sử trò chuyện của bạn cục bộ trên trình duyệt (Local Storage). Chúng tôi không gửi dữ liệu này đến máy chủ lưu trữ dài hạn nào của bên thứ ba.\n\n2. Quyền của bạn\nBạn có quyền xóa toàn bộ lịch sử chat hoặc xóa tài khoản bất cứ lúc nào trong phần Cài đặt.`,
    license: `MIT License\n\nCopyright (c) 2025 k-ite Team\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...`
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearHistory,
  userEmail,
  onLogout,
  sessions,
  currentTheme,
  onSetTheme
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [viewingDoc, setViewingDoc] = useState<DocType>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleExportData = () => {
    if (sessions.length === 0) {
        alert("Không có dữ liệu để xuất.");
        return;
    }
    const dataStr = JSON.stringify({ user: userEmail, sessions, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kite_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
      if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử chat và thông tin đăng nhập trên trình duyệt này. Bạn không thể hoàn tác. Bạn có chắc chắn không?")) {
          // 1. Clear sessions specific to user
          localStorage.removeItem(`kite_sessions_${userEmail}`);
          localStorage.removeItem(`kite_theme_${userEmail}`); // Clear theme preference
          // 2. Clear user login
          localStorage.removeItem('kite_user_email');
          // 3. Close modal & Logout
          onClose();
          onLogout();
      }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-2xl h-[550px] flex overflow-hidden animate-in zoom-in-95 duration-200 md:flex-row flex-col transition-colors duration-200 border border-transparent dark:border-white/10">
        
        {/* Sidebar (Tabs) - UPDATED to pure white */}
        <div className="w-full md:w-56 bg-white dark:bg-black border-r border-slate-100 dark:border-white/10 p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="md:hidden flex justify-between items-center mb-2 px-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">Cài đặt</span>
                <button onClick={onClose} className="text-slate-500 dark:text-slate-400"><X size={20} /></button>
            </div>
            
            <button 
                onClick={() => { setActiveTab('general'); setViewingDoc(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${activeTab === 'general' ? 'bg-slate-100 dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
            >
                <Monitor size={18} />
                Chung
            </button>
            <button 
                onClick={() => { setActiveTab('data'); setViewingDoc(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${activeTab === 'data' ? 'bg-slate-100 dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
            >
                <Shield size={18} />
                Kiểm soát dữ liệu
            </button>
            <button 
                onClick={() => { setActiveTab('about'); setViewingDoc(null); }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${activeTab === 'about' ? 'bg-slate-100 dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
            >
                <Info size={18} />
                Giới thiệu & Pháp lý
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-black relative">
            <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-black z-10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeTab === 'general' && 'Cài đặt chung'}
                    {activeTab === 'data' && 'Kiểm soát dữ liệu'}
                    {activeTab === 'about' && (viewingDoc ? 'Chi tiết' : 'Giới thiệu')}
                </h2>
                <button 
                    onClick={onClose}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                
                {/* --- TAB: GENERAL --- */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Theme Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block">Giao diện</label>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
                                <button 
                                    onClick={() => onSetTheme('system')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTheme === 'system' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Monitor size={14} /> Hệ thống
                                </button>
                                <button 
                                    onClick={() => onSetTheme('light')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTheme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Sun size={14} /> Sáng
                                </button>
                                <button 
                                    onClick={() => onSetTheme('dark')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTheme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Moon size={14} /> Tối
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/10"></div>

                        {/* Account Section (Simple) */}
                        <div className="space-y-3">
                             <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block">Tài khoản</label>
                             <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/10 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-400">{userEmail}</span>
                                <button 
                                    onClick={() => { onClose(); onLogout(); }}
                                    className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Đăng xuất
                                </button>
                             </div>
                        </div>

                         <div className="h-px bg-slate-100 dark:bg-white/10"></div>

                        {/* Clear History */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Xóa tất cả đoạn chat</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Xóa toàn bộ lịch sử trò chuyện khỏi thiết bị này.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if(window.confirm("Bạn có chắc chắn không?")) {
                                        onClearHistory();
                                    }
                                }}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors border border-red-100 dark:border-red-900/30"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                )}

                {/* --- TAB: DATA CONTROLS --- */}
                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                         <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Xuất dữ liệu</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tải xuống nội dung các cuộc trò chuyện của bạn dưới dạng JSON.</p>
                            </div>
                            <button 
                                onClick={handleExportData}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Download size={16} />
                                Xuất
                            </button>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/10"></div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200">Xóa tài khoản</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hành động này sẽ xóa vĩnh viễn tài khoản và dữ liệu khỏi trình duyệt này.</p>
                            </div>
                            <button 
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                )}

                {/* --- TAB: ABOUT --- */}
                {activeTab === 'about' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {viewingDoc ? (
                             <div className="flex flex-col h-full">
                                <button 
                                    onClick={() => setViewingDoc(null)}
                                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Quay lại
                                </button>
                                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                        {viewingDoc === 'terms' && 'Điều khoản sử dụng'}
                                        {viewingDoc === 'privacy' && 'Chính sách quyền riêng tư'}
                                        {viewingDoc === 'license' && 'Giấy phép mã nguồn mở'}
                                    </h3>
                                    <p className="whitespace-pre-wrap font-mono text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-300">
                                        {viewingDoc === 'terms' && TERMS_CONTENT.terms}
                                        {viewingDoc === 'privacy' && TERMS_CONTENT.privacy}
                                        {viewingDoc === 'license' && TERMS_CONTENT.license}
                                    </p>
                                </div>
                             </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-200 uppercase tracking-wider">Giới thiệu về k-ite</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        k-ite là một trợ lý AI thông minh, được thiết kế với giao diện tối giản, tập trung vào trải nghiệm người dùng và hiệu suất.
                                        Phiên bản hiện tại: <strong>1.2.0 (Preview)</strong>
                                    </p>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-white/10"></div>

                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setViewingDoc('terms')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-left group transition-colors"
                                    >
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Điều khoản sử dụng</span>
                                        <FileText size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                                    </button>
                                    <button 
                                        onClick={() => setViewingDoc('privacy')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-left group transition-colors"
                                    >
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Chính sách quyền riêng tư</span>
                                        <Shield size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                                    </button>
                                    <button 
                                        onClick={() => setViewingDoc('license')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-left group transition-colors"
                                    >
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Giấy phép mã nguồn mở</span>
                                        <FileText size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                                    </button>
                                </div>
                                
                                <div className="pt-4 text-center">
                                    <p className="text-xs text-slate-400 dark:text-slate-500">© 2025 k-ite AI. All rights reserved.</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};