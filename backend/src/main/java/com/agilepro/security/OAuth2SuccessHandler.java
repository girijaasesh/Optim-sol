package com.agilepro.security;

import com.agilepro.entity.User;
import com.agilepro.enums.AuthProvider;
import com.agilepro.enums.Role;
import com.agilepro.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication auth) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) auth.getPrincipal();
        String email  = oAuth2User.getAttribute("email");
        String name   = oAuth2User.getAttribute("name");
        String sub    = oAuth2User.getAttribute("sub");
        String avatar = oAuth2User.getAttribute("picture");

        User user = userRepository.findByEmail(email).orElseGet(() ->
            userRepository.save(User.builder()
                .email(email).fullName(name)
                .provider(AuthProvider.GOOGLE).providerId(sub)
                .role(Role.USER).emailVerified(true).avatarUrl(avatar)
                .build()));

        if (user.getProvider() == AuthProvider.LOCAL && sub != null) {
            user.setProvider(AuthProvider.GOOGLE);
            user.setProviderId(sub);
            userRepository.save(user);
        }

        String access  = jwtService.generateToken(user);
        String refresh = jwtService.generateRefreshToken(user);

        String redirect = frontendUrl + "/auth/callback"
            + "#access_token="  + URLEncoder.encode(access,  StandardCharsets.UTF_8)
            + "&refresh_token=" + URLEncoder.encode(refresh, StandardCharsets.UTF_8)
            + "&provider=google";
        response.sendRedirect(redirect);
    }
}
