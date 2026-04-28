package com.portfolio.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String technologies;
    private String role;
    private String priority;
    private String status;
    private Integer progress;
    private String deadline;
    private String demo;
    private String githubLink;
    private String subject;
    private String screenshotPath;
    private String projectFilePath;
    private String grade;

    @Column(length = 2000)
    private String milestones;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "not-started";
        if (priority == null) priority = "medium";
        if (progress == null) progress = 0;
    }

    public Project() {}

    private Project(Builder b) {
        this.user = b.user; this.title = b.title; this.description = b.description;
        this.technologies = b.technologies; this.role = b.role; this.priority = b.priority;
        this.status = b.status; this.progress = b.progress; this.deadline = b.deadline;
        this.demo = b.demo; this.githubLink = b.githubLink; this.subject = b.subject;
        this.grade = b.grade; this.milestones = b.milestones;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user; private String title, description, technologies, role, priority;
        private String status, deadline, demo, githubLink, subject, grade, milestones;
        private Integer progress;
        public Builder user(User v) { this.user = v; return this; }
        public Builder title(String v) { this.title = v; return this; }
        public Builder description(String v) { this.description = v; return this; }
        public Builder technologies(String v) { this.technologies = v; return this; }
        public Builder role(String v) { this.role = v; return this; }
        public Builder priority(String v) { this.priority = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder progress(Integer v) { this.progress = v; return this; }
        public Builder deadline(String v) { this.deadline = v; return this; }
        public Builder demo(String v) { this.demo = v; return this; }
        public Builder githubLink(String v) { this.githubLink = v; return this; }
        public Builder subject(String v) { this.subject = v; return this; }
        public Builder grade(String v) { this.grade = v; return this; }
        public Builder milestones(String v) { this.milestones = v; return this; }
        public Project build() { return new Project(this); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTechnologies() { return technologies; }
    public void setTechnologies(String technologies) { this.technologies = technologies; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public String getDemo() { return demo; }
    public void setDemo(String demo) { this.demo = demo; }
    public String getGithubLink() { return githubLink; }
    public void setGithubLink(String githubLink) { this.githubLink = githubLink; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getScreenshotPath() { return screenshotPath; }
    public void setScreenshotPath(String screenshotPath) { this.screenshotPath = screenshotPath; }
    public String getProjectFilePath() { return projectFilePath; }
    public void setProjectFilePath(String projectFilePath) { this.projectFilePath = projectFilePath; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getMilestones() { return milestones; }
    public void setMilestones(String milestones) { this.milestones = milestones; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
