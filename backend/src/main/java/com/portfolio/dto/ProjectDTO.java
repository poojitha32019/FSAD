package com.portfolio.dto;

import java.time.LocalDateTime;

public class ProjectDTO {
    private Long id, userId;
    private String studentName, title, description, technologies, role, priority;
    private String status, deadline, demo, githubLink, subject, grade, milestones;
    private String screenshotPath, projectFilePath;
    private Integer progress;
    private LocalDateTime createdAt;

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
    public String getTechnologies() { return technologies; } public void setTechnologies(String technologies) { this.technologies = technologies; }
    public String getRole() { return role; } public void setRole(String role) { this.role = role; }
    public String getPriority() { return priority; } public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Integer getProgress() { return progress; } public void setProgress(Integer progress) { this.progress = progress; }
    public String getDeadline() { return deadline; } public void setDeadline(String deadline) { this.deadline = deadline; }
    public String getDemo() { return demo; } public void setDemo(String demo) { this.demo = demo; }
    public String getGithubLink() { return githubLink; } public void setGithubLink(String githubLink) { this.githubLink = githubLink; }
    public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
    public String getGrade() { return grade; } public void setGrade(String grade) { this.grade = grade; }
    public String getMilestones() { return milestones; } public void setMilestones(String milestones) { this.milestones = milestones; }
    public String getScreenshotPath() { return screenshotPath; } public void setScreenshotPath(String screenshotPath) { this.screenshotPath = screenshotPath; }
    public String getProjectFilePath() { return projectFilePath; } public void setProjectFilePath(String projectFilePath) { this.projectFilePath = projectFilePath; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
