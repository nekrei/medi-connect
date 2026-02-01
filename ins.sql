INSERT INTO users (username, firstname, lastname, password, role, dateofbirth) VALUES ('admin', 'admin', 'admin', 'admin', 'Admin', '1990-01-01');
INSERT INTO users (username, firstname, lastname, password, role, dateofbirth) VALUES ('jdoe', 'John', 'Doe', 'password123', 'User', '1985-05-15');
INSERT INTO users (username, firstname, lastname, password, role, dateofbirth) VALUES ('asmith', 'Alice', 'Smith', 'alicepwd', 'User', '1992-08-22');
INSERT INTO users (username, firstname, lastname, password, role, dateofbirth) VALUES ('zmahir', 'Zarif', 'Mahir', 'zarif2020', 'User', '2005-12-30');

INSERT INTO districts (districtname) VALUES ('Dhaka');

INSERT INTO thanas (thananame, districtid, postalcode) VALUES ('Dhanmondi', 1, '1209');
INSERT INTO thanas (thananame, districtid, postalcode) VALUES ('Mirpur', 1, '1216');

ALTER table locations ALTER COLUMN propertyname DROP NOT NULL;
INSERT INTO locations (holdingnumber, road, thanaid) VALUES ('34/35', '14A', 1);

INSERT INTO users (username, firstname, lastname, password, role, dateofbirth) VALUES ('mrahman', 'Muna', 'Rahman', 'muna456', 'User', '1998-03-10');
INSERT INTO specializations (specializationname) VALUES ('Cardiology');
INSERT INTO specializations (specializationname) VALUES ('Neurology');
INSERT INTO specializations (specializationname) VALUES ('Hepatology');
INSERT INTO specializations (specializationname) VALUES ('Gastroenterology');

INSERT INTO doctors (userid, designation, registrationnumber) VALUES (
    (SELECT userid FROM users WHERE username='mrahman'),
    'MBBS', 'REG12345');

INSERT INTO doctorspecializations (doctorid, specializationid) 
SELECT d.doctorid, s.specializationid
FROM doctors d, specializations s
WHERE d.userid = (SELECT userid FROM users WHERE username='mrahman')
AND (s.specializationname = 'Hepatology' OR s.specializationname = 'Gastroenterology');

SELECT (u.firstname|| ' '||u.lastname) AS doctor_name, d.designation, s.specializationname
FROM users u JOIN doctors d ON u.userid = d.userid
join doctorspecializations ds on d.doctorid = ds.doctorid
join specializations s on ds.specializationid = s.specializationid;