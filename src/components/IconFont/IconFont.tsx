import React, { CSSProperties } from 'react';

type Props = {
  name: string;
  styles?: CSSProperties;
};

/**
 * Icon Font
 * https://www.iconfont.cn/help/detail?helptype=code
 */
const IconFont: React.FC<Props> = ({ name, styles }) => (
  <svg className="icon" aria-hidden="true" style={styles}>
    <use xlinkHref={`#${name}`} />
  </svg>
);

export default IconFont;
