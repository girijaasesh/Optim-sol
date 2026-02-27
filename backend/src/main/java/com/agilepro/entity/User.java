package com.agilepro.entity;

import com.agilepro.enums.AuthProvider;
import com.agilepro.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;           // null for OAuth-only users

    private String phone;
    private String company;
    private String jobTitle;
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;                 // USER, ADMIN, SUPER_ADMIN

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId;         // Google sub / LinkedIn urn

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    private String emailVerificationToken;
    private LocalDateTime emailVerificationExpiry;

    private String passwordResetToken;
    private LocalDateTime passwordResetExpiry;

    // MFA
    @Column(nullable = false)
    @Builder.Default
    private boolean mfaEnabled = false;

    private String mfaSecret;          // TOTP secret (encrypted at rest)

    @Column(nullable = false)
    @Builder.Default
    private boolean accountLocked = false;

    @Builder.Default
    private int failedLoginAttempts = 0;

    private LocalDateTime lockoutUntil;

    // Profile
    private String avatarUrl;
    private String gstNumber;
    private String experienceLevel;

    // Currency preference
    @Builder.Default
    private String preferredCurrency = "USD";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;
    private String lastLoginIp;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Registration> registrations;

    public boolean isAccountNonLocked() {
        if (!accountLocked) return true;
        if (lockoutUntil != null && LocalDateTime.now().isAfter(lockoutUntil)) {
            this.accountLocked = false;
            this.failedLoginAttempts = 0;
            return true;
        }
        return false;
    }
}
