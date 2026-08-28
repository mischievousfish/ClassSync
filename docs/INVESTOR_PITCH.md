# ClassSync Investor Pitch & Commercialization Plan

**Product:** ClassSync  
**Positioning:** Smart Management & AI Assistant for Dual-Sided Education  
**Audience:** Seed investors, strategic EdTech partners, tutoring-center operators  
**Version:** Fundraising working draft  
**Date:** 2026-08-28

> **Data note:** Market sizes, pricing, conversion rates, and ARR forecasts below are planning assumptions for a fundraising model, not audited market facts. Replace them with cited Vietnam and Southeast Asia research before presenting externally.

## 1. Executive Narrative

### One-line pitch

**ClassSync is the operating layer between students and the teachers who support them: one unified learning calendar for students, one AI-powered classroom workspace for teachers, and a real-time sync loop connecting both sides.**

### 30-second version

Students in Vietnam often coordinate three to five tutoring schedules through scattered chats and screenshots. Teachers spend more than ten hours a week on reminders, preparation, and remembering individual student context. ClassSync turns a photo into a deadline, turns a topic into a classroom-ready quiz in 30 seconds, and automatically distributes every assignment to the right students. The student product creates daily habit; the teacher product creates willingness to pay.

### Investment thesis

1. **Daily student utility:** schedule and deadline management creates repeated engagement.
2. **Teacher-led distribution:** teachers bring entire classes into the network, reducing acquisition friction.
3. **AI improves unit economics:** lesson and quiz automation increases teacher value without proportional support cost.
4. **A connected data network:** assignments, schedules, and class relationships create a defensible workflow graph, while privacy boundaries protect student records.
5. **Expansion path:** individual teachers become centers, centers become a B2B workflow platform.

## 2. Ten-Slide Pitch Deck

## Slide 1: ClassSync

### Slide wording

**ClassSync**  
**Smart Management & AI Assistant for Dual-Sided Education**

*Học gọn hơn. Dạy nhẹ hơn.*

**One calendar for every learner. One AI copilot for every teacher.**

### Visual direction

- Full-bleed split visual: a student phone with a clean deadline calendar and a teacher view with a generated quiz.
- Brand palette: ink green, warm paper, lime signal color, coral urgency accent.
- Show the two modes connected by a single live sync line.
- Keep the slide sparse: product name, promise, presenter/company mark.

### Talking points

- ClassSync is not another isolated student planner or teacher chatbot.
- It connects the two workflows that generate the same learning event: a class assignment.
- The wedge is simple enough to understand in one demo and broad enough to become infrastructure.

## Slide 2: The Problem

### Slide wording

**Learning is fragmented. Administration is still manual.**

**For students**

- Managing **3-5 tutor and school schedules** across Zalo, Messenger, screenshots, and memory.
- Deadlines disappear inside chat threads.
- No single view of what is next.

**For teachers**

- **10+ hours/week** spent on reminders, repeated preparation, roster updates, and administrative follow-up.
- Student progress context is stored in memory or scattered notes.
- Every assignment requires another manual broadcast.

**The result:** More coordination. Less time for learning.

### Visual direction

- Left: chaotic collage of chat bubbles, paper notes, and calendar fragments.
- Right: a simple time-cost bar showing “Teaching” versus “Administration”.
- Use the two headline numbers as clearly labeled customer-research hypotheses until validated.

### Talking points

- The pain is not a lack of content; it is a lack of coordination.
- Parents, students, and teachers all pay the cost, but the workflows are disconnected.
- Fragmentation creates a natural two-sided product opportunity.

## Slide 3: The Solution

### Slide wording

**One connected learning loop.**

1. **Student Mode**  
   Unified schedule, smart reminders, and photo-to-deadline OCR.
2. **Teacher Mode**  
   Class management, private Student Micro-Profile, and 30-second AI prep.
3. **2-Way Auto Sync**  
   Create once. Every enrolled student sees it instantly.

**ClassSync turns coordination into a background process.**

### Visual direction

Show one assignment moving through the product:

`Teacher creates → Firestore event → Student schedule + FCM alert`

Under it, show the reverse student flow:

`Student photo → OCR → AI extraction → Confirmed personal deadline`

### Talking points

- The same assignment exists once canonically, then is projected to each enrolled student's schedule.
- Students get immediate value before a teacher ever pays.
- Teachers get the highest-value automation and become the monetization anchor.

