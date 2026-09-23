import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setErrorMsg('');
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      console.warn('Login error:', err);
      const msg = err.message || 'Invalid login credentials.';
      setErrorMsg(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerArea}>
          <Image
            source={require('../../assets/logo-full.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>SIPS Mobile</Text>
          <Text style={styles.subtitle}>
            Sports Infrastructure Project Management
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to your account</Text>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.statusBad} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@kindersports.in"
                placeholderTextColor={colors.muted3}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.muted3}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Kinder Sports Pvt. Ltd. &copy; 2026</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy950,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 220,
    height: 60,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.muted2,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.paper1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink900,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.statusBadBg,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.statusBad,
    fontSize: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink700,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper0,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.ink900,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  submitBtn: {
    backgroundColor: colors.brandOrange,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 11,
    color: colors.muted2,
  },
});
