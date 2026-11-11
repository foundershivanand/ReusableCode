import 'package:flutter/material.dart';

enum DeviceScreenType { mobile, tablet, desktop }

class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  static DeviceScreenType getDeviceType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width >= 1024) return DeviceScreenType.desktop;
    if (width >= 600) return DeviceScreenType.tablet;
    return DeviceScreenType.mobile;
  }

  @override
  Widget build(BuildContext context) {
    final type = getDeviceType(context);
    if (type == DeviceScreenType.desktop && desktop != null) return desktop!;
    if (type == DeviceScreenType.tablet && tablet != null) return tablet!;
    return mobile;
  }
}
