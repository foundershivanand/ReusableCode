import type { CommandItem } from "../schemas/search-schemas.js";

export class CommandRegistry {
  private commands: Map<string, CommandItem> = new Map();

  registerCommand(command: CommandItem): void {
    this.commands.set(command.id, command);
  }

  registerCommands(commands: CommandItem[]): void {
    commands.forEach((c) => this.registerCommand(c));
  }

  getCommand(id: string): CommandItem | null {
    return this.commands.get(id) || null;
  }

  getAuthorizedCommands(userRoles: string[] = [], userPermissions: string[] = []): CommandItem[] {
    const rolesSet = new Set(userRoles);
    const permSet = new Set(userPermissions);

    return Array.from(this.commands.values()).filter((cmd) => {
      const requiredRoles = cmd.requiredRoles ?? [];
      if (requiredRoles.length > 0) {
        const hasRole = requiredRoles.some((r) => rolesSet.has(r));
        if (!hasRole) return false;
      }
      const requiredPermissions = cmd.requiredPermissions ?? [];
      if (requiredPermissions.length > 0) {
        const hasPerm = requiredPermissions.every((p) => permSet.has(p));
        if (!hasPerm) return false;
      }
      return true;
    });
  }
}
