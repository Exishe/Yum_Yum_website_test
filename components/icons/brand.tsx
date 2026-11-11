/*
 * Hand-drawn two-tone brand icons: plum outline, magenta and yellow fills,
 * round joins. Drawn for this project (see docs/CREDITS.md).
 * Utility icons (arrows, close, plus) come from Phosphor.
 */
import Image from "next/image";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; title?: string };

/**
 * The team's own 3D menu icons (renders made for YUM-YUM, backgrounds cut
 * out; public/images/icons). They replace the drawn icons in the menus.
 */
type Icon3DProps = { size?: number; className?: string; title?: string };
function Icon3D({ src, size = 24, className, title }: Icon3DProps & { src: string }) {
  // The renders fill their square less than a line icon does, so they are drawn a touch larger.
  const px = Math.round(size * 1.18);
  return (
    <Image
      src={src}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={px}
      height={px}
      className={className}
      style={{ width: px, height: px, maxWidth: "none", margin: -(px - size) / 2 }}
    />
  );
}
export const DonutIcon = (p: Icon3DProps) => <Icon3D src="/images/icons/donut.webp" {...p} />;
export const PinIcon = (p: Icon3DProps) => <Icon3D src="/images/icons/pin.webp" {...p} />;
export const BagIcon = (p: Icon3DProps) => <Icon3D src="/images/icons/bag.webp" {...p} />;
export const FlowerIcon = (p: Icon3DProps) => <Icon3D src="/images/icons/bouquet.webp" {...p} />;
export const GlobeIcon = (p: Icon3DProps) => <Icon3D src="/images/icons/globe.webp" {...p} />;
/** "About us": the shop's own round logo, until the team adds a render for it. */
export const LogoIcon = ({ size = 24, ...p }: Icon3DProps) => (
  <Icon3D src="/images/brand/logo-240.png" size={Math.round(size * 0.92)} {...p} />
);

const PLUM = "#2b0a24";
const MAGENTA = "#de1281";
const SUN = "#ffe14d";
const PINK = "#ffb3d6";

function Svg({ size = 24, title, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={PLUM}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Donut with morning rays, for "fresh at 9:00". */
export function FreshDonutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 2.8v2.6M6.6 6.6l1.8 1.8M25.4 6.6l-1.8 1.8M2.8 16h2.6M26.6 16h2.6" />
      <circle cx="16" cy="18" r="9.5" fill={SUN} />
      <path
        d="M7.2 16.3c1-3.7 4.4-6.3 8.8-6.3 4.6 0 8.2 2.8 8.7 6.7-.9 1.1-2 .9-2.6 1.9-.7 1.1-.2 2.1-1.3 2.6-1.2.5-1.8-.6-3-.2-1.2.4-1.3 1.6-2.6 1.6-1.3 0-1.4-1.3-2.6-1.7-1.1-.3-2 .5-2.8-.4-.7-.8-.5-1.9-1.8-2.9"
        fill={MAGENTA}
      />
      <circle cx="16" cy="18" r="2.8" fill="#fff8f2" />
      <circle cx="16" cy="18" r="9.5" />
    </Svg>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="8" width="21" height="15" rx="2.8" fill={SUN} />
      <path d="M3.5 13h21" strokeWidth={3} />
      <path d="M8 18.5h5" />
      <circle cx="24.5" cy="9" r="4.6" fill={MAGENTA} />
      <circle cx="24.5" cy="9" r="1.4" fill="#fff8f2" />
    </Svg>
  );
}

/** Heart with a donut hole: "our story". */
export function HeartDonutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M16 27.5S4 20.3 4 12a6.3 6.3 0 0 1 12-2.7A6.3 6.3 0 0 1 28 12c0 8.3-12 15.5-12 15.5Z"
        fill={MAGENTA}
      />
      <circle cx="16" cy="15.4" r="4.2" fill={SUN} />
      <circle cx="16" cy="15.4" r="1.6" fill="#fff8f2" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M8.4 4.5h3.2l2 5.3-2.6 1.8a15 15 0 0 0 9.4 9.4l1.8-2.6 5.3 2v3.2a3 3 0 0 1-3.2 3C14.4 25.9 6.1 17.6 5.4 7.7a3 3 0 0 1 3-3.2Z"
        fill={SUN}
      />
      <path d="M19 5.5a8 8 0 0 1 7.5 7.5M19 9.5a4 4 0 0 1 3.5 3.5" stroke={MAGENTA} />
    </Svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="13" width="22" height="14" rx="2" fill={PINK} />
      <rect x="3.5" y="9" width="25" height="5" rx="1.6" fill={MAGENTA} />
      <path d="M16 9v18" stroke={SUN} strokeWidth={3} />
      <path
        d="M16 9c-1.4-3.6-6.5-5-6.5-2 0 2 3.4 2 6.5 2Zm0 0c1.4-3.6 6.5-5 6.5-2 0 2-3.4 2-6.5 2Z"
        fill={SUN}
      />
    </Svg>
  );
}

export function CupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 9.5h17l-2 17.3a2 2 0 0 1-2 1.7h-9a2 2 0 0 1-2-1.7l-2-17.3Z" fill={PLUM} />
      <path d="M6 6.5h20v3H6z" fill={MAGENTA} />
      <path d="M11 3.5h10l1 3H10z" fill={PINK} />
      <path d="M10.2 16.5h11.6" stroke={SUN} strokeWidth={3.2} />
    </Svg>
  );
}

/** Small decorative sprinkle shapes used in the hero background. */
export function Sprinkle({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        background: color,
        width: 18,
        height: 6,
        borderRadius: 999,
        display: "block",
        ...style,
      }}
    />
  );
}
