package com.saas.pm.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.saas.pm.security.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())

            // Enable CORS handling in Spring Security
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // Allow browser preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Authentication endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // WebSocket handshake
                .requestMatchers("/ws/**").permitAll()

                // Everything else requires JWT
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // React/Vite frontend
        configuration.setAllowedOrigins(
            Arrays.asList("http://localhost:5173")
        );

        // HTTP methods allowed from the frontend
        configuration.setAllowedMethods(
            Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        // Headers sent by Axios/browser
        configuration.setAllowedHeaders(
            Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept"
            )
        );

        // We are using JWT in the Authorization header,
        // not cookie-based authentication.
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}