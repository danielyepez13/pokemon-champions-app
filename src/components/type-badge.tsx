import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTypeColor } from '../utils/colors';

interface TypeBadgeProps {
  type: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const color = getTypeColor(type);

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{type}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginRight: 4,
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
