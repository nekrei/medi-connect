insert into thanas (thananame, districtid) values ( 'New Market', 1);

insert into locations (thanaid, holdingnumber, road) values (1, '58', '2A');
insert into hospitals (locationid, hospitalname) values (4, 'C Hospital');


-- CREATE OR REPLACE FUNCTION appointment_handler() RETURNS trigger as $$
-- DECLARE
-- BEGIN
--     if new.status = 'Cancelled' or new.status = 'Denied' THEN
--         insert into rejectedappointments (
--             appointmentid, patientid, scheduleid, appointmentdate, esttime, status, requestedat
--         ) values (
--             new.appointmentid, new.patientid, new.scheduleid, new.appointmentdate, new.esttime, new.status, now()
--         )
--     end if;
--     return NULL;    
-- END;
-- $$ language plpgsql;

-- CREATE OR REPLACE TRIGGER appointment_status_handler
-- AFTER UPDATE OF status ON appointments
-- FOR EACH ROW
-- EXECUTE FUNCTION appointment_handler();

-- CREATE or REPLACE FUNCTION rej_appointment() RETURNS trigger as $$
-- declare
-- begin
--     if new.status = 'Cancelled' or new.status = 'Denied' THEN
--         delete from appointments where appointmentid = new.rejectappid;
--     end if;
--     return NULL;    
-- end;
-- $$ language plpgsql;

-- CREATE OR REPLACE TRIGGER rej_appointment_handler
-- after insert on rejectedappointments
-- for each row
-- EXECUTE FUNCTION rej_appointment();
