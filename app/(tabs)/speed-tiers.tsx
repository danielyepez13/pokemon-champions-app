import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SpeedTiersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speed Tiers</Text>
      <View style={styles.separator} />
      <Text style={styles.subtitle}>Próximamente...</Text>
      <Text style={styles.description}>
        Aquí se listarán las bandas de velocidad (Speed Tiers) extraídas del meta, permitiéndote
        saber exactamente los puntos de corte de velocidad de todos los Pokémon clave.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  subtitle: {
    fontSize: 18,
    color: '#d4af37',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
});
