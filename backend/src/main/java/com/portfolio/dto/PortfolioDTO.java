package com.portfolio.dto;

import java.time.LocalDateTime;

public class PortfolioDTO {

    public static class FeedbackDTO {
        private Long id, projectId;
        private String projectTitle, adminName, message, grade, strengths, improve, section, studentReply;
        private Integer rating;
        private LocalDateTime createdAt;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getProjectId() { return projectId; } public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getProjectTitle() { return projectTitle; } public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }
        public String getAdminName() { return adminName; } public void setAdminName(String adminName) { this.adminName = adminName; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public Integer getRating() { return rating; } public void setRating(Integer rating) { this.rating = rating; }
        public String getGrade() { return grade; } public void setGrade(String grade) { this.grade = grade; }
        public String getStrengths() { return strengths; } public void setStrengths(String strengths) { this.strengths = strengths; }
        public String getImprove() { return improve; } public void setImprove(String improve) { this.improve = improve; }
        public String getSection() { return section; } public void setSection(String section) { this.section = section; }
        public String getStudentReply() { return studentReply; } public void setStudentReply(String studentReply) { this.studentReply = studentReply; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class StudentProfileDTO {
        private Long id, userId;
        private String firstName, lastName, email, gender, dob, identification, languages;
        private String contact, linkedin, github, summary, photoPath, resumePath, educationLevel;
        private String postGradType, postGradSpecialization, postGradInstitution, postGradCgpa;
        private String gradType, gradSpecialization, gradInstitution, gradCgpa;
        private String preUniType, preUniInstitution, preUniMarks;
        private String secondaryBoard, secondaryInstitution, secondaryMarks;
        private String department, year, studentStatus, lastActive;
        private Double gpa;
        private int projectCount;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getFirstName() { return firstName; } public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; } public void setLastName(String lastName) { this.lastName = lastName; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
        public String getDob() { return dob; } public void setDob(String dob) { this.dob = dob; }
        public String getIdentification() { return identification; } public void setIdentification(String identification) { this.identification = identification; }
        public String getLanguages() { return languages; } public void setLanguages(String languages) { this.languages = languages; }
        public String getContact() { return contact; } public void setContact(String contact) { this.contact = contact; }
        public String getLinkedin() { return linkedin; } public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
        public String getGithub() { return github; } public void setGithub(String github) { this.github = github; }
        public String getSummary() { return summary; } public void setSummary(String summary) { this.summary = summary; }
        public String getPhotoPath() { return photoPath; } public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }
        public String getResumePath() { return resumePath; } public void setResumePath(String resumePath) { this.resumePath = resumePath; }
        public String getEducationLevel() { return educationLevel; } public void setEducationLevel(String educationLevel) { this.educationLevel = educationLevel; }
        public String getPostGradType() { return postGradType; } public void setPostGradType(String postGradType) { this.postGradType = postGradType; }
        public String getPostGradSpecialization() { return postGradSpecialization; } public void setPostGradSpecialization(String v) { this.postGradSpecialization = v; }
        public String getPostGradInstitution() { return postGradInstitution; } public void setPostGradInstitution(String v) { this.postGradInstitution = v; }
        public String getPostGradCgpa() { return postGradCgpa; } public void setPostGradCgpa(String postGradCgpa) { this.postGradCgpa = postGradCgpa; }
        public String getGradType() { return gradType; } public void setGradType(String gradType) { this.gradType = gradType; }
        public String getGradSpecialization() { return gradSpecialization; } public void setGradSpecialization(String v) { this.gradSpecialization = v; }
        public String getGradInstitution() { return gradInstitution; } public void setGradInstitution(String gradInstitution) { this.gradInstitution = gradInstitution; }
        public String getGradCgpa() { return gradCgpa; } public void setGradCgpa(String gradCgpa) { this.gradCgpa = gradCgpa; }
        public String getPreUniType() { return preUniType; } public void setPreUniType(String preUniType) { this.preUniType = preUniType; }
        public String getPreUniInstitution() { return preUniInstitution; } public void setPreUniInstitution(String v) { this.preUniInstitution = v; }
        public String getPreUniMarks() { return preUniMarks; } public void setPreUniMarks(String preUniMarks) { this.preUniMarks = preUniMarks; }
        public String getSecondaryBoard() { return secondaryBoard; } public void setSecondaryBoard(String secondaryBoard) { this.secondaryBoard = secondaryBoard; }
        public String getSecondaryInstitution() { return secondaryInstitution; } public void setSecondaryInstitution(String v) { this.secondaryInstitution = v; }
        public String getSecondaryMarks() { return secondaryMarks; } public void setSecondaryMarks(String secondaryMarks) { this.secondaryMarks = secondaryMarks; }
        public String getDepartment() { return department; } public void setDepartment(String department) { this.department = department; }
        public String getYear() { return year; } public void setYear(String year) { this.year = year; }
        public Double getGpa() { return gpa; } public void setGpa(Double gpa) { this.gpa = gpa; }
        public String getStudentStatus() { return studentStatus; } public void setStudentStatus(String studentStatus) { this.studentStatus = studentStatus; }
        public String getLastActive() { return lastActive; } public void setLastActive(String lastActive) { this.lastActive = lastActive; }
        public int getProjectCount() { return projectCount; } public void setProjectCount(int projectCount) { this.projectCount = projectCount; }
    }

    public static class SkillDTO {
        private Long id;
        private String category, skills, certLink;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
        public String getSkills() { return skills; } public void setSkills(String skills) { this.skills = skills; }
        public String getCertLink() { return certLink; } public void setCertLink(String certLink) { this.certLink = certLink; }
    }

    public static class HackathonDTO {
        private Long id;
        private String name, summary, website, certificatePath;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getSummary() { return summary; } public void setSummary(String summary) { this.summary = summary; }
        public String getWebsite() { return website; } public void setWebsite(String website) { this.website = website; }
        public String getCertificatePath() { return certificatePath; } public void setCertificatePath(String certificatePath) { this.certificatePath = certificatePath; }
    }

    public static class InternshipDTO {
        private Long id;
        private String company, role, duration, work;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getCompany() { return company; } public void setCompany(String company) { this.company = company; }
        public String getRole() { return role; } public void setRole(String role) { this.role = role; }
        public String getDuration() { return duration; } public void setDuration(String duration) { this.duration = duration; }
        public String getWork() { return work; } public void setWork(String work) { this.work = work; }
    }

    public static class CertificationDTO {
        private Long id;
        private String name, issueDate, expiryDate, licenseId, link;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getIssueDate() { return issueDate; } public void setIssueDate(String issueDate) { this.issueDate = issueDate; }
        public String getExpiryDate() { return expiryDate; } public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
        public String getLicenseId() { return licenseId; } public void setLicenseId(String licenseId) { this.licenseId = licenseId; }
        public String getLink() { return link; } public void setLink(String link) { this.link = link; }
    }
}
