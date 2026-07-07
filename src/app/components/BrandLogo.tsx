type BrandLogoSize = "sm" | "md" | "lg";

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  className?: string;
}

const sizeClasses: Record<BrandLogoSize, { frame: string; image: string; title: string; subtitle: string }> = {
  sm: {
    frame: "h-10 w-10",
    image: "h-11 w-11",
    title: "text-lg",
    subtitle: "text-[10px]",
  },
  md: {
    frame: "h-14 w-14",
    image: "h-16 w-16",
    title: "text-2xl",
    subtitle: "text-xs",
  },
  lg: {
    frame: "h-24 w-24",
    image: "h-28 w-28",
    title: "text-3xl",
    subtitle: "text-sm",
  },
};

export function BrandLogo({ size = "md", showText = true, className = "" }: BrandLogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`${classes.frame} flex flex-none items-center justify-center`}>
        <img src="/spaceroom-logo.png" alt="SpaceRoom" className={`${classes.image} object-contain`} />
      </div>
      {showText && (
        <div className="min-w-0">
          <div className={`${classes.title} truncate font-bold leading-tight text-blue-900 dark:text-slate-100`}>SpaceRoom</div>
          <div className={`${classes.subtitle} truncate font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-300`}>Reservas inteligentes</div>
        </div>
      )}
    </div>
  );
}
