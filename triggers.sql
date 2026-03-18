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