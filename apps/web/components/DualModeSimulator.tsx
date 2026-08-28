'use client';

import { motion } from 'framer-motion';
import { Bell, BookOpen, Check, ChevronRight, CircleUserRound, Clock3, Sparkles } from 'lucide-react';
import { useState } from 'react';

type Mode = 'student' | 'teacher';

const studentItems = [
  { time: '08:00', title: 'Toán học', meta: 'Phòng A203 · Cô Hương', color: '#d8f36d' },
  { time: '14:30', title: 'Vật lý', meta: 'Phòng Lab 02 · Thầy Nam', color: '#b9e5df' },
];

export default function DualModeSimulator() {
  const [mode, setMode] = useState<Mode>('student');
  const isStudent = mode === 'student';

  return (
    <div className="relative mx-auto w-full max-w-[390px] lg:mx-0">
      <div className="absolute -right-2 top-10 h-40 w-40 rounded-full bg-[#ff8068] blur-[1px] lg:-right-12" />
      <div className="absolute -bottom-8 -left-10 h-32 w-32 rounded-full bg-[#b9e5df] lg:-left-16" />
      <div className="phone-shadow relative z-10 mx-auto w-[280px] rotate-[3deg] rounded-[38px] border-[7px] border-[#183538] bg-[#183538] p-2 transition-transform duration-500 hover:rotate-0 sm:w-[310px]">
        <div className="overflow-hidden rounded-[28px] bg-[#f4f1e8]">
          <div className="flex items-center justify-between bg-[#d8f36d] px-5 pb-4 pt-3 text-[10px] font-bold">
            <span>9:41</span><span className="h-1 w-16 rounded-full bg-[#10272a]" /><span>•••</span>
          </div>
          <div className="px-5 pb-8 pt-5">
            <div className="mb-6 flex items-center justify-between">
              <div><p className="font-mono text-[9px] uppercase tracking-[.18em] opacity-60">Thứ ba, 12 tháng 9</p><h3 className="mt-1 text-xl font-extrabold">Xin chào, An.</h3></div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#ff8068]"><CircleUserRound size={19} /></div>
            </div>
            <div className="mb-5 flex rounded-full border border-[#10272a]/10 bg-white/50 p-1 text-[11px] font-bold">
              <button onClick={() => setMode('student')} className={`flex-1 rounded-full px-3 py-2 transition ${isStudent ? 'bg-[#10272a] text-[#d8f36d]' : 'opacity-50'}`}>Student</button>
              <button onClick={() => setMode('teacher')} className={`flex-1 rounded-full px-3 py-2 transition ${!isStudent ? 'bg-[#10272a] text-[#d8f36d]' : 'opacity-50'}`}>Teacher</button>
            </div>
            {isStudent ? <motion.div key="student" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-4 flex items-center justify-between"><h4 className="text-2xl font-extrabold">Lịch hôm nay</h4><span className="rounded-full bg-[#ff8068] px-2 py-1 font-mono text-[9px] font-bold">3 việc</span></div>
              <div className="space-y-2">{studentItems.map((item) => <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm" key={item.title}><span className="w-10 pt-1 font-mono text-[10px] font-bold opacity-60">{item.time}</span><span className="h-10 w-1 rounded-full" style={{ background: item.color }} /><div><p className="text-xs font-extrabold">{item.title}</p><p className="mt-1 text-[9px] opacity-55">{item.meta}</p></div></div>)}</div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#10272a]/10 bg-[#b9e5df] p-3"><div className="grid h-8 w-8 place-items-center rounded-xl bg-[#10272a] text-[#d8f36d]"><Bell size={15} /></div><div><p className="text-[10px] font-extrabold">Deadline sắp tới</p><p className="text-[9px] opacity-65">Bài tập Hình học · còn 2 ngày</p></div></div>
            </motion.div> : <motion.div key="teacher" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-4 flex items-center justify-between"><h4 className="text-2xl font-extrabold">Lớp của bạn</h4><span className="rounded-full bg-[#ff8068] px-2 py-1 font-mono text-[9px] font-bold">4 lớp</span></div>
              <div className="rounded-2xl bg-[#10272a] p-4 text-[#f4f1e8]"><div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-wider text-[#b9e5df]">Đang dạy</p><p className="mt-1 text-lg font-extrabold">Toán 10A</p></div><BookOpen size={20} className="text-[#d8f36d]" /></div><div className="flex items-end justify-between"><p className="text-[10px] opacity-65">32 học sinh · 2 bài mới</p><ChevronRight size={16} className="text-[#d8f36d]" /></div></div>
              <div className="mt-3 rounded-2xl bg-[#d8f36d] p-4"><div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase"><Sparkles size={13} /> Trợ lý AI</div><p className="mt-2 text-xs font-extrabold">Tạo quiz 10 câu trong 30 giây</p><button className="mt-3 flex items-center gap-1 text-[10px] font-bold underline underline-offset-2">Bắt đầu <ChevronRight size={13} /></button></div>
            </motion.div>}
            <div className="mt-7 flex justify-around border-t border-[#10272a]/10 pt-4 text-[9px] font-bold opacity-55"><span className="flex flex-col items-center gap-1 text-[#10272a]"><Clock3 size={15} /> Lịch</span><span className="flex flex-col items-center gap-1"><Check size={15} /> Việc cần làm</span><span className="flex flex-col items-center gap-1"><CircleUserRound size={15} /> Hồ sơ</span></div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-7 left-0 z-20 hidden rounded-xl border border-[#10272a]/10 bg-white px-3 py-2 shadow-xl sm:block"><div className="flex items-center gap-2 text-[10px] font-bold"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#d8f36d]"><Check size={12} /></span> Đồng bộ tức thì</div></div>
    </div>
  );
}
