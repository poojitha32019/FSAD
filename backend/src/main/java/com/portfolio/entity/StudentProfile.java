package com.portfolio.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String gender;
    private String dob;
    private String identification;
    private String languages;
    private String contact;
    private String linkedin;
    private String github;

    @Column(length = 1000)
    private String summary;

    private String photoPath;
    private String resumePath;
    private String educationLevel;
    private String postGradType;
    private String postGradSpecialization;
    private String postGradInstitution;
    private String postGradCgpa;
    private String gradType;
    private String gradSpecialization;
    private String gradInstitution;
    private String gradCgpa;
    private String preUniType;
    private String preUniInstitution;
    private String preUniMarks;
    private String secondaryBoard;
    private String secondaryInstitution;
    private String secondaryMarks;
    private String department;
    private String year;
    private Double gpa;
    private String studentStatus;
    private String lastActive;

    public StudentProfile() {}

    private StudentProfile(Builder b) { this.user = b.user; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        public Builder user(User v) { this.user = v; return this; }
        public StudentProfile build() { return new StudentProfile(this); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getIdentification() { return identification; }
    public void setIdentification(String identification) { this.identification = identification; }
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
    public String getGithub() { return github; }
    public void setGithub(String github) { this.github = github; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }
    public String getResumePath() { return resumePath; }
    public void setResumePath(String resumePath) { this.resumePath = resumePath; }
    public String getEducationLevel() { return educationLevel; }
    public void setEducationLevel(String educationLevel) { this.educationLevel = educationLevel; }
    public String getPostGradType() { return postGradType; }
    public void setPostGradType(String postGradType) { this.postGradType = postGradType; }
    public String getPostGradSpecialization() { return postGradSpecialization; }
    public void setPostGradSpecialization(String postGradSpecialization) { this.postGradSpecialization = postGradSpecialization; }
    public String getPostGradInstitution() { return postGradInstitution; }
    public void setPostGradInstitution(String postGradInstitution) { this.postGradInstitution = postGradInstitution; }
    public String getPostGradCgpa() { return postGradCgpa; }
    public void setPostGradCgpa(String postGradCgpa) { this.postGradCgpa = postGradCgpa; }
    public String getGradType() { return gradType; }
    public void setGradType(String gradType) { this.gradType = gradType; }
    public String getGradSpecialization() { return gradSpecialization; }
    public void setGradSpecialization(String gradSpecialization) { this.gradSpecialization = gradSpecialization; }
    public String getGradInstitution() { return gradInstitution; }
    public void setGradInstitution(String gradInstitution) { this.gradInstitution = gradInstitution; }
    public String getGradCgpa() { return gradCgpa; }
    public void setGradCgpa(String gradCgpa) { this.gradCgpa = gradCgpa; }
    public String getPreUniType() { return preUniType; }
    public void setPreUniType(String preUniType) { this.preUniType = preUniType; }
    public String getPreUniInstitution() { return preUniInstitution; }
    public void setPreUniInstitution(String preUniInstitution) { this.preUniInstitution = preUniInstitution; }
    public String getPreUniMarks() { return preUniMarks; }
    public void setPreUniMarks(String preUniMarks) { this.preUniMarks = preUniMarks; }
    public String getSecondaryBoard() { return secondaryBoard; }
    public void setSecondaryBoard(String secondaryBoard) { this.secondaryBoard = secondaryBoard; }
    public String getSecondaryInstitution() { return secondaryInstitution; }
    public void setSecondaryInstitution(String secondaryInstitution) { this.secondaryInstitution = secondaryInstitution; }
    public String getSecondaryMarks() { return secondaryMarks; }
    public void setSecondaryMarks(String secondaryMarks) { this.secondaryMarks = secondaryMarks; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public Double getGpa() { return gpa; }
    public void setGpa(Double gpa) { this.gpa = gpa; }
    public String getStudentStatus() { return studentStatus; }
    public void setStudentStatus(String studentStatus) { this.studentStatus = studentStatus; }
    public String getLastActive() { return lastActive; }
    public void setLastActive(String lastActive) { this.lastActive = lastActive; }
}