## Slide 4: Market Opportunity

### Slide wording

**A large tutoring market with a daily workflow wedge.**

| Layer | Planning definition | Illustrative assumption |
| --- | --- | --- |
| **TAM** | Vietnam + Southeast Asia K-12 tutoring, supplementary education, and teacher productivity software | **US$1.5B annual software/service opportunity** |
| **SAM** | Digitally reachable Vietnamese secondary students, private tutors, and independent tutoring centers | **US$180M annual opportunity** |
| **SOM** | Initial beachhead: urban Vietnam, English/math/science tutoring, 20k paying teachers/centers plus student network | **US$12M annual revenue potential** |

**Initial market wedge:** Vietnam first. Southeast Asia next.  
**Why now:** mobile-first learning, chat-based tutoring, falling AI inference costs, and growing demand for teacher efficiency.

### Visual direction

- Concentric TAM/SAM/SOM rings with the assumptions printed beside each ring.
- Small map: Ho Chi Minh City, Hanoi, Da Nang as beachhead clusters; arrows toward Thailand, Indonesia, and the Philippines for expansion.
- Add a footnote: “Validate with paid research and bottom-up customer counts before investment committee circulation.”

### Talking points

- We are not asking investors to believe an enormous consumer market on day one.
- The bottom-up wedge is teacher and center subscriptions, supported by free student distribution.
- The first measurable market is the number of active tutoring classes that can be onboarded by one teacher champion.

### Bottom-up model

- 20,000 paying teacher accounts × US$120 annual average revenue = **US$2.4M teacher ARR**.
- 1,000 centers × US$2,400 annual average contract value = **US$2.4M center ARR**.
- Messaging, storage, and premium AI add-ons supply the remaining expansion toward the illustrative SOM.

## Slide 5: Product & Technology Edge

### Slide wording

**A workflow engine, not a collection of AI features.**

- **OCR-to-Deadline Pipeline:** image → text extraction → entity parsing → human confirmation → calendar event.
- **Gemini Structured Quiz Engine:** topic/document → schema-valid 10-question quiz or lesson outline in 30 seconds.
- **Firestore Real-Time Sync:** canonical assignment → chunked student schedule projection → FCM deep-link alert.
- **Privacy by design:** teacher-only micro-profiles; PII sanitizer before model prompts; role and class ownership checks.

### Visual direction

Use a technical pipeline diagram with three layers:

```text
Capture              Intelligence             Coordination
Photo / topic   →    OCR + Gemini JSON   →    Firestore + FCM
```

Add small reliability callouts: `offline queue`, `LWW conflict rule`, `batch <= 500`, `retry + DLQ`.

### Talking points

- The defensibility is in orchestration, permissions, and workflow data, not in claiming ownership of a foundation model.
- Structured output makes AI content reviewable, testable, and usable by mobile clients.
- The same architecture supports a center-level event stream later.

## Slide 6: Business Model & Monetization

### Slide wording

**Free for student habit. Paid for teacher leverage.**

| Segment | Offer | Illustrative price |
| --- | --- | --- |
| Students | Unified schedule, class joining, basic OCR reminders, real-time sync | **Free** |
| Pro Teachers | Unlimited AI prep, larger classes, Student Micro-Profile, advanced sync | **US$4.99/month** or local equivalent |
| Tutoring Centers | Multi-teacher workspace, center controls, reporting, support, integrations | **US$199/month starting plan** |
| Messaging add-ons | SMS / Zalo ZNS parent notifications | Usage-based margin-positive add-on |

**Expansion revenue:** AI usage packs, extra storage, center seats, premium notification volume, API integrations.

### Visual direction

- Three ascending plan columns with the Pro Teacher plan visually highlighted.
- Add a simple flywheel: `Free students → teacher invites → paid teacher → center expansion`.

### Talking points

- The free student tier is a distribution mechanism, not the primary revenue bet.
- Teacher conversion is earned by saving real preparation and administration time.
- Center contracts create higher ACV, lower logo churn, and operational data density.

### Initial unit economics targets

These are operating targets for the first 12 months, not historical performance:

- Blended paid teacher CAC: **below US$25** through teacher-led onboarding and referrals.
- Pro Teacher monthly churn target: **below 3.5%** after activation improvements.
- Gross margin target: **above 75%** excluding messaging pass-through, with AI quotas and caching.
- LTV/CAC target: **above 3x** once retention and conversion are validated.

