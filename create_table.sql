--ABID--

CREATE TABLE Districts (
    DistrictId SERIAL PRIMARY KEY,
    DistrictName VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Thanas (
    ThanaId SERIAL PRIMARY KEY,
    ThanaName VARCHAR(100) NOT NULL,
    DistrictId INT NOT NULL,
    PostalCode VARCHAR(10),
    FOREIGN KEY (DistrictId) REFERENCES Districts(DistrictId)
);

CREATE TABLE Locations (
    LocationId SERIAL PRIMARY KEY,
    Latitude DECIMAL(10,9),
    Longitude DECIMAL(10,9),
    PropertyName VARCHAR(100),
    HoldingNumber VARCHAR(50),
    Road VARCHAR(50),
    ThanaId INT NOT NULL,
    FOREIGN KEY (ThanaId) REFERENCES Thanas(ThanaId)
);

CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50),
    Email VARCHAR(100),
    DateOfBirth DATE NOT NULL,
    Sex CHAR(1) CHECK (Sex IN ('M', 'F', 'O')),
    BloodType VARCHAR(3) CHECK (BloodType IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) CHECK (Role IN ('Admin', 'User', 'Doctor')) NOT NULL,
    LocationId INT,
    FOREIGN KEY (LocationId) REFERENCES Locations(LocationId)

);

--- phone number extra table --
CREATE TABLE PhoneNumbers (
    PhoneNumberId SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

--drop table doctors;
CREATE TABLE Doctors (
    DoctorId SERIAL PRIMARY KEY,
    Designation VARCHAR(100),
    RegistrationNumber VARCHAR(50) UNIQUE NOT NULL,
    StartPracticeDate DATE,
    RegistrationExpiry DATE,
    ApprovalStatus VARCHAR(20) CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected')) NOT NULL DEFAULT 'Pending',
    ReviewedBy INT,
    ReviewedAt TIMESTAMP,
    CauseOfRejection VARCHAR(250),
    FOREIGN KEY (DoctorId) REFERENCES Users(UserId),
    FOREIGN KEY (ReviewedBy) REFERENCES Users(UserId)
);

CREATE TABLE RejectedDoctors (
    RejectedDoctorId SERIAL PRIMARY KEY,
    Designation VARCHAR(100),
    RegistrationNumber VARCHAR(50) UNIQUE NOT NULL,
    StartPracticeDate DATE,
    RegistrationExpiry DATE,
    ReviewedBy INT,
    ReviewedAt TIMESTAMP,
    CauseOfRejection VARCHAR(250),
    FOREIGN KEY (RejectedDoctorId) REFERENCES Users(UserId),
    FOREIGN KEY (ReviewedBy) REFERENCES Users(UserId)
);

--- Specialization table ---
CREATE TABLE Specializations (
    SpecializationId SERIAL PRIMARY KEY,
    SpecializationName VARCHAR(100) UNIQUE NOT NULL
);

--Junction table 
--drop table doctorspecializations;
CREATE TABLE DoctorSpecializations (
    DoctorSpecializationID SERIAL PRIMARY KEY,
    DoctorId INT,
    SpecializationId INT,
    UNIQUE(DoctorId, SpecializationId),
    FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId),
    FOREIGN KEY (SpecializationId) REFERENCES Specializations(SpecializationId)
);


CREATE TABLE Hospitals (
    HospitalId SERIAL PRIMARY KEY,
    LocationId INT NOT NULL,
    HospitalName VARCHAR(100) NOT NULL,
    Hotline VARCHAR(15),
    Website VARCHAR(100),
    FOREIGN KEY (LocationId) REFERENCES Locations(LocationId)
);

--junction doctor hosp
--drop table chambers;
CREATE TABLE Chambers (
    ChamberId SERIAL PRIMARY KEY,
    DoctorId INT NOT NULL,
    HospitalId INT NOT NULL,
    UNIQUE(DoctorId, HospitalId),
    CheckupStartTime TIME NOT NULL,
    CheckupEndTime TIME NOT NULL,
    CheckupPrice DECIMAL(10, 2),
    AppointmentContact VARCHAR(15),
    FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId),
    FOREIGN KEY (HospitalId) REFERENCES Hospitals(HospitalId)
);

--drop table reviews;
CREATE TABLE Reviews (
    ReviewId SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    DoctorId INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 and 5) NOT NULL,
    Comment VARCHAR(255),
    ReviewDate DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (DoctorId) REFERENCES Doctors(DoctorId)
);

