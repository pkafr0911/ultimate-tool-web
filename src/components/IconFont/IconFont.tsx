import React from 'react';

type Props = {
  name: string;
  style?: object;
};

/**
 * Icon Font
 * https://www.iconfont.cn/help/detail?helptype=code
 */
const IconFont: React.FC<Props> = ({ name, style }) => (
  <svg className="icon" aria-hidden="true" style={style}>
    <use xlinkHref={`#${name}`} />
  </svg>
);

export default IconFont;
