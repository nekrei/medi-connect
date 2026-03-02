import 'server-only';

import { sql } from '@/lib/db';

export type UserInfo = {
    userid: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    dateofbirth: string | null;
    sex: string | null;
    bloodtype: string | null;
    password: string;
    role: string;
};

export type DoctorInfo = {
    doctorid: number;
    designation: string | null;
    registrationnumber: string;
    startpracticedate: string | null;
    registrationexpiry: string | null;
    approvalstatus: 'Approved' | 'Pending' | 'Rejected';   // 'Pending' | 'Approved' | 'Rejected'
    reviewedby: number | null;
    reviewedat: string | null;
};

export type PendingDoctorRow = UserInfo & DoctorInfo;


export async function ensureUsersTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS Users (
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
    )
  `;
}

/** Return the Doctors row for a given User id, or null if not a doctor. */
export async function findDoctorByUserId(userId: number): Promise<DoctorInfo | null> {
    const rows = (await sql`
        SELECT doctorid, designation, registrationnumber,
               startpracticedate, registrationexpiry,
               approvalstatus, reviewedby, reviewedat
        FROM doctors WHERE doctorid = ${userId}
        LIMIT 1
    `) as DoctorInfo[];
    return rows[0] ?? null;
}

export async function findUserByEmail(email: string) {
    const rows = (await sql`
        SELECT userid, username, firstname, lastname, email, 
        dateofbirth, sex, bloodtype, password, role, locationid 
        FROM users WHERE email = ${email}
        LIMIT 1
    `) as UserInfo[];
    return rows[0] ?? null;
}

export async function findUserById(userId: number) {
    const rows = (await sql`
        SELECT userid, username, firstname, lastname, email,
        dateofbirth, sex, bloodtype, password, role
        FROM users WHERE userid = ${userId}
        LIMIT 1
    `) as UserInfo[];
    return rows[0] ?? null;
}


export async function   createUser(input: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    dateofbirth: string | null;
    sex: string | null;
    bloodtype: string | null;
    password: string;
    role: string;

}) : Promise<Pick<UserInfo, 'userid' | 'email' | 'firstname' | 'lastname' | 'role'>> {
    const rows = (await sql`
        Insert into users (Username, FirstName, LastName, Email, DateOfBirth, password, Role)
        VALUES (${input.username}, ${input.firstname}, ${input.lastname}, ${input.email}, ${input.dateofbirth}, ${input.password}, ${input.role})
        RETURNING userid, email, firstname, lastname, role
    `) as Pick<UserInfo, 'userid' | 'email' | 'firstname' | 'lastname' | 'role'>[];

    return rows[0];
}

/** Insert a row into Doctors after the matching Users row has been created. */
export async function createDoctor(input: {
    doctorid: number;
    designation: string | null;
    registrationnumber: string;
    startpracticedate: string | null;
    registrationexpiry: string | null;
}): Promise<DoctorInfo> {
    const rows = (await sql`
        INSERT INTO doctors (doctorid, designation, registrationnumber, startpracticedate, registrationexpiry)
        VALUES (
            ${input.doctorid},
            ${input.designation},
            ${input.registrationnumber},
            ${input.startpracticedate},
            ${input.registrationexpiry}
        )
        RETURNING doctorid, designation, registrationnumber,
                  startpracticedate, registrationexpiry,
                  approvalstatus, reviewedby, reviewedat
    `) as DoctorInfo[];
    return rows[0];
}

/** Return all doctors whose ApprovalStatus is 'Pending', joined with their user info. */
export async function listPendingDoctors(): Promise<PendingDoctorRow[]> {
    return (await sql`
        SELECT
            u.userid, u.username, u.firstname, u.lastname, u.email,
            u.dateofbirth, u.sex, u.bloodtype, u.password, u.role,
            d.doctorid, d.designation, d.registrationnumber,
            d.startpracticedate, d.registrationexpiry,
            d.approvalstatus, d.reviewedby, d.reviewedat
        FROM doctors d
        JOIN users u ON u.userid = d.doctorid
        WHERE d.approvalstatus = 'Pending'
        ORDER BY u.userid ASC
    `) as PendingDoctorRow[];
}

/** Set ApprovalStatus to 'Approved' or 'Rejected' and record who reviewed it. */
export async function reviewDoctor(input: {
    doctorid: number;
    status: 'Approved' | 'Rejected';
    reviewedby: number;
}): Promise<DoctorInfo | null> {
    const rows = (await sql`
        UPDATE doctors
        SET
            approvalstatus = ${input.status},
            reviewedby     = ${input.reviewedby},
            reviewedat     = NOW()
        WHERE doctorid = ${input.doctorid}
        RETURNING doctorid, designation, registrationnumber,
                  startpracticedate, registrationexpiry,
                  approvalstatus, reviewedby, reviewedat
    `) as DoctorInfo[];
    return rows[0] ?? null;
}