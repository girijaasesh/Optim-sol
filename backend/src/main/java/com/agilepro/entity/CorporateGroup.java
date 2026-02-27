package com.agilepro.entity;

import com.agilepro.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "corporate_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CorporateGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    private String contactName;
    private String contactEmail;
    private String contactPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    private int groupSize;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus invoiceStatus = PaymentStatus.PENDING;

    private String invoiceRef;

    @Column(columnDefinition = "TEXT")
    private String customContent;

    private String lmsGroupId;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
