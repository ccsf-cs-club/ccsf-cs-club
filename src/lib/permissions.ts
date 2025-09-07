export enum Role {
  GUEST = 'guest',
  MEMBER = 'member', 
  OFFICER = 'officer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // Elections
  VOTE_IN_ELECTIONS = 'vote_in_elections',
  CREATE_ELECTIONS = 'create_elections',
  MANAGE_ELECTIONS = 'manage_elections',
  VIEW_ELECTION_RESULTS = 'view_election_results',
  
  // Users
  MANAGE_USERS = 'manage_users',
  ASSIGN_ROLES = 'assign_roles',
  
  // System
  SYSTEM_SETTINGS = 'system_settings',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.GUEST]: [],
  [Role.MEMBER]: [
    Permission.VOTE_IN_ELECTIONS,
    Permission.VIEW_ELECTION_RESULTS,
  ],
  [Role.OFFICER]: [
    Permission.VOTE_IN_ELECTIONS,
    Permission.VIEW_ELECTION_RESULTS,
    Permission.CREATE_ELECTIONS,
    Permission.MANAGE_ELECTIONS,
  ],
  [Role.ADMIN]: [
    Permission.VOTE_IN_ELECTIONS,
    Permission.VIEW_ELECTION_RESULTS,
    Permission.CREATE_ELECTIONS,
    Permission.MANAGE_ELECTIONS,
    Permission.MANAGE_USERS,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function requiresPermission(permission: Permission) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const user = this.getCurrentUser(); // Implementation depends on auth system
      if (!user || !hasPermission(user.role, permission)) {
        throw new Error('Insufficient permissions');
      }
      return method.apply(this, args);
    };
  };
}