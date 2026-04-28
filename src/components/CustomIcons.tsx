import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

/**
 * Shared <svg> wrapper.
 * - 24x24 viewBox, 1.75 stroke width baseline (rounded caps/joins)
 * - All icons designed on a consistent grid with 2px outer padding
 * - Subtle dual-tone fills (10–15% opacity) to add depth without clutter
 */
const BaseIcon: React.FC<IconProps> = ({ size, color, style, children, ...props }) => (
  <svg
    width={size || '1em'}
    height={size || '1em'}
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    {...props}
  >
    {children}
  </svg>
);

const SW = 1.75; // shared stroke width

/* ─────────────────────────  PLAYGROUND  ───────────────────────── */
export const PlaygroundIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <defs>
      <linearGradient id="pg-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
        <stop offset="100%" stopColor={color} stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect
      x="2.5"
      y="3.5"
      width="19"
      height="17"
      rx="3"
      fill="url(#pg-grad)"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M2.5 8.5H21.5" stroke={color} strokeWidth={SW} />
    <circle cx="5.5" cy="6" r="0.7" fill={color} />
    <circle cx="8" cy="6" r="0.7" fill={color} opacity="0.7" />
    <circle cx="10.5" cy="6" r="0.7" fill={color} opacity="0.4" />
    <path d="M8 13.5L6 15.5L8 17.5" stroke={color} strokeWidth={SW} />
    <path d="M16 13.5L18 15.5L16 17.5" stroke={color} strokeWidth={SW} />
    <path d="M13.5 12.5L10.5 18" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  QR CODE  ───────────────────────── */
