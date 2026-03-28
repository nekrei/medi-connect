import 'server-only';

import { pool } from '@/lib/db';
import { number } from 'zod';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Denied' | 'Pending' | 'Absent';

type AppointmentDbRow = {
    appointmentid: number;
    scheduleid: number;
    patientid: number;
    patientname: string;
    patientemail: string | null;
    timeslot: string | null;
    sex: string | null;
    status: AppointmentStatus;
    requestedat: string | null;
    history_access: string | null;
};

type ScheduleDbRow = {
    scheduleid: number;
    chamberid: number;
    hospitalname: string;
    addressstring: string;
    doctorname: string;
    weekday: number;
    starttime: string;
    endtime: string;
};

type HospitalDbRow = {
    hospitalname: string;
};

export type Appointment = {
    appointmentid: number;
    scheduleid: number;
    patientid: number;
    patientname: string;
    patientemail: string | null;
    timeslot: string | null;
    sex: string | null;
    status: AppointmentStatus;
    requestedat: string | null;
    history_access: string | null;
};

export type Schedule = {
    scheduleid: number;
    chamberid: number;
    chamberhosp: string;
    chamberloc: string;
    doctorname: string;
    week: number;
    starttime: string;
    endtime: string;
};

export type DoctorAppointmentRow = {
    appointmentid: number;
    patientid: number;
    patientname: string;
    patientemail: string | null;
    scheduleid: number;
    hospitalname: string;
    weekday: number;
    scheduleStart: string;
    scheduleEnd: string;
    esttime: string | null;
    status: AppointmentStatus;
    requestedat: string | null;
    history_access: string | null;
};

export type DoctorAppointmentDetails = {
    appointmentid: number;
    patientid: number;
    status: AppointmentStatus;
    history_access: string | null;
};

export type DoctorHospitalFilterRow = {
    hospitalname: string;
};

export type DoctorScheduleFilterRow = {
    scheduleid: number;
    weekday: number;
    hospitalname: string;
    starttime: string;
    endtime: string;
};

export async function listDoctorAppointments(params: {
    doctorId: number;
    date: string | null;
    hospital: string | null;
    scheduleId: number | null;
    statuses?: AppointmentStatus[];
}): Promise<DoctorAppointmentRow[]> {
    const { doctorId, date, hospital, scheduleId, statuses } = params;
    const schedules = await getScheduleByDoctor(doctorId);

    const filteredSchedules = schedules.filter((schedule) => {
        if (scheduleId !== null && schedule.scheduleid !== scheduleId) {
            return false;
        }
        if (hospital !== null && schedule.chamberhosp !== hospital) {
            return false;
        }
        return true;
    });

    const appointmentGroups = await Promise.all(
        filteredSchedules.map(async (schedule) => {
            const appointments = date
                ? await getAppointmentsByDateSchedule(schedule.scheduleid, date)
                : await getAppointmentsBySchedule(schedule.scheduleid);

            return appointments.map((appointment) => ({
                appointmentid: appointment.appointmentid,
                patientid: appointment.patientid,
                patientname: appointment.patientname,
                patientemail: appointment.patientemail,
                scheduleid: appointment.scheduleid,
                hospitalname: schedule.chamberhosp,
                weekday: schedule.week,
                scheduleStart: schedule.starttime,
                scheduleEnd: schedule.endtime,
                esttime: appointment.timeslot,
                status: appointment.status,
                requestedat: appointment.requestedat,
                history_access: appointment.history_access,
            }));
        })
    );

    let allAppointments = appointmentGroups.flat();
    
    if (statuses && statuses.length > 0) {
        allAppointments = allAppointments.filter(app => statuses.includes(app.status));
    }

    return allAppointments
        .sort((a, b) => {
            const left = a.esttime ? Date.parse(a.esttime) : 0;
            const right = b.esttime ? Date.parse(b.esttime) : 0;
            return right - left;
        });
}

export async function addAppointment(
    patientId: number,
    scheduleId: number,
    appointDate: string
): Promise<string> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const res = await client.query<{ add_appointment: string }>(
            'select add_appointment($1, $2, $3::date)',
            [patientId, scheduleId, appointDate]
        );
        await client.query('COMMIT');
        return res.rows[0]?.add_appointment ?? 'Failed: Could not create appointment';
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getHospitalChambers(doctorId: number): Promise<string[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<HospitalDbRow>(
            `select distinct h.hospitalname
             from chambers c
             join hospitals h on c.hospitalid = h.hospitalid
             where c.doctorid = $1
             order by h.hospitalname`,
            [doctorId]
        );

        return res.rows.map((row) => row.hospitalname);
    } finally {
        client.release();
    }
}

