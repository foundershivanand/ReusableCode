import os

class IosIdentityManager:
    """Manages iOS bundle identity, App Transport Security (ATS) enforcement, and Info.plist generation."""

    @staticmethod
    def generate_bundle_id(app_slug: str, org_domain: str = "com.factory") -> str:
        clean_slug = "".join(c for c in app_slug.lower() if c.isalnum() or c == "-")
        return f"{org_domain}.{clean_slug}"

    @staticmethod
    def generate_hardened_info_plist(bundle_id: str, app_display_name: str) -> str:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>{bundle_id}</string>
    <key>CFBundleDisplayName</key>
    <string>{app_display_name}</string>
    <key>CFBundleExecutable</key>
    <string>Runner</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>

    <!-- OWASP MASVS-NETWORK: Enforce Strict App Transport Security (ATS) -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSAllowsLocalNetworking</key>
        <false/>
    </dict>

    <!-- UI Configuration -->
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
</dict>
</plist>
"""

    @staticmethod
    def generate_entitlements(bundle_id: str, team_id: str = "TEAM12345") -> str:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Hardware Keychain Sharing Entitlement -->
    <key>keychain-access-groups</key>
    <array>
        <string>{team_id}.{bundle_id}</string>
    </array>
    <!-- Associated Domains for Universal Links -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.factory.link</string>
    </array>
</dict>
</plist>
"""
