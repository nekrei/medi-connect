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
};

export type DoctorProfileInfo = {
    designation: string | null;
    registrationnumber: string | null;
    startpracticedate: string | null;
    registrationexpiry: string | null;
    approvalstatus: 'Approved' | 'Pending' | 'Rejected' | null;
    specializations: string[];
};

export type PendingDoctorRow = UserInfo & DoctorInfo;

export type BasicUserProfileInfo = {
    userid: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    dateofbirth: string;
    sex: string | null;
    bloodtype: string | null;
    role: string;
    propertyname: string | null;
    holdingnumber: string | null;
    road: string | null;
    thananame: string | null;
    districtname: string | null;
    postalcode: string | null;
    latitude: string | null;
    longitude: string | null;
};

export type ContactUserInfo = {
    email: string;
    phonenumbers: string[];
};



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

export async function createPhoneNumber(input: {
    userid: number;
    phonenumber: string;
}): Promise<void> {
    await sql`
        INSERT INTO phonenumbers (userid, phonenumber)
        VALUES (${input.userid}, ${input.phonenumber})
    `;
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


export async function fetchBasicUserInfo(userId: number): Promise<BasicUserProfileInfo | null> {
    const rows = (await sql`
        SELECT
            u.userid,
            u.username,
            u.firstname,
            u.lastname,
            u.email,
            to_char(u.dateofbirth, 'YYYY-MM-DD') as dateofbirth,
            u.sex,
            u.bloodtype,
            u.role,
            l.propertyname,
            l.holdingnumber,
            l.road,
            t.thananame,
            d.districtname,
            NULL::varchar AS postalcode,
            l.latitude,
            l.longitude
        FROM users u
        LEFT JOIN locations l ON l.locationid = u.locationid
        LEFT JOIN thanas t ON t.thanaid = l.thanaid
        LEFT JOIN districts d ON d.districtid = t.districtid
        WHERE u.userid = ${userId}
        LIMIT 1
    `) as BasicUserProfileInfo[];

    return rows[0] ?? null;
}

export async function fetchContactUserInfo(userId: number): Promise<ContactUserInfo | null> {
    const userRows = (await sql`
        SELECT email
        FROM users
        WHERE userid = ${userId}
        LIMIT 1
    `) as Array<{ email: string | null }>;

    const user = userRows[0];
    if (!user?.email) {
        return null;
    }

    const phoneRows = (await sql`
        SELECT phonenumber
        FROM phonenumbers
        WHERE userid = ${userId}
        ORDER BY phonenumberid ASC
    `) as Array<{ phonenumber: string | null }>;


    return {
        email: user.email,
        phonenumbers: phoneRows
            .map((row) => row.phonenumber)
            .filter((phone): phone is string => Boolean(phone)),
    };
}


export async function fetchDoctorProfileInfo(userId: number): Promise<DoctorProfileInfo | null> {
    const doctorRows = (await sql`
        SELECT
            designation,
            registrationnumber,
            to_char(startpracticedate, 'YYYY-MM-DD') AS startpracticedate,
            to_char(registrationexpiry, 'YYYY-MM-DD') AS registrationexpiry,
            approvalstatus
        FROM doctors
        WHERE doctorid = ${userId}
        LIMIT 1
    `) as Array<{
        designation: string | null;
        registrationnumber: string | null;
        startpracticedate: string | null;
        registrationexpiry: string | null;
        approvalstatus: 'Approved' | 'Pending' | 'Rejected' | null;
    }>;

    const doctor = doctorRows[0];
    if (!doctor) {
        return null;
    }

    const specializationRows = (await sql`
        SELECT s.specializationname
        FROM doctorspecializations ds
        JOIN specializations s ON s.specializationid = ds.specializationid
        WHERE ds.doctorid = ${userId}
        ORDER BY s.specializationname ASC
    `) as Array<{ specializationname: string | null }>;

    return {
        ...doctor,
        specializations: specializationRows
            .map((row) => row.specializationname)
            .filter((name): name is string => Boolean(name)),
    };
}

export type BasicProfileUpdateInput = {
    propertyname: string | null;
    holdingnumber: string | null;
    road: string | null;
    districtname: string | null;
    thananame: string | null;
    postalcode: string | null;
};

export type ContactProfileUpdateInput = {
    phonenumbers: string[];
};

export type DoctorProfileUpdateInput = {
    specializations: string[];
};

async function resolveThanaId(input: { districtname: string | null; thananame: string | null }): Promise<number | null> {
    if (!input.districtname || !input.thananame) {
        return null;
    }

    const rows = (await sql`
        SELECT t.thanaid
        FROM thanas t
        JOIN districts d ON d.districtid = t.districtid
        WHERE lower(d.districtname) = lower(${input.districtname})
          AND lower(t.thananame) = lower(${input.thananame})
        LIMIT 1
    `) as Array<{ thanaid: number }>;

    return rows[0]?.thanaid ?? null;
}

export async function updateBasicProfileInfo(userId: number, input: BasicProfileUpdateInput): Promise<void> {
    const userRows = (await sql`
        SELECT locationid
        FROM users
        WHERE userid = ${userId}
        LIMIT 1
    `) as Array<{ locationid: number | null }>;

    const locationId = userRows[0]?.locationid ?? null;
    const thanaId = await resolveThanaId({ districtname: input.districtname, thananame: input.thananame });

    if (locationId) {
        await sql`
            UPDATE locations
            SET
                propertyname = ${input.propertyname},
                holdingnumber = ${input.holdingnumber},
                road = ${input.road},
                thanaid = COALESCE(${thanaId}, thanaid)
            WHERE locationid = ${locationId}
        `;
        return;
    }

    if (!thanaId) {
        return;
    }

    const rows = (await sql`
        INSERT INTO locations (propertyname, holdingnumber, road, thanaid)
        VALUES (${input.propertyname}, ${input.holdingnumber}, ${input.road}, ${thanaId})
        RETURNING locationid
    `) as Array<{ locationid: number }>;

    const insertedLocationId = rows[0]?.locationid;
    if (!insertedLocationId) {
        return;
    }

    await sql`
        UPDATE users
        SET locationid = ${insertedLocationId}
        WHERE userid = ${userId}
    `;
}

export async function updateContactProfileInfo(userId: number, input: ContactProfileUpdateInput): Promise<void> {
    await sql`
        DELETE FROM phonenumbers
        WHERE userid = ${userId}
    `;

    const normalizedPhones = Array.from(new Set(input.phonenumbers.map((phone) => phone.trim()).filter(Boolean)));

    for (const phone of normalizedPhones) {
        await sql`
            INSERT INTO phonenumbers (userid, phonenumber)
            VALUES (${userId}, ${phone})
        `;
    }
}

export async function updateDoctorProfileInfo(userId: number, input: DoctorProfileUpdateInput): Promise<void> {
    await sql`
        DELETE FROM doctorspecializations
        WHERE doctorid = ${userId}
    `;

    const uniqueSpecializations = Array.from(new Set(input.specializations.map((name) => name.trim()).filter(Boolean)));

    for (const specialization of uniqueSpecializations) {
        await sql`
            INSERT INTO specializations (specializationname)
            VALUES (${specialization})
            ON CONFLICT (specializationname) DO NOTHING
        `;

        const rows = (await sql`
            SELECT specializationid
            FROM specializations
            WHERE lower(specializationname) = lower(${specialization})
            LIMIT 1
        `) as Array<{ specializationid: number }>;

        const specializationId = rows[0]?.specializationid;
        if (!specializationId) {
            continue;
        }

        await sql`
            INSERT INTO doctorspecializations (doctorid, specializationid)
            VALUES (${userId}, ${specializationId})
            ON CONFLICT (doctorid, specializationid) DO NOTHING
        `;
    }
}
