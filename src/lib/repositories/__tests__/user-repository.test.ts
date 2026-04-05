import {
  findUserByEmail,
  findUserById,
  findDoctorByUserId,
  createUser,
  createPhoneNumber,
  createDoctor,
  listPendingDoctors,
  reviewDoctor,
  fetchBasicUserInfo,
  fetchContactUserInfo,
  fetchDoctorProfileInfo,
  updateBasicProfileInfo,
  updateContactProfileInfo,
  updateDoctorProfileInfo,
  type UserInfo,
  type DoctorInfo,
} from '@/lib/repositories/user-repository';

// ── mock database ──────────────────────────────────────────────────────────────
const mockSql = jest.fn();
jest.mock('@/lib/db', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
  pool: {},
}));

beforeEach(() => {
  jest.resetAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────────
const sampleUser: UserInfo = {
  userid: 1,
  username: 'johndoe',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  dateofbirth: '1990-01-01',
  sex: 'Male',
  bloodtype: 'O+',
  password: 'hashedpw',
  role: 'User',
};

const sampleDoctor: DoctorInfo = {
  doctorid: 10,
  designation: 'MBBS',
  registrationnumber: 'REG-001',
  startpracticedate: '2010-01-01',
  registrationexpiry: '2030-01-01',
  approvalstatus: 'Pending',
};

// ── findUserByEmail ────────────────────────────────────────────────────────────
describe('findUserByEmail', () => {
  it('returns the matching user', async () => {
    mockSql.mockResolvedValue([sampleUser]);
    const result = await findUserByEmail('john@example.com');
    expect(result).toEqual(sampleUser);
  });

  it('returns null when no user is found', async () => {
    mockSql.mockResolvedValue([]);
    const result = await findUserByEmail('nobody@example.com');
    expect(result).toBeNull();
  });
});

// ── findUserById ───────────────────────────────────────────────────────────────
describe('findUserById', () => {
  it('returns the user with matching id', async () => {
    mockSql.mockResolvedValue([sampleUser]);
    expect(await findUserById(1)).toEqual(sampleUser);
  });

  it('returns null when id does not exist', async () => {
    mockSql.mockResolvedValue([]);
    expect(await findUserById(999)).toBeNull();
  });
});

// ── findDoctorByUserId ─────────────────────────────────────────────────────────
describe('findDoctorByUserId', () => {
  it('returns DoctorInfo when found', async () => {
    mockSql.mockResolvedValue([sampleDoctor]);
    expect(await findDoctorByUserId(10)).toEqual(sampleDoctor);
  });

  it('returns null when no doctor row exists', async () => {
    mockSql.mockResolvedValue([]);
    expect(await findDoctorByUserId(99)).toBeNull();
  });
});

// ── createUser ─────────────────────────────────────────────────────────────────
describe('createUser', () => {
  it('returns the created user summary', async () => {
    const created = { userid: 2, email: 'jane@example.com', firstname: 'Jane', lastname: 'Smith', role: 'User' };
    mockSql.mockResolvedValue([created]);
    const result = await createUser({
      username: 'janesmith',
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane@example.com',
      dateofbirth: '1995-05-15',
      sex: 'Female',
      bloodtype: 'A+',
      password: 'hashedpw',
      role: 'User',
    });
    expect(result).toEqual(created);
  });
});

// ── createPhoneNumber ──────────────────────────────────────────────────────────
describe('createPhoneNumber', () => {
  it('resolves without error', async () => {
    mockSql.mockResolvedValue([]);
    await expect(createPhoneNumber({ userid: 1, phonenumber: '01712345678' })).resolves.toBeUndefined();
  });
});

// ── createDoctor ───────────────────────────────────────────────────────────────
describe('createDoctor', () => {
  it('returns the created doctor row', async () => {
    mockSql.mockResolvedValue([sampleDoctor]);
    const result = await createDoctor({
      doctorid: 10,
      designation: 'MBBS',
      registrationnumber: 'REG-001',
      startpracticedate: '2010-01-01',
      registrationexpiry: '2030-01-01',
    });
    expect(result).toEqual(sampleDoctor);
  });
});

// ── listPendingDoctors ─────────────────────────────────────────────────────────
describe('listPendingDoctors', () => {
  it('returns an array of pending doctor rows', async () => {
    const pendingRow = { ...sampleUser, ...sampleDoctor };
    mockSql.mockResolvedValue([pendingRow]);
    const results = await listPendingDoctors();
    expect(results).toHaveLength(1);
    expect(results[0].approvalstatus).toBe('Pending');
  });

  it('returns an empty array when there are no pending doctors', async () => {
    mockSql.mockResolvedValue([]);
    expect(await listPendingDoctors()).toEqual([]);
  });
});

// ── reviewDoctor ───────────────────────────────────────────────────────────────
describe('reviewDoctor', () => {
  it('returns the stored-procedure result', async () => {
    const resultRow = { res: 'OK', msg: 'Doctor approved' };
    mockSql.mockResolvedValue([resultRow]);
    const result = await reviewDoctor({ doctorid: 10, status: 'Approved', reviewedby: 1 });
    expect(result).toEqual(resultRow);
  });

  it('returns null when the stored procedure returns no rows', async () => {
    mockSql.mockResolvedValue([]);
    expect(await reviewDoctor({ doctorid: 10, status: 'Rejected', reviewedby: 1 })).toBeNull();
  });
});

// ── fetchBasicUserInfo ─────────────────────────────────────────────────────────
describe('fetchBasicUserInfo', () => {
  it('returns profile info for an existing user', async () => {
    const profileRow = { userid: 1, username: 'johndoe', firstname: 'John', lastname: 'Doe', email: 'john@example.com', dateofbirth: '1990-01-01', sex: 'Male', bloodtype: 'O+', role: 'User', propertyname: null, holdingnumber: null, road: null, thananame: null, districtname: null, postalcode: null, latitude: null, longitude: null };
    mockSql.mockResolvedValue([profileRow]);
    expect(await fetchBasicUserInfo(1)).toEqual(profileRow);
  });

  it('returns null for a user that does not exist', async () => {
    mockSql.mockResolvedValue([]);
    expect(await fetchBasicUserInfo(999)).toBeNull();
  });
});

// ── fetchContactUserInfo ───────────────────────────────────────────────────────
describe('fetchContactUserInfo', () => {
  it('returns email and phone numbers', async () => {
    // First call → user email, second call → phone rows
    mockSql
      .mockResolvedValueOnce([{ email: 'john@example.com' }])
      .mockResolvedValueOnce([{ phonenumber: '01712345678' }, { phonenumber: '01898765432' }]);

    const result = await fetchContactUserInfo(1);
    expect(result).toEqual({
      email: 'john@example.com',
      phonenumbers: ['01712345678', '01898765432'],
    });
  });

  it('returns empty phone array when no phone numbers stored', async () => {
    mockSql
      .mockResolvedValueOnce([{ email: 'john@example.com' }])
      .mockResolvedValueOnce([]);

    const result = await fetchContactUserInfo(1);
    expect(result?.phonenumbers).toEqual([]);
  });

  it('returns null when the user email is not found', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await fetchContactUserInfo(999)).toBeNull();
  });

  it('filters out null phone numbers', async () => {
    mockSql
      .mockResolvedValueOnce([{ email: 'john@example.com' }])
      .mockResolvedValueOnce([{ phonenumber: '01712345678' }, { phonenumber: null }]);

    const result = await fetchContactUserInfo(1);
    expect(result?.phonenumbers).toEqual(['01712345678']);
  });
});