-- LABIB --

CREATE TABLE Medcine (
    MedicineID INT PRIMARY KEY,
    MedicineName VARCHAR(100) NOT NULL,
    Manufacturer VARCHAR(100),
    ExpiryDate DATE,
    Price DECIMAL(10, 2) NOT NULL,
    DETAILS VARCHAR(255)
);

CREATE TABLE TESTS (
    TestID INT PRIMARY KEY,
    TestName VARCHAR(100) NOT NULL,
    TestCategory VARCHAR(100),
    SampleType VARCHAR(50),
    Description VARCHAR(255)
);

CREATE TABLE Diagnostic_Center (
    CenterID INT PRIMARY KEY,
    CenterName VARCHAR(100) NOT NULL,
    LocationId INT,
    ContactNumber VARCHAR(15),
    OpeningTime TIME,
    ClosingTime TIME,
    Email VARCHAR(100),
    FOREIGN KEY (LocationId) REFERENCES Locations(LocationId)
);

CREATE TABLE Center_Available_Tests (
    center_available_testsID serial PRIMARY KEY,
    CenterID INT,
    TestID INT,
    Price DECIMAL(10, 2) NOT NULL,
    unique (CenterID,TestID),
    FOREIGN KEY (CenterID) REFERENCES Diagnostic_Center(CenterID),
    FOREIGN KEY (TestID) REFERENCES TESTS(TestID)
);

CREATE TABLE Test_Report (
    ReportID INT PRIMARY KEY,
    TestID INT,
    CenterID INT,
    PatientID INT,
    TestDate DATE,
    ReportLink VARCHAR(255),
    Result VARCHAR(255),
    FOREIGN KEY (TestID) REFERENCES TESTS(TestID),
    FOREIGN KEY (PatientID) REFERENCES Users(UserId),
    FOREIGN KEY (CenterID) REFERENCES Diagnostic_Center(CenterID)
);

--drop table prescription;
CREATE TABLE prescription (
    prescriptionID INT,
    PatientID INT,
    DoctorID INT,
    AppointmentDate DATE,
    Notes VARCHAR(255),
    PRIMARY KEY (prescriptionID),
    FOREIGN KEY (PatientID) REFERENCES users(userid),
    FOREIGN KEY (DoctorID) REFERENCES doctors(doctorid)
);


-- drop table if exists Prescribed_medicine;
--drop TABLE Prescribed_medicine;
CREATE TABLE Prescribed_medicine (
    Prescribed_medicineID serial PRIMARY KEY,
    PrescriptionID INT,
    MedicineID INT,
    Dosage VARCHAR(50),
    Frequency VARCHAR(50),
    Duration VARCHAR(50),
    unique (PrescriptionID,MedicineID),
    FOREIGN KEY (MedicineID) REFERENCES Medcine(MedicineID),
    FOREIGN KEY (PrescriptionID) REFERENCES prescription(prescriptionID)
);


--drop TABLE prescribed_test;
CREATE TABLE Prescribed_test (
    Prescibed_testID serial PRIMARY KEY,
    TestId INT, 
    PrescriptionID INT,
    unique (TestId,PrescriptionID),
    FOREIGN KEY (TestId) REFERENCES TESTS(TestID),
    ForeIGN KEY (PrescriptionID) REFERENCES prescription(prescriptionID)
);

-- ── Migration: run these if the Doctors table already exists in your DB ───────
-- The original DDL had a semicolon bug that dropped the FK and missing columns.
-- These statements bring an existing Doctors table up to date.

-- 1. Add the missing FK (skip if it already exists — check pg_constraint first)
-- ALTER TABLE Doctors ADD CONSTRAINT doctors_doctorid_fkey
--     FOREIGN KEY (DoctorId) REFERENCES Users(UserId);

-- 2. Add review audit columns
-- ALTER TABLE Doctors ADD COLUMN IF NOT EXISTS ReviewedBy INT REFERENCES Users(UserId);
-- ALTER TABLE Doctors ADD COLUMN IF NOT EXISTS ReviewedAt TIMESTAMP;

-- 3. Tighten ApprovalStatus to NOT NULL (safe only after backfilling any NULLs)
-- UPDATE Doctors SET ApprovalStatus = 'Pending' WHERE ApprovalStatus IS NULL;
-- ALTER TABLE Doctors ALTER COLUMN ApprovalStatus SET NOT NULL;