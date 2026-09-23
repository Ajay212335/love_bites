import React from 'react';
import { Image, ImageStyle, StyleProp, View, StyleSheet, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  rounded?: boolean;
  backgroundColor?: string;
}

export function Logo({
  size = 48,
  style,
  containerStyle,
  rounded = false,
  backgroundColor = '#000000',
}: LogoProps) {
  return (
    <View
      style={[
        styles.container,
        rounded && {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor,
        },
        containerStyle,
      ]}
    >
      <Image
        source={require('../../../assets/logo.png')}
        style={[
          {
            width: size,
            height: size,
            resizeMode: 'contain',
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
