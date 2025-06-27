import React, { ReactNode, FC } from 'react';
import {
  Modal as ReactNativeModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ModalProps as ReactNativeModalProps,
  AccessibilityProps,
} from 'react-native';
// import { colors } from '../../constants/colors'; // Removed direct import
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Icon from './Icon'; // Default import
import { useTheme } from '../../context/ThemeContext'; // Added useTheme hook

export interface ModalProps
  extends Partial<Omit<ReactNativeModalProps, 'children'>>,
    AccessibilityProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  hideCloseButton?: boolean;
  // accessibilityLabel for the modal itself can be passed or derived from title
}

export const Modal: FC<ModalProps> = ({
  isVisible,
  onClose,
  children,
  title,
  containerStyle,
  contentStyle: customContentStyle,
  titleStyle: customTitleStyle,
  hideCloseButton = false,
  animationType = 'slide',
  transparent = true,
  accessibilityLabel, // Explicitly get accessibilityLabel
  ...props
}) => {
  const { theme } = useTheme(); // Use theme from context

  const finalModalAccessibilityLabel =
    accessibilityLabel || title || 'Modal window';

  const styles = StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark backdrop, could be themed if needed
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg, // Ensure modal content isn't flush with screen edges
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary, // Themed background for modal content
      borderRadius: 12,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 500, // Max width for larger screens/tablets
      maxHeight: '85%',
      shadowColor: theme.black, // Themed shadow
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: title ? spacing.md : 0,
    },
    titleText: {
      ...(textStyles.h3 || {}),
      color: theme.textPrimary, // Themed title text
      flex: 1,
    },
    closeButton: {
      padding: spacing.xs, // Make it easier to tap
      marginLeft: spacing.sm,
    },
    childrenContainer: {
      // Styles for the container that wraps the children, if needed
    },
  });

  return (
    <ReactNativeModal
      visible={isVisible}
      onRequestClose={onClose}
      animationType={animationType}
      transparent={transparent}
      accessibilityLabel={finalModalAccessibilityLabel} // Label for the modal itself
      accessibilityViewIsModal // iOS: Informs VoiceOver that its content is separate from the rest of the app
      // accessibilityModal (Android) is not a direct prop, RN Modal handles this role.
      {...props}
    >
      <View style={[styles.modalBackdrop, containerStyle]}>
        {/* TouchableOpacity to close modal on backdrop press - optional, add with care for a11y */}
        {/* <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close modal" /> */}
        <View style={[styles.modalContent, customContentStyle]}>
          {(title || !hideCloseButton) && (
            <View style={styles.header}>
              {title && (
                <Text
                  style={[styles.titleText, customTitleStyle]}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
              )}
              {!hideCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <Icon name="X" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.childrenContainer}>{children}</View>
        </View>
      </View>
    </ReactNativeModal>
  );
};

export default Modal;
