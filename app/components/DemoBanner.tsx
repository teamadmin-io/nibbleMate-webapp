import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDemo } from '../utils/contexts/DemoProvider';

const DemoBanner: React.FC = () => {
  const { isDemoMode } = useDemo();

  if (!isDemoMode) {
    return null;
  }

  return (
    <View style={styles.demoBanner}>
      <Text style={styles.demoBannerText}>
        🎮 Demo Mode - You can create up to 4 feeders and 4 cats. Data will reset when you exit demo.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  demoBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  demoBannerText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DemoBanner; 