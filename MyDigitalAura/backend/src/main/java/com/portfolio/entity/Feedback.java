package com.portfolio.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = true)
    private User student;

    private String section;

    @Column(length = 2000)
    private String message;

    private Integer rating;
    private String grade;

    @Column(length = 1000)
    private String strengths;

    @Column(length = 1000)
    private String improve;

    @Column(length = 1000)
    private String studentReply;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Feedback() {}

    private Feedback(Builder b) {
        this.project = b.project; this.admin = b.admin; this.student = b.student;
        this.section = b.section; this.message = b.message;
        this.rating = b.rating; this.grade = b.grade; this.strengths = b.strengths;
        this.improve = b.improve;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Project project; private User admin; private User student;
        private String message, grade, strengths, improve, section;
        private Integer rating;
        public Builder project(Project v) { this.project = v; return this; }
        public Builder admin(User v) { this.admin = v; return this; }
        public Builder student(User v) { this.student = v; return this; }
        public Builder section(String v) { this.section = v; return this; }
        public Builder message(String v) { this.message = v; return this; }
        public Builder rating(Integer v) { this.rating = v; return this; }
        public Builder grade(String v) { this.grade = v; return this; }
        public Builder strengths(String v) { this.strengths = v; return this; }
        public Builder improve(String v) { this.improve = v; return this; }
        public Feedback build() { return new Feedback(this); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public User getAdmin() { return admin; }
    public void setAdmin(User admin) { this.admin = admin; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getImprove() { return improve; }
    public void setImprove(String improve) { this.improve = improve; }
    public String getStudentReply() { return studentReply; }
    public void setStudentReply(String studentReply) { this.studentReply = studentReply; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
