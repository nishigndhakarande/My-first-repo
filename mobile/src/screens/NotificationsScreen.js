import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { colors } from '../theme/colors';

export const NotificationsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack={true} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text>Notifications Content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  content: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }
});
