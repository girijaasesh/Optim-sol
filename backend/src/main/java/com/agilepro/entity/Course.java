package com.agilepro.entity;

import com.agilepro.enums.CertificationType;
import com.agilepro.enums.CourseFormat;
import com.agilepro.enums.RegistrationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CertificationType certificationType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal earlyBirdPrice;

    private LocalDate earlyBirdDeadline;

    @Column(nullable = false)
    private int maxSeats;

    @Column(nullable = false)
    @Builder.Default
    private int durationDays = 2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CourseFormat format = CourseFormat.VIRTUAL;

    private String zoomLink;
    private String venue;
    private String materialsLink;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean soldOut = false;

    private LocalDate startDate;
    private LocalDate endDate;
    private String targetAudience;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "course_outcomes", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "outcome")
    @Builder.Default
    private List<String> learningOutcomes = new ArrayList<>();

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Registration> registrations = new ArrayList<>();

    public int getSeatsRemaining() {
        if (registrations == null) return maxSeats;
        long confirmed = registrations.stream()
            .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED).count();
        return (int)(maxSeats - confirmed);
    }

    public BigDecimal getEffectivePrice() {
        if (earlyBirdPrice != null && earlyBirdDeadline != null && !LocalDate.now().isAfter(earlyBirdDeadline))
            return earlyBirdPrice;
        return price;
    }

    public boolean isEarlyBirdActive() {
        return earlyBirdPrice != null && earlyBirdDeadline != null && !LocalDate.now().isAfter(earlyBirdDeadline);
    }
}
