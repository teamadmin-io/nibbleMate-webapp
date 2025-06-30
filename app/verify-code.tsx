import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import GlobalStyles from '../assets/styles/GlobalStyles';
import Button from './components/Button';
import { useVerifyEmail } from './utils/features/auth/hooks';

export default function VerifyCodeScreen(): JSX.Element {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const { verifyEmail, loading } = useVerifyEmail();

  const handleVerifyEmail = async () => {
    await verifyEmail(code, email);
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Verify Email</Text>
        <TextInput
          value={email}
          style={GlobalStyles.input}
          placeholder="Your Email"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          value={code}
          style={GlobalStyles.input}
          placeholder="Verification Code"
          onChangeText={setCode}
          editable={!loading}
        />
        <Button
          title={loading ? 'Verifying...' : 'Verify Email'}
          variant="primary"
          onPress={handleVerifyEmail}
          isLoading={loading}
          disabled={loading || !code || !email}
        />
      </View>
    </View>
  );
}