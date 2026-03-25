create or replace function reject_doctor() returns trigger as $rejected_doctor_handler$
    DECLARE
    BEGIN
        IF (new.approvalstatus = 'Rejected') THEN
            insert into rejecteddoctors (rejecteddoctorid, registrationnumber, registrationexpiry, reviewedby,
            reviewedat, causeofrejection) VALUES
            (new.doctorid, new.registrationnumber, new.registrationexpiry, new.reviewedby, new.reviewedat, new.causeofrejection);
        ELSIF (new.approvalstatus = 'Approved') THEN
            update users set role = 'Doctor' where userid = new.doctorid;
        END IF;
        return NULL;
    END;
$rejected_doctor_handler$ LANGUAGE plpgsql;


create or replace trigger rejected_doctor_handler
after update
of approvalstatus
on doctors
for each row 
EXECUTE FUNCTION reject_doctor();

create or replace PROCEDURE change_status(IN doc_id int, in stat varchar, in reviewer int, in cause varchar,
OUT res varchar, OUT msg varchar)
language plpgsql
as $$
DECLARE 
    dcount int;
    rcount int;
BEGIN
    select count(*) into dcount from doctors where doctorid = doc_id;
    select count(*) into rcount 
    from users where role = 'Admin' and userid = reviewer;
    IF dcount = 0 THEN
        res:= 'FAILED';
        msg:= 'Doctor Not Found';
    elsif rcount = 0 THEN
        res:= 'FAILED';
        msg:= 'Reviewer may not be an admin';
    ELSE
        UPDATE doctors SET approvalstatus = stat, reviewedby = reviewer, reviewedat = now(),
        CauseOfRejection = cause
        where doctorid = doc_id;
        IF stat = 'Rejected' THEN
            delete from doctors where doctorid = doc_id;
        END IF;
        res:= 'SUCCESS';
        msg:= 'Doctor ' || stat || ' Successfully';
    END IF;
    exception
        when others THEN
            res:= 'FAILED';
            msg:= 'Error occurred ' || SQLERRM;
END;
$$;
    
call change_status(11, 'Approved', 12, 'cool guy',NULL,null);



CREATE OR REPLACE FUNCTION medicinecount(prescription_id int) RETURNS int AS $$
DECLARE
    med_count int;
BEGIN
    SELECT COUNT(*) INTO med_count
    FROM prescribed_medicine
    WHERE prescriptionid = prescription_id;
    
    RETURN med_count;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION testcount(prescription_id int) RETURNS int AS $$
DECLARE
    test_count int;
BEGIN
    SELECT COUNT(*) INTO test_count
    FROM prescribed_test
    WHERE prescriptionid = prescription_id;
    
    RETURN test_count;
END;
$$ LANGUAGE plpgsql;

--appointment handling 
CREATE OR REPLACE FUNCTION confirm_appointment(appointment_id int) 
returns varchar as $$
DECLARE
    pat_id int;
    sch_id int;
    appoint_date date;
    slotcnt int;
    freeslot time;
    chosenslot timestamp;
    eslot time;
BEGIN
    if 1>(select count(*) from appointments where appointmentid = appointment_id) THEN
        return 'Failed: Appointment not found';
    end if;
    select patientid, scheduleid, appointmentdate 
    into pat_id, sch_id, appoint_date
    from appointments where appointmentid = appointment_id;


    perform status 
    from appointments 
    where scheduleid = sch_id and appointmentdate = appoint_date
    for UPDATE;

    with recursive hourslots as(
        select 
            starttime as slotstart,
            starttime + interval '1 hour' as slotend
        from chamberschedules where scheduleid = sch_id
        union all
        select 
            slotstart + interval '1 hour',
            slotend + interval '1 hour'
        from hourslots
        where slotend + interval '1 hour' <= (select endtime from chamberschedules where scheduleid = sch_id)
    )

    select count(appointmentid), hs.slotstart, hs.slotend
    into slotcnt, freeslot, eslot
    from hourslots hs left join (
        select * from appointments
        where scheduleid = sch_id and status ='Scheduled' and
        appointmentdate = appoint_date
    ) on 
    hs.slotstart <= esttime::time and hs.slotend > esttime::time
    group by hs.slotstart, hs.slotend
    having count(appointmentid) < 10
    ORDER BY hs.slotstart
    limit 1;
    
    if freeslot is null THEN
        return 'Failed: No slots available';
    ELSE
        chosenslot := freeslot + date_trunc('day', appoint_date);
        update appointments set esttime = chosenslot, status = 'Scheduled' 
        where appointmentid = appointment_id;
        return 'Success: Appointment scheduled at ' || to_char(chosenslot, 'DD Mon YYYY HH24:MI');
    end if;
exception
    when sqlstate '23525' then
        return sqlerrm;
END;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION add_appointment(pat_id int, sch_id int, appoint_date date)
RETURNS varchar as $$
DECLARE
BEGIN
    if 1 > (select count(*) from chamberschedules where scheduleid = sch_id) THEN
        return 'Failed: Schedule not found';
    elsif 1 > (select count(*) from users where userid = pat_id) THEN
        return 'Failed: Patient not found';
    end if;
    insert into appointments (patientid, scheduleid, appointmentdate) values (pat_id, sch_id, appoint_date);
    return 'Success: Appointment pending approval';
exception
    when unique_violation then
        return 'Failed: Appointment already made for this schedule';
    when sqlstate '23525' then
        return sqlerrm;
END;
$$ language plpgsql;

select confirm_appointment(24);

create or replace function status_update_checker() returns trigger as $$
begin
    if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.status in ('Cancelled', 'Scheduled')) THEN
        if now()::timestamp > (
        select ((new.appointmentdate + starttime) - interval '3 hours')
        from chamberschedules where scheduleid = new.scheduleid) then
            RAISE SQLSTATE '23525'
            using message = 'Failed: Appointment must be ' || new.status || ' at least 3 hours prior';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create or replace trigger appointment_status_update_checker
before insert or update of status on appointments
for each ROW
execute function status_update_checker();


create or replace function completing_appointment() returns trigger as $$
declare 
    appid int;
begin
    select appointmentid into appid
    from appointments ap join chamberschedules cs on ap.scheduleid = cs.scheduleid
    join chambers c on cs.chamberid = c.chamberid
    join doctors d on c.doctorid = d.doctorid
    where d.doctorid = new.doctorid and patientid = new.patientid and 
    appointmentdate = new.appointmentdate and status <> 'Completed'
    for update;
    if appid is not null then
        update appointments set status = 'Completed' where appointmentid = appid;
    end if;
    return new;
end;
$$ language plpgsql;

create or replace trigger completing_appointment_trigger
after insert on prescription
for each row 
execute function completing_appointment();
    
