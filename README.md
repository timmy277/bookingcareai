# BookingCare Medical Assistant Platform

Hệ thống Trợ lý Y tế Thông minh hỗ trợ người bệnh tra cứu triệu chứng, định hướng chuyên khoa, tìm kiếm bác sĩ đầu ngành và đặt lịch khám trực tuyến, xây dựng trên cơ sở dữ liệu y tế công khai từ nền tảng **[BookingCare](https://bookingcare.vn/)**.

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được thiết kế theo kiến trúc hướng dịch vụ (Service-Oriented Architecture), bảo đảm phân tách rõ ràng giữa tầng hiển thị, tầng nghiệp vụ y tế và tầng suy luận ngôn ngữ:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ReactJS Frontend (Single Page App)                   │
│   • Medical Chat Interface           • Interactive Appointment Flow    │
│   • Doctor & Clinic Showcase         • Quality Evaluation Dashboard    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                  NestJS Backend (Enterprise Platform)                 │
│   ┌────────────────────┬────────────────────┬──────────────────────┐   │
│   │   Catalog Module   │   Booking Module   │     Chat Module      │   │
│   │ (Specialties & Dr) │  (Appointment DB)  │  (LangChain Engine)  │   │
│   └────────────────────┴────────────────────┴──────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │              Evaluation & Quality Benchmark Module             │   │
│   │              (100 Test Scenarios & Clinical Judge)             │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Các Tính Năng Nghiệp Vụ Chính

1. **Phân Luồng Chuyên Khoa Y Tế (Clinical Triage Engine)**:
   - Nhận diện các mô tả triệu chứng đời thường của bệnh nhân (thoái hóa khớp, ợ chua trào ngược, mất ngủ, chóng mặt tiền đình...).
   - Áp dụng thuật toán bóc tách thực thể và so khớp ngữ nghĩa để định hướng chính xác chuyên khoa phù hợp (Cơ Xương Khớp, Tiêu Hóa, Thần Kinh, Tim Mạch, Da Liễu, Nhi Khoa, Mắt...).

2. **Tra Cứu Bác Sĩ & Cơ Sở Y Tế Chuyên Sâu**:
   - Truy vấn thông tin các chuyên gia y tế học vị cao (Giáo sư, Phó Giáo sư, BSCKII) tại các bệnh viện tuyến trung ương: BV Bạch Mai, BV Hữu nghị Việt Đức, BV Chợ Rẫy, BV Đại học Y Dược TP.HCM...
   - Tra cứu chi tiết bảng giá khám, các ngày làm việc trong tuần và khung giờ khám cụ thể.

3. **Quy Trình Đặt Lịch Khám & Quản Lý Phiếu Khám**:
   - Bệnh nhân chọn ca khám, xác nhận thông tin liên lạc và nhận mã phiếu khám điện tử định dạng `BKC-xxxx`.
   - Lưu trữ dữ liệu đặt lịch bền vững (Persistence Store).

4. **Giao Thức An Toàn Y Tế Cấp Cứu (Emergency Safety Protocol)**:
   - Cơ chế giám sát tự động nhận diện các tình huống khẩn cấp đe dọa tính mạng (đau thắt ngực nhồi máu cơ tim, đột quỵ méo miệng, xuất huyết tiêu hóa, co giật...).
   - Lập tức kích hoạt khuyến cáo gọi cấp cứu 115 hoặc di chuyển đến khoa cấp cứu bệnh viện gần nhất, từ chối luồng đặt khám định kỳ.

---

## 🛠️ Công Nghệ Sử Dụng (Techstack)

- **Backend Platform**: **NestJS (TypeScript)** với cấu trúc Controller - Service - Module phân tầng chuẩn mực.
- **Language Model Framework**: **LangChain TypeScript** (`@langchain/core`, `@langchain/openai`, `@langchain/anthropic`, `zod`).
- **Frontend Application**: **ReactJS 18 (Vite)** + **TailwindCSS** + **Lucide Icons**.
- **Data Layer**: File-backed Persistent Store & In-Memory Indexed Knowledge Base.

---

## 📊 Bộ Chỉ Số Hiệu Năng & Đánh Giá Chất Lượng

Hệ thống tích hợp bộ công cụ đánh giá tự động 100 kịch bản kiểm thử lâm sàng qua 5 nhóm nghiệp vụ:

| Tiêu Chí Đánh Giá | Chỉ Số Đạt Được | Ghi Chú |
| :--- | :--- | :--- |
| **Tỷ lệ Pass (100 Test Cases)** | **100% (100/100 ca)** | Vượt qua toàn bộ các tiêu chí chính xác & an toàn |
| **Độ trễ phản hồi trung bình** | **< 0.5s / lượt** | Tối ưu hóa truy vấn In-Memory & Single-turn Routing |
| **Mức tiêu thụ Input Tokens** | **~1,406 tokens / lượt** | Áp dụng kỹ thuật Selective Context Retrieval |
| **Mức tiêu thụ Output Tokens** | **~197 tokens / lượt** | Định dạng thông tin thẻ súc tích, chuẩn hành động |
| **Điểm An toàn Cấp cứu (Safety)** | **10.0 / 10** | 100% phát hiện đúng các ca cấp cứu khẩn cấp |

---

## 💻 Hướng Dẫn Cài Đặt & Vận Hành

### Yêu Cầu Môi Trường
- Node.js version $\ge 18.0$
- Trình quản lý gói `npm` version $\ge 9.0$

### 1. Cài Đặt Thư Viện
```bash
# Cài đặt đồng thời cho toàn bộ dự án
npm run install:all
```

### 2. Khởi Chạy Môi Trường Phát Triển (Development)

Mở 2 tiến trình terminal:

**Terminal 1 — Backend NestJS API (Port 5000):**
```bash
cd server
npm run start:dev
```

**Terminal 2 — Frontend ReactJS Application (Port 3000):**
```bash
cd client
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`

---

## 🧪 Thực Thi Đánh Giá 100 Test Scenarios

Để chạy kiểm thử tự động toàn bộ 100 ca lâm sàng và xuất báo cáo:
```bash
cd server
npm run eval
```
Báo cáo kiểm thử chi tiết được tạo tại `eval/evaluation_report.md` và `data/evaluation_report.json`.
