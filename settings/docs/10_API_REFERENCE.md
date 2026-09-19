# 10 — Settings API Reference

## 1. SettingsService Methods
- `getUserSettings(userId: string): Promise<UserSettings>`
- `updateUserSettings(userId: string, update: Partial<Omit<UserSettings, "schemaVersion" | "userId" | "updatedAt">>, reauthenticatedAt?: Date): Promise<UserSettings>`
- `resolvePreferences(userId: string, organizationId?: string, sessionOverrides?: SessionOverrides): Promise<ResolvedPreferences>`
- `exportSettings(userId: string): Promise<{ schemaVersion: number; exportedAt: Date; settings: UserSettings }>`
- `importSettings(userId: string, importedJson: any): Promise<UserSettings>`
- `migrateToV3(raw: { version: number; data: any }, userId: string): UserSettings`

## 2. Client SDK & Hooks
- `useProfile()`: `{ profile, loading, error, updateProfile }`
- `useAppearance()`: `{ appearance, effectiveTheme, effectiveAccentColor, loading, error, updateAppearance }`
- `usePrivacy()`: `{ privacy, loading, error, updatePrivacy }`
- `useSettings()`: Full settings context and methods
