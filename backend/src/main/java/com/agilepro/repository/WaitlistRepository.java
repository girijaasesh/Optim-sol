package com.agilepro.repository;

import com.agilepro.entity.WaitlistEntry;
import com.agilepro.enums.WaitlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRepository extends JpaRepository<WaitlistEntry, Long> {
    Optional<WaitlistEntry> findByUserEmailAndCourseId(String email, Long courseId);
    List<WaitlistEntry> findByCourseIdAndStatusOrderByPosition(Long courseId, WaitlistStatus status);
    Optional<WaitlistEntry> findFirstByCourseIdAndStatusOrderByPosition(Long courseId, WaitlistStatus status);
    long countByStatus(WaitlistStatus status);
    boolean existsByUserEmailAndCourseId(String email, Long courseId);
}