// ── fetchDoctorProfileInfo ─────────────────────────────────────────────────────
describe('fetchDoctorProfileInfo', () => {
  it('returns doctor profile with specializations', async () => {
    const doctorRow = { designation: 'MBBS', registrationnumber: 'REG-001', startpracticedate: '2010-01-01', registrationexpiry: '2030-01-01', approvalstatus: 'Approved' };
    mockSql
      .mockResolvedValueOnce([doctorRow])
      .mockResolvedValueOnce([{ specializationname: 'Cardiology' }, { specializationname: 'General' }]);

    const result = await fetchDoctorProfileInfo(10);
    expect(result).toEqual({ ...doctorRow, specializations: ['Cardiology', 'General'] });
  });

  it('returns null when no doctor row exists', async () => {
    mockSql.mockResolvedValueOnce([]);
    expect(await fetchDoctorProfileInfo(999)).toBeNull();
  });

  it('returns empty specializations array when none are assigned', async () => {
    const doctorRow = { designation: 'MBBS', registrationnumber: 'REG-002', startpracticedate: null, registrationexpiry: null, approvalstatus: 'Pending' };
    mockSql
      .mockResolvedValueOnce([doctorRow])
      .mockResolvedValueOnce([]);

    const result = await fetchDoctorProfileInfo(10);
    expect(result?.specializations).toEqual([]);
  });
});

// ── updateContactProfileInfo ───────────────────────────────────────────────────
describe('updateContactProfileInfo', () => {
  it('deletes old numbers and inserts new ones', async () => {
    mockSql.mockResolvedValue([]);
    await updateContactProfileInfo(1, { phonenumbers: ['01712345678', '01898765432'] });
    // DELETE + 2 INSERTs = 3 calls
    expect(mockSql).toHaveBeenCalledTimes(3);
  });

  it('deduplicates and trims phone numbers', async () => {
    mockSql.mockResolvedValue([]);
    await updateContactProfileInfo(1, { phonenumbers: [' 01712345678 ', '01712345678'] });
    // DELETE + 1 INSERT (deduplicated)
    expect(mockSql).toHaveBeenCalledTimes(2);
  });

  it('does not insert when all phone numbers are empty strings', async () => {
    mockSql.mockResolvedValue([]);
    await updateContactProfileInfo(1, { phonenumbers: ['', '   '] });
    // only DELETE, no INSERTs
    expect(mockSql).toHaveBeenCalledTimes(1);
  });
});

