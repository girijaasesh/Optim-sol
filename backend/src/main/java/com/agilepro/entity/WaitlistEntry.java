package com.agilepro.entity;

import com.agilepro.enums.WaitlistStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "waitlist",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Builder.Default
    private int position = 1;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WaitlistStatus status = WaitlistStatus.WAITING;

    private LocalDateTime notifiedAt;
    private LocalDateTime expiresAt;

    @CreationTimestamp
    private LocalDateTime joinedAt;
}
