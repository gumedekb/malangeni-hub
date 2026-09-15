package co.za.malangeniblog.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private FirebaseAuthenticationFilter firebaseAuthenticationFilter;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Cloud Run's startup/liveness probes call these unauthenticated, so
                        // they have to stay open. Everything else under /actuator does not:
                        // Spring only exposes health+info over HTTP by default, but this stops
                        // that default being the only thing standing between an internet-facing
                        // URL and whatever a future `exposure.include` adds.
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        // more specific than the "/api/shops/**" GET permitAll below, so it must come first
                        .requestMatchers(HttpMethod.GET, "/api/shops/mine", "/api/shops/review").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/mine", "/api/events/review").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/services/mine", "/api/services/review").authenticated()
                        .requestMatchers(HttpMethod.GET,
                                "/api/attractions/**",
                                "/api/categories/**",
                                "/api/news/**",
                                "/api/services/**",
                                "/api/projects/**",
                                "/api/posts/**",
                                "/api/groups/**",
                                "/api/events/**",
                                "/api/shops/**",
                                "/api/library",
                                "/api/sponsors/active"
                        ).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) ->
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")))
                .addFilterBefore(firebaseAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
