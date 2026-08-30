# ClassSync

<div align="center">
  <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80" alt="ClassSync banner" width="100%" />
</div>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-MVP%20in%20progress-orange" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15.x-000000?logo=nextdotjs&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" />
  <img alt="AI" src="https://img.shields.io/badge/AI-Gemini%20%2B%20OCR-8A2BE2" />
  <img alt="Monorepo" src="https://img.shields.io/badge/Architecture-Monorepo-0A7EA4" />
</p>

> One calendar for every learner. One AI copilot for every teacher.

ClassSync là nền tảng EdTech hai chế độ giúp học sinh và giáo viên làm việc trên cùng một vòng lặp học tập: lịch học được đồng bộ, bài tập không mất trong chat, và AI giúp giáo viên chuẩn bị bài nhanh hơn gấp nhiều lần.

## 🚀 Tóm tắt ngắn cho README đầu trang

ClassSync kết nối hai mặt của hệ thống giáo dục:

- Student Mode: lịch học tổng hợp, nhắc deadline, OCR từ ảnh bài tập, đồng bộ thời gian thực.
- Teacher Mode: quản lý lớp, tạo bài tập, tạo quiz/lesson outline bằng AI, lưu trữ Student Micro-Profile.

### Giá trị cốt lõi

- Giảm rối thời gian và nhầm lẫn khi học sinh phải theo dõi qua Zalo, Messenger, ảnh chụp và ghi nhớ.
- Tiết kiệm thời gian cho giáo viên bằng workflow AI và đồng bộ tự động.
- Tạo nền tảng data layer có giá trị cho mô hình SaaS giáo dục theo hướng B2B và trung tâm luyện thi.

### Roadmap / product angle

- Student habit: miễn phí, dùng hằng ngày, dễ có cảm giác “đúng cần”.
- Teacher monetization: AI prep + class management + phê duyệt nội dung.
- Center expansion: mở rộng từ giáo viên cá nhân sang trung tâm/tổ chức.

---

## ✨ Tính năng nổi bật

### Student Mode
- Lịch học và deadline được tổng hợp trong một view duy nhất
- Nhắc việc dựa trên thời gian thực và FCM
- Chụp ảnh bài tập, OCR trích xuất văn bản, đề xuất deadline
- Tham gia lớp bằng mã code và thấy dữ liệu ngay lập tức

### Teacher Mode
- Tạo / quản lý lớp học và học sinh trong một workspace riêng
- Giao bài và đồng bộ tới toàn bộ lớp với một thao tác
- Tạo quiz, lesson outline, prompt-to-lesson bằng AI trong 30 giây
- Lưu Student Micro-Profile và tag nhóm học sinh để cá nhân hóa hỗ trợ

### Platform architecture
- Web app: Next.js + React + TypeScript
- Backend: Node.js + Express + TypeScript
- Database/Firebase: Firestore + Auth + FCM
- AI/OCR: Gemini + Google Cloud Vision
- Monorepo-based product structure for web/mobile/companion workflows

---

## 🧭 Documentation map

- README này: overview ngắn gọn, product positioning, quick start
- [docs/INVESTOR_PITCH.md](docs/INVESTOR_PITCH.md): pitch deck, market thesis, commercial model
- [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md): spec kỹ thuật đầy đủ cho backend, schema, flows, architecture
- [docs/DR_COMPLIANCE_RUNBOOK.md](docs/DR_COMPLIANCE_RUNBOOK.md): vận hành, DR, compliance, disaster recovery

---

## 🏗️ Cấu trúc monorepo

```text
ClassSync/
├── apps/
│   ├── backend/        # API, auth, services, routes, validation
│   ├── web/            # Next.js frontend and demo landing page
│   ├── mobile/         # mobile app scaffold and client app
│   └── companion/      # extension / desktop companion
├── docs/               # investor pitch, technical spec, compliance docs
├── infra/              # Terraform / deployment configuration
├── scripts/            # ETL, backup, migration, operational automation
├── docker-compose.yml
├── firebase.json
├── firestore.rules
├── jest.config.js
├── package.json
├── README.md
├── .env.example
└── ...
```

---

## 🚀 Quick start

### Yêu cầu

- Node.js 20+
- npm 10+
- Docker + Docker Compose
- Firebase CLI

### Cài đặt

```bash
git clone https://github.com/mischievousfish/ClassSync.git
cd ClassSync
npm install
```

### Môi trường

```bash
cp .env.example .env
```

Ví dụ biến môi trường web:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_USE_MOCK_API=true
```

### Chạy local

```bash
npm run dev
npm run web:dev
```

### Test

```bash
npm test
```

---

## 🛠️ Tech stack

### Frontend / web
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend
- Node.js
- Express
- Firebase Admin SDK
- Zod validation
- JWT / Firebase ID token auth

### AI / OCR
- Gemini
- Google Cloud Vision
- Structured output validation

### Infrastructure
- Docker
- Firebase Emulator
- Firestore
- FCM
- Jest

---

## 📌 Vì sao ClassSync đáng chú ý

1. Dễ hiểu trong 10 giây: lịch học + AI + đồng bộ là một luồng duy nhất.
2. Có story monetization rõ ràng: free student habit → paid teacher leverage → center expansion.
3. Có technical moat: workflow orchestration, permission model, real-time sync, AI + OCR + validation stack.
4. Tăng giá trị nội bộ theo thời gian: dữ liệu học tập, lịch, class graph, và micro-profile tạo lợi thế cho sản phẩm dài hạn.

---

## 📝 Phiên bản dài cho docs kỹ thuật

Thông tin chi tiết về kiến trúc, Flow nghiệp vụ, database schema, auth, notification, AI/OCR và quy trình triển khai được cập nhật trong [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md).

Nội dung kỹ thuật ở đó được tổ chức theo các mục sau:

- Product summary
- Goals and success metrics
- User flows
- Database schema design
- API design and guarded auth
- Sync, notification, and asynchronous fanout
- AI/OCR adapter contracts
- Deployment and operational reliability

---

## 📄 License

Dự án đang trong giai đoạn MVP và tài liệu này được dùng cho phát triển nội bộ / demo / fundraising. Khi cần public release chính thức, nên bổ sung license cụ thể phù hợp với kế hoạch phân phối và cộng tác.
