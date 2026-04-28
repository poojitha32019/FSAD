@echo off
echo Setting up Portfolio Database...
echo.
echo This will create the portfolio_db database and admin user
echo Make sure MySQL is running first!
echo.
pause

echo Creating database and admin user...
mysql -u root -pSwetha123 < database.sql

if %errorlevel% == 0 (
    echo.
    echo Database setup completed successfully!
    echo Default admin login:
    echo Email: admin@techuniversity.edu
    echo Password: admin123
) else (
    echo.
    echo Database setup failed. Please check:
    echo 1. MySQL is running
    echo 2. Username/password is correct
    echo 3. MySQL is accessible from command line
)

echo.
pause