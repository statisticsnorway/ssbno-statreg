/**
 * ACCESS POLICY DOCS
 *
 * All routes are PROTECTED by default.
 * Nothing is public unless you explicitly set it to false here.
 *
 * How to configure:
 *   "/users": {
 *     GET: false,  // Public (no authentication required)
 *     POST: true,  // Protected
 *   }
 *
 * Method names MUST be uppercase (GET, POST, PUT, DELETE, PATCH, etc.).
 * For example: "GET", not "get".
 *
 * Rules:
 * - If a route is NOT listed → authentication IS required.
 * - If a method under a listed route is NOT listed → authentication IS required.
 * - If you list a route with no method rules → ALL methods remain protected.
 *
 * Values:
 * - true  = authentication required
 * - false = NO authentication required (public)
 *
 * Define only the routes+methods that should be PUBLIC.
 */

// Allowed HTTP methods (extend if needed)
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// Policy type
export type AuthPolicy = {
  [route: string]: Partial<Record<HttpMethod, boolean>>
}

// AUTHPOLICY
export const authPolicy: AuthPolicy = {
  // '/': { GET: false },
  '/docs/*': { GET: false },
}

// Determines whether authentication is required for the given route and HTTP method
export function requiresAuthPolicy(routePath: string, method: HttpMethod): boolean {
  const policyForRoute = authPolicy[routePath]

  if (!policyForRoute) {
    return true
  }

  if (policyForRoute[method] === false) {
    return false
  }

  return true
}
