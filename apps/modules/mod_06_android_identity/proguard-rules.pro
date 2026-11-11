# Code Shrinking & Obfuscation Rules for Product Factory
-repackageclasses 'obfuscated'
-allowaccessmodification
-keeppackagenames

# Keep data models serialized to/from JSON
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Preserve Native Methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Strip debug log calls in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
