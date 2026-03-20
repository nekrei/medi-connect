--ABID--

create table districts (
   districtid   serial primary key,
   districtname varchar(100) unique not null
);

create table thanas (
   thanaid    serial primary key,
   thananame  varchar(100) not null,
   districtid int not null,
   postalcode varchar(10),
   foreign key ( districtid )
      references districts ( districtid )
);

create table locations (
   locationid    serial primary key,
   latitude      decimal(10,9),
   longitude     decimal(10,9),
   propertyname  varchar(100),
   holdingnumber varchar(50),
   road          varchar(50),
   thanaid       int not null,
   foreign key ( thanaid )
      references thanas ( thanaid )
);

create table users (
   userid      serial primary key,
   username    varchar(50) unique not null,
   firstname   varchar(50) not null,
   lastname    varchar(50),
   email       varchar(100),
   dateofbirth date not null,
   sex         char(1) check ( sex in ( 'M',
                                'F',
                                'O' ) ),
   bloodtype   varchar(3) check ( bloodtype in ( 'A+',
                                               'A-',
                                               'B+',
                                               'B-',
                                               'AB+',
                                               'AB-',
                                               'O+',
                                               'O-' ) ),
   password    varchar(255) not null,
   role        varchar(20) check ( role in ( 'Admin',
                                      'User',
                                      'Doctor' ) ) not null,
   locationid  int,
   foreign key ( locationid )
      references locations ( locationid )
);

--- phone number extra table --
create table phonenumbers (
   phonenumberid serial primary key,
   userid        int not null,
   phonenumber   varchar(15) not null,
   foreign key ( userid )
      references users ( userid )
);

--drop table doctors;
create table doctors (
   doctorid           serial primary key,
   designation        varchar(100),
   registrationnumber varchar(50) unique not null,
   startpracticedate  date,
   registrationexpiry date,
   approvalstatus     varchar(20) check ( approvalstatus in ( 'Pending',
                                                          'Approved',
                                                          'Rejected' ) ) not null default 'Pending',
   reviewedby         int,
   reviewedat         timestamp,
   causeofrejection   varchar(250),
   foreign key ( doctorid )
      references users ( userid ),
   foreign key ( reviewedby )
      references users ( userid )
);

create table rejecteddoctors (
   rejecteddoctorid   int not null,
   registrationnumber varchar(50) not null,
   registrationexpiry date,
   reviewedby         int,
   reviewedat         timestamp,
   causeofrejection   varchar(250),
   entryid            serial primary key,
   foreign key ( rejecteddoctorid )
      references users ( userid ),
   foreign key ( reviewedby )
      references users ( userid )
);

--- Specialization table ---
create table specializations (
   specializationid   serial primary key,
   specializationname varchar(100) unique not null
);

--Junction table 
--drop table doctorspecializations;
create table doctorspecializations (
   doctorspecializationid serial primary key,
   doctorid               int,
   specializationid       int,
   unique ( doctorid,
            specializationid ),
   foreign key ( doctorid )
      references doctors ( doctorid )
         on delete cascade,
   foreign key ( specializationid )
      references specializations ( specializationid )
         on delete cascade
);


create table hospitals (
   hospitalid   serial primary key,
   locationid   int not null,
   hospitalname varchar(100) not null,
   hotline      varchar(15),
   website      varchar(100),
   foreign key ( locationid )
      references locations ( locationid )
);

--junction doctor hosp
--drop table chambers;
create table chambers (
   chamberid          serial primary key,
   doctorid           int not null,
   hospitalid         int not null,
   unique ( doctorid,
            hospitalid ),
   checkupprice       decimal(10,2),
   appointmentcontact varchar(15),
   foreign key ( doctorid )
      references doctors ( doctorid )
         on delete cascade,
   foreign key ( hospitalid )
      references hospitals ( hospitalid )
);