// ── updateDoctorProfileInfo ────────────────────────────────────────────────────
describe('updateDoctorProfileInfo', () => {
  it('deletes old specializations and inserts new ones', async () => {
    // DELETE + for each unique specialization: INSERT INTO specializations, SELECT, INSERT INTO doctorspecializations
    mockSql
      .mockResolvedValueOnce([]) // DELETE
      .mockResolvedValueOnce([]) // INSERT INTO specializations
      .mockResolvedValueOnce([{ specializationid: 1 }]) // SELECT specializationid
      .mockResolvedValueOnce([]); // INSERT INTO doctorspecializations

    await updateDoctorProfileInfo(1, { specializations: ['Cardiology'] });
    expect(mockSql).toHaveBeenCalledTimes(4);
  });

  it('skips insert when specializationid is not found', async () => {
    mockSql
      .mockResolvedValueOnce([]) // DELETE
      .mockResolvedValueOnce([]) // INSERT INTO specializations
      .mockResolvedValueOnce([]); // SELECT returns empty

    await updateDoctorProfileInfo(1, { specializations: ['UnknownSpec'] });
    // Should not call the final INSERT INTO doctorspecializations
    expect(mockSql).toHaveBeenCalledTimes(3);
  });

  it('deduplicates specializations', async () => {
    mockSql
      .mockResolvedValueOnce([]) // DELETE
      .mockResolvedValueOnce([]) // INSERT INTO specializations
      .mockResolvedValueOnce([{ specializationid: 1 }]) // SELECT
      .mockResolvedValueOnce([]); // INSERT INTO doctorspecializations

    await updateDoctorProfileInfo(1, { specializations: ['Cardiology', 'Cardiology'] });
    // Only 1 specialization processed after dedup, so 4 calls total (not 7)
    expect(mockSql).toHaveBeenCalledTimes(4);
  });
});

// ── updateBasicProfileInfo ─────────────────────────────────────────────────────
describe('updateBasicProfileInfo', () => {
  const baseInput = {
    propertyname: 'House 1',
    holdingnumber: '10',
    road: 'Road 2',
    districtname: 'Dhaka',
    thananame: 'Gulshan',
    postalcode: '1212',
  };

  it('updates existing location when user already has one', async () => {
    mockSql
      .mockResolvedValueOnce([{ locationid: 5 }])  // SELECT locationid
      .mockResolvedValueOnce([{ thanaid: 3 }])      // resolveThanaId SELECT
      .mockResolvedValueOnce([]);                   // UPDATE locations

    await updateBasicProfileInfo(1, baseInput);
    // SELECT user + SELECT thana + UPDATE locations = 3 calls
    expect(mockSql).toHaveBeenCalledTimes(3);
  });

  it('inserts a new location and updates user when no location exists and thana is found', async () => {
    mockSql
      .mockResolvedValueOnce([{ locationid: null }]) // SELECT locationid → no location
      .mockResolvedValueOnce([{ thanaid: 3 }])       // resolveThanaId SELECT
      .mockResolvedValueOnce([{ locationid: 99 }])   // INSERT INTO locations
      .mockResolvedValueOnce([]);                    // UPDATE users SET locationid

    await updateBasicProfileInfo(1, baseInput);
    expect(mockSql).toHaveBeenCalledTimes(4);
  });

  it('does nothing when user has no location and thana cannot be resolved', async () => {
    // resolveThanaId exits early (no SQL) when thananame is null; only SELECT locationid runs
    mockSql.mockResolvedValueOnce([{ locationid: null }]);

    await updateBasicProfileInfo(1, { ...baseInput, thananame: null });
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('does nothing when districtname is missing even if thananame is set', async () => {
    // resolveThanaId exits early (no SQL) when districtname is null; only SELECT locationid runs
    mockSql.mockResolvedValueOnce([{ locationid: null }]);

    await updateBasicProfileInfo(1, { ...baseInput, districtname: null });
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('does not update users when location INSERT returns no id', async () => {
    mockSql
      .mockResolvedValueOnce([{ locationid: null }]) // SELECT locationid
      .mockResolvedValueOnce([{ thanaid: 3 }])       // resolveThanaId
      .mockResolvedValueOnce([]);                    // INSERT INTO locations returns empty

    await updateBasicProfileInfo(1, baseInput);
    // Should not call UPDATE users
    expect(mockSql).toHaveBeenCalledTimes(3);
  });

  it('does nothing when thana is not found in the database', async () => {
    // resolveThanaId SELECT returns empty – falls back to null via ?? null
    mockSql
      .mockResolvedValueOnce([{ locationid: null }]) // SELECT locationid
      .mockResolvedValueOnce([]);                    // resolveThanaId SELECT → no row found

    await updateBasicProfileInfo(1, baseInput);
    // thanaId is null → !thanaId is true → return early; no INSERT/UPDATE
    expect(mockSql).toHaveBeenCalledTimes(2);
  });
});
