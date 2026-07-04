import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

/** Handles invite deep links: athleticsdept://join/TOKEN */
export default function JoinDeepLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <Redirect href={{ pathname: '/(auth)/invite', params: { token } }} />;
}