--drop table reviews;
create table reviews (
   reviewid   serial primary key,
   userid     int not null,
   doctorid   int not null,
   rating     int check ( rating between 1 and 5 ) not null,
   comment    varchar(255),
   reviewdate date default current_date,
   foreign key ( userid )
      references users ( userid ),
   foreign key ( doctorid )
      references doctors ( doctorid )
         on delete cascade
);

-- LABIB --

create table medicine (
   medicineid   serial primary key,
   medicinename varchar(100) not null,
   manufacturer varchar(100),
   price        decimal(10,2) not null,
   details      varchar(255)
);

create table tests (
   testid       serial primary key,
   testname     varchar(100) not null,
   testcategory varchar(100),
   sampletype   varchar(50),
   description  varchar(255)
);

create table diagnostic_center (
   centerid      serial primary key,
   centername    varchar(100) not null,
   locationid    int,
   contactnumber varchar(15),
   openingtime   time,
   closingtime   time,
   email         varchar(100),
   foreign key ( locationid )
      references locations ( locationid )
);

create table center_available_tests (
   center_available_testsid serial primary key,
   centerid                 int,
   testid                   int,
   price                    decimal(10,2) not null,
   unique ( centerid,
            testid ),
   foreign key ( centerid )
      references diagnostic_center ( centerid ),
   foreign key ( testid )
      references tests ( testid )
);

create table test_report (
   reportid   int primary key,
   testid     int,
   centerid   int,
   patientid  int,
   testdate   date,
   reportlink varchar(255),
   result     varchar(255),
   foreign key ( testid )
      references tests ( testid ),
   foreign key ( patientid )
      references users ( userid ),
   foreign key ( centerid )
      references diagnostic_center ( centerid )
);

--drop table prescription;
create table prescription (
   prescriptionid  int,
   patientid       int,
   doctorid        int,
   appointmentdate date,
   notes           varchar(255),
   primary key ( prescriptionid ),
   foreign key ( patientid )
      references users ( userid ),
   foreign key ( doctorid )
      references doctors ( doctorid )
);


-- drop table if exists Prescribed_medicine;
--drop TABLE Prescribed_medicine;
create table prescribed_medicine (
   prescribed_medicineid serial primary key,
   prescriptionid        int,
   medicineid            int,
   dosage                varchar(50),
   frequency             varchar(50),
   duration              varchar(50),
   remarks               varchar(255),
   unique ( prescriptionid,
            medicineid ),
   foreign key ( medicineid )
      references medcine ( medicineid ),
   foreign key ( prescriptionid )
      references prescription ( prescriptionid )
);


--drop TABLE prescribed_test;
create table prescribed_test (
   prescibed_testid serial primary key,
   testid           int,
   prescriptionid   int,
   unique ( testid,
            prescriptionid ),
   foreign key ( testid )
      references tests ( testid ),
   foreign key ( prescriptionid )
      references prescription ( prescriptionid )
);

-- chamber schedule
-- 0 = Sunday, 1 = Monday, ... 6 = Saturday
create table if not exists chamberschedules (
   scheduleid serial primary key,
   chamberid  int not null
      references chambers ( chamberid )
         on delete cascade,
   weekday    smallint not null check ( weekday between 0 and 6 ),
   starttime  time not null,
   endtime    time not null,
   isactive   boolean not null default true,
   check ( starttime < endtime ),
   unique ( chamberid,
            weekday )
);

create table appointments(
   appointmentid serial primary key,
   patientid int not null,
   scheduleid int not null,
   ESTtime timestamp,
   status varchar(25) check (status in ('Scheduled', 'Completed', 'Cancelled', 'Denied', 'Pending', 'Absent')) 
   not null default 'Pending',
   requestedat timestamp default now(),
   FOREIGN key (patientid) references users(userid) on delete cascade,
   foreign key (scheduleid) references chamberschedules(scheduleid)
);
alter table appointments
add constraint unique_appointment UNIQUE (patientid, scheduleid, ESTtime);


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