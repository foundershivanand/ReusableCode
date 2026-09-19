import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySettingsRepository,
  SettingsService
} from "../server/index.js";

describe("Module 05 — Settings, Preferences & Customization", () => {
  let repository: InMemorySettingsRepository;
  let service: SettingsService;

  beforeEach(() => {
    repository = new InMemorySettingsRepository();
    service = new SettingsService(repository);
  });

  describe("1. Default Initialization & Validation", () => {
    it("initializes a new user with standard v3 settings", async () => {
      const settings = await service.getUserSettings("user_100");
      expect(settings.schemaVersion).toBe(3);
      expect(settings.profile.name).toBe("User");
      expect(settings.appearance.theme).toBe("system");
      expect(settings.privacy.functionalConsent).toBe(true);
      expect(settings.privacy.analyticsConsent).toBe(false);
    });

    it("updates profile fields cleanly", async () => {
      await service.getUserSettings("user_100");
      const updated = await service.updateUserSettings("user_100", {
        profile: {
          name: "Alice Smith",
          bio: "Software Architect",
          avatarUrl: "https://example.com/alice.png"
        }
      });

      expect(updated.profile.name).toBe("Alice Smith");
      expect(updated.profile.bio).toBe("Software Architect");
      expect(updated.appearance.theme).toBe("system"); // preserved
    });
  });

  describe("2. Versioning & Backward-Compatible Migrations", () => {
    it("safely migrates v1 legacy settings to v3", async () => {
      // Seed v1 settings in raw store
      await repository.saveRawSettings("user_legacy_v1", 1, {
        name: "Old User",
        theme: "dark",
        lang: "es"
      });

      const migrated = await service.getUserSettings("user_legacy_v1");
      expect(migrated.schemaVersion).toBe(3);
      expect(migrated.profile.name).toBe("Old User");
      expect(migrated.appearance.theme).toBe("dark");
      expect(migrated.language.locale).toBe("es");
      expect(migrated.privacy.functionalConsent).toBe(true);
    });

    it("recovers from corrupted preferences without crashing", async () => {
      // Seed corrupted data
      await repository.saveRawSettings("user_corrupt", 2, {
        appearance: { theme: "NOT_A_THEME", accentColor: "invalid-hex" }
      });

      const recovered = await service.getUserSettings("user_corrupt");
      expect(recovered.schemaVersion).toBe(3);
      expect(recovered.appearance.theme).toBe("system"); // fell back safely
      expect(recovered.profile.name).toBe("User");
    });
  });

  describe("3. Preference Precedence Resolution", () => {
    it("resolves hierarchy: System -> Org -> User -> Session Override", async () => {
      // 1. Set Org default theme to dark
      await repository.saveOrganizationSettings({
        schemaVersion: 2,
        organizationId: "org_acme",
        defaultTheme: "dark",
        enforceMfa: false,
        allowedEmailDomains: [],
        defaultLocale: "fr",
        updatedAt: new Date()
      });

      // User has no custom theme yet (system)
      const res1 = await service.resolvePreferences("user_new", "org_acme");
      // Since user settings defaulted to 'system', let's check
      expect(res1.locale).toBe("en"); // user's default locale is en

      // Now set user explicit theme
      await service.updateUserSettings("user_new", {
        appearance: {
          theme: "light",
          accentColor: "#ff0000",
          fontSize: "large",
          reducedMotion: true
        }
      });

      const res2 = await service.resolvePreferences("user_new", "org_acme");
      expect(res2.theme).toBe("light"); // user overrides org

      // Session override (e.g. temporary dark preview)
      const res3 = await service.resolvePreferences("user_new", "org_acme", {
        theme: "dark"
      });
      expect(res3.theme).toBe("dark"); // session override takes highest precedence
    });
  });

  describe("4. Privacy Preferences & Data Portability", () => {
    it("manages granular privacy consent separately", async () => {
      await service.getUserSettings("user_privacy");
      const updated = await service.updateUserSettings("user_privacy", {
        privacy: {
          functionalConsent: true,
          analyticsConsent: true,
          marketingConsent: false,
          personalizationConsent: true
        }
      });

      expect(updated.privacy.analyticsConsent).toBe(true);
      expect(updated.privacy.marketingConsent).toBe(false);
    });

    it("exports and imports settings safely with version checks", async () => {
      await service.updateUserSettings("user_export", {
        profile: { name: "Export User", bio: "Testing export" }
      });

      const exported = await service.exportSettings("user_export");
      expect(exported.schemaVersion).toBe(3);
      expect(exported.settings.profile.name).toBe("Export User");

      // Import into another user
      const imported = await service.importSettings("user_import", exported);
      expect(imported.profile.name).toBe("Export User");
      expect(imported.userId).toBe("user_import");
    });
  });
});
