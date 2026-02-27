package com.agilepro.repository;

import com.agilepro.entity.Registration;
import com.agilepro.enums.PaymentStatus;
import com.agilepro.enums.RegistrationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByUserEmail(String email);
    Optional<Registration> findByRegistrationRef(String ref);
    List<Registration> findByCourseId(Long courseId);
    long countByCourseIdAndStatus(Long courseId, RegistrationStatus status);

    @Query("SELECT r FROM Registration r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:courseId IS NULL OR r.course.id = :courseId) AND " +
           "(:search IS NULL OR LOWER(r.user.email) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "  OR LOWER(r.user.fullName) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Registration> findAllFiltered(@Param("status") RegistrationStatus status,
                                       @Param("courseId") Long courseId,
                                       @Param("search") String search,
                                       Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.amount),0) FROM Registration r WHERE r.paymentStatus = :status AND r.createdAt >= :from")
    BigDecimal sumAmountByPaymentStatusAndCreatedAtAfter(@Param("status") PaymentStatus status, @Param("from") LocalDateTime from);

    @Query("SELECT COUNT(r) FROM Registration r WHERE r.paymentStatus = :status AND r.createdAt >= :from")
    long countByPaymentStatusAndCreatedAtAfter(@Param("status") PaymentStatus status, @Param("from") LocalDateTime from);

    @Query("SELECT FUNCTION('TO_CHAR', r.createdAt, 'YYYY-MM') as month, COUNT(r), COALESCE(SUM(r.amount),0) " +
           "FROM Registration r WHERE r.paymentStatus = 'PAID' AND r.createdAt >= :from " +
           "GROUP BY FUNCTION('TO_CHAR', r.createdAt, 'YYYY-MM') ORDER BY 1")
    List<Object[]> monthlyRevenue(@Param("from") LocalDateTime from);

    boolean existsByStripePaymentIntentId(String intentId);
}
