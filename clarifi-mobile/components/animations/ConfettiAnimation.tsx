import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface ConfettiAnimationProps {
  isVisible: boolean;
  duration?: number;
  pieceCount?: number;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isVisible,
  duration = 3000,
  pieceCount = 25,
}) => {
  const confettiPieces = useRef<ConfettiPiece[]>([]).current;
  
  const colors = ['#2B5CE6', '#00C896', '#6B5DD3', '#F6AD55', '#E53E3E'];

  // Initialize confetti pieces
  useEffect(() => {
    if (confettiPieces.length === 0) {
      for (let i = 0; i < pieceCount; i++) {
        confettiPieces.push({
          id: i,
          translateX: new Animated.Value(Math.random() * width),
          translateY: new Animated.Value(-50),
          rotate: new Animated.Value(0),
          scale: new Animated.Value(0.5 + Math.random() * 0.5),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isVisible && confettiPieces.length > 0) {
      const animations = confettiPieces.map((piece, index) => {
        // Reset positions
        piece.translateX.setValue(Math.random() * width);
        piece.translateY.setValue(-50);
        piece.rotate.setValue(0);

        return Animated.parallel([
          // Fall down
          Animated.timing(piece.translateY, {
            toValue: height + 100,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
          // Slight horizontal drift
          Animated.timing(piece.translateX, {
            toValue: piece.translateX._value + (Math.random() - 0.5) * 100,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
          // Rotation
          Animated.timing(piece.rotate, {
            toValue: 360 * (2 + Math.random() * 3),
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]);
      });

      // Start animations with staggered delays
      animations.forEach((animation, index) => {
        setTimeout(() => animation.start(), index * 50);
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.translateX },
                { translateY: piece.translateY },
                { 
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
                { scale: piece.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ConfettiAnimation;