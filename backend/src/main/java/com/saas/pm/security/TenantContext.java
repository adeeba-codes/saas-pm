package com.saas.pm.security;

import java.util.UUID;

// This holds the CURRENT request's organizationId/userId/role in a
// thread-local variable, set once by the JWT filter, and read
// anywhere later in the request (controllers, services, repositories)
// without having to pass it through every method signature.
//
// This is the single source of truth for "which tenant is this
// request allowed to touch" — every data-access method should
// consult this before returning or modifying anything.
public class TenantContext {

    private static final ThreadLocal<UUID> currentOrgId = new ThreadLocal<>();
    private static final ThreadLocal<UUID> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<String> currentRole = new ThreadLocal<>();

    public static void set(UUID orgId, UUID userId, String role) {
        currentOrgId.set(orgId);
        currentUserId.set(userId);
        currentRole.set(role);
    }

    public static UUID getOrgId() { return currentOrgId.get(); }
    public static UUID getUserId() { return currentUserId.get(); }
    public static String getRole() { return currentRole.get(); }

    // IMPORTANT: must be called at the end of every request
    // (in the filter's finally block) to prevent thread-local leaks
    // between requests, since servlet containers reuse threads.
    public static void clear() {
        currentOrgId.remove();
        currentUserId.remove();
        currentRole.remove();
    }
}
