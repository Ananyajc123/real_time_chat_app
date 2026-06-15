package com.chatapp.service;

import com.chatapp.config.JwtUtil;
import com.chatapp.dto.*;
import com.chatapp.model.User;
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuthService implements UserDetailsService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AuthenticationManager authManager;

    private static final List<String> COLORS = List.of(
        "#4f46e5","#10b981","#f59e0b","#ef4444","#6366f1","#ec4899","#14b8a6","#f97316"
    );

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");
        if (userRepository.existsByUsername(req.getUsername()))
            throw new RuntimeException("Username already taken");

        String color = COLORS.get((int)(Math.random() * COLORS.size()));
        User user = User.builder()
                .username(req.getUsername()).email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .avatarColor(color).build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(loadUserByUsername(req.getEmail()));
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getAvatarColor(), user.getId());
    }

    public AuthResponse login(LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email, req.password));
        User user = userRepository.findByEmail(req.email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String token = jwtUtil.generateToken(loadUserByUsername(req.email));
        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getAvatarColor(), user.getId());
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>());
    }
}