## Slide 7: Go-To-Market

### Slide wording

**The classroom is the acquisition loop.**

1. **Teacher-led onboarding**  
   One teacher creates a class and invites every student with a six-character code.
2. **Student referral loop**  
   Students invite classmates to keep the shared schedule complete.
3. **Community partnerships**  
   Tutor communities, teacher creators, school clubs, and exam-prep groups.
4. **Center land-and-expand**  
   Prove value in one class, expand to the center roster and parent communication.

### Visual direction

Show a loop rather than a funnel:

```text
Teacher champion → Class invite → Student habit → More complete network
       ↑                                               ↓
Center expansion ← Usage proof ← More connected classes
```

### Talking points

- The product contains its own distribution primitive: the class join code.
- A single activated teacher can create dozens of qualified student signups.
- Marketing should lead with a measurable outcome: “save preparation time” or “stop losing deadlines,” not generic AI novelty.

### 90-day launch plan

| Period | Action | Leading indicator |
| --- | --- | --- |
| Days 0-30 | Recruit 20 teacher design partners in Hanoi/HCMC; onboard 50 classes | Activation and weekly assignment creation |
| Days 31-60 | Launch referral invites and teacher creator content | Invite-to-join conversion |
| Days 61-90 | Pilot three tutoring centers with paid Pro workflows | Paid conversion, class retention, support load |

## Slide 8: Product Roadmap

### Slide wording

**From coordination utility to learning operating system.**

| Phase | Timeline | Product evolution | Proof point |
| --- | --- | --- | --- |
| **v1.0 MVP** | Months 0-6 | Dual Mode, class join, unified schedule, assignment sync, OCR deadline, AI quiz/lesson outline, FCM | 100 active classes; 40% weekly student retention; 20% teacher trial-to-paid target |
| **v1.5 Scale** | Months 6-12 | Offline-first sync, center workspaces, attendance foundation, integrations, notification controls | 1,000 active classes; sync P95 under 10 seconds; paid retention validated |
| **v2.0 AI Personal Learning Analytics** | Months 12-24 | Personalized study suggestions, progress signals, teacher intervention insights, answer-key workflows | Improved assignment completion and teacher hours saved |
| **v3.0 Tutoring Center ERP Integration** | Months 24-36 | Billing, multi-branch roles, parent CRM, payroll/roster integrations, center analytics | Multi-year center contracts and expansion ARR |

### Visual direction

- Horizontal timeline with the product surface expanding from **organize** → **assist** → **predict** → **operate**.
- Put reliability/privacy gates under every phase, not just feature milestones.

### Talking points

- Each phase deepens the same object graph: users, classes, assignments, and outcomes.
- We will not scale AI breadth before proving the assignment sync loop.
- Center ERP is an expansion layer after repeated usage and permission models are mature.

## Slide 9: Team & Execution Capabilities

### Slide wording

**Built at the intersection of product, education, and reliable systems.**

Recommended team slide format:

| Role | Proof to show |
| --- | --- |
| Founder / CEO | Education insight, customer access, speed of learning from design partners |
| CTO / Platform lead | Firebase, offline sync, event processing, security, and mobile delivery experience |
| AI product lead | Gemini/OCR evaluation, structured outputs, prompt privacy, and quality measurement |
| GTM / Education partnerships | Teacher community, tutoring-center, and parent-channel relationships |

**Execution advantage:** start with one high-frequency workflow, instrument it end to end, and expand only after activation and retention are measurable.

### Visual direction

- Four faces/roles with one proof metric or prior outcome each.
- If a role is not hired, show it as “next critical hire” rather than implying capacity that does not exist.
- Include design-partner logos only with permission.

### Talking points

- Investors need evidence of access and shipping ability more than a list of technologies.
- The immediate hiring priority is platform reliability plus teacher distribution.
- The company should be transparent about which capabilities are built, piloted, or planned.

## Slide 10: The Ask & Financial Projections

### Slide wording

**Raise: US$750K pre-seed to reach repeatable teacher-led distribution.**

**18-month objectives**

- 25,000 registered students
- 2,000 active teachers
- 250 paying teacher or center accounts
- 5,000 active classes
- Demonstrated AI prep time reduction and assignment completion lift
- Monthly recurring revenue target: **US$55K by month 18**

**Use of funds**

