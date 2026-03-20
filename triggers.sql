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
CREATE OR REPLACE FUNCTION add_appointment(pat_id int, sch_id int, appoint_date date) 
returns varchar as $$
DECLARE
    slotcnt int;
    freeslot time;
    chosenslot timestamp;
    eslot time;
BEGIN
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
        date_trunc('day', ESTtime) = date_trunc('day', appoint_date)
    ) on 
    hs.slotstart <= esttime::time and hs.slotend > esttime::time
    group by hs.slotstart, hs.slotend
    having count(appointmentid) < 10
    ORDER BY hs.slotstart
    limit 1;
    
    if freeslot is null THEN
        return 'Failed: No slots available';
    elsif 1 > (
        select count(*) from users where userid = pat_id 
        ) THEN
        return 'Failed: Patient not found';
    ELSE
        chosenslot := freeslot + date_trunc('day', appoint_date);
        insert into appointments (patientid, scheduleid, esttime)
        values (pat_id, sch_id, chosenslot);
        return 'Success: Appointment scheduled at ' || to_char(chosenslot, 'DD Mon YYYY HH24:MI');
    end if;
    exception
        when unique_violation THEN
            return 'Failed: Appointment already made for this schedule and date';
END;
$$ language plpgsql;

SELECT add_appointment(10, 7, date'2026-03-23');
    

