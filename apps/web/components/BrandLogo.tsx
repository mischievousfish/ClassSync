type BrandLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  imageClassName?: string;
};

export default function BrandLogo({
  size = 32,
  className = '',
  showWordmark = true,
  wordmarkClassName = '',
  imageClassName = '',
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="ClassSync Logo"
        width={size}
        height={size}
        className={`shrink-0 rounded-xl object-contain ring-1 ring-[#10272a]/10 ${imageClassName}`}
        style={{ width: size, height: size }}
      />

      {showWordmark && (
        <div className={`flex items-center gap-1 ${wordmarkClassName}`}>
          <span className="text-lg font-black tracking-tight text-[#10272a]">classsync</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff8068]">.app</span>
        </div>
      )}
    </div>
  );
}
