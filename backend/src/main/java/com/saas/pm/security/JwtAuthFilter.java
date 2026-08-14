package com.saas.pm.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                var userId = jwtUtil.getUserId(token);
                var orgId = jwtUtil.getOrganizationId(token);
                var role = jwtUtil.getRole(token);

                // This is the line that makes multi-tenancy actually work:
                // every downstream repository call will filter by this orgId.
                TenantContext.set(orgId, userId, role);

                var auth = new UsernamePasswordAuthenticationToken(
                        userId, null, List.of(() -> "ROLE_" + role));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                // Invalid/expired token — leave unauthenticated,
                // Spring Security will reject protected endpoints.
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Always clear, even if the request throws — prevents
            // one user's org context leaking into the next request
            // handled by the same thread.
            TenantContext.clear();
        }
    }
}
