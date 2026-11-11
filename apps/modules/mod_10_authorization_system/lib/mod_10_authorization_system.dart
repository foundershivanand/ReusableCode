library mod_10_authorization_system;

enum Role {
  guest,
  freeUser,
  proSubscriber,
  teamMember,
  teamAdmin,
  enterpriseAdmin,
  superAdmin
}

enum Permission {
  viewContent,
  createContent,
  editOwnContent,
  deleteOwnContent,
  editAnyContent,
  deleteAnyContent,
  exportData,
  accessAiFeatures,
  manageBilling,
  manageTeamUsers,
  accessAuditLogs,
  impersonateUser
}

class AuthorizationContext {
  final String userId;
  final Role role;
  final String? tenantId;
  final Set<Permission> directPermissions;

  const AuthorizationContext({
    required this.userId,
    required this.role,
    this.tenantId,
    this.directPermissions = const {},
  });
}

class AbacPolicy {
  final String name;
  final bool Function(AuthorizationContext context, Map<String, dynamic> resource) evaluator;

  const AbacPolicy({required this.name, required this.evaluator});
}

class ComprehensiveAuthorizationEngine {
  // Role Hierarchy
  static final Map<Role, Set<Permission>> _rolePermissions = {
    Role.guest: {Permission.viewContent},
    Role.freeUser: {
      Permission.viewContent,
      Permission.createContent,
      Permission.editOwnContent,
      Permission.deleteOwnContent,
    },
    Role.proSubscriber: {
      Permission.viewContent,
      Permission.createContent,
      Permission.editOwnContent,
      Permission.deleteOwnContent,
      Permission.exportData,
      Permission.accessAiFeatures,
    },
    Role.teamMember: {
      Permission.viewContent,
      Permission.createContent,
      Permission.editOwnContent,
      Permission.deleteOwnContent,
      Permission.exportData,
      Permission.accessAiFeatures,
    },
    Role.teamAdmin: {
      Permission.viewContent,
      Permission.createContent,
      Permission.editOwnContent,
      Permission.deleteOwnContent,
      Permission.editAnyContent,
      Permission.exportData,
      Permission.accessAiFeatures,
      Permission.manageBilling,
      Permission.manageTeamUsers,
    },
    Role.enterpriseAdmin: {
      Permission.viewContent,
      Permission.createContent,
      Permission.editOwnContent,
      Permission.deleteOwnContent,
      Permission.editAnyContent,
      Permission.deleteAnyContent,
      Permission.exportData,
      Permission.accessAiFeatures,
      Permission.manageBilling,
      Permission.manageTeamUsers,
      Permission.accessAuditLogs,
    },
    Role.superAdmin: Permission.values.toSet(),
  };

  static bool hasPermission({
    required AuthorizationContext context,
    required Permission permission,
  }) {
    if (context.directPermissions.contains(permission)) return true;
    final permissionsForRole = _rolePermissions[context.role] ?? {};
    return permissionsForRole.contains(permission);
  }

  static bool evaluateAbac({
    required AuthorizationContext context,
    required AbacPolicy policy,
    required Map<String, dynamic> resource,
  }) {
    // SuperAdmin bypasses ABAC
    if (context.role == Role.superAdmin) return true;
    return policy.evaluator(context, resource);
  }

  // Pre-configured ABAC Policies
  static final isResourceOwner = AbacPolicy(
    name: 'IsResourceOwner',
    evaluator: (ctx, res) => res['owner_id'] == ctx.userId,
  );

  static final isSameTenant = AbacPolicy(
    name: 'IsSameTenant',
    evaluator: (ctx, res) => ctx.tenantId != null && res['tenant_id'] == ctx.tenantId,
  );
}