- **40% Tech & AI:** mobile product, sync reliability, model/OCR quality, security, observability
- **40% Growth:** teacher design partners, community, content, onboarding, center pilots
- **20% Operations:** legal/privacy, customer success, finance, and cloud operations

### Illustrative financial projection

| Metric | Year 1 | Year 2 | Year 3 |
| --- | ---: | ---: | ---: |
| Paying teacher accounts | 250 | 1,200 | 4,000 |
| Paying centers | 10 | 60 | 180 |
| Teacher/center ARR | US$45K | US$310K | US$1.25M |
| Messaging and AI add-on ARR | US$5K | US$90K | US$420K |
| **Total projected ARR** | **US$50K** | **US$400K** | **US$1.67M** |

### Visual direction

- Left: raise amount and allocation donut (40/40/20).
- Right: ARR bars with assumptions visible below, not hidden in an appendix.
- Closing line: **“We are building the coordination layer that lets more people spend their time learning and teaching.”**

### Talking points

- This round funds product-market fit evidence, not premature regional expansion.
- The key investor milestones are teacher activation, class retention, paid conversion, and gross margin.
- The next round should be earned by repeatable distribution and center expansion, not by vanity downloads.

## 3. Product Roadmap Strategy

### North-star metric

**Weekly active learning loops:** the number of classes in which at least one teacher publishes or updates an assignment and at least one enrolled student opens or completes the related schedule item within seven days.

This metric captures both sides of the network and discourages optimizing for downloads without learning activity.

### Supporting metrics

| Funnel stage | Metric | Why it matters |
| --- | --- | --- |
| Acquisition | Teacher invite-to-class creation rate | Measures distribution friction |
| Activation | Time to first joined class | Measures student onboarding |
| Value | Assignment sync success within 10 seconds | Measures core reliability |
| Habit | Weekly student schedule opens | Measures daily utility |
| Teacher value | AI asset generated and edited per active teacher | Measures AI usefulness |
| Monetization | Trial-to-paid teacher conversion | Measures willingness to pay |
| Retention | Class-level 4-week retention | Measures workflow embed |
| Trust | OCR correction rate and privacy incidents | Protects product quality and brand |

### Product principles

- **One canonical event, many projections:** assignment truth lives server-side; mobile views are fast projections.
- **Human confirmation for uncertain AI:** OCR and generated content assist; they do not silently alter records.
- **Privacy is a feature:** micro-profiles stay class-teacher scoped and PII is removed before model calls.
- **Offline is normal:** a student can capture, edit, and queue a deadline without connectivity.
- **Measure saved time:** every AI feature needs a time-to-result and correction-rate metric.

### Key risks and mitigations

| Risk | Mitigation |
| --- | --- |
| AI output quality varies by subject/language | Schema validation, evaluation sets, teacher edit loop, model fallback |
| FCM delivery is not guaranteed | Firestore source of truth, listeners, retryable outbox, DLQ |
| Teacher adoption requires behavior change | Design partners, import flows, one-class setup, visible time saved |
| Student privacy/regulatory exposure | Data minimization, class-scoped rules, consent/retention policy, audit logs |
| AI inference and messaging costs grow faster than revenue | Quotas, caching, tier limits, usage-based add-ons, provider abstraction |
| Two-sided marketplace cold start | Start with teacher champions and let class codes pull in students |

## 4. Commercialization Strategy

### Beachhead customer profiles

**Primary buyer:** independent teacher, tutor, or small center owner managing 3-20 classes.  
**Primary user:** teacher publishing work and student checking a schedule.  
**Economic champion:** teacher or center operator who feels the administrative time cost.  
**Expansion buyer:** center owner seeking multi-teacher visibility and parent communication.

### Packaging

- **Student Free:** unlimited basic schedule and class joining; fair-use OCR and reminders.
- **Teacher Pro:** AI quota sized for normal weekly teaching, advanced roster and profile tools, larger class limits.
- **Center:** seats, branch/role controls, audit logs, support SLA, usage analytics, and messaging integrations.
- **Enterprise later:** SSO, data residency, custom retention, procurement support, and API access.

### Pricing experiments

Test three teacher offers with design partners:

1. Low-friction monthly subscription with a 14-day Pro trial.
2. Annual plan with two months free to improve cash collection.
3. Per-active-class pricing for tutors whose rosters fluctuate.

Choose the model that maximizes retained gross profit, not initial conversion alone.

### Sales motion

