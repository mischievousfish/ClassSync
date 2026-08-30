import { Check, Crown, GraduationCap } from 'lucide-react';
import { apiRequest, dispatchToast } from '../lib/api';

const plans = [
  {
    name: 'Student',
    label: 'Cho học sinh',
    price: '0',
    suffix: 'mãi mãi',
    icon: GraduationCap,
    featured: false,
    items: ['Lịch học hợp nhất', 'OCR bài tập & nhắc deadline', 'Tham gia lớp bằng mã code', 'Đồng bộ thời gian thực'],
    cta: 'Tải app miễn phí',
  },
  {
    name: 'Teacher Pro',
    label: 'Cho giáo viên & trung tâm',
    price: '99K',
    suffix: '/ tháng',
    icon: Crown,
    featured: true,
    items: ['AI tạo quiz & giáo án không giới hạn', 'Quản lý lớp quy mô lớn', 'Student Micro-Profile', 'Thông báo SMS / Zalo cho phụ huynh'],
    cta: 'Đăng ký Pro',
  },
];

export default function Pricing() {
  const handlePlanClick = async (planName: string) => {
    try {
      dispatchToast('info', 'Đang mở demo', `${planName} đang chuyển sang trải nghiệm thử nghiệm.`);
      await apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify({ name: 'Lớp demo', code: 'DEMO123' }),
      });
      dispatchToast('success', 'Demo đã sẵn sàng', `Bạn đã chọn ${planName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối.';
      dispatchToast('error', 'Kết nối thất bại', message);
    }
  };

  return (
    <section id="pricing" className="bg-[#10272a] px-5 py-24 text-[#f4f1e8] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.2em] text-[#d8f36d]">Đơn giản, rõ ràng</p>
            <h2 className="mt-3 max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Bắt đầu miễn phí.<br />
              <span className="text-[#b9e5df]">Lớn lên cùng nhau.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#f4f1e8]/60">
            Không phí ẩn. Không hợp đồng dài hạn. Nâng cấp khi bạn cần nhiều hơn.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={`relative rounded-[24px] p-7 sm:p-9 ${
                  plan.featured ? 'bg-[#d8f36d] text-[#10272a]' : 'border border-[#f4f1e8]/15 bg-[#173336]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[.16em]">{plan.label}</span>
                    </div>
                    <h3 className="mt-8 text-2xl font-extrabold">{plan.name}</h3>
                  </div>
                  {plan.featured && (
                    <span className="rounded-full bg-[#ff8068] px-3 py-1 font-mono text-[9px] font-bold uppercase">
                      Phổ biến
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="mb-2 text-sm opacity-60">{plan.price === '0' ? 'VND ' : ''}{plan.suffix}</span>
                </div>

                <ul className="mt-8 space-y-3 border-t border-current/15 pt-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check size={17} className="mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanClick(plan.name)}
                  className={`mt-9 w-full rounded-full px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 ${
                    plan.featured ? 'bg-[#10272a] text-[#d8f36d]' : 'bg-[#d8f36d] text-[#10272a]'
                  }`}
                >
                  {plan.cta} <span aria-hidden>↗</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
