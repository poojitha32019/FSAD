package com.portfolio.repository;

import com.portfolio.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);
    List<Project> findByStatus(String status);
    long countByStatus(String status);

    @Query("SELECT p FROM Project p WHERE p.user.id = :userId AND p.status = :status")
    List<Project> findByUserIdAndStatus(Long userId, String status);
}
