import 'server-only';

import {randomUUID} from 'crypto';

import { sql } from '@/lib/db';

export type UserInfo = {
    username: string;
    firstname: string;
    lastname: string;
    email: string | null;
    dateofbirth: string | null;
    sex: string | null;
    bloodtype: string | null;
    password: string;
    role: string;
    locationid: number | null;
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
        Role VARCHAR(20) CHECK (Role IN ('Admin', 'User', 'Guest')) NOT NULL,
        LocationId INT,
        FOREIGN KEY (LocationId) REFERENCES Locations(LocationId)
    )
  `;
}

export async function findUserByEmail(email: string) {
    const rows = (await sql`
        SELECT username, firstname, lastname, email, 
        dateofbirth, sex, bloodtype, password, role, locationid 
        FROM users WHERE email = ${email}
        LIMIT 1
    `) as UserInfo[];
    return rows[0] ?? null;
}