- **Self-serve:** student invite and teacher class setup.
- **Product-led sales:** prompt a teacher to invite a center after three active classes.
- **Founder-led center pilot:** instrument onboarding, support time, and expansion triggers.
- **Partner channel:** teacher creators, tutoring associations, and education software resellers.

### Commercial milestones

- Month 3: 20 design-partner teachers, no-charge pilot.
- Month 6: first 50 paid teachers; prove activation and weekly assignment loop.
- Month 9: three paid center pilots; document onboarding and ROI case study.
- Month 12: repeatable teacher acquisition channel with CAC payback under 12 months.
- Month 18: center expansion motion and add-on messaging revenue.

## 5. Three-Minute Live Demo Script

### Stage setup

- Two devices or one browser with two prepared sessions: Teacher Mode and Student Mode.
- Seeded class: **Toán 10A**, teacher **Thầy Nam**, student **An**.
- Demo image: a slightly messy but readable homework sheet containing “Hình học lớp 10 - Thể tích khối đa diện” and a due date.
- Preload a deterministic mock AI response for the stage environment. Keep a visible “live AI” path only if connectivity and quota are tested.
- Keep a backup recording or local fixture. The demo should prove the workflow, not gamble on a network call.

### 0:00-0:45 — Student pain and OCR magic

| Time | Presenter action | Spoken line |
| --- | --- | --- |
| 0:00-0:05 | Hold up the student phone with scattered chat notifications. | “Một học sinh cấp 3 thường có lịch từ trường và ba đến năm thầy cô khác nhau. Deadline nằm trong chat, ảnh chụp, và đôi khi là trí nhớ.” |
| 0:05-0:10 | Open ClassSync Student Mode. | “ClassSync bắt đầu từ một việc rất đơn giản: gom mọi việc cần làm vào một lịch duy nhất.” |
| 0:10-0:17 | Tap camera/OCR action and photograph the prepared homework page. | “An không cần gõ lại đề. Bạn ấy chỉ cần chụp tờ bài tập.” |
| 0:17-0:25 | Show OCR loading state, then extracted subject/title/description. | “Trong khoảng ba giây, OCR đọc nội dung và AI tách ra môn học, tiêu đề, mô tả và ngày cần nộp.” |
| 0:25-0:33 | Point to the editable due-date field. | “Điểm quan trọng: AI không tự quyết định thay học sinh. Ngày tháng chưa chắc chắn luôn được đưa ra để kiểm tra.” |
| 0:33-0:40 | Tap Save deadline. | “An bấm lưu. Deadline xuất hiện ngay trên lịch, kể cả khi kết nối chập chờn vì thay đổi đã được lưu offline.” |
| 0:40-0:45 | Show the new calendar card. | “Một tấm ảnh vừa trở thành một hành động rõ ràng.” |

### 0:45-1:45 — Teacher magic and AI preparation

| Time | Presenter action | Spoken line |
| --- | --- | --- |
| 0:45-0:52 | Switch the simulator to Teacher Mode. | “Bây giờ, hãy nhìn từ phía người dạy. Cùng một ứng dụng, nhưng một workflow hoàn toàn khác.” |
| 0:52-1:00 | Open class Toán 10A. | “Thầy Nam nhìn thấy lớp, danh sách học sinh, và trạng thái bài tập mà không phải lục lại nhiều nhóm chat.” |
| 1:00-1:08 | Open AI assistant and focus the prompt field. | “Thay vì dành cả buổi tối để soạn đề, thầy nhập một câu lệnh ngắn.” |
| 1:08-1:15 | Type: `Hình học lớp 10 - Thể tích khối đa diện`. | “Hình học lớp 10 - Thể tích khối đa diện.” |
| 1:15-1:24 | Choose grade 10, mixed difficulty, 10 questions. | “Thầy chọn cấp độ và độ khó. ClassSync yêu cầu AI trả về đúng cấu trúc quiz để có thể chỉnh sửa, không phải một đoạn văn khó dùng.” |
| 1:24-1:38 | Start generation and show progress/skeleton. | “Trong khoảng 30 giây, hệ thống tạo mười câu hỏi, đáp án, giải thích và phân bổ độ khó.” |
| 1:38-1:45 | Scroll two questions, tap Assign. | “Thầy xem nhanh, chỉnh nếu cần, rồi giao cho lớp chỉ bằng một lần chạm.” |

### 1:45-2:30 — Two-way instant sync

