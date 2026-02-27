package com.agilepro.repository;

import com.agilepro.entity.Course;
import com.agilepro.enums.CertificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByActiveTrue();
    List<Course> findByCertificationTypeAndActiveTrue(CertificationType type);
    List<Course> findByActiveTrueAndStartDateAfter(LocalDate date);
    @Query("SELECT c FROM Course c WHERE c.active = true AND (c.startDate IS NULL OR c.startDate >= :now)")
    List<Course> findAllUpcoming(LocalDate now);
    long countByActiveTrueAndStartDateAfter(LocalDate date);
}
