/// <reference types="nativewind/types" />
import "react-native";

// RN 0.86 no longer receives the v4 augmentation transitively in this
// workspace layout; keep NativeWind's public className contract explicit.
declare module "react-native" {
  interface ViewProps { className?: string; }
  interface TextProps { className?: string; }
  interface TextInputProps { className?: string; }
  interface PressableProps { className?: string; }
  interface ScrollViewProps { className?: string; contentContainerClassName?: string; }
}

declare module "react-native-view-shot" {
  interface ViewShotProperties { className?: string; }
}

