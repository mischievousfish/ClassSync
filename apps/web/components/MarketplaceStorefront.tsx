'use client';

import { useMemo, useState } from 'react';

export type MarketplaceProduct = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  priceVnd: number;
  ratingAverage: number;
  salesCount: number;
  description: string;
};

const initialProducts: MarketplaceProduct[] = [
  {
    id: 'p1',
    title: 'Algebra Sprint Pack',
    subject: 'Mathematics',
    gradeLevel: 'Grade 8',
    priceVnd: 220000,
    ratingAverage: 4.9,
    salesCount: 128,
    description: '20-question test prep bundle with auto-graded explanations and answer keys.',
  },
  {
    id: 'p2',
    title: 'Reading Comprehension Bootcamp',
    subject: 'English',
    gradeLevel: 'Grade 9',
    priceVnd: 180000,
    ratingAverage: 4.7,
    salesCount: 84,
    description: 'Critical reading strategies with mini-passages and teacher rubrics.',
  },
  {
    id: 'p3',
    title: 'Chemistry Lab Safety Kit',
    subject: 'Science',
    gradeLevel: 'Grade 10',
    priceVnd: 260000,
    ratingAverage: 4.8,
    salesCount: 95,
    description: 'Safety quizzes, flash cards, and demo worksheets for classroom lab practice.',
  },
];

export function MarketplaceStorefront() {
  const [subject, setSubject] = useState('All');
  const [maxPrice, setMaxPrice] = useState(300000);
  const [rating, setRating] = useState(4.5);

  const products = useMemo(() => {
    return initialProducts.filter((product) => {
      const subjectMatch = subject === 'All' || product.subject === subject;
      const priceMatch = product.priceVnd <= maxPrice;
      const ratingMatch = product.ratingAverage >= rating;
      return subjectMatch && priceMatch && ratingMatch;
    });
  }, [subject, maxPrice, rating]);

  return (
    <section style={{ display: 'grid', gap: 18, padding: 24, fontFamily: 'sans-serif', background: '#f8fafc', borderRadius: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>Marketplace</div>
          <h2 style={{ margin: 0, fontSize: 32 }}>Teacher resource catalog</h2>
        </div>
        <button style={{ border: 'none', background: '#1d4ed8', color: 'white', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>
          Sell a resource
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', background: 'white', padding: 16, borderRadius: 16 }}>
        <label>
          <div style={{ fontSize: 12, color: '#475569' }}>Subject</div>
          <select value={subject} onChange={(event) => setSubject(event.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <option value="All">All</option>
            <option value="Mathematics">Mathematics</option>
            <option value="English">English</option>
            <option value="Science">Science</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, color: '#475569' }}>Max price</div>
          <input type="range" min={50000} max={300000} step={25000} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} style={{ width: '100%' }} />
          <div>{maxPrice.toLocaleString('vi-VN')} VND</div>
        </label>

        <label>
          <div style={{ fontSize: 12, color: '#475569' }}>Min rating</div>
          <input type="number" min={0} max={5} step={0.1} value={rating} onChange={(event) => setRating(Number(event.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
        </label>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {products.map((product) => (
          <div key={product.id} style={{ background: 'white', borderRadius: 18, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{product.subject}</span>
              <span style={{ fontWeight: 700 }}>{product.ratingAverage.toFixed(1)} ★</span>
            </div>
            <h3 style={{ margin: '12px 0 6px', fontSize: 22 }}>{product.title}</h3>
            <div style={{ color: '#475569', fontSize: 14 }}>{product.gradeLevel}</div>
            <p style={{ color: '#475569', lineHeight: 1.5, minHeight: 70 }}>{product.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <strong style={{ fontSize: 18 }}>{product.priceVnd.toLocaleString('vi-VN')} VND</strong>
              <span style={{ color: '#64748b' }}>{product.salesCount} sold</span>
            </div>
            <button style={{ width: '100%', marginTop: 14, border: 'none', borderRadius: 10, background: '#0f172a', color: 'white', padding: '10px 12px', cursor: 'pointer' }}>
              View product
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MarketplaceStorefront;
