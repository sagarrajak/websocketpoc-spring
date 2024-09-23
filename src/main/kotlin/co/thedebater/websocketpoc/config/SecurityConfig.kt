package co.thedebater.websocketpoc.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.Message
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.authorization.AuthorizationManager
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager
import org.springframework.security.web.DefaultSecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.filter.OncePerRequestFilter

@EnableWebSecurity
@Configuration
open class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): DefaultSecurityFilterChain? {
       http.csrf { obj: CsrfConfigurer<HttpSecurity> -> obj.disable() }
           .formLogin { obj -> obj.disable() }
           .authorizeHttpRequests { obj ->
               obj.requestMatchers("/ws/**").authenticated()
               obj.anyRequest().permitAll()
           }
           .addFilterBefore(customAuthenticationFilter(), UsernamePasswordAuthenticationFilter::class.java)
           .sessionManagement { obj -> obj.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }

        return http.build()
    }

    @Bean
    open fun messageAuthorizationManager(): AuthorizationManager<Message<*>> {
        val messages = MessageMatcherDelegatingAuthorizationManager.builder()
        messages.simpDestMatchers("/app/**").authenticated()
        messages.simpDestMatchers("/topic").authenticated()
        messages.anyMessage().permitAll()
        return messages.build()
    }

    private fun customAuthenticationFilter() = object : OncePerRequestFilter() {
        override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
            var headerNames = request.headerNames
            val username = request.getParameter("username")
            val password = request.getParameter("password")
            if (username != null && password != null) {
                if (username == "user" && password == "password") {
                    val auth = UsernamePasswordAuthenticationToken(username, null, listOf(SimpleGrantedAuthority("ROLE_USER")))
                    SecurityContextHolder.getContext().authentication = auth
                }
            }

            filterChain.doFilter(request, response)
        }
    }
}