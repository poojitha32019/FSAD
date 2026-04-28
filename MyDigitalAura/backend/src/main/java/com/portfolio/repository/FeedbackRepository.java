package com.portfolio.repository;

import com.portfolio.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByProjectId(Long projectId);
    List<Feedback> findByProjectUserId(Long userId);
    List<Feedback> findByStudentId(Long studentId);
}
