'use client';

import { useState } from 'react';

export type ProductReview = {
  author: string;
  rating: number;
  comment: string;
};

export function ProductDetailCard({
  title,
  description,
  subject,
  gradeLevel,
  priceVnd,
  reviews,
}: {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  priceVnd: number;
  reviews: ProductReview[];
}) {
  const [previewMode, setPreviewMode] = useState<'questions' | 'teacher-guide'>('questions');

  return (
    <section style={{ display: 'grid', gap: 20, padding: 24, background: '#f8fafc', borderRadius: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        <div>
          <div style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>{subject}</div>
          <h2 style={{ margin: '8px 0', fontSize: 32 }}>{title}</h2>
          <div style={{ color: '#475569', fontSize: 15 }}>{gradeLevel}</div>
          <p style={{ color: '#334155', lineHeight: 1.7 }}>{description}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPreviewMode('questions')} style={{ border: previewMode === 'questions' ? '1px solid #1d4ed8' : '1px solid #cbd5e1', background: previewMode === 'questions' ? '#dbeafe' : 'white', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              Sample questions
            </button>
            <button onClick={() => setPreviewMode('teacher-guide')} style={{ border: previewMode === 'teacher-guide' ? '1px solid #1d4ed8' : '1px solid #cbd5e1', background: previewMode === 'teacher-guide' ? '#dbeafe' : 'white', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              Teacher guide
            </button>
          </div>

          <div style={{ marginTop: 16, background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
            {previewMode === 'questions' ? (
              <ol>
                <li>1. Solve for x: 3x + 9 = 21.</li>
                <li>2. Which equation is equivalent to y = 2x + 3?</li>
                <li>3. Describe the slope and intercept of the line.</li>
              </ol>
            ) : (
              <p>Teacher guide includes pacing notes, differentiated support prompts, and rubric criteria for assessment.</p>
            )}
          </div>
        </div>

        <aside style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{priceVnd.toLocaleString('vi-VN')} VND</div>
          <div style={{ color: '#64748b', margin: '6px 0 14px' }}>Instant access • 1-click checkout</div>
          <button style={{ width: '100%', background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}>Buy now</button>
          <button style={{ width: '100%', marginTop: 8, background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}>Save to wishlist</button>
        </aside>
      </div>

      <div>
        <h3 style={{ margin: '0 0 12px' }}>Buyer reviews</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {reviews.map((review, index) => (
            <div key={`${review.author}-${index}`} style={{ background: 'white', borderRadius: 12, padding: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{review.author}</strong>
                <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p style={{ margin: '8px 0 0', color: '#475569' }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductDetailCard;
