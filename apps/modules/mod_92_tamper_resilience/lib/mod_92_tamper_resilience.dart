class TamperDetector {
  static bool checkRootOrJailbreak({
    bool testKeys = false,
    bool suBinaryPresent = false,
    bool cydiaPresent = false,
  }) {
    return testKeys || suBinaryPresent || cydiaPresent;
  }

  static bool checkDebuggerAttached({bool isAttached = false}) {
    return isAttached;
  }

  static bool isDeviceCompromised({
    bool isRooted = false,
    bool isDebugger = false,
    bool isHooked = false,
  }) {
    return isRooted || isDebugger || isHooked;
  }
}
