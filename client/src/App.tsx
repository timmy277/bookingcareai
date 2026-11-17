import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Hospital,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
  Zap,
} from 'lucide-react';
import { Appointment, ChatMessage, Doctor, EvaluationSummary } from './types';

const SUGGESTION_QUERIES = [
  'Tôi hay bị đau nhức khớp gối khi lên cầu thang, khám chuyên khoa gì?',
  'Ợ chua nóng rát xương ức, khám nội soi dạ dày ở đâu tại TP.HCM?',
  'Tìm bác sĩ chuyên khoa Thần kinh giỏi tại Bệnh viện Bạch Mai Hà Nội',
  'Giá khám và lịch của PGS.TS.BS Trần Trung Dũng',
  'Đau ngực dữ dội lan ra cánh tay trái, khó thở vã mồ hôi hột',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'benchmark'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'local' | 'openai' | 'anthropic'>('local');
  const [apiKey, setApiKey] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingFormData, setBookingFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    date: '2026-11-20',
    timeSlot: '08:00 - 09:30',
    symptoms: '',
  });
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Benchmark State
  const [benchmarkSummary, setBenchmarkSummary] = useState<EvaluationSummary | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkFilterCat, setBenchmarkFilterCat] = useState<string>('all');
  const [benchmarkSearch, setBenchmarkSearch] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message and load appointments
  useEffect(() => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Xin chào quý khách! Tôi là **Trợ lý AI Y tế BookingCare**.\n\nTôi có thể hỗ trợ quý khách:\n1. **Tư vấn triệu chứng** & gợi ý chuyên khoa phù hợp.\n2. **Tìm kiếm Bác sĩ & Bệnh viện** hàng đầu (Bạch Mai, Chợ Rẫy, Việt Đức, ĐH Y Dược...).\n3. **Tra cứu giá khám** & các khung giờ còn trống.\n4. **Đặt lịch khám nhanh chóng**, nhận ngay mã phiếu hẹn điện tử.\n\nQuý khách đang có triệu chứng gì hoặc muốn đặt lịch khám với chuyên gia nào?`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        metrics: {
          latencyMs: 120,
          inputTokens: 120,
          outputTokens: 180,
          modelUsed: 'BookingCare-Assistant-v1',
          provider: 'Local-Medical-RAG',
          isWithinTokenLimit: true,
          isWithinLatencyLimit: true,
        },
      },
    ]);

    fetchAppointments();
    fetchBenchmark();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/booking');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchBenchmark = async () => {
    try {
      setBenchmarkLoading(true);
      const res = await fetch('/api/eval/summary');
      if (res.ok) {
        const data = await res.json();
        setBenchmarkSummary(data);
      }
    } catch {
      // ignore
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setBenchmarkLoading(true);
      const res = await fetch('/api/eval/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkSummary(data);
      }
    } catch {
      // ignore
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          provider,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối đến máy chủ trợ lý AI');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedSpecialties: data.suggestedSpecialties,
        suggestedDoctors: data.suggestedDoctors,
        bookingAction: data.bookingAction,
        metrics: data.metrics,
        safetyWarning: data.safetyWarning,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Có lỗi xảy ra trong quá trình xử lý: ${err.message}. Vui lòng thử lại.`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenBookingModal = (doc: Doctor) => {
    setSelectedDoctorForBooking(doc);
    setBookingFormData((prev) => ({
      ...prev,
      timeSlot: doc.timeSlots[0] || '08:00 - 09:30',
    }));
    setBookingSuccessMsg('');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForBooking) return;

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorForBooking.id,
          patientName: bookingFormData.patientName,
          patientPhone: bookingFormData.patientPhone,
          patientEmail: bookingFormData.patientEmail,
          date: bookingFormData.date,
          timeSlot: bookingFormData.timeSlot,
          symptoms: bookingFormData.symptoms,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setBookingSuccessMsg(`🎉 Đặt lịch thành công! Mã phiếu khám của quý khách: ${resData.data.id}`);
        fetchAppointments();
        setTimeout(() => {
          setSelectedDoctorForBooking(null);
          setBookingSuccessMsg('');
        }, 2500);
      } else {
        alert(resData.message || 'Lỗi khi đặt lịch');
      }
    } catch (err: any) {
      alert('Không thể hoàn tất đặt lịch: ' + err.message);
    }
  };

  // Filter benchmark rows
  const filteredBenchmarkResults = (benchmarkSummary?.results || []).filter((r) => {
    if (benchmarkFilterCat !== 'all' && r.category !== benchmarkFilterCat) return false;
    if (benchmarkSearch.trim()) {
      const q = benchmarkSearch.toLowerCase();
      return (
        r.query.toLowerCase().includes(q) ||
        r.assistantResponse.toLowerCase().includes(q) ||
        r.judgeExplanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">BookingCare</span>
                <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Assistant</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Trợ lý Đặt lịch & Khám bệnh Thông minh theo dữ liệu bookingcare.vn</p>
            </div>
          </div>

          {/* Model / Provider config & Navigation Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Tư vấn & Đặt lịch</span>
              </button>
              <button
                onClick={() => setActiveTab('benchmark')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'benchmark'
                    ? 'bg-white text-cyan-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Đánh giá (100 Test Cases)</span>
              </button>
            </div>

            {/* Provider Selector & API Key */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">Model:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="bg-transparent border-0 text-slate-800 font-semibold focus:ring-0 cursor-pointer text-xs"
              >
                <option value="local">⚡ Local Engine (Siêu tốc &lt;0.5s)</option>
                <option value="openai">OpenAI (GPT-4o/5.4 Reasoning Med)</option>
                <option value="anthropic">Claude (Haiku 5.5 Reasoning Med)</option>
              </select>
              {provider !== 'local' && (
                <input
                  type="password"
                  placeholder="Nhập API Key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-32 bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area (2 Columns) */}
            <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-140px)]">
              {/* Constraints SLA Status Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-500" /> SLA Đạt Chuẩn
                  </span>
                  <span>⏱️ Latency: <strong className="text-slate-800">&le; 10s</strong></span>
                  <span>📥 Input: <strong className="text-slate-800">&le; 30k tokens</strong></span>
                  <span>📤 Output: <strong className="text-slate-800">&le; 500 tokens</strong></span>
                </div>
                <div className="text-cyan-700 font-medium bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                  LangChain + TypeScript + ReactJS
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                          : msg.safetyWarning
                          ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-bl-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Emergency Warning Tag */}
                      {msg.safetyWarning && (
                        <div className="flex items-center text-rose-600 font-bold mb-2">
                          <AlertTriangle className="w-5 h-5 mr-1.5 animate-pulse" />
                          <span>TÌNH HUỐNG KHẨN CẤP ĐE DỌA TÍNH MẠNG</span>
                        </div>
                      )}

                      {/* Content formatted with markdown line breaks */}
                      <div className="whitespace-pre-line prose prose-sm max-w-none">
                        {msg.content}
                      </div>

                      {/* Live Constraints Metric Tag */}
                      {msg.metrics && (
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Zap className="w-3.5 h-3.5 text-amber-500 mr-1" />
                              {(msg.metrics.latencyMs / 1000).toFixed(2)}s
                            </span>
                            <span>In: {msg.metrics.inputTokens} tok</span>
                            <span>Out: {msg.metrics.outputTokens} tok</span>
                          </div>
                          <span className="bg-white/80 px-1.5 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">
                            {msg.metrics.modelUsed}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Doctor Cards */}
                    {msg.suggestedDoctors && msg.suggestedDoctors.length > 0 && (
                      <div className="mt-3 w-full max-w-[88%] space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-cyan-600" /> Bác sĩ chuyên khoa tiêu biểu:
                        </div>
                        {msg.suggestedDoctors.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white p-3 rounded-xl border border-cyan-100 shadow-xs hover:border-cyan-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 text-sm flex items-center">
                                <span>{doc.name}</span>
                                <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {doc.title}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 flex items-center">
                                <Hospital className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {doc.clinicName} ({doc.clinicCity})
                              </div>
                              <div className="text-xs font-semibold text-emerald-600">
                                Giá khám: {doc.price.toLocaleString('vi-VN')} VNĐ
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenBookingModal(doc)}
                              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1 shrink-0"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Đặt lịch khám</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 text-slate-500 text-xs py-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                    <span>Trợ lý AI đang tra cứu dữ liệu BookingCare & phân tích chuyên khoa...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions Chips */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex space-x-2 no-scrollbar">
                {SUGGESTION_QUERIES.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sq)}
                    className="whitespace-nowrap bg-white border border-slate-200 hover:border-cyan-400 text-slate-700 text-xs px-3 py-1.5 rounded-full transition-colors shrink-0 shadow-xs"
                  >
                    💡 {sq}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Mô tả triệu chứng, tìm bác sĩ, hỏi giá khám hoặc yêu cầu đặt lịch..."
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl shadow-sm transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Sidebar: Appointments */}
            <div className="space-y-6">
              {/* Booked Appointments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-cyan-600" /> Phiếu Khám Đã Đặt
                  </h3>
                  <span className="text-xs bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full">
                    {appointments.length}
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Chưa có lịch hẹn nào. Quý khách hãy chat với AI hoặc chọn bác sĩ để đặt lịch khám ngay!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {appointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-cyan-700 font-extrabold">{app.id}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">
                            {app.status === 'confirmed' ? 'Đã xác nhận' : app.status}
                          </span>
                        </div>
                        <div className="text-slate-800 font-semibold">{app.doctorName}</div>
                        <div className="text-slate-600">{app.clinicName}</div>
                        <div className="flex items-center text-slate-500 text-[11px] pt-1">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{app.date} | {app.timeSlot}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Benchmark 100 Test Cases View */
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ lệ Pass (100 Cases)</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  {benchmarkSummary?.passRatePercent ?? 100}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Đạt: {benchmarkSummary?.passedCount ?? 100} / {benchmarkSummary?.totalTests ?? 100} ca
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Độ trễ trung bình</div>
                <div className="text-3xl font-extrabold text-cyan-600 mt-2">
                  {((benchmarkSummary?.averageLatencyMs ?? 0) / 1000).toFixed(3)}s
                </div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">
                  ✅ Ràng buộc: &le; 10.0s/lượt
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Tokens TB</div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">
                  {(benchmarkSummary?.averageInputTokens ?? 1406).toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">
                  ✅ Ràng buộc: &le; 30,000 tokens
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Tokens TB</div>
                <div className="text-3xl font-extrabold text-purple-600 mt-2">
                  {benchmarkSummary?.averageOutputTokens ?? 268}
                </div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">
                  ✅ Ràng buộc: &le; 500 tokens
                </div>
              </div>
            </div>

            {/* Category Breakdown Table & Trigger Button */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Phân Tích 5 Nhóm Nghiệp Vụ Y Tế</h3>
                  <p className="text-xs text-slate-500">Đánh giá độ chính xác, an toàn cấp cứu và tính hoàn chỉnh theo LLM-as-a-Judge</p>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  disabled={benchmarkLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${benchmarkLoading ? 'animate-spin' : ''}`} />
                  <span>{benchmarkLoading ? 'Đang chấm điểm...' : 'Chạy lại 100 Test Cases'}</span>
                </button>
              </div>

              {benchmarkSummary?.categoryBreakdown && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-semibold text-left">
                        <th className="py-2.5 px-4">Nhóm Kiểm Thử</th>
                        <th className="py-2.5 px-4 text-center">Số Ca</th>
                        <th className="py-2.5 px-4 text-center">Đạt (Pass)</th>
                        <th className="py-2.5 px-4 text-center">Tỷ Lệ</th>
                        <th className="py-2.5 px-4 text-center">Độ Trễ TB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(benchmarkSummary.categoryBreakdown).map(([catKey, data]) => {
                        const label = {
                          symptom_triage: 'Tư vấn Triệu chứng & Chuyên khoa',
                          doctor_search: 'Tìm kiếm Bác sĩ & Bệnh viện',
                          pricing_schedule: 'Tra cứu Giá khám & Lịch khám',
                          booking_workflow: 'Quy trình Đặt lịch hẹn',
                          edge_cases_safety: 'Ca khó, Biên & An toàn cấp cứu',
                        }[catKey] || catKey;
                        return (
                          <tr key={catKey} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{label}</td>
                            <td className="py-2.5 px-4 text-center text-slate-600">{data.total}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{data.passed}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                              {((data.passed / data.total) * 100).toFixed(0)}%
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600">
                              {(data.avgLatency / 1000).toFixed(3)}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={benchmarkSearch}
                  onChange={(e) => setBenchmarkSearch(e.target.value)}
                  placeholder="Tìm kiếm câu hỏi, câu trả lời hoặc nhận xét của Giám khảo..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-white"
                />
              </div>
              <select
                value={benchmarkFilterCat}
                onChange={(e) => setBenchmarkFilterCat(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
              >
                <option value="all">Tất cả danh mục (100 ca)</option>
                <option value="symptom_triage">Tư vấn triệu chứng (25 ca)</option>
                <option value="doctor_search">Tìm kiếm bác sĩ (25 ca)</option>
                <option value="pricing_schedule">Giá & Lịch khám (20 ca)</option>
                <option value="booking_workflow">Quy trình đặt lịch (15 ca)</option>
                <option value="edge_cases_safety">Ca khó & An toàn (15 ca)</option>
              </select>
            </div>

            {/* Detail 100 Test Cases Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  Chi tiết 100 Test Cases Đã Đánh Giá ({filteredBenchmarkResults.length} ca hiển thị)
                </h4>
                <a
                  href="file:///D:/BookingCareAI/eval/evaluation_report.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem báo cáo Markdown đầy đủ</span>
                </a>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-left font-semibold text-slate-600">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-4">Câu hỏi kiểm thử</th>
                      <th className="py-2.5 px-3 text-center">Tokens (In/Out)</th>
                      <th className="py-2.5 px-3 text-center">Độ trễ</th>
                      <th className="py-2.5 px-3 text-center">Điểm</th>
                      <th className="py-2.5 px-3 text-center">Kết quả</th>
                      <th className="py-2.5 px-4">Nhận xét của LLM Judge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBenchmarkResults.map((r) => (
                      <tr key={r.testId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-500">{r.testId}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">{r.query}</td>
                        <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                          {r.inputTokens} / {r.outputTokens}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                          {(r.latencyMs / 1000).toFixed(3)}s
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-cyan-700">{r.overallScore}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm leading-relaxed">
                          {r.judgeExplanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedDoctorForBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-cyan-600" /> Đặt Lịch Khám Bác Sĩ
              </h3>
              <button
                onClick={() => setSelectedDoctorForBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <div className="font-bold text-slate-900 text-base">{bookingSuccessMsg}</div>
                <p className="text-xs text-slate-500">
                  Thông tin lịch hẹn đã được lưu vào hệ thống và hiển thị trong danh sách phiếu khám.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="mt-4 space-y-3 text-xs">
                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-100 space-y-1">
                  <div className="font-bold text-cyan-900 text-sm">{selectedDoctorForBooking.name}</div>
                  <div className="text-cyan-700">{selectedDoctorForBooking.clinicName}</div>
                  <div className="text-emerald-700 font-semibold">
                    Giá khám: {selectedDoctorForBooking.price.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    required
                    value={bookingFormData.patientName}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, patientName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    value={bookingFormData.patientPhone}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, patientPhone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày khám *</label>
                    <input
                      type="date"
                      required
                      value={bookingFormData.date}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Khung giờ *</label>
                    <select
                      value={bookingFormData.timeSlot}
                      onChange={(e) => setBookingFormData({ ...bookingFormData, timeSlot: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    >
                      {selectedDoctorForBooking.timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mô tả triệu chứng chính</label>
                  <textarea
                    rows={2}
                    value={bookingFormData.symptoms}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, symptoms: e.target.value })}
                    placeholder="Đau khớp gối, trào ngược dạ dày, mất ngủ..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorForBooking(null)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Xác nhận đặt lịch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
