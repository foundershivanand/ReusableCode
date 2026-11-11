import os
import xml.etree.ElementTree as ET

class AndroidIdentityManager:
    """Manages Android package identity, AndroidManifest.xml security hardening, and Keystore config."""

    @staticmethod
    def generate_package_name(app_slug: str, org_domain: str = "com.factory") -> str:
        clean_slug = "".join(c for c in app_slug.lower() if c.isalnum() or c == "_")
        return f"{org_domain}.{clean_slug}"

    @staticmethod
    def generate_hardened_manifest(package_name: str, app_label: str) -> str:
        return f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{package_name}">

    <!-- Hardware & Internet permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="{app_label}"
        android:allowBackup="false"
        android:fullBackupContent="false"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config"
        android:enableOnBackInvokedCallback="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
"""

    @staticmethod
    def generate_network_security_config(api_domain: str) -> str:
        return f"""<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- OWASP MASVS-NETWORK: Prohibit cleartext traffic globally -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config>
        <domain includeSubdomains="true">{api_domain}</domain>
        <pin-set expiration="2027-01-01">
            <!-- Pinned SHA-256 SPKI public key hash -->
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
"""