export async function getScheduleByDoctor(doctorId: number): Promise<Schedule[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<ScheduleDbRow>(
            `select
                cs.scheduleid,c.chamberid,h.hospitalname,addressString(l.locationid) as addressstring,
                (u.firstname || ' ' || u.lastname) as doctorname,
                cs.weekday,to_char(cs.starttime, 'HH12:MI AM') as starttime,
                to_char(cs.endtime, 'HH12:MI AM') as endtime
            from chamberschedules cs
            join chambers c on cs.chamberid = c.chamberid
            join doctors d on c.doctorid = d.doctorid
            join users u on d.doctorid = u.userid
            join hospitals h on c.hospitalid = h.hospitalid
            join locations l on h.locationid = l.locationid
            where c.doctorid = $1
            order by cs.weekday, cs.starttime`,
            [doctorId]
        );

        return res.rows.map((row) => ({
            scheduleid: row.scheduleid,
            chamberid: row.chamberid,
            chamberhosp: row.hospitalname,
            chamberloc: row.addressstring,
            doctorname: row.doctorname,
            week: row.weekday,
            starttime: row.starttime,
            endtime: row.endtime,
        }));
    } finally {
        client.release();
    }
}

export async function getScheduleByTime(chamberId: number, week: number, start: string): Promise<Schedule[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<ScheduleDbRow>(
            `select
                cs.scheduleid,c.chamberid,h.hospitalname,
                addressString(l.locationid) as addressstring,
                (u.firstname || ' ' || u.lastname) as doctorname,
                cs.weekday,to_char(cs.starttime, 'HH12:MI AM') as starttime,
                to_char(cs.endtime, 'HH12:MI AM') as endtime
            from chamberschedules cs
            join chambers c on cs.chamberid = c.chamberid
            join doctors d on c.doctorid = d.doctorid
            join users u on d.doctorid = u.userid
            join hospitals h on c.hospitalid = h.hospitalid
            join locations l on h.locationid = l.locationid
            where c.chamberid = $1 and cs.weekday = $2 and cs.starttime = $3::time
            order by cs.starttime`,
            [chamberId, week, start]
        );

        return res.rows.map((row) => ({
            scheduleid: row.scheduleid,
            chamberid: row.chamberid,
            chamberhosp: row.hospitalname,
            chamberloc: row.addressstring,
            doctorname: row.doctorname,
            week: row.weekday,
            starttime: row.starttime,
            endtime: row.endtime,
        }));
    } finally {
        client.release();
    }
}

export async function getScheduleByWeekday(chamberId: number, week: number): Promise<Schedule[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<ScheduleDbRow>(
            `select
                cs.scheduleid,c.chamberid,h.hospitalname,addressString(l.locationid) as addressstring,
                (u.firstname || ' ' || u.lastname) as doctorname,cs.weekday,
                to_char(cs.starttime, 'HH12:MI AM') as starttime,to_char(cs.endtime, 'HH12:MI AM') as endtime
            from chamberschedules cs
            join chambers c on cs.chamberid = c.chamberid
            join doctors d on c.doctorid = d.doctorid
            join users u on d.doctorid = u.userid
            join hospitals h on c.hospitalid = h.hospitalid
            join locations l on h.locationid = l.locationid
            where c.chamberid = $1 and cs.weekday = $2
            order by cs.starttime`,
            [chamberId, week]
        );

        return res.rows.map((row) => ({
            scheduleid: row.scheduleid,
            chamberid: row.chamberid,
            chamberhosp: row.hospitalname,
            chamberloc: row.addressstring,
            doctorname: row.doctorname,
            week: row.weekday,
            starttime: row.starttime,
            endtime: row.endtime,
        }));
    } finally {
        client.release();
    }
}