| Time | Presenter action | Spoken line |
| --- | --- | --- |
| 1:45-1:53 | Keep teacher device visible; tap Assign. | “Khoảnh khắc này là nơi ClassSync khác một công cụ soạn bài đơn lẻ.” |
| 1:53-2:02 | Show sync status or event indicator. | “Assignment được ghi một lần vào dữ liệu chính, sau đó hệ thống phân phối theo từng học sinh trong các batch an toàn.” |
| 2:02-2:10 | Trigger/display FCM notification on student device. | “Trên điện thoại của An, thông báo xuất hiện ngay: ‘Bài tập mới từ Thầy Nam!’” |
| 2:10-2:18 | Tap notification. | “An chạm vào thông báo và đi thẳng đến chi tiết bài tập, không phải tìm trong nhóm chat.” |
| 2:18-2:26 | Show student's unified schedule with new assignment. | “Lịch học cập nhật tự động. Nếu push notification bị bỏ lỡ, Firestore vẫn là nguồn dữ liệu chính để ứng dụng đồng bộ lại.” |
| 2:26-2:30 | Show teacher and student screens side by side. | “Một hành động của giáo viên. Hai phía cùng nhìn thấy một sự thật.” |

### 2:30-3:00 — Closing and vision

| Time | Presenter action | Spoken line |
| --- | --- | --- |
| 2:30-2:38 | Return to split Student/Teacher view. | “ClassSync giảm áp lực quản lý thời gian cho học sinh và trả lại thời gian hành chính cho giáo viên.” |
| 2:38-2:46 | Show the two pricing tiers. | “Học sinh bắt đầu miễn phí để hình thành thói quen. Giáo viên và trung tâm trả tiền cho AI, quy mô lớp, và hiệu suất vận hành.” |
| 2:46-2:54 | Show roadmap: MVP → AI analytics → center ERP. | “Chúng tôi bắt đầu bằng lịch và assignment, sau đó mở rộng thành lớp dữ liệu học tập và hệ điều hành cho trung tâm.” |
| 2:54-3:00 | End on ClassSync logo and ask. | “ClassSync xây dựng lớp kết nối giữa người học và người dạy. Học gọn hơn. Dạy nhẹ hơn. Chúng tôi đang tìm những đối tác đầu tiên để mở rộng workflow này tại Việt Nam.” |

### Demo recovery lines

- **If OCR is slow:** “Đây là lúc hệ thống đang xử lý ảnh thật. Trong bản stage, chúng tôi có fixture dự phòng để demo không phụ thuộc mạng.”
- **If AI times out:** “Sản phẩm hiển thị trạng thái retry và không tạo nội dung chưa được xác thực. Đây là chủ ý reliability, không phải lỗi im lặng.”
- **If notification is delayed:** “Push là lớp thông báo, còn Firestore là nguồn sự thật. Tôi sẽ mở lại schedule để cho thấy assignment đã được đồng bộ.”
- **If the network drops:** “Đây chính là tình huống chúng tôi thiết kế cho: deadline được lưu vào hàng đợi offline và tự gửi khi kết nối quay lại.”

## 6. Investor Q&A Preparation

### “Why will teachers pay?”

Because ClassSync compresses repeated administrative work into one class workflow: assignment creation, student distribution, reminders, and reusable AI preparation. The paid promise is measurable time saved, not access to a generic chatbot.

### “What is defensible if Gemini and Vision are available to everyone?”

The model providers are replaceable infrastructure. The product advantage is the permissioned relationship graph, assignment-to-schedule workflow, reliable offline and event processing, quality feedback from teachers, and distribution through active classes.

### “How do you protect minors’ data?”

Keep micro-profiles class-teacher scoped, minimize collected data, sanitize PII before AI calls, never put private notes in push payloads, enforce Firebase Auth/RBAC, and establish consent, retention, deletion, and incident-response policies before broad launch.

### “What must be true before scaling?”

Teachers must repeatedly create assignments, students must return to the unified schedule, sync must be reliable at class scale, and Pro conversion must support AI and messaging costs. Downloads alone are not proof of product-market fit.

## 7. Closing Position

**ClassSync is a practical wedge into a large, fragmented education market.** It earns daily student usage through deadlines, earns teacher willingness to pay through automation, and earns expansion through the class relationship. The near-term company goal is not to automate every part of education. It is to make the next assignment impossible to miss and dramatically easier to prepare.
