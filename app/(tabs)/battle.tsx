import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function BattleScreen() {
    return (
        <View style={styles.container}>
            <FontAwesome name="bolt" size={60} color="rgba(212, 175, 55, 0.2)" />
            <Text style={styles.title}>Battle Matchup</Text>
            <Text style={styles.subtitle}>Coming soon: 6x6 Heatmap Matrix and Danger Alerts.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: 10,
    },
});
