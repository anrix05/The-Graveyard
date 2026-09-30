'use client';

import React from 'react';
import Button, { ButtonProps } from './Button';

export interface CyberButtonProps extends ButtonProps {
  glow?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({ glow, ...props }) => {
  return <Button {...props} />;
};

export default CyberButton;