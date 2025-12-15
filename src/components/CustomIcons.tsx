import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

const BaseIcon: React.FC<IconProps> = ({ size, color, style, children, ...props }) => (
  <svg
    width={size || '1em'}
    height={size || '1em'}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    {...props}
  >
    {children}
  </svg>
);

export const PlaygroundIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <path d="M3 9H21" stroke={color} strokeWidth="2" />
    <path
      d="M7.5 13L5.5 15L7.5 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 13L18.5 15L16.5 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 12L11 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="6.5" r="1" fill={color} />
    <circle cx="9" cy="6.5" r="1" fill={color} />
    <circle cx="12" cy="6.5" r="1" fill={color} />
  </BaseIcon>
);

export const QRIcon: React.FC<IconProps> = ({ color = '#000000', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect x="3" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
    <rect x="15" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
    <rect x="3" y="15" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
    <rect x="5" y="5" width="2" height="2" fill={color} />
    <rect x="17" y="5" width="2" height="2" fill={color} />
    <rect x="5" y="17" width="2" height="2" fill={color} />
    <path d="M15 15H17V17H15V15Z" fill={color} />
    <path d="M19 19H21V21H19V19Z" fill={color} />
    <path d="M15 19H17V21H15V19Z" fill={color} fillOpacity="0.5" />
    <path d="M19 15H21V17H19V15Z" fill={color} fillOpacity="0.5" />
    <path d="M12 3V21" stroke={color} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="2 2" />
    <path d="M3 12H21" stroke={color} strokeWidth="1" strokeOpacity="0.2" strokeDasharray="2 2" />
  </BaseIcon>
);

export const VideoIcon: React.FC<IconProps> = ({ color = '#F5222D', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="3"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M10 9L16 12L10 15V9Z"
      fill={color}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M2 8H22" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
    <path d="M2 16H22" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
    <rect x="4" y="5" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="8" y="5" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="14" y="5" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="18" y="5" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="4" y="17" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="8" y="17" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="14" y="17" width="2" height="2" fill={color} fillOpacity="0.5" />
    <rect x="18" y="17" width="2" height="2" fill={color} fillOpacity="0.5" />
  </BaseIcon>
);

export const EpochIcon: React.FC<IconProps> = ({ color = '#FA8C16', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <path
      d="M12 7V12L15.5 15.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 2V4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M2 12H4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 12H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill={color} />
    <path d="M17 7L16 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M7 17L8 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M17 17L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M7 7L8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const RegexIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M11 4C6.58172 4 3 7.58172 3 12C3 16.4183 6.58172 20 11 20C15.4183 20 19 16.4183 19 12C19 7.58172 15.4183 4 11 4Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M21 21L16.65 16.65"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 10L10 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M14 10L12 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="14" r="1" fill={color} />
    <circle cx="14" cy="14" r="1" fill={color} />
    <path d="M11 8V16" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
  </BaseIcon>
);

export const UUIDIcon: React.FC<IconProps> = ({ color = '#13C2C2', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.1"
    />
    <path d="M8 8H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 16H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="15" cy="16" r="1.5" fill={color} />
    <path d="M4 10H2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M22 10H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M4 14H2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M22 14H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const PasswordIcon: React.FC<IconProps> = ({ color = '#FAAD14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M12 2C8.13401 2 5 5.13401 5 9V11H4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V11H19V9C19 5.13401 15.866 2 12 2Z"
      fill={color}
      fillOpacity="0.1"
    />
    <path
      d="M12 2C8.13401 2 5 5.13401 5 9V11H19V9C19 5.13401 15.866 2 12 2Z"
      stroke={color}
      strokeWidth="2"
    />
    <rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="16" r="2" fill={color} />
    <path d="M12 18V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="16" r="1" fill={color} fillOpacity="0.5" />
    <circle cx="16" cy="16" r="1" fill={color} fillOpacity="0.5" />
  </BaseIcon>
);

export const JWTIcon: React.FC<IconProps> = ({ color = '#2F54EB', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M12 22C12 22 5 18 5 12V5L12 2L19 5V12C19 18 12 22 12 22Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
    <path d="M12 10V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 16V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M10 12H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M16 12H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </BaseIcon>
);

export const ColorPickerIcon: React.FC<IconProps> = ({ color = '#EB2F96', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <path
      d="M12 6C12 6 12 12 16.2426 16.2426C14.5 18 12 18 12 18C8 18 6 15 6 12C6 9 9 6 12 6Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="8" r="2" fill="#F5222D" />
    <circle cx="8" cy="16" r="2" fill="#1890FF" />
    <circle cx="18" cy="15" r="1.5" fill="#52C41A" />
    <circle cx="6" cy="9" r="1.5" fill="#FAAD14" />
  </BaseIcon>
);

export const ImageToTextIcon: React.FC<IconProps> = ({ color = '#1890FF', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 12H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 16H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 8H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <rect x="15" y="15" width="6" height="6" rx="1" fill={color} stroke="#fff" strokeWidth="2" />
    <path d="M17 17L19 19" stroke="#fff" strokeWidth="1.5" />
  </BaseIcon>
);

export const TextArtIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <path
      d="M7 17L12 5L17 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 13H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M4 20L20 4" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
    <circle cx="12" cy="5" r="1" fill={color} />
    <circle cx="7" cy="17" r="1" fill={color} />
    <circle cx="17" cy="17" r="1" fill={color} />
  </BaseIcon>
);

export const SVGIcon: React.FC<IconProps> = ({ color = '#FA8C16', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
    <path
      d="M7 17C7 17 9 7 12 7C15 7 17 17 17 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="7" r="2" fill={color} stroke="#fff" strokeWidth="1" />
    <circle cx="7" cy="17" r="2" fill={color} stroke="#fff" strokeWidth="1" />
    <circle cx="17" cy="17" r="2" fill={color} stroke="#fff" strokeWidth="1" />
    <path d="M12 7L17 4" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    <path d="M12 7L7 4" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
  </BaseIcon>
);

export const PicsEditorIcon: React.FC<IconProps> = ({ color = '#13C2C2', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M15 3L21 9L13 17H7V11L15 3Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 4L20 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M3 21H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M10 14L12 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="6" cy="18" r="1" fill={color} />
    <circle cx="18" cy="18" r="1" fill={color} />
    <path d="M2 2L22 22" stroke={color} strokeWidth="1" strokeOpacity="0.1" />
  </BaseIcon>
);

export const Base64Icon: React.FC<IconProps> = ({ color = '#8C8C8C', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22V12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.5"
    />
    <circle cx="12" cy="7" r="1.5" fill={color} />
  </BaseIcon>
);

export const ReadmeIcon: React.FC<IconProps> = ({ color = '#000000', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 7V12L10.5 9.5L13 12V7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 7V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 16H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 19H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <rect x="18" y="16" width="2" height="2" fill={color} />
  </BaseIcon>
);

export const JsonIcon: React.FC<IconProps> = ({ color = '#FADB14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M7 4C7 4 3 5 3 8V10C3 10 1 11 1 12C1 13 3 14 3 14V16C3 19 7 20 7 20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 4C17 4 21 5 21 8V10C21 10 23 11 23 12C23 13 21 14 21 14V16C21 19 17 20 17 20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill={color} />
    <path d="M12 8V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 18V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const HtmlIcon: React.FC<IconProps> = ({ color = '#E44D26', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 3L5.5 20L12 22L18.5 20L20 3H4Z"
      fill={color}
      fillOpacity="0.1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 7.5H7.5L8 12.5H16L15.5 16.5L12 17.5L8.5 16.5L8.25 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 3V7.5" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
    <path d="M12 17.5V22" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
  </BaseIcon>
);

export const WheelIcon: React.FC<IconProps> = ({ color = '#F5222D', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <path
      d="M12 2V12L19 19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12L5 19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12L22 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12L2 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12L19 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12L5 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill={color} stroke="#fff" strokeWidth="2" />
  </BaseIcon>
);

export const RandomIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="4"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.1"
    />
    <circle cx="8" cy="8" r="2" fill={color} />
    <circle cx="16" cy="16" r="2" fill={color} />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="16" cy="8" r="2" fill={color} />
    <circle cx="8" cy="16" r="2" fill={color} />
    <path d="M4 4L20 20" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
    <path d="M20 4L4 20" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
  </BaseIcon>
);

export const TicTacToeIcon: React.FC<IconProps> = ({ color = '#1890FF', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <path d="M8 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M16 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M2 8H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M2 16H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M4 4L7 7M7 4L4 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="2" />
    <path d="M17 17L20 20M20 17L17 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const SnakeIcon: React.FC<IconProps> = ({ color = '#52C41A', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M4 16C4 18.2091 5.79086 20 8 20C10.2091 20 12 18.2091 12 16V8C12 5.79086 13.7909 4 16 4C18.2091 4 20 5.79086 20 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="4" cy="16" r="2" fill={color} />
    <circle cx="20" cy="8" r="1.5" fill={color} />
    <circle cx="16" cy="12" r="1.5" fill={color} fillOpacity="0.3" />
    <circle cx="12" cy="16" r="1.5" fill={color} fillOpacity="0.3" />
    <path d="M20 8L22 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M20 8L22 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const MinesweeperIcon: React.FC<IconProps> = ({ color = '#000000', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <circle cx="12" cy="12" r="5" fill={color} fillOpacity="0.2" />
    <path
      d="M12 5V7M12 17V19M5 12H7M17 12H19"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7.05 7.05L8.46 8.46M15.54 15.54L16.95 16.95"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16.95 7.05L15.54 8.46M8.46 15.54L7.05 16.95"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M12 12L14 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <rect x="15" y="5" width="4" height="4" fill="#F5222D" rx="1" />
  </BaseIcon>
);

export const SudokuIcon: React.FC<IconProps> = ({ color = '#722ED1', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.05"
    />
    <path d="M9 3V21" stroke={color} strokeWidth="2" />
    <path d="M15 3V21" stroke={color} strokeWidth="2" />
    <path d="M3 9H21" stroke={color} strokeWidth="2" />
    <path d="M3 15H21" stroke={color} strokeWidth="2" />
    <rect x="4" y="4" width="4" height="4" fill={color} fillOpacity="0.2" />
    <rect x="16" y="16" width="4" height="4" fill={color} fillOpacity="0.2" />
    <rect x="10" y="10" width="4" height="4" fill={color} fillOpacity="0.2" />
    <rect x="16" y="4" width="4" height="4" fill={color} fillOpacity="0.1" />
    <rect x="4" y="16" width="4" height="4" fill={color} fillOpacity="0.1" />
  </BaseIcon>
);

export const ChessIcon: React.FC<IconProps> = ({ color = '#000000', ...props }) => (
  <BaseIcon color={color} {...props}>
    <path
      d="M14.5 5C14.5 6.65685 13.1569 8 11.5 8C9.84315 8 8.5 6.65685 8.5 5C8.5 3.34315 9.84315 2 11.5 2C13.1569 2 14.5 3.34315 14.5 5Z"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M15 7L17 9C18.5 10.5 18.5 13 17 14.5L16 15.5V19H7V17L9 15L7 13L9 11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    <path d="M6 22H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M7 19H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="11.5" cy="5" r="1" fill={color} />
  </BaseIcon>
);

export const CommandIcon: React.FC<IconProps> = ({ color = '#262626', ...props }) => (
  <BaseIcon color={color} {...props}>
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill={color}
      fillOpacity="0.1"
    />
    <path
      d="M6 14L10 10L6 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 16H18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="2" y="4" width="20" height="4" fill={color} fillOpacity="0.2" />
    <circle cx="4" cy="6" r="1" fill={color} />
    <circle cx="7" cy="6" r="1" fill={color} />
    <circle cx="10" cy="6" r="1" fill={color} />
  </BaseIcon>
);

export const EmojiIcon: React.FC<IconProps> = ({ color = '#FAAD14', ...props }) => (
  <BaseIcon color={color} {...props}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
    <path
      d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 9H9.01" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M15 9H15.01" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M18 5L20 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M6 5L4 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      strokeOpacity="0.2"
      strokeDasharray="4 4"
    />
  </BaseIcon>
);
