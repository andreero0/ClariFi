import React from 'react';
import { SvgProps } from 'react-native-svg';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/colors';

export interface IconProps extends SvgProps {
  name: LucideIcon; // The actual Lucide icon component
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const Icon: React.FC<IconProps> = ({
  name: IconComponent,
  size = 24,
  color = colors.textPrimary,
  strokeWidth = 2,
  ...props
}) => {
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};

export default Icon;
