# Portfolio Backend - Setup Instructions

## Prerequisites
1. **Java 17** - Make sure Java 17 is installed
2. **Maven** - For building the project
3. **MySQL** - Database server running on localhost:3306

## Quick Start
1. Start MySQL server
2. Run `setup-db.bat` to create database
3. Run `run.bat` to start the application
4. Access: http://localhost:8082/swagger-ui.html

## Database Setup
1. Start MySQL server
2. Run the SQL script: `portfolio-backend/database.sql`
3. This will create the `portfolio_db` database and tables

## Configuration
The application is configured in `src/main/resources/application.properties`:
- Server: http://localhost:8082
- Database: `portfolio_db` on localhost:3306
- Username: `root`
- Password: `Swetha123`
- Email service is disabled (development mode)

## Running the Application

### Option 1: Using the batch script
```bash
cd portfolio-backend
run.bat
```

### Option 2: Using Maven directly
```bash
cd portfolio-backend
mvn spring-boot:run
```

### Option 3: Using JAR file
```bash
cd portfolio-backend
mvn clean package
java -jar target/portfolio-backend-1.0.0.jar
```

## API Documentation
Once running, access Swagger UI at: http://localhost:8082/swagger-ui.html

## Default Admin Account
- Email: admin@techuniversity.edu
- Password: admin123

## Development Notes
- Email service is disabled - OTP codes are logged to console
- Port set to 8082 to avoid conflicts
- SQL logging is reduced for cleaner output

## Testing the API
1. Start the application
2. Go to http://localhost:8082/swagger-ui.html
3. Register a new user via `/api/auth/register`
4. Login via `/api/auth/login` to get JWT token
5. Use the token for authenticated endpoints

## All Features Working
✅ User Authentication (Register/Login/OTP)
✅ JWT Security
✅ Student Profile Management
✅ Project Management
✅ File Upload (Photos, Resumes, Screenshots)
✅ Skills, Hackathons, Internships, Certifications
✅ Admin Dashboard
✅ Feedback System
✅ Email Notifications (Console mode)
✅ Swagger API Documentation
✅ CORS Configuration
✅ Database Integration