export async function getSchedulesByHospital(doctorId: number, hospitalId: number): Promise<Schedule[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<ScheduleDbRow>(
            `select
                cs.scheduleid,c.chamberid,h.hospitalname,addressString(l.locationid) as addressstring,
                (u.firstname || ' ' || u.lastname) as doctorname,cs.weekday,
                to_char(cs.starttime, 'HH12:MI AM') as starttime,
                to_char(cs.endtime, 'HH12:MI AM') as endtime
            from chamberschedules cs
            join chambers c on cs.chamberid = c.chamberid
            join doctors d on c.doctorid = d.doctorid
            join users u on d.doctorid = u.userid
            join hospitals h on c.hospitalid = h.hospitalid
            join locations l on h.locationid = l.locationid
            where d.doctorid = $1 and h.hospitalid = $2
            order by cs.weekday, cs.starttime`,
            [doctorId, hospitalId]
        );

        return res.rows.map((row) => ({
            scheduleid: row.scheduleid,
            chamberid: row.chamberid,
            chamberhosp: row.hospitalname,
            chamberloc: row.addressstring,
            doctorname: row.doctorname,
            week: row.weekday,
            starttime: row.starttime,
            endtime: row.endtime,
        }));
    } finally {
        client.release();
    }
}

export async function getAppointmentsBySchedule(scheduleId: number): Promise<Appointment[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<AppointmentDbRow>(
            `select
                i.appointmentid,i.scheduleid,i.patientid,
                (u.firstname || ' ' || u.lastname) as patientname,u.email as patientemail,
                to_char(i.esttime, 'YYYY-MM-DD"T"HH24:MI:SS') as timeslot,
                u.sex,i.status,to_char(i.requestedat, 'YYYY-MM-DD"T"HH24:MI:SS') as requestedat,
                i.history_access
            from appointments i
            join users u on i.patientid = u.userid
            where i.scheduleid = $1
            order by i.esttime desc, i.requestedat desc`,
            [scheduleId]
        );

        return res.rows;
    } finally {
        client.release();
    }
}

export async function getAppointmentsByDateSchedule(scheduleId: number, date: string): Promise<Appointment[]> {
    const client = await pool.connect();
    try {
        const res = await client.query<AppointmentDbRow>(
            `select
                i.appointmentid,i.scheduleid,i.patientid,(u.firstname || ' ' || u.lastname) as patientname,
                u.email as patientemail,to_char(i.esttime, 'YYYY-MM-DD"T"HH24:MI:SS') as timeslot,
                u.sex,i.status,to_char(i.requestedat, 'YYYY-MM-DD"T"HH24:MI:SS') as requestedat,
                i.history_access
            from appointments i
            join users u on i.patientid = u.userid
            where i.scheduleid = $1 and date_trunc('day', i.esttime) = date_trunc('day', $2::date)
            order by i.esttime desc, i.requestedat desc`,
            [scheduleId, date]
        );

        return res.rows;
    } finally {
        client.release();
    }
}

export async function listDoctorAppointmentHospitals(doctorId: number): Promise<DoctorHospitalFilterRow[]> {
    const hospitals = await getHospitalChambers(doctorId);
    return hospitals.map((hospitalname) => ({ hospitalname }));
}

export async function listDoctorAppointmentSchedules(doctorId: number): Promise<DoctorScheduleFilterRow[]> {
    const schedules = await getScheduleByDoctor(doctorId);
    return schedules.map((schedule) => ({
        scheduleid: schedule.scheduleid,
        weekday: schedule.week,
        hospitalname: schedule.chamberhosp,
        starttime: schedule.starttime,
        endtime: schedule.endtime,
    }));
}

export async function getDoctorAppointmentDetailsById(doctorId: number, appointmentId: number): Promise<DoctorAppointmentDetails | null> {
    const client = await pool.connect();
    try {
        const res = await client.query<DoctorAppointmentDetails>(
            `select
                i.appointmentid,
                i.patientid,
                i.status,
                i.history_access
            from appointments i
            join chamberschedules cs on i.scheduleid = cs.scheduleid
            join chambers c on cs.chamberid = c.chamberid
            where i.appointmentid = $1 and c.doctorid = $2
            limit 1`,
            [appointmentId, doctorId]
        );

        return res.rows[0] ?? null;
    } finally {
        client.release();
    }
}

export type PatientAppointmentRow = {
    appointmentid: number,
    doctorid: number,
    doctorname: string,
    doctordesignation: string,
    doctormail: string | null,
    hospitalname: string,
    chamberloc: string,
    chamberduration: string,
    timeslot: string | null,
    status: AppointmentStatus,
    requestedat: string | null,
    history_access: string | null
}
export async function getAppointmentByPatient(patientId : number):
    Promise<PatientAppointmentRow[]> {
        const client = await pool.connect();
        try {
            const res = await client.query<PatientAppointmentRow>(
            `select 
                appointmentid, d.doctorid, (u.firstname || ' ' || u.lastname) as doctorname, d.designation as doctordesignation, 
                u.email as doctormail, h.hospitalname, addressString(l.locationid) as chamberloc,
                (to_char(cs.starttime, 'HH12:MI AM') || ' - ' || to_char(cs.endtime, 'HH12:MI AM')) as chamberduration,
                to_char(i.esttime, 'YYYY-MM-DD"T"HH24:MI:SS') as timeslot, i.status,
                to_char(i.requestedat, 'YYYY-MM-DD"T"HH24:MI:SS') as requestedat, i.history_access
            from appointments i join chamberschedules cs on i.scheduleid = cs.scheduleid
            join chambers c on cs.chamberid = c.chamberid
            join doctors d on c.doctorid = d.doctorid
            join users u on d.doctorid = u.userid
            join hospitals h on c.hospitalid = h.hospitalid
            join locations l on h.locationid = l.locationid
            where i.patientid = $1
            order by i.esttime desc, i.requestedat desc`,
            [patientId]
        );
        return res.rows;
    } finally {
        client.release();
    }
}
export async function confirmAppointment(appointmentId: number): Promise<string> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const res = await client.query(
            'SELECT confirm_appointment($1);',
            [appointmentId]
        );
        console.log("appointment : ", appointmentId);
        await client.query('COMMIT');
        return res.rows[0].confirm_appointment ?? 'Failed: Could not confirm appointment';
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();

    }
}
export async function updateAppointmentStatus(appointmentId: number, newStatus: AppointmentStatus): Promise<void> {
    if (newStatus === 'Scheduled') {
        await confirmAppointment(appointmentId);
        return;
    }
    const client = await pool.connect();
    try {
        await client.query('begin');
        await client.query(
            'update appointments set status = $1 where appointmentid = $2',
            [newStatus, appointmentId]
        );
        await client.query('commit');
    } catch (error) {
        await client.query('rollback');
        throw error;
    } finally {
        client.release();
    }
}
export type slot = {
    cnt: number;
    starttime: string;
    endtime: string;
}
export async function checkSlotCount(scheduleId: number, appointDate: string):
    Promise<slot[]> {
        const client = await pool.connect();
        try {
            await client.query('begin');
            const res = await client.query(
                `with recursive hourslots as(
                    select 
                    starttime as slotstart,
                    starttime + interval '1 hour' as slotend
                    from chamberschedules where scheduleid = $1
                    union all
                    select 
                    slotstart + interval '1 hour',
                    slotend + interval '1 hour'
                    from hourslots
                    where slotend + interval '1 hour' <= (select endtime from chamberschedules where scheduleid = $1)
                )

                select count(appointmentid) as cnt, hs.slotstart, hs.slotend
                from hourslots hs left join (
                    select * from appointments
                    where scheduleid = $1 and status ='Scheduled' and
                    appointmentdate = $2::date   
                ) on 
                hs.slotstart <= esttime::time and hs.slotend > esttime::time
                group by hs.slotstart, hs.slotend
                having count(appointmentid) < 10
                ORDER BY hs.slotstart;`,
                [scheduleId, appointDate]
            );
            client.query('commit');
            return res.rows.map((row) => ({
                cnt: row.cnt,
                starttime: row.slotstart,
                endtime: row.slotend,
            }));
        }catch (error) {
            await client.query('rollback');
            throw error;
        } finally {            
            client.release();
        }
    }

export async function getwaitingcount(scheduleId: number, appointDate: string): Promise<number> {
    const client = await pool.connect();
    try {
        const res = await client.query<{ cnt: number }>(
            `select count(appointmentid) as cnt
             from appointments
             where scheduleid = $1 and status = 'Pending' and appointmentdate = $2::date`,
            [scheduleId, appointDate]
        );
        return res.rows[0]?.cnt ?? 0;
    } finally {
        client.release();
    }
}

export async function requestAccess(appointmentId: number): Promise<string> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const res = await client.query(
            `update appointments set history_access = 'Requested' where appointmentid = $1`,
            [appointmentId]
        );
        await client.query('COMMIT');
        return 'Access requested successfully';
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function grantAccess(appointmentId: number): Promise<string> {
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const res = await client.query(
            `update appointments set history_access = 'Granted' where appointmentid = $1`,
            [appointmentId]
        );
        await client.query('COMMIT');
        return 'Access granted successfully';
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