export const QRIcon: React.FC<IconProps> = ({ color = '#1F1F1F', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.05"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.05"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.05"
    />
    <rect x="5.5" y="5.5" width="2" height="2" rx="0.4" fill={color} />
    <rect x="16.5" y="5.5" width="2" height="2" rx="0.4" fill={color} />
    <rect x="5.5" y="16.5" width="2" height="2" rx="0.4" fill={color} />
    <rect x="14" y="14" width="2.5" height="2.5" rx="0.5" fill={color} />
    <rect x="18.5" y="14" width="2.5" height="2.5" rx="0.5" fill={color} fillOpacity="0.5" />
    <rect x="14" y="18.5" width="2.5" height="2.5" rx="0.5" fill={color} fillOpacity="0.5" />
    <rect x="18.5" y="18.5" width="2.5" height="2.5" rx="0.5" fill={color} />
  </BaseIcon>
);

/* ─────────────────────────  VIDEO  ───────────────────────── */
export const VideoIcon: React.FC<IconProps> = ({ color = '#F5222D', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2"
      y="5"
      width="16"
      height="14"
      rx="3"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <path
      d="M18 9.5L22 7V17L18 14.5V9.5Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M8.5 9L13.5 12L8.5 15V9Z" fill={color} stroke={color} strokeWidth={SW} />
    <circle cx="5" cy="8" r="0.8" fill={color} opacity="0.5" />
  </BaseIcon>
);

/* ─────────────────────────  EPOCH / TIME  ───────────────────────── */
export const EpochIcon: React.FC<IconProps> = ({ color = '#FA8C16', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW} fill={color} fillOpacity="0.08" />
    <circle
      cx="12"
      cy="12"
      r="6"
      stroke={color}
      strokeWidth="1"
      strokeOpacity="0.35"
      strokeDasharray="2 2"
    />
    <path d="M12 7V12L15.5 14" stroke={color} strokeWidth={SW} />
    <circle cx="12" cy="12" r="1.5" fill={color} />
    <path d="M12 2.5V4" stroke={color} strokeWidth={SW} />
    <path d="M12 20V21.5" stroke={color} strokeWidth={SW} />
    <path d="M2.5 12H4" stroke={color} strokeWidth={SW} />
    <path d="M20 12H21.5" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  REGEX  ───────────────────────── */
export const RegexIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2.5"
      y="3.5"
      width="19"
      height="13"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.08"
    />
    <path d="M16 7V12" stroke={color} strokeWidth={SW} />
    <path d="M13.5 8.25L18.5 10.75" stroke={color} strokeWidth={SW} />
    <path d="M13.5 10.75L18.5 8.25" stroke={color} strokeWidth={SW} />
    <circle cx="16" cy="14" r="1.1" fill={color} />
    <path d="M5.5 7.5L9.5 12" stroke={color} strokeWidth={SW} opacity="0.55" />
    <path d="M9.5 7.5L5.5 12" stroke={color} strokeWidth={SW} opacity="0.55" />
    <path d="M4 20H20" stroke={color} strokeWidth={SW} strokeDasharray="2 2" opacity="0.5" />
  </BaseIcon>
);

/* ─────────────────────────  UUID  ───────────────────────── */
export const UUIDIcon: React.FC<IconProps> = ({ color = '#13C2C2', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3.5"
      y="4"
      width="17"
      height="16"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.08"
    />
    <path d="M7 4V20" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
    <path d="M17 4V20" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
    <path d="M7.5 8.5H16.5" stroke={color} strokeWidth={SW} />
    <path d="M7.5 12H13.5" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M7.5 15.5H15" stroke={color} strokeWidth={SW} opacity="0.5" />
    <circle cx="16" cy="15.5" r="0.9" fill={color} />
    <circle cx="3.5" cy="9" r="1" fill={color} fillOpacity="0.25" />
    <circle cx="20.5" cy="9" r="1" fill={color} fillOpacity="0.25" />
    <circle cx="3.5" cy="15" r="1" fill={color} fillOpacity="0.25" />
    <circle cx="20.5" cy="15" r="1" fill={color} fillOpacity="0.25" />
  </BaseIcon>
);

/* ─────────────────────────  PASSWORD  ───────────────────────── */
export const PasswordIcon: React.FC<IconProps> = ({ color = '#FAAD14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path d="M7 10V8a5 5 0 0110 0v2" stroke={color} strokeWidth={SW} fill="none" />
    <rect
      x="3.5"
      y="10"
      width="17"
      height="11"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.12"
    />
    <circle cx="8" cy="15.5" r="1.2" fill={color} />
    <circle cx="12" cy="15.5" r="1.2" fill={color} />
    <circle cx="16" cy="15.5" r="1.2" fill={color} />
    <path d="M8 17v1.5" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M12 17v1.5" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M16 17v1.5" stroke={color} strokeWidth={SW} opacity="0.7" />
  </BaseIcon>
);

/* ─────────────────────────  JWT  ───────────────────────── */
export const JWTIcon: React.FC<IconProps> = ({ color = '#2F54EB', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M12 2.5L20 5v6c0 5.5-3.6 9.4-8 11-4.4-1.6-8-5.5-8-11V5l8-2.5z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth={SW}
    />
    <circle
      cx="12"
      cy="11"
      r="3.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.15"
    />
    <circle cx="12" cy="11" r="1.2" fill={color} />
    <path d="M12 14.5V18" stroke={color} strokeWidth={SW} />
    <path d="M10.5 18h3" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  COLOR PICKER  ───────────────────────── */
export const ColorPickerIcon: React.FC<IconProps> = ({ color = '#EB2F96', ...props }) => (
  <BaseIcon color={color} {...props}>
    <defs>
      <linearGradient id="cp-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F5222D" />
        <stop offset="33%" stopColor="#FAAD14" />
        <stop offset="66%" stopColor="#52C41A" />
        <stop offset="100%" stopColor="#1890FF" />
      </linearGradient>
    </defs>
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke={color}
      strokeWidth={SW}
      fill="url(#cp-grad)"
      fillOpacity="0.18"
    />
    <circle cx="7.5" cy="9" r="1.6" fill="#F5222D" />
    <circle cx="16.5" cy="9" r="1.6" fill="#FAAD14" />
    <circle cx="16.5" cy="15" r="1.6" fill="#1890FF" />
    <circle cx="7.5" cy="15" r="1.6" fill="#52C41A" />
    <circle cx="12" cy="12" r="2" fill="#fff" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  IMAGE → TEXT  ───────────────────────── */
export const ImageToTextIcon: React.FC<IconProps> = ({ color = '#1890FF', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M5 3h9l5 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M14 3v5h5" stroke={color} strokeWidth={SW} />
    <rect
      x="6.5"
      y="10.5"
      width="5"
      height="4"
      rx="0.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.2"
    />
    <circle cx="8" cy="12" r="0.6" fill={color} />
    <path d="M7 14l1.5-1.2L11 14" stroke={color} strokeWidth="1.2" />
    <path d="M13.5 11h4" stroke={color} strokeWidth={SW} />
    <path d="M13.5 13.5h3" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M6.5 17h11" stroke={color} strokeWidth={SW} opacity="0.5" />
    <path d="M6.5 19h7" stroke={color} strokeWidth={SW} opacity="0.4" />
  </BaseIcon>
);

/* ─────────────────────────  TEXT ART  ───────────────────────── */
export const TextArtIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.06"
    />
    <path d="M7.5 17L12 6.5L16.5 17" stroke={color} strokeWidth={SW} />
    <path d="M9.5 13.5H14.5" stroke={color} strokeWidth={SW} />
    <circle cx="12" cy="6.5" r="1.4" fill={color} stroke="#fff" strokeWidth="1" />
    <path
      d="M5.5 19.5L18.5 4.5"
      stroke={color}
      strokeWidth="1"
      strokeOpacity="0.2"
      strokeDasharray="2 2"
    />
  </BaseIcon>
);

/* ─────────────────────────  SVG  ───────────────────────── */
export const SVGIcon: React.FC<IconProps> = ({ color = '#FA8C16', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      strokeDasharray="3 2"
      fill={color}
      fillOpacity="0.05"
    />
    <path
      d="M6.5 17C6.5 17 9 8 12 8C15 8 17.5 17 17.5 17"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <circle cx="12" cy="8" r="2" fill={color} stroke="#fff" strokeWidth="1.2" />
    <circle cx="6.5" cy="17" r="2" fill={color} stroke="#fff" strokeWidth="1.2" />
    <circle cx="17.5" cy="17" r="2" fill={color} stroke="#fff" strokeWidth="1.2" />
  </BaseIcon>
);

/* ─────────────────────────  PICS EDITOR  ───────────────────────── */
export const PicsEditorIcon: React.FC<IconProps> = ({ color = '#13C2C2', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="4"
      width="14"
      height="14"
      rx="2"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <circle cx="7.5" cy="8.5" r="1.3" fill={color} />
    <path d="M3 14L7 11L11 14L15 10L17 12.5" stroke={color} strokeWidth={SW} />
    <path
      d="M14.5 13.5L20 8L22 10L16.5 15.5L13.5 16.5L14.5 13.5Z"
      fill={color}
      fillOpacity="0.25"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M19 9L21 11" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  BASE64  ───────────────────────── */
export const Base64Icon: React.FC<IconProps> = ({ color = '#595959', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M5 7L11 4.5V11L5 8.5V7Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth={SW}
    />
    <path
      d="M19 7L13 4.5V11L19 8.5V7Z"
      fill={color}
      fillOpacity="0.25"
      stroke={color}
      strokeWidth={SW}
    />
    <path
      d="M5 17L11 19.5V13L5 15.5V17Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth={SW}
    />
    <path
      d="M19 17L13 19.5V13L19 15.5V17Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <text
      x="12"
      y="13.5"
      fontSize="3.5"
      fontWeight="700"
      textAnchor="middle"
      fill={color}
      fontFamily="ui-monospace, monospace"
    >
      64
    </text>
  </BaseIcon>
);

/* ─────────────────────────  README  ───────────────────────── */
export const ReadmeIcon: React.FC<IconProps> = ({ color = '#1F1F1F', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 4.5C4 4 4.4 3.5 5 3.5h6c.6 0 1 .5 1 1V20c0-.6-.4-1-1-1H5c-.6 0-1 .5-1 1V4.5z"
      fill={color}
      fillOpacity="0.08"
      stroke={color}
      strokeWidth={SW}
    />
    <path
      d="M20 4.5c0-.5-.4-1-1-1h-6c-.6 0-1 .5-1 1V20c0-.6.4-1 1-1h6c.6 0 1 .5 1 1V4.5z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M6 7H10" stroke={color} strokeWidth={SW} />
    <path d="M6 10H10" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M6 13H9" stroke={color} strokeWidth={SW} opacity="0.5" />
    <path d="M14 7H18" stroke={color} strokeWidth={SW} />
    <path d="M14 10H18" stroke={color} strokeWidth={SW} opacity="0.7" />
    <path d="M14 13H17" stroke={color} strokeWidth={SW} opacity="0.5" />
  </BaseIcon>
);

/* ─────────────────────────  JSON  ───────────────────────── */
export const JsonIcon: React.FC<IconProps> = ({ color = '#FADB14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M9 4C6 4.5 5 6.5 5 9C5 10.5 4 11.5 3 12C4 12.5 5 13.5 5 15C5 17.5 6 19.5 9 20"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <path
      d="M15 4C18 4.5 19 6.5 19 9C19 10.5 20 11.5 21 12C20 12.5 19 13.5 19 15C19 17.5 18 19.5 15 20"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <circle cx="12" cy="9" r="1.1" fill={color} />
    <circle cx="12" cy="12" r="1.1" fill={color} opacity="0.7" />
    <circle cx="12" cy="15" r="1.1" fill={color} opacity="0.4" />
  </BaseIcon>
);

/* ─────────────────────────  HTML  ───────────────────────── */
export const HtmlIcon: React.FC<IconProps> = ({ color = '#E44D26', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 3L5.4 19.5L12 21.5L18.6 19.5L20 3H4Z"
      fill={color}
      fillOpacity="0.12"
      stroke={color}
      strokeWidth={SW}
    />
    <path
      d="M16.5 7.5H8L8.4 12H15.6L15.2 16L12 17L8.8 16L8.6 14"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <path
      d="M12 3V21.5"
      stroke={color}
      strokeWidth="1"
      strokeOpacity="0.25"
      strokeDasharray="2 2"
    />
  </BaseIcon>
);

/* ─────────────────────────  WHEEL OF NAMES  ───────────────────────── */
export const WheelIcon: React.FC<IconProps> = ({ color = '#F5222D', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle
      cx="12"
      cy="13"
      r="8.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.08"
    />
    <path d="M12 13L12 4.5" stroke="#F5222D" strokeWidth={SW} opacity="0.9" />
    <path d="M12 13L19.4 9.2" stroke="#FA8C16" strokeWidth={SW} opacity="0.9" />
    <path d="M12 13L19.4 16.8" stroke="#FADB14" strokeWidth={SW} opacity="0.9" />
    <path d="M12 13L12 21.5" stroke="#52C41A" strokeWidth={SW} opacity="0.9" />
    <path d="M12 13L4.6 16.8" stroke="#1890FF" strokeWidth={SW} opacity="0.9" />
    <path d="M12 13L4.6 9.2" stroke="#722ED1" strokeWidth={SW} opacity="0.9" />
    <circle cx="12" cy="13" r="1.6" fill="#fff" stroke={color} strokeWidth={SW} />
    <path d="M12 1.5L13.5 4.5H10.5L12 1.5Z" fill={color} stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  RANDOM (DICE)  ───────────────────────── */
export const RandomIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <circle cx="7.5" cy="7.5" r="1.3" fill={color} />
    <circle cx="16.5" cy="7.5" r="1.3" fill={color} />
    <circle cx="12" cy="12" r="1.3" fill={color} />
    <circle cx="7.5" cy="16.5" r="1.3" fill={color} />
    <circle cx="16.5" cy="16.5" r="1.3" fill={color} />
  </BaseIcon>
);

/* ─────────────────────────  TIC TAC TOE  ───────────────────────── */
export const TicTacToeIcon: React.FC<IconProps> = ({ color = '#1890FF', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path d="M9 3.5V20.5" stroke={color} strokeWidth={SW} />
    <path d="M15 3.5V20.5" stroke={color} strokeWidth={SW} />
    <path d="M3.5 9H20.5" stroke={color} strokeWidth={SW} />
    <path d="M3.5 15H20.5" stroke={color} strokeWidth={SW} />
    <path d="M5 5L7.5 7.5M7.5 5L5 7.5" stroke="#F5222D" strokeWidth={SW} />
    <circle cx="12" cy="12" r="2" stroke="#1890FF" strokeWidth={SW} />
    <path d="M17 17L19 19M19 17L17 19" stroke="#F5222D" strokeWidth={SW} />
    <circle cx="6.25" cy="12" r="1.6" stroke="#1890FF" strokeWidth={SW} opacity="0.5" />
    <path d="M11 5L13 7M13 5L11 7" stroke="#F5222D" strokeWidth={SW} opacity="0.5" />
  </BaseIcon>
);

/* ─────────────────────────  SNAKE  ───────────────────────── */
export const SnakeIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 17a3 3 0 003 3h2a3 3 0 003-3V8a3 3 0 013-3h2a3 3 0 013 3"
      stroke={color}
      strokeWidth={SW * 1.4}
      fill="none"
      opacity="0.25"
    />
    <path
      d="M4 17a3 3 0 003 3h2a3 3 0 003-3V8a3 3 0 013-3h2a3 3 0 013 3"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <circle cx="20" cy="8" r="1.6" fill={color} />
    <circle cx="20" cy="8" r="0.5" fill="#fff" />
    <path d="M21.3 8L23 7" stroke={color} strokeWidth={SW} />
    <path d="M21.3 8L23 9" stroke={color} strokeWidth={SW} />
    <circle cx="6" cy="14" r="1" fill="#F5222D" />
  </BaseIcon>
);

/* ─────────────────────────  MINESWEEPER  ───────────────────────── */
export const MinesweeperIcon: React.FC<IconProps> = ({ color = '#1F1F1F', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.06"
    />
    <circle cx="12" cy="13" r="4" fill={color} />
    <path d="M12 7V9" stroke={color} strokeWidth={SW} />
    <path d="M7.2 13H5.5" stroke={color} strokeWidth={SW} />
    <path d="M18.5 13H16.8" stroke={color} strokeWidth={SW} />
    <path d="M8.5 9.5L9.7 10.7" stroke={color} strokeWidth={SW} />
    <path d="M15.5 9.5L14.3 10.7" stroke={color} strokeWidth={SW} />
    <path d="M8.5 16.5L9.7 15.3" stroke={color} strokeWidth={SW} />
    <path d="M15.5 16.5L14.3 15.3" stroke={color} strokeWidth={SW} />
    <circle cx="10.5" cy="11.5" r="0.9" fill="#fff" />
    <path d="M16 5.5h3v3h-3z" fill="#F5222D" />
  </BaseIcon>
);

/* ─────────────────────────  SUDOKU  ───────────────────────── */
export const SudokuIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.06"
    />
    <path d="M9 3V21" stroke={color} strokeWidth={SW} />
    <path d="M15 3V21" stroke={color} strokeWidth={SW} />
    <path d="M3 9H21" stroke={color} strokeWidth={SW} />
    <path d="M3 15H21" stroke={color} strokeWidth={SW} />
    <text x="6" y="7.5" fontSize="3.5" fontWeight="700" textAnchor="middle" fill={color}>
      5
    </text>
    <text
      x="18"
      y="7.5"
      fontSize="3.5"
      fontWeight="700"
      textAnchor="middle"
      fill={color}
      opacity="0.5"
    >
      3
    </text>
    <text x="12" y="13.5" fontSize="3.5" fontWeight="700" textAnchor="middle" fill={color}>
      7
    </text>
    <text
      x="6"
      y="19.5"
      fontSize="3.5"
      fontWeight="700"
      textAnchor="middle"
      fill={color}
      opacity="0.5"
    >
      1
    </text>
    <text x="18" y="19.5" fontSize="3.5" fontWeight="700" textAnchor="middle" fill={color}>
      9
    </text>
  </BaseIcon>
);

/* ─────────────────────────  CHESS (KNIGHT)  ───────────────────────── */
export const ChessIcon: React.FC<IconProps> = ({ color = '#1F1F1F', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M9 4C8 5 7 6 7 8L8 9L6 11C5 12 5 14 6.5 14L9 13.5L8 16.5V18H17V14C17 11 16 8 14 6L11 3L9 4Z"
      fill={color}
      fillOpacity="0.12"
      stroke={color}
      strokeWidth={SW}
    />
    <circle cx="10.5" cy="7.5" r="0.8" fill={color} />
    <path
      d="M5.5 18.5H17.5V20H5.5z"
      fill={color}
      fillOpacity="0.25"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M4.5 21H18.5" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  VECTOR / PEN  ───────────────────────── */
export const VectorIcon: React.FC<IconProps> = ({ color = '#FA541C', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2.5"
      y="2.5"
      width="4"
      height="4"
      rx="0.5"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <rect
      x="17.5"
      y="2.5"
      width="4"
      height="4"
      rx="0.5"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <rect
      x="2.5"
      y="17.5"
      width="4"
      height="4"
      rx="0.5"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <rect
      x="17.5"
      y="17.5"
      width="4"
      height="4"
      rx="0.5"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth={SW}
    />
    <path d="M6.5 4.5C10 7 14 7 17.5 4.5" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M4.5 6.5C7 10 7 14 4.5 17.5" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M19.5 6.5C17 10 17 14 19.5 17.5" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M6.5 19.5C10 17 14 17 17.5 19.5" stroke={color} strokeWidth={SW} fill="none" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </BaseIcon>
);

/* ─────────────────────────  COMMAND / TERMINAL  ───────────────────────── */
export const CommandIcon: React.FC<IconProps> = ({ color = '#262626', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2.5"
      y="4"
      width="19"
      height="16"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.08"
    />
    <path d="M2.5 8H21.5" stroke={color} strokeWidth={SW} />
    <circle cx="5" cy="6" r="0.7" fill="#F5222D" />
    <circle cx="7.5" cy="6" r="0.7" fill="#FAAD14" />
    <circle cx="10" cy="6" r="0.7" fill="#52C41A" />
    <path d="M6 15L9 12L6 9" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M11 15.5H16" stroke={color} strokeWidth={SW} />
  </BaseIcon>
);

/* ─────────────────────────  EMOJI  ───────────────────────── */
export const EmojiIcon: React.FC<IconProps> = ({ color = '#FAAD14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.15"
    />
    <circle cx="9" cy="10.5" r="1.2" fill={color} />
    <circle cx="15" cy="10.5" r="1.2" fill={color} />
    <path
      d="M8 14.5C8.5 16 10 17 12 17C14 17 15.5 16 16 14.5"
      stroke={color}
      strokeWidth={SW}
      fill="none"
    />
    <path d="M6 7L4.5 5.5" stroke={color} strokeWidth={SW} opacity="0.5" />
    <path d="M18 7L19.5 5.5" stroke={color} strokeWidth={SW} opacity="0.5" />
  </BaseIcon>
);

/* ─────────────────────────  STRESS TEST (BOLT)  ───────────────────────── */
export const StressTestIcon: React.FC<IconProps> = ({ color = '#FAAD14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M13 2L3.5 13.5H11L10 22L20.5 10.5H13L13 2Z"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.18"
    />
    <path d="M13 2L11 10.5H13L13 2Z" fill={color} opacity="0.4" />
  </BaseIcon>
);

/* ─────────────────────────  MERMAID (FLOW DIAGRAM)  ───────────────────────── */
export const MermaidIcon: React.FC<IconProps> = ({ color = '#FF3670', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2.5"
      y="3"
      width="7"
      height="5"
      rx="1"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.15"
    />
    <rect
      x="14.5"
      y="3"
      width="7"
      height="5"
      rx="1"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <rect
      x="8"
      y="16"
      width="8"
      height="5"
      rx="1"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.2"
    />
    <path d="M6 8V11C6 12 7 12.5 8 12.5H12V16" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M18 8V11C18 12 17 12.5 16 12.5H12V16" stroke={color} strokeWidth={SW} fill="none" />
    <path d="M11 15L12 16L13 15" stroke={color} strokeWidth={SW} fill="none" />
  </BaseIcon>
);

/* ─────────────────────────  GOOGLE DRIVE  ───────────────────────── */
export const GoogleDriveIcon: React.FC<IconProps> = ({ ...props }) => (
  <BaseIcon {...props}>
    <path
      d="M8.5 2.5L1.5 14.5H8.5L15.5 2.5H8.5Z"
      fill="#1FA463"
      stroke="#1FA463"
      strokeWidth={SW * 0.6}
    />
    <path
      d="M15.5 2.5L22.5 14.5L19 20.5L12 8.5L15.5 2.5Z"
      fill="#FFC107"
      stroke="#FFC107"
      strokeWidth={SW * 0.6}
    />
    <path
      d="M1.5 14.5L5 20.5H19L22.5 14.5H1.5Z"
      fill="#4285F4"
      stroke="#4285F4"
      strokeWidth={SW * 0.6}
    />
  </BaseIcon>
);

/* ─────────────────────────  DEVICE TEST  ───────────────────────── */
export const DeviceTestIcon: React.FC<IconProps> = ({ color = '#1677FF', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2.5"
      y="3.5"
      width="19"
      height="13"
      rx="2.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <path d="M9 20H15" stroke={color} strokeWidth={SW} />
    <path d="M12 16.5V20" stroke={color} strokeWidth={SW} />
    <path d="M4 10H7L8.5 6L11 14L13 8L14.5 11H20" stroke={color} strokeWidth={SW} fill="none" />
    <circle cx="20" cy="11" r="0.8" fill="#52C41A" />
  </BaseIcon>
);

/* ─────────────────────────  MOUSE TEST  ───────────────────────── */
export const MouseTestIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="6.5"
      y="2.5"
      width="11"
      height="19"
      rx="5.5"
      stroke={color}
      strokeWidth={SW}
      fill={color}
      fillOpacity="0.1"
    />
    <path d="M12 2.5V11.5" stroke={color} strokeWidth={SW} opacity="0.6" />
    <rect x="11" y="6.5" width="2" height="4" rx="1" fill={color} />
    <path d="M6.5 11.5H17.5" stroke={color} strokeWidth={SW} opacity="0.3" strokeDasharray="2 2" />
    <path d="M6.5 8a5.5 5.5 0 015.5-5.5V11.5H6.5V8z" fill={color} fillOpacity="0.18" />
  </BaseIcon>
);

/* ─────────────────────────  GOOGLE PHOTOS  ───────────────────────── */
export const GooglePhotosIcon: React.FC<IconProps> = ({ ...props }) => (
  <BaseIcon {...props}>
    <path d="M12 2.5a5 5 0 015 5H12V2.5z" fill="#EA4335" />
    <path d="M12 2.5a5 5 0 00-5 5h5V2.5z" fill="#EA4335" fillOpacity="0.55" />
    <path d="M21.5 12a5 5 0 01-5 5V12h5z" fill="#4285F4" />
    <path d="M21.5 12a5 5 0 00-5-5V12h5z" fill="#4285F4" fillOpacity="0.55" />
    <path d="M12 21.5a5 5 0 01-5-5h5v5z" fill="#34A853" />
    <path d="M12 21.5a5 5 0 005-5h-5v5z" fill="#34A853" fillOpacity="0.55" />
    <path d="M2.5 12a5 5 0 015-5v5h-5z" fill="#FBBC04" />
    <path d="M2.5 12a5 5 0 005 5V12h-5z" fill="#FBBC04" fillOpacity="0.55" />
  </BaseIcon>
);
