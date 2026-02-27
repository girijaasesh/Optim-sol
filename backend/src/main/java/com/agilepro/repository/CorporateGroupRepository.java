package com.agilepro.repository;

import com.agilepro.entity.CorporateGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CorporateGroupRepository extends JpaRepository<CorporateGroup, Long> {}
