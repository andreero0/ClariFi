import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  size?: 'small' | 'medium' | 'large';
  image?: string;
  children?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'medium',
  image,
  children,
}) => {
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: 14 },
    medium: { width: 40, height: 40, fontSize: 16 },
    large: { width: 48, height: 48, fontSize: 18 },
  };

  const avatarSize = sizeStyles[size];

  return (
    <View style={[styles.container, { width: avatarSize.width, height: avatarSize.height }]}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={[styles.image, { width: avatarSize.width, height: avatarSize.height }]}
        />
      ) : (
        <Text style={[styles.text, { fontSize: avatarSize.fontSize }]}>
          {children}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: 100,
  },
  text: {
    fontWeight: '600',
    color: '#6B7280',
  },
});