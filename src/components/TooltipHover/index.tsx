import React, { useState, ReactNode, useRef } from 'react';
import styles from './index.module.scss';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}

const TooltipHover: React.FC<TooltipProps> = ({ isVisible, setIsVisible, content, children, position = 'top' }) => {
  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className={`${styles.tooltip} ${styles[position]}`}>{content}</div>}
    </div>
  );
};

export default TooltipHover;
