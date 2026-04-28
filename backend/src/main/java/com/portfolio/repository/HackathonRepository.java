package com.portfolio.repository;

import com.portfolio.entity.Hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HackathonRepository extends JpaRepository<Hackathon, Long> {
    List<Hackathon> findByUserId(Long userId);
}
