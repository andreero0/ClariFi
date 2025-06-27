import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Building2, Landmark, CreditCard } from 'lucide-react-native';

interface BankLogoProps {
  bankId: string;
  size?: number;
  color?: string;
}

const BankLogo: React.FC<BankLogoProps> = ({ bankId, size = 40, color = '#FFFFFF' }) => {
  const logoSize = size * 0.6; // Icon should be 60% of container size
  
  const getBankLogo = () => {
    switch (bankId) {
      case 'td':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#00B04F' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.3, color }]}>TD</Text>
          </View>
        );
      case 'rbc':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#005DAA' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.25, color }]}>RBC</Text>
          </View>
        );
      case 'bmo':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#0079C1' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.25, color }]}>BMO</Text>
          </View>
        );
      case 'scotia':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#ED1C24' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.2, color }]}>SCOTIA</Text>
          </View>
        );
      case 'cibc':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#AA172B' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.25, color }]}>CIBC</Text>
          </View>
        );
      case 'national-bank':
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#EF3E42' }]}>
            <Text style={[styles.logoText, { fontSize: size * 0.18, color }]}>NATIONAL</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.logoContainer, { width: size, height: size * 0.6, backgroundColor: '#6B7280' }]}>
            <Building2 size={logoSize} color={color} />
          </View>
        );
    }
  };

  return getBankLogo();
};

const styles = StyleSheet.create({
  logoContainer: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  logoText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default BankLogo